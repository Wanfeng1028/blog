import { apiError, apiOk } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/auth/guards";
import { getAuthEvents, getSecurityAlerts, getSecurityOverview } from "@/lib/auth/security";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const url = new URL(request.url);
    const kind = url.searchParams.get("kind") ?? "alerts";

    if (kind === "overview") {
      const overview = await getSecurityOverview();
      return apiOk(overview);
    }

    if (kind === "events") {
      const limit = Math.min(Number(url.searchParams.get("limit") ?? 100), 200);
      const offset = Math.max(Number(url.searchParams.get("offset") ?? 0), 0);
      const items = await getAuthEvents(limit, offset);
      return apiOk({ items, limit, offset });
    }

    const alerts = await getSecurityAlerts(50);
    return apiOk(alerts);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get alerts";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return apiError(message, status);
  }
}
