import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/auth/guards";
import { upsertTag } from "@/features/admin/server/posts";
import { BLOG_TAGS_CACHE_TAG } from "@/features/blog/server/queries";

const schema = z.object({
  name: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const payload = schema.parse(await request.json());
    const tag = await upsertTag(payload.name);
    revalidateTag(BLOG_TAGS_CACHE_TAG);
    return apiOk(tag, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create tag";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}
