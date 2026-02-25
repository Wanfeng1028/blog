import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";

type SearchRow = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  publishedAt: Date | null;
  rank: number;
};

export async function GET(request: NextRequest) {
  try {
    const keyword = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const page = Number(request.nextUrl.searchParams.get("page") ?? 1);
    const pageSize = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get("pageSize") ?? 10)));
    if (keyword.length < 2) {
      return apiOk({ items: [], total: 0, page, pageSize });
    }
    const offset = (page - 1) * pageSize;

    const tsVector = Prisma.sql`to_tsvector('simple', coalesce("title", '') || ' ' || coalesce("summary", '') || ' ' || coalesce("content", ''))`;
    const tsQuery = Prisma.sql`websearch_to_tsquery('simple', ${keyword})`;

    const items = await db.$queryRaw<SearchRow[]>`
      SELECT
        "id",
        "title",
        "slug",
        "summary",
        "publishedAt",
        ts_rank(${tsVector}, ${tsQuery}) AS "rank"
      FROM "Post"
      WHERE "status" = 'PUBLISHED'
        AND ${tsVector} @@ ${tsQuery}
      ORDER BY "rank" DESC, "publishedAt" DESC
      LIMIT ${pageSize}
      OFFSET ${offset}
    `;

    const [{ count }] = await db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint as count
      FROM "Post"
      WHERE "status" = 'PUBLISHED'
        AND ${tsVector} @@ ${tsQuery}
    `;

    return apiOk({
      items,
      total: Number(count),
      page,
      pageSize
    });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Search failed", 500);
  }
}
