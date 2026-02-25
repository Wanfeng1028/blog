import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { apiError, apiOk } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/auth/guards";
import { reorderArticleCategories } from "@/features/admin/server/posts";
import { BLOG_CATEGORIES_CACHE_TAG, BLOG_POSTS_CACHE_TAG } from "@/features/blog/server/queries";

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const payload = await request.json();
    await reorderArticleCategories(payload);
    revalidateTag(BLOG_CATEGORIES_CACHE_TAG);
    revalidateTag(BLOG_POSTS_CACHE_TAG);
    revalidatePath("/blog");
    revalidatePath("/admin/categories");
    return apiOk({ reordered: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reorder categories";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}
