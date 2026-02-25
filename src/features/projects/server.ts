import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { GITHUB_PROFILE_URL, projectSeeds, type ProjectSeed } from "@/features/projects/data";

export type ProjectViewModel = {
  id: string;
  order: number;
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  period: string;
  summary: string;
  highlights: string[];
  techStack: string[];
  githubUrl: string;
  demoUrl?: string;
  likesCount: number;
  viewsCount: number;
  content?: string;
};

type GitHubRepo = {
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  homepage: string | null;
  topics?: string[];
};

export const PROJECTS_CACHE_TAG = "projects-public";

function normalizeProject(seed: ProjectSeed): ProjectSeed {
  return {
    ...seed,
    githubUrl: seed.githubUrl ?? GITHUB_PROFILE_URL
  };
}

function seedToViewModel(seed: ProjectSeed): ProjectViewModel {
  const s = normalizeProject(seed);
  return {
    id: `seed-${s.slug}`,
    order: s.order,
    slug: s.slug,
    title: s.title,
    subtitle: s.subtitle,
    role: s.role,
    period: s.period,
    summary: s.summary,
    highlights: s.highlights,
    techStack: s.techStack,
    githubUrl: s.githubUrl ?? GITHUB_PROFILE_URL,
    demoUrl: s.demoUrl,
    likesCount: 0,
    viewsCount: 0,
    content: undefined
  };
}

function toViewModel(project: {
  id: string;
  order: number;
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  period: string;
  summary: string;
  highlights: unknown;
  techStack: string[];
  githubUrl: string | null;
  demoUrl: string | null;
  likesCount: number;
  viewsCount: number;
  content?: string | null;
}): ProjectViewModel {
  return {
    id: project.id,
    order: project.order,
    slug: project.slug,
    title: project.title,
    subtitle: project.subtitle,
    role: project.role,
    period: project.period,
    summary: project.summary,
    highlights: Array.isArray(project.highlights) ? (project.highlights as string[]) : [],
    techStack: project.techStack,
    githubUrl: project.githubUrl ?? GITHUB_PROFILE_URL,
    demoUrl: project.demoUrl ?? undefined,
    likesCount: project.likesCount,
    viewsCount: project.viewsCount,
    content: project.content ?? undefined
  };
}

function getProjectClient() {
  const client = (db as any).project;
  return client && typeof client.findMany === "function" ? client : null;
}

function getProjectLikeClient() {
  const client = (db as any).projectLike;
  return client && typeof client.findUnique === "function" ? client : null;
}

function isMissingProjectTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("public.Project") ||
    message.includes("table") && message.includes("does not exist") ||
    message.includes("P2021")
  );
}

function fallbackProjects(): ProjectViewModel[] {
  return projectSeeds.map(seedToViewModel).sort((a, b) => a.order - b.order);
}

async function ensureProjectsSeededInternal() {
  const projectClient = getProjectClient();
  if (!projectClient) return;

  let count = 0;
  try {
    count = await projectClient.count();
  } catch (error) {
    if (isMissingProjectTableError(error)) return;
    throw error;
  }
  if (count > 0) return;

  for (const seed of projectSeeds.map(normalizeProject)) {
    await projectClient.create({
      data: {
        order: seed.order,
        slug: seed.slug,
        title: seed.title,
        subtitle: seed.subtitle,
        role: seed.role,
        period: seed.period,
        summary: seed.summary,
        highlights: seed.highlights,
        techStack: seed.techStack,
        githubUrl: seed.githubUrl,
        demoUrl: seed.demoUrl,
        sourceRepo: seed.sourceRepo,
        likesCount: 0,
        viewsCount: 0
      }
    });
  }
}

const ensureProjectsSeededCached = cache(ensureProjectsSeededInternal);

export async function ensureProjectsSeeded() {
  await ensureProjectsSeededCached();
}

async function listProjectsInternal(): Promise<ProjectViewModel[]> {
  const projectClient = getProjectClient();
  if (!projectClient) return fallbackProjects();

  try {
    await ensureProjectsSeededCached();
    const items = (await projectClient.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true, order: true, slug: true, title: true, subtitle: true,
        role: true, period: true, summary: true, highlights: true, techStack: true,
        githubUrl: true, demoUrl: true, sourceRepo: true, likesCount: true, viewsCount: true
        // content deliberately excluded from list query (large field)
      }
    })) as Array<any>;
    return items.map((item) => toViewModel(item));
  } catch (error) {
    if (isMissingProjectTableError(error)) return fallbackProjects();
    throw error;
  }
}

const listProjectsPublicCached = unstable_cache(listProjectsInternal, ["projects-list"], {
  revalidate: 120,
  tags: [PROJECTS_CACHE_TAG]
});

export async function listProjects(): Promise<ProjectViewModel[]> {
  return listProjectsPublicCached();
}

async function getProjectBySlugInternal(slug: string): Promise<ProjectViewModel | null> {
  const projectClient = getProjectClient();
  if (!projectClient) {
    return fallbackProjects().find((p) => p.slug === slug) ?? null;
  }

  try {
    await ensureProjectsSeededCached();
    const project = (await projectClient.findUnique({ where: { slug } })) as any;
    if (!project) return null;

    // Fetch `content` via raw SQL — the Prisma client may not include it in its
    // SELECT if `prisma generate` hasn't been re-run after adding the column.
    try {
      const rows = await db.$queryRaw<Array<{ content: string | null }>>`
        SELECT content FROM "Project" WHERE slug = ${slug} LIMIT 1
      `;
      project.content = rows[0]?.content ?? null;
    } catch {
      // column may not exist yet on older DBs — keep content undefined
    }

    return toViewModel(project);
  } catch (error) {
    if (isMissingProjectTableError(error)) {
      return fallbackProjects().find((p) => p.slug === slug) ?? null;
    }
    throw error;
  }
}

const getProjectBySlugPublicCached = unstable_cache(getProjectBySlugInternal, ["projects-by-slug"], {
  revalidate: 120,
  tags: [PROJECTS_CACHE_TAG]
});

export async function getProjectBySlug(slug: string): Promise<ProjectViewModel | null> {
  return getProjectBySlugPublicCached(slug);
}

export async function increaseProjectViews(slug: string) {
  const projectClient = getProjectClient();
  if (!projectClient) return 0;

  try {
    await ensureProjectsSeededCached();
    const updated = await projectClient.update({
      where: { slug },
      data: { viewsCount: { increment: 1 } },
      select: { viewsCount: true }
    });
    return updated.viewsCount as number;
  } catch (error) {
    if (isMissingProjectTableError(error)) return 0;
    throw error;
  }
}

export async function getProjectLikeState(slug: string, viewerId: string) {
  const projectClient = getProjectClient();
  const likeClient = getProjectLikeClient();
  if (!projectClient || !likeClient) return { liked: false, likesCount: 0 };

  try {
    const project = await projectClient.findUnique({ where: { slug }, select: { id: true, likesCount: true } });
    if (!project) throw new Error("NOT_FOUND");

    const liked = await likeClient.findUnique({
      where: { projectId_viewerId: { projectId: project.id, viewerId } },
      select: { id: true }
    });
    return { liked: Boolean(liked), likesCount: project.likesCount as number };
  } catch (error) {
    if (isMissingProjectTableError(error)) return { liked: false, likesCount: 0 };
    throw error;
  }
}

export async function toggleProjectLike(slug: string, viewerId: string) {
  const projectClient = getProjectClient();
  const likeClient = getProjectLikeClient();
  if (!projectClient || !likeClient) return { liked: false, likesCount: 0 };

  const session = await auth();
  let project: { id: string } | null = null;
  try {
    project = await projectClient.findUnique({ where: { slug }, select: { id: true } });
  } catch (error) {
    if (isMissingProjectTableError(error)) return { liked: false, likesCount: 0 };
    throw error;
  }
  if (!project) throw new Error("NOT_FOUND");

  return db.$transaction(async (tx) => {
    const existing = await (tx as any).projectLike.findUnique({
      where: { projectId_viewerId: { projectId: project.id, viewerId } },
      select: { id: true }
    });

    if (existing) {
      await (tx as any).projectLike.delete({ where: { id: existing.id } });
      const updated = await (tx as any).project.update({
        where: { id: project.id },
        data: { likesCount: { decrement: 1 } },
        select: { likesCount: true }
      });
      return { liked: false, likesCount: Math.max(0, updated.likesCount as number) };
    }

    await (tx as any).projectLike.create({
      data: {
        projectId: project.id,
        viewerId,
        userId: session?.user?.id ?? null
      }
    });
    const updated = await (tx as any).project.update({
      where: { id: project.id },
      data: { likesCount: { increment: 1 } },
      select: { likesCount: true }
    });
    return { liked: true, likesCount: updated.likesCount as number };
  });
}

export async function syncProjectsFromGitHub() {
  const projectClient = getProjectClient();
  if (!projectClient) {
    return { count: 0, items: [] as Array<{ slug: string; title: string }> };
  }

  const username = process.env.GITHUB_USERNAME ?? "Wanfeng1028";
  const token = process.env.GITHUB_TOKEN;

  const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/vnd.github+json",
      "User-Agent": "wanfeng-blog-web"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GITHUB_SYNC_FAILED: ${message}`);
  }

  const repos = (await response.json()) as GitHubRepo[];
  const synced: Array<{ slug: string; title: string }> = [];
  let order = 1;

  for (const repo of repos) {
    const slug = repo.name.toLowerCase();
    const title = repo.name.replace(/[-_]/g, " ");
    const summary = repo.description?.trim() || `${repo.name} 项目，更多介绍待补充。`;
    const tech = [repo.language, ...(repo.topics ?? [])].filter(Boolean) as string[];

    await projectClient.upsert({
      where: { slug },
      update: {
        order,
        title,
        subtitle: "来自 GitHub 仓库同步",
        role: "开发者",
        period: "持续迭代",
        summary,
        highlights: ["项目内容将持续补充", "支持后续手工完善项目介绍", "统计数据与后端实时联动"],
        techStack: tech,
        githubUrl: repo.html_url,
        demoUrl: repo.homepage || null,
        sourceRepo: repo.name
      },
      create: {
        order,
        slug,
        title,
        subtitle: "来自 GitHub 仓库同步",
        role: "开发者",
        period: "持续迭代",
        summary,
        highlights: ["项目内容将持续补充", "支持后续手工完善项目介绍", "统计数据与后端实时联动"],
        techStack: tech,
        githubUrl: repo.html_url,
        demoUrl: repo.homepage || null,
        sourceRepo: repo.name,
        likesCount: Math.max(0, repo.stargazers_count),
        viewsCount: Math.max(0, repo.watchers_count)
      }
    });

    synced.push({ slug, title });
    order += 1;
  }

  return { count: synced.length, items: synced };
}
