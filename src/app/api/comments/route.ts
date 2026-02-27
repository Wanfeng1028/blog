import { randomUUID } from "crypto";
import { NextRequest } from "next/server";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import { isRateLimited } from "@/lib/utils/rate-limit";
import { createMessage, listMessages, type MessageStatus } from "@/lib/message-board";
import {
  createFriendLink,
  listFriendLinks,
  type FriendLinkStatus
} from "@/lib/friend-links";
import { createDonation, listDonations, type DonationStatus } from "@/lib/donations";
import { sendMail } from "@/lib/auth/mailer";
import { getSiteSettings } from "@/lib/site-settings";

const createCommentSchema = z.object({
  postId: z.string().cuid().optional(),
  momentId: z.string().cuid().optional(),
  parentId: z.string().cuid().optional().nullable(),
  content: z.string().min(2).max(1000)
}).refine(data => data.postId || data.momentId, {
  message: "Either postId or momentId is required",
});

const createMessageSchema = z.object({
  mode: z.literal("message"),
  name: z.string().trim().min(1).max(40),
  email: z.string().email().optional().or(z.literal("")),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  content: z.string().min(2).max(1200),
  parentId: z.string().optional().nullable()
});

const friendLinkApplySchema = z.object({
  mode: z.literal("friend-link-apply"),
  avatarUrl: z.string().url().min(1),
  name: z.string().trim().min(1).max(50),
  email: z.string().email(),
  siteName: z.string().trim().min(1).max(80),
  siteUrl: z.string().url(),
  description: z.string().trim().min(6).max(240)
});

const friendLinkAdminCreateSchema = z.object({
  mode: z.literal("friend-link-admin"),
  avatarUrl: z.string().url().min(1),
  name: z.string().trim().min(1).max(50),
  email: z.string().email(),
  siteName: z.string().trim().min(1).max(80),
  siteUrl: z.string().url(),
  description: z.string().trim().min(6).max(240)
});

const createDonationSchema = z.object({
  mode: z.literal("donation"),
  name: z.string().trim().min(1).max(40),
  email: z.string().email().optional().or(z.literal("")),
  amount: z.coerce.number().positive().max(999999),
  message: z.string().max(200).optional().or(z.literal("")),
  paymentMethod: z.enum(["WECHAT", "ALIPAY", "OTHER"]).default("WECHAT")
});

export async function GET(request: NextRequest) {
  try {
    const mode = request.nextUrl.searchParams.get("mode");

    if (mode === "site-settings") {
      const settings = await getSiteSettings();
      return apiOk(settings);
    }

    if (mode === "message") {
      const status = (request.nextUrl.searchParams.get("status") ?? "VISIBLE") as MessageStatus | "ALL";
      const admin = request.nextUrl.searchParams.get("admin") === "1";
      const items = await listMessages({
        admin,
        status: admin ? status : "VISIBLE",
        limit: Number(request.nextUrl.searchParams.get("limit") ?? 60)
      });
      return apiOk(items);
    }

    if (mode === "friend-link") {
      const admin = request.nextUrl.searchParams.get("admin") === "1";
      if (admin) await requireAdmin();
      const status = (request.nextUrl.searchParams.get("status") ?? (admin ? "ALL" : "APPROVED")) as
        | FriendLinkStatus
        | "ALL";
      const links = await listFriendLinks({
        status,
        limit: Number(request.nextUrl.searchParams.get("limit") ?? 100)
      });
      return apiOk(links);
    }

    if (mode === "donation") {
      const admin = request.nextUrl.searchParams.get("admin") === "1";
      if (admin) await requireAdmin();
      const status = (request.nextUrl.searchParams.get("status") ??
        (admin ? "ALL" : "CONFIRMED")) as DonationStatus | "ALL";
      const items = await listDonations({
        status,
        limit: Number(request.nextUrl.searchParams.get("limit") ?? 80)
      });
      return apiOk(items);
    }

    const postId = request.nextUrl.searchParams.get("postId");
    const momentId = request.nextUrl.searchParams.get("momentId");
    
    if (!postId && !momentId) return apiError("postId or momentId is required", 400);

    const whereCondition: any = { status: "VISIBLE", parentId: null };
    if (postId) whereCondition.postId = postId;
    if (momentId) whereCondition.momentId = momentId;

    // Return comments with nested replies (2-level: top-level + replies)
    const comments = await db.comment.findMany({
      where: whereCondition,
      select: {
        id: true,
        content: true,
        status: true,
        parentId: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true
          }
        },
        replies: {
          where: { status: "VISIBLE" },
          select: {
            id: true,
            content: true,
            parentId: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return apiOk(comments);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to get comments", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const payloadRaw = await request.json();

    if (payloadRaw?.mode === "friend-link-apply") {
      const payload = friendLinkApplySchema.parse(payloadRaw);
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
      if (isRateLimited(`friend-link-apply:ip:${ip}`, 4, windowMs)) {
        return apiError("Friend link apply rate limit exceeded", 429);
      }

      await createFriendLink({
        avatarUrl: payload.avatarUrl,
        name: payload.name,
        email: payload.email.toLowerCase(),
        siteName: payload.siteName,
        siteUrl: payload.siteUrl,
        description: payload.description,
        status: "PENDING"
      });

      await sendMail({
        to: "wanfeng572@gmail.com",
        subject: "晚风博客友链申请",
        text: `收到新的友链申请：
昵称：${payload.name}
邮箱：${payload.email}
站点：${payload.siteName}
链接：${payload.siteUrl}
简介：${payload.description}`,
        html: `<p>收到新的友链申请：</p>
<ul>
  <li>昵称：${payload.name}</li>
  <li>邮箱：${payload.email}</li>
  <li>站点：${payload.siteName}</li>
  <li>链接：${payload.siteUrl}</li>
  <li>简介：${payload.description}</li>
</ul>`
      });
      return apiOk({ applied: true }, 201);
    }

    if (payloadRaw?.mode === "friend-link-admin") {
      await requireAdmin();
      const payload = friendLinkAdminCreateSchema.parse(payloadRaw);
      await createFriendLink({
        avatarUrl: payload.avatarUrl,
        name: payload.name,
        email: payload.email.toLowerCase(),
        siteName: payload.siteName,
        siteUrl: payload.siteUrl,
        description: payload.description,
        status: "APPROVED"
      });
      return apiOk({ created: true }, 201);
    }

    if (payloadRaw?.mode === "donation") {
      const payload = createDonationSchema.parse(payloadRaw);
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
      if (isRateLimited(`donation:ip:${ip}`, 6, windowMs)) {
        return apiError("Donation rate limit exceeded", 429);
      }

      await createDonation({
        name: payload.name,
        email: payload.email ? payload.email.toLowerCase() : null,
        amount: payload.amount,
        message: payload.message ? payload.message.trim() : null,
        paymentMethod: payload.paymentMethod,
        status: "PENDING"
      });
      return apiOk({ created: true }, 201);
    }

    if (payloadRaw?.mode === "message") {
      const payload = createMessageSchema.parse(payloadRaw);
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
      const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
      if (isRateLimited(`message:ip:${ip}`, 8, windowMs)) {
        return apiError("Message rate limit exceeded", 429);
      }

      const cleanContent = sanitizeHtml(payload.content, { allowedTags: [], allowedAttributes: {} }).trim();
      if (!cleanContent) return apiError("Message cannot be empty", 400);

      // Use session user info if logged in
      const userName = session?.user?.name ?? payload.name;
      const userEmail = session?.user?.email ?? (payload.email ? payload.email.trim().toLowerCase() : null);
      const userAvatar = (session?.user as any)?.image ?? (payload.avatarUrl || null);

      await createMessage({
        id: randomUUID(),
        name: userName,
        email: userEmail,
        avatarUrl: userAvatar,
        content: cleanContent,
        status: "VISIBLE",
        parentId: payload.parentId ?? null,
        ip,
        userId: session?.user?.id ?? null
      });

      return apiOk({ created: true }, 201);
    }

    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const payload = createCommentSchema.parse(payloadRaw);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const max = Number(process.env.RATE_LIMIT_MAX_COMMENT ?? 6);
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
    if (isRateLimited(`comment:user:${session.user.id}`, max, windowMs)) {
      return apiError("Comment rate limit exceeded", 429);
    }
    if (isRateLimited(`comment:ip:${ip}`, max * 2, windowMs)) {
      return apiError("IP rate limit exceeded", 429);
    }

    const cleanContent = sanitizeHtml(payload.content, {
      allowedTags: [],
      allowedAttributes: {}
    }).trim();
    if (!cleanContent) return apiError("Comment cannot be empty", 400);

    const comment = await db.comment.create({
      data: {
        postId: payload.postId ?? null,
        momentId: payload.momentId ?? null,
        userId: session.user.id,
        parentId: payload.parentId ?? null,
        content: cleanContent,
        status: "VISIBLE"
      }
    });
    return apiOk(comment, 201);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to create comment", 400);
  }
}
