import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProjectStats } from "@/components/projects/project-stats";
import { GITHUB_PROFILE_URL } from "@/features/projects/data";
import { getProjectBySlug, listProjects } from "@/features/projects/server";

type ProjectDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export const revalidate = 300;

export async function generateStaticParams() {
  const projects = await listProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params
}: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "项目不存在" };
  return {
    title: `${project.title} - 项目介绍`,
    description: project.summary
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) notFound();

  const githubUrl = project.githubUrl || GITHUB_PROFILE_URL;

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
        href="/projects?group=my-projects"
      >
        <ArrowLeft className="size-4" />
        返回项目列表
      </Link>

      <Card className="border-white/55 bg-white/78 backdrop-blur-md">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-zinc-500">
                Project #{project.order}
              </p>
              <h1 className="text-3xl font-bold text-zinc-900">{project.title}</h1>
              <p className="mt-2 text-sm text-zinc-600">{project.subtitle}</p>
            </div>
            <ProjectStats
              interactive
              initialLikes={project.likesCount}
              initialViews={project.viewsCount}
              slug={project.slug}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-600">
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
              {project.role}
            </span>
            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1">
              {project.period}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">项目简介</h2>
            <p className="text-sm leading-7 text-zinc-700">{project.summary}</p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-zinc-900">关键工作</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-700">
              {project.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-zinc-900">技术栈</h2>
            <div className="flex flex-wrap gap-2">
              {project.techStack.map((tech) => (
                <Badge key={tech}>{tech}</Badge>
              ))}
            </div>
          </section>

          <section className="flex flex-wrap gap-3">
            <a
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:text-zinc-950"
              href={githubUrl}
              rel="noreferrer"
              target="_blank"
            >
              GitHub
              <ExternalLink className="size-4" />
            </a>
            {project.demoUrl ? (
              <a
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 hover:text-zinc-950"
                href={project.demoUrl}
                rel="noreferrer"
                target="_blank"
              >
                Demo
                <ExternalLink className="size-4" />
              </a>
            ) : null}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
