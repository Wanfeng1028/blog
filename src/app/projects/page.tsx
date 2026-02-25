import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ExternalLink, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProjectStats } from "@/components/projects/project-stats";
import { GITHUB_PROFILE_URL, aiTools, toolCategories } from "@/features/projects/data";
import { listProjects } from "@/features/projects/server";
import { ProjectSearch } from "./_components/project-search";

export const metadata: Metadata = {
  title: "项目",
  description: "AI Tools 导航与我的项目展示页。"
};

export const revalidate = 120;

type PageProps = {
  searchParams: Promise<{
    group?: string;
    cat?: string;
    q?: string;
  }>;
};

function includesKeyword(
  tool: { name: string; summary: string; tags: string[] },
  keyword: string
) {
  const needle = keyword.trim().toLowerCase();
  if (!needle) return true;
  const haystack = `${tool.name} ${tool.summary} ${tool.tags.join(" ")}`.toLowerCase();
  return haystack.includes(needle);
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const group = params.group === "my-projects" ? "my-projects" : "ai-tools";
  const cat = params.cat ?? "all";
  const q = params.q?.trim() ?? "";

  const filteredTools =
    group === "ai-tools"
      ? aiTools.filter((tool) => {
          if (cat !== "all" && tool.category !== cat) return false;
          if (!includesKeyword(tool, q)) return false;
          return true;
        })
      : [];

  const projects = group === "my-projects" ? await listProjects() : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Link href="/projects?group=ai-tools">
          <Badge className={group === "ai-tools" ? "border-primary text-primary" : ""}>AI Tools</Badge>
        </Link>
        <Link href="/projects?group=my-projects">
          <Badge className={group === "my-projects" ? "border-primary text-primary" : ""}>我的项目</Badge>
        </Link>
      </div>

      {group === "ai-tools" ? (
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/50 bg-white/58 p-4 shadow-[0_10px_28px_rgba(30,41,59,0.12)] backdrop-blur-md lg:sticky lg:top-24 lg:self-start">
            <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-700">
              <Filter className="size-4" />
              分类
            </h2>
            <div className="mt-3 grid gap-2">
              {toolCategories.map((category) => (
                <Link
                  className={`rounded-lg border px-3 py-2 text-sm transition ${
                    cat === category.key
                      ? "border-sky-300 bg-sky-50 text-sky-700"
                      : "border-zinc-200 bg-white/80 text-zinc-700 hover:border-sky-200 hover:text-sky-700"
                  }`}
                  href={`/projects?group=ai-tools&cat=${category.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                  key={category.key}
                >
                  {category.label}
                </Link>
              ))}
            </div>
          </aside>

          <section className="space-y-4">
            <ProjectSearch cat={cat} defaultQ={q} />

            <div className="rounded-lg px-1 text-xs text-zinc-600">共 {filteredTools.length} 个工具</div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredTools.map((tool) => (
                <Card className="border-white/55 bg-white/72 backdrop-blur-md" key={tool.name}>
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold">{tool.name}</h3>
                      <a
                        className="inline-flex size-7 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 hover:text-zinc-950"
                        href={tool.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                    <p className="text-sm text-zinc-600">{tool.summary}</p>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {tool.tags.map((tag) => (
                      <span
                        className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600"
                        key={`${tool.name}-${tag}`}
                      >
                        {tag}
                      </span>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold text-zinc-900">我的项目</h1>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => {
              const githubUrl = project.githubUrl || GITHUB_PROFILE_URL;
              return (
                <Card className="border-white/55 bg-white/78 backdrop-blur-md" key={project.slug}>
                  <CardHeader className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wider text-zinc-500">
                          Project #{project.order}
                        </p>
                        <h2 className="line-clamp-2 text-xl font-semibold">{project.title}</h2>
                        <p className="mt-1 text-xs text-zinc-500">
                          {project.role} · {project.period}
                        </p>
                      </div>
                      <ProjectStats
                        initialLikes={project.likesCount}
                        initialViews={project.viewsCount}
                        slug={project.slug}
                      />
                    </div>
                    <p className="line-clamp-3 text-sm text-zinc-600">{project.summary}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {project.techStack.map((tech) => (
                        <Badge key={`${project.slug}-${tech}`}>{tech}</Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:text-zinc-950"
                        href={`/projects/${project.slug}`}
                      >
                        项目详情
                        <ArrowUpRight className="size-4" />
                      </Link>
                      <a
                        className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 hover:text-zinc-950"
                        href={githubUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        GitHub
                        <ExternalLink className="size-4" />
                      </a>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
