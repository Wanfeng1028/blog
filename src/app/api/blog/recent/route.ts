import { apiError, apiOk } from "@/lib/utils/api";
import { getPosts } from "@/features/blog/server/queries";

export const revalidate = 60;

export async function GET() {
  try {
    const result = await getPosts({
      page: 1,
      pageSize: 10,
      includeDraft: false
    });
    return apiOk(result.items);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch recent posts";
    return apiError(message, 400);
  }
}
