import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/auth/guards";
import { togglePostPublish } from "@/features/admin/server/posts";
import {
  BLOG_ADJACENT_CACHE_TAG,
  BLOG_CATEGORIES_CACHE_TAG,
  BLOG_POSTS_CACHE_TAG,
  BLOG_TAGS_CACHE_TAG
} from "@/features/blog/server/queries";

const bodySchema = z.object({
  publish: z.boolean()
});

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const params = await context.params;
    const { id } = params;
    const payload = bodySchema.parse(await request.json());
    const post = await togglePostPublish(id, payload.publish);
    revalidateTag(BLOG_POSTS_CACHE_TAG);
    revalidateTag(BLOG_TAGS_CACHE_TAG);
    revalidateTag(BLOG_CATEGORIES_CACHE_TAG);
    revalidateTag(BLOG_ADJACENT_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/posts");
    revalidatePath("/admin/categories");
    return apiOk({ id: post.id, status: post.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update publish status";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}
