import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { apiError, apiOk } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/auth/guards";
import { createPost } from "@/features/admin/server/posts";
import {
  BLOG_ADJACENT_CACHE_TAG,
  BLOG_CATEGORIES_CACHE_TAG,
  BLOG_POSTS_CACHE_TAG,
  BLOG_TAGS_CACHE_TAG
} from "@/features/blog/server/queries";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const post = await createPost(payload);
    revalidateTag(BLOG_POSTS_CACHE_TAG);
    revalidateTag(BLOG_TAGS_CACHE_TAG);
    revalidateTag(BLOG_CATEGORIES_CACHE_TAG);
    revalidateTag(BLOG_ADJACENT_CACHE_TAG);
    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath(`/blog/${post.slug}`);
    revalidatePath("/admin/posts");
    revalidatePath("/admin/categories");
    return apiOk({ id: post.id, slug: post.slug }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create post";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}
