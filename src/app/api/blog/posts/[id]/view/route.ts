import { z } from "zod";
import { Prisma } from "@prisma/client";
import { revalidateTag } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiOk, apiError } from "@/lib/utils/api";
import { BLOG_POST_DETAIL_CACHE_TAG, BLOG_POSTS_CACHE_TAG } from "@/features/blog/server/queries";

const schema = z.object({
  id: z.string().cuid()
});

type Params = { params: Promise<{ id: string }> };

const WINDOW_MS = 30 * 60 * 1000; // 30 分钟内同一 IP 只计一次

export async function POST(request: Request, { params }: Params) {
  const parsed = schema.safeParse(await params);
  if (!parsed.success) return apiError("Invalid post id", 400);
  const postId = parsed.data.id;

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const bucketKey = `view:post:${postId}:${ip}`;
  const windowStart = new Date(Date.now() - WINDOW_MS);

  // 查询防刷桶
  const [bucket] = await db.$queryRaw<Array<{ window_start: Date }>>(Prisma.sql`
    SELECT window_start FROM rate_limit_buckets
    WHERE key = ${bucketKey}
    LIMIT 1
  `);

  // 时窗内已计入，直接返回
  if (bucket && bucket.window_start > windowStart) {
    return apiOk({ tracked: false, deduped: true });
  }

  // 原子递增 viewsCount
  await db.$executeRaw(Prisma.sql`
    UPDATE "Post" SET "viewsCount" = "viewsCount" + 1 WHERE id = ${postId}
  `);

  // 更新防刷桶
  await db.$executeRaw(Prisma.sql`
    INSERT INTO rate_limit_buckets (key, count, window_start, updated_at)
    VALUES (${bucketKey}, 1, NOW(), NOW())
    ON CONFLICT (key) DO UPDATE
      SET count = 1, window_start = NOW(), updated_at = NOW()
  `);

  // 登录用户额外写入 PostView 明细
  const session = await auth();
  if (session?.user?.id && session.user.role === "USER") {
    await db.$executeRaw(Prisma.sql`
      INSERT INTO "PostView" ("id", "userId", "postId", "viewedAt")
      VALUES (${crypto.randomUUID()}, ${session.user.id}, ${postId}, NOW())
    `);
  }

  const [post] = await db.$queryRaw<Array<{ viewsCount: number }>>(Prisma.sql`
    SELECT "viewsCount" FROM "Post" WHERE id = ${postId} LIMIT 1
  `);

  revalidateTag(BLOG_POSTS_CACHE_TAG);
  revalidateTag(BLOG_POST_DETAIL_CACHE_TAG);
  return apiOk({ tracked: true, viewsCount: post?.viewsCount ?? 0 });
}
