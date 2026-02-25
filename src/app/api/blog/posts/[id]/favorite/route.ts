import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import { DASHBOARD_FAVORITES_TAG, DASHBOARD_OVERVIEW_TAG, DASHBOARD_RECENT_TAG } from "@/features/user/server/dashboard";

const schema = z.object({
  id: z.string().cuid()
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return apiOk({ favorited: false });

  const parsed = schema.safeParse(await params);
  if (!parsed.success) return apiError("Invalid post id", 400);

  const favorite = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "PostFavorite"
    WHERE "userId" = ${session.user.id} AND "postId" = ${parsed.data.id}
    LIMIT 1
  `);
  return apiOk({ favorited: favorite.length > 0 });
}

export async function POST(_: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return apiError("Unauthorized", 401);

  const parsed = schema.safeParse(await params);
  if (!parsed.success) return apiError("Invalid post id", 400);
  const postId = parsed.data.id;

  // 验证 session 中的 userId 在数据库中仍然存在
  const userExists = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "User" WHERE id = ${session.user.id} LIMIT 1
  `);
  if (!userExists[0]) {
    return apiError("用户信息已失效，请重新登录", 401);
  }

  const exists = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "PostFavorite"
    WHERE "userId" = ${session.user.id} AND "postId" = ${postId}
    LIMIT 1
  `);

  if (exists[0]) {
    await db.$executeRaw(Prisma.sql`
      DELETE FROM "PostFavorite"
      WHERE id = ${exists[0].id}
    `);
    revalidateTag(DASHBOARD_OVERVIEW_TAG);
    revalidateTag(DASHBOARD_FAVORITES_TAG);
    revalidateTag(DASHBOARD_RECENT_TAG);
    return apiOk({ favorited: false });
  }

  await db.postFavorite.create({
    data: { userId: session.user.id, postId }
  });
  revalidateTag(DASHBOARD_OVERVIEW_TAG);
  revalidateTag(DASHBOARD_FAVORITES_TAG);
  revalidateTag(DASHBOARD_RECENT_TAG);
  return apiOk({ favorited: true });
}
