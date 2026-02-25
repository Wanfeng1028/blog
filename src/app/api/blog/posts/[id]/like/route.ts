import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import { BLOG_POST_DETAIL_CACHE_TAG, BLOG_POSTS_CACHE_TAG } from "@/features/blog/server/queries";
import { DASHBOARD_LIKES_TAG, DASHBOARD_OVERVIEW_TAG, DASHBOARD_RECENT_TAG } from "@/features/user/server/dashboard";

const schema = z.object({
  id: z.string().cuid()
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const parsed = schema.safeParse(await params);
  if (!parsed.success) return apiError("Invalid post id", 400);
  const postId = parsed.data.id;

  const [post] = await db.$queryRaw<Array<{ likesCount: number }>>(Prisma.sql`
    SELECT "likesCount" FROM "Post" WHERE id = ${postId} LIMIT 1
  `);
  const likesCount = post?.likesCount ?? 0;

  const session = await auth();
  if (!session?.user?.id) {
    return apiOk({ liked: false, likesCount });
  }

  const like = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "PostLike"
    WHERE "userId" = ${session.user.id} AND "postId" = ${postId}
    LIMIT 1
  `);
  return apiOk({ liked: like.length > 0, likesCount });
}

export async function POST(_: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError("请先登录后再点赞", 401);
  }

  const parsed = schema.safeParse(await params);
  if (!parsed.success) return apiError("Invalid post id", 400);
  const postId = parsed.data.id;

  // 验证 session 中的 userId 在数据库中仍然存在（防止 JWT 过期但 cookie 未清理）
  const userExists = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "User" WHERE id = ${session.user.id} LIMIT 1
  `);
  if (!userExists[0]) {
    return apiError("用户信息已失效，请重新登录", 401);
  }

  const exists = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "PostLike"
    WHERE "userId" = ${session.user.id} AND "postId" = ${postId}
    LIMIT 1
  `);

  if (exists[0]) {
    // 取消点赞（原子操作）
    await db.$executeRaw(Prisma.sql`DELETE FROM "PostLike" WHERE id = ${exists[0].id}`);
    await db.$executeRaw(Prisma.sql`
      UPDATE "Post" SET "likesCount" = GREATEST(0, "likesCount" - 1) WHERE id = ${postId}
    `);
    const [post] = await db.$queryRaw<Array<{ likesCount: number }>>(Prisma.sql`
      SELECT "likesCount" FROM "Post" WHERE id = ${postId} LIMIT 1
    `);
    revalidateTag(BLOG_POSTS_CACHE_TAG);
    revalidateTag(BLOG_POST_DETAIL_CACHE_TAG);
    revalidateTag(DASHBOARD_OVERVIEW_TAG);
    revalidateTag(DASHBOARD_LIKES_TAG);
    revalidateTag(DASHBOARD_RECENT_TAG);
    return apiOk({ liked: false, likesCount: post?.likesCount ?? 0 });
  }

  // 点赞 — 使用 ORM create 保证 FK 正确性
  await db.postLike.create({
    data: { userId: session.user.id, postId }
  });
  await db.$executeRaw(Prisma.sql`
    UPDATE "Post" SET "likesCount" = "likesCount" + 1 WHERE id = ${postId}
  `);
  const [post] = await db.$queryRaw<Array<{ likesCount: number }>>(Prisma.sql`
    SELECT "likesCount" FROM "Post" WHERE id = ${postId} LIMIT 1
  `);
  revalidateTag(BLOG_POSTS_CACHE_TAG);
  revalidateTag(BLOG_POST_DETAIL_CACHE_TAG);
  revalidateTag(DASHBOARD_OVERVIEW_TAG);
  revalidateTag(DASHBOARD_LIKES_TAG);
  revalidateTag(DASHBOARD_RECENT_TAG);
  return apiOk({ liked: true, likesCount: post?.likesCount ?? 0 });
}
