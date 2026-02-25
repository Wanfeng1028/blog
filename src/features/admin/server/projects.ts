import "server-only";
import { z } from "zod";
import { db } from "@/lib/db";
import { projectInputSchema } from "@/features/admin/server-schema";
import { toSlug } from "@/lib/utils/slug";

function getProjectClient() {
  const client = (db as any).project;
  return client && typeof client.findMany === "function" ? client : null;
}

async function createUniqueProjectSlug(title: string, currentId?: string) {
  const projectClient = getProjectClient();
  const base = toSlug(title);
  let candidate = base;
  let index = 2;

  if (!projectClient) return candidate;

  for (;;) {
    const conflict = await projectClient.findFirst({
      where: {
        slug: candidate,
        ...(currentId ? { id: { not: currentId } } : {})
      },
      select: { id: true }
    });
    if (!conflict) return candidate;
    candidate = `${base}-${index}`;
    index += 1;
  }
}

export async function listAdminProjects() {
  const projectClient = getProjectClient();
  if (!projectClient) return [];
  return projectClient.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }]
  });
}

export async function createProject(input: unknown) {
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid project payload");
  }

  const projectClient = getProjectClient();
  if (!projectClient) throw new Error("Project table is unavailable");

  const data = parsed.data;
  const slug = await createUniqueProjectSlug(data.slug?.trim() || data.title);

  return projectClient.create({
    data: {
      order: data.order,
      slug,
      title: data.title,
      subtitle: data.subtitle,
      role: data.role,
      period: data.period,
      summary: data.summary,
      highlights: data.highlights,
      techStack: data.techStack,
      githubUrl: data.githubUrl || null,
      demoUrl: data.demoUrl || null,
      sourceRepo: data.sourceRepo || null
    }
  });
}

export async function updateProject(input: unknown) {
  const updateSchema = projectInputSchema
    .omit({ id: true })
    .and(z.object({ id: z.string().min(1) }));
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid project payload");
  }

  const projectClient = getProjectClient();
  if (!projectClient) throw new Error("Project table is unavailable");

  const data = parsed.data;
  const existing = await projectClient.findUnique({ where: { id: data.id } });
  if (!existing) throw new Error("Project not found");

  const nextSlug =
    data.slug && data.slug.trim()
      ? await createUniqueProjectSlug(data.slug.trim(), data.id)
      : existing.title !== data.title
        ? await createUniqueProjectSlug(data.title, data.id)
        : existing.slug;

  return projectClient.update({
    where: { id: data.id },
    data: {
      order: data.order,
      slug: nextSlug,
      title: data.title,
      subtitle: data.subtitle,
      role: data.role,
      period: data.period,
      summary: data.summary,
      highlights: data.highlights,
      techStack: data.techStack,
      githubUrl: data.githubUrl || null,
      demoUrl: data.demoUrl || null,
      sourceRepo: data.sourceRepo || null
    }
  });
}

export async function deleteProject(id: string) {
  const projectClient = getProjectClient();
  if (!projectClient) throw new Error("Project table is unavailable");
  await projectClient.delete({ where: { id } });
}
