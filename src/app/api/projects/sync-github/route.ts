import { requireAdmin } from "@/lib/auth/guards";
import { apiError, apiOk } from "@/lib/utils/api";
import { syncProjectsFromGitHub } from "@/features/projects/server";

export async function POST() {
  try {
    await requireAdmin();
    const result = await syncProjectsFromGitHub();
    return apiOk(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to sync projects";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return apiError(message, status);
  }
}

