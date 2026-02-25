import { NextRequest } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { apiError, apiOk } from "@/lib/utils/api";
import { listProjects, PROJECTS_CACHE_TAG } from "@/features/projects/server";
import { requireAdmin } from "@/lib/auth/guards";
import { createProject, deleteProject, listAdminProjects, updateProject } from "@/features/admin/server/projects";

const deleteSchema = z.object({
  id: z.string().min(1)
});

export async function GET(request: NextRequest) {
  try {
    const mode = new URL(request.url).searchParams.get("mode");
    if (mode === "admin") {
      await requireAdmin();
      const items = await listAdminProjects();
      return apiOk(items);
    }

    const items = await listProjects();
    return apiOk(items);
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "Failed to load projects", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const project = await createProject(payload);
    revalidateTag(PROJECTS_CACHE_TAG);
    revalidatePath("/projects");
    revalidatePath(`/projects/${project.slug}`);
    revalidatePath("/admin");
    return apiOk(project, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
    const payload = await request.json();
    const project = await updateProject(payload);
    revalidateTag(PROJECTS_CACHE_TAG);
    revalidatePath("/projects");
    revalidatePath(`/projects/${project.slug}`);
    revalidatePath("/admin");
    return apiOk(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update project";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
    const payload = deleteSchema.parse(await request.json());
    await deleteProject(payload.id);
    revalidateTag(PROJECTS_CACHE_TAG);
    revalidatePath("/projects");
    revalidatePath("/admin");
    return apiOk({ deleted: true });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.issues[0]?.message ?? "Invalid payload", 400);
    const message = error instanceof Error ? error.message : "Failed to delete project";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 400;
    return apiError(message, status);
  }
}
