import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import { getUserFavorites } from "@/features/user/server/dashboard";

const deleteSchema = z.object({
  postId: z.string().cuid()
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiError("Unauthorized", 401);

  const items = await getUserFavorites(session.user.id);
  return apiOk(
    items.map((item: { id: string; createdAt: Date; post: { id: string; title: string; slug: string; summary: string } }) => ({
      id: item.id,
      createdAt: item.createdAt.toISOString(),
      post: item.post
    }))
  );
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiError("Unauthorized", 401);

  try {
    const payload = deleteSchema.parse(await request.json());
    await db.$executeRaw(Prisma.sql`
      DELETE FROM "PostFavorite"
      WHERE "userId" = ${session.user.id} AND "postId" = ${payload.postId}
    `);
    return apiOk({ removed: true });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.issues[0]?.message ?? "Invalid payload", 400);
    return apiError(error instanceof Error ? error.message : "Failed to remove favorite", 500);
  }
}
