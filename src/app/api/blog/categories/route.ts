import { apiError, apiOk } from "@/lib/utils/api";
import { getArticleCategoriesWithCount } from "@/features/blog/server/queries";

export const revalidate = 60;

export async function GET() {
  try {
    const categories = await getArticleCategoriesWithCount();
    return apiOk(categories);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch categories";
    return apiError(message, 400);
  }
}
