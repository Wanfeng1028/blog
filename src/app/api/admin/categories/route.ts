import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { apiError, apiOk } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/auth/guards";
import { createArticleCategory, listArticleCategories } from "@/features/admin/server/posts";
import { BLOG_CATEGORIES_CACHE_TAG, BLOG_POSTS_CACHE_TAG } from "@/features/blog/server/queries";

export async function GET() {
  try {
    await requireAdmin();
    const categories = await listArticleCategories();
    return apiOk(
      categories.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        order: item.order,
        postCount: item._count.posts
      }))
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const category = await createArticleCategory(payload);
    revalidateTag(BLOG_CATEGORIES_CACHE_TAG);
    revalidateTag(BLOG_POSTS_CACHE_TAG);
    revalidatePath("/blog");
    revalidatePath("/admin/categories");
    return apiOk(category, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}
