import { NextRequest } from "next/server";
import { apiError, apiOk } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/auth/guards";
import { createUser } from "@/features/admin/server/users";
import { db } from "@/lib/db";
import { getSiteSettings, updateSiteSettings } from "@/lib/site-settings";
import { z } from "zod";

const siteSettingsSchema = z.object({
  bgmEnabled: z.boolean().optional(),
  bgmSrc: z.string().optional(),
  aboutContent: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    if (request.nextUrl.searchParams.get("mode") === "site-settings") {
      const settings = await getSiteSettings();
      return apiOk(settings);
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            comments: true,
            sessions: true
          }
        }
      }
    });

    return apiOk(
      users.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        commentCount: user._count.comments,
        activeSessionCount: user._count.sessions
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch users";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const user = await createUser(payload);
    return apiOk({ id: user.id, email: user.email, role: user.role }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create user";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const mode = request.nextUrl.searchParams.get("mode");
    if (mode !== "site-settings") {
      return apiError("Unsupported mode", 400);
    }

    const payload = siteSettingsSchema.parse(await request.json());
    const settings = await updateSiteSettings(payload);
    return apiOk(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(error.issues[0]?.message ?? "Invalid payload", 400);
    }
    const message = error instanceof Error ? error.message : "Failed to update settings";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}
