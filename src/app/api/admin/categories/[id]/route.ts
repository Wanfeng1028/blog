import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { apiError, apiOk } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/auth/guards";
import { deleteArticleCategory, updateArticleCategory } from "@/features/admin/server/posts";
import { BLOG_CATEGORIES_CACHE_TAG, BLOG_POSTS_CACHE_TAG } from "@/features/blog/server/queries";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const payload = await request.json();
    const category = await updateArticleCategory(id, payload);
    revalidateTag(BLOG_CATEGORIES_CACHE_TAG);
    revalidateTag(BLOG_POSTS_CACHE_TAG);
    revalidatePath("/blog");
    revalidatePath("/admin/categories");
    return apiOk(category);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update category";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    await deleteArticleCategory(id);
    revalidateTag(BLOG_CATEGORIES_CACHE_TAG);
    revalidateTag(BLOG_POSTS_CACHE_TAG);
    revalidatePath("/blog");
    revalidatePath("/admin/categories");
    return apiOk({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete category";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}
