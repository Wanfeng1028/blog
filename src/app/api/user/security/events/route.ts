import { auth } from "@/auth";
import { apiError, apiOk } from "@/lib/utils/api";
import { getUserAuthEvents } from "@/features/user/server/dashboard";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiError("Unauthorized", 401);

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const events = await getUserAuthEvents(session.user.id, Math.min(100, Math.max(1, limit)));
  return apiOk(
    events.map((item) => ({
      id: item.id,
      eventType: item.event_type,
      success: item.success,
      ip: item.ip,
      createdAt: item.created_at.toISOString()
    }))
  );
}
