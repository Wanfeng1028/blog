import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(50),
  image: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(300).optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal(""))
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiError("Unauthorized", 401);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      name: true,
      image: true
    }
  });
  if (!user) return apiError("User not found", 404);

  const profileRows = await db.$queryRaw<
    Array<{ bio: string | null; githubUrl: string | null; websiteUrl: string | null }>
  >(Prisma.sql`
    SELECT "bio", "githubUrl", "websiteUrl"
    FROM "UserProfile"
    WHERE "userId" = ${session.user.id}
    LIMIT 1
  `);
  const profile = profileRows[0];

  return apiOk({
    ...user,
    createdAt: user.createdAt.toISOString(),
    bio: profile?.bio ?? null,
    githubUrl: profile?.githubUrl ?? null,
    websiteUrl: profile?.websiteUrl ?? null
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiError("Unauthorized", 401);

  try {
    const payload = profileSchema.parse(await request.json());
    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: payload.name,
        image: payload.image || null
      }
    });
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "UserProfile" ("userId", "bio", "githubUrl", "websiteUrl", "updatedAt")
      VALUES (${session.user.id}, ${payload.bio || null}, ${payload.githubUrl || null}, ${payload.websiteUrl || null}, NOW())
      ON CONFLICT ("userId")
      DO UPDATE SET
        "bio" = EXCLUDED."bio",
        "githubUrl" = EXCLUDED."githubUrl",
        "websiteUrl" = EXCLUDED."websiteUrl",
        "updatedAt" = NOW()
    `);
    return apiOk({ updated: true });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.issues[0]?.message ?? "Invalid payload", 400);
    return apiError(error instanceof Error ? error.message : "Failed to update profile", 500);
  }
}
