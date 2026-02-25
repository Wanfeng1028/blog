import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";

const schema = z.object({
  id: z.string().cuid()
});

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiOk({ liked: false });

  const parsed = schema.safeParse(await params);
  if (!parsed.success) return apiError("Invalid post id", 400);

  const like = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "PostLike"
    WHERE "userId" = ${session.user.id} AND "postId" = ${parsed.data.id}
    LIMIT 1
  `);
  return apiOk({ liked: like.length > 0 });
}

export async function POST(_: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiError("Unauthorized", 401);

  const parsed = schema.safeParse(await params);
  if (!parsed.success) return apiError("Invalid post id", 400);
  const postId = parsed.data.id;

  const exists = await db.$queryRaw<Array<{ id: string }>>(Prisma.sql`
    SELECT id FROM "PostLike"
    WHERE "userId" = ${session.user.id} AND "postId" = ${postId}
    LIMIT 1
  `);

  if (exists[0]) {
    await db.$executeRaw(Prisma.sql`
      DELETE FROM "PostLike"
      WHERE id = ${exists[0].id}
    `);
    return apiOk({ liked: false });
  }

  await db.$executeRaw(Prisma.sql`
    INSERT INTO "PostLike" ("id", "userId", "postId", "createdAt")
    VALUES (${crypto.randomUUID()}, ${session.user.id}, ${postId}, NOW())
  `);
  return apiOk({ liked: true });
}
