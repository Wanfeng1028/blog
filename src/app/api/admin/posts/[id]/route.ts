import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { apiError, apiOk } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/auth/guards";
import { deletePost, updatePost } from "@/features/admin/server/posts";
import {
  BLOG_ADJACENT_CACHE_TAG,
  BLOG_CATEGORIES_CACHE_TAG,
  BLOG_POSTS_CACHE_TAG,
  BLOG_TAGS_CACHE_TAG
} from "@/features/blog/server/queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const params = await context.params;
    const { id } = params;
    const payload = await request.json();
    const post = await updatePost(id, payload);
    revalidateTag(BLOG_POSTS_CACHE_TAG);
    revalidateTag(BLOG_TAGS_CACHE_TAG);
    revalidateTag(BLOG_CATEGORIES_CACHE_TAG);
    revalidateTag(BLOG_ADJACENT_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/posts");
    revalidatePath("/admin/categories");
    return apiOk({ id: post.id, slug: post.slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update post";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const params = await context.params;
    const { id } = params;
    await deletePost(id);
    revalidateTag(BLOG_POSTS_CACHE_TAG);
    revalidateTag(BLOG_TAGS_CACHE_TAG);
    revalidateTag(BLOG_CATEGORIES_CACHE_TAG);
    revalidateTag(BLOG_ADJACENT_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/admin/posts");
    revalidatePath("/admin/categories");
    return apiOk({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete post";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}
