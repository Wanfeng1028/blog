import { apiError, apiOk } from "@/lib/utils/api";
import { getArticleCategoriesWithCount, getPosts, getTagsWithCount } from "@/features/blog/server/queries";

export const revalidate = 120;

export async function GET() {
  try {
    const [{ total: postCount }, tags, categories] = await Promise.all([
      getPosts({ pageSize: 1 }),
      getTagsWithCount(),
      getArticleCategoriesWithCount()
    ]);
    return apiOk({
      postCount,
      tagCount: tags.length,
      categoryCount: categories.length
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    return apiError(message, 500);
  }
}
