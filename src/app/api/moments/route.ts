import { NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import { isRateLimited } from "@/lib/utils/rate-limit";

const createMomentSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  images: z.array(z.string()).optional()
});

export async function GET(request: NextRequest) {
  try {
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
    const cursor = request.nextUrl.searchParams.get("cursor");

    const moments = await db.moment.findMany({
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        },
        _count: {
          select: { comments: true }
        }
      }
    });

    let nextCursor: string | null = null;
    if (moments.length > limit) {
      const nextItem = moments.pop();
      nextCursor = nextItem!.id;
    }

    return apiOk({ items: moments, nextCursor });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to load moments", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const payloadRaw = await request.json();
    const payload = createMomentSchema.parse(payloadRaw);

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
    if (isRateLimited(`moment:ip:${ip}`, 10, windowMs)) {
      return apiError("Moment rate limit exceeded", 429);
    }

    const moment = await db.moment.create({
      data: {
        content: payload.content,
        images: payload.images ?? undefined,
        userId: session.user.id
      },
      include: {
        user: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    return apiOk(moment, 201);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to create moment", 400);
  }
}
