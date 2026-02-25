import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";

const schema = z.object({
  id: z.string().cuid()
});

type Params = { params: Promise<{ id: string }> };

export async function POST(_: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiOk({ tracked: false });

  const parsed = schema.safeParse(await params);
  if (!parsed.success) return apiError("Invalid post id", 400);

  await db.$executeRaw(Prisma.sql`
    INSERT INTO "PostView" ("id", "userId", "postId", "viewedAt")
    VALUES (${crypto.randomUUID()}, ${session.user.id}, ${parsed.data.id}, NOW())
  `);
  return apiOk({ tracked: true });
}
