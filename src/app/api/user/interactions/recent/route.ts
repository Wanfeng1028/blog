import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/utils/api";
import { getRecentInteractions } from "@/features/user/server/dashboard";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiError("Unauthorized", 401);

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "12");
  const items = await getRecentInteractions(session.user.id, Math.min(50, Math.max(1, limit)));
  return apiOk(items);
}
