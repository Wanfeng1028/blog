import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/utils/api";
import { getUserComments } from "@/features/user/server/dashboard";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiError("Unauthorized", 401);

  const items = await getUserComments(session.user.id);
  return apiOk(
    items.map((item) => ({
      id: item.id,
      content: item.content,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      post: item.post
    }))
  );
}
