import { PrismaClient } from "@prisma/client";

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

const prisma = new PrismaClient();
const prismaAny = prisma as any;

async function main() {
  const username = process.env.GITHUB_USERNAME ?? "Wanfeng1028";
  const token = process.env.GITHUB_TOKEN;

  const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      Accept: "application/vnd.github+json",
      "User-Agent": "wanfeng-blog-web-script"
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`GitHub sync failed: ${message}`);
  }

  const repos = (await response.json()) as GitHubRepo[];
  let order = 1;

  for (const repo of repos) {
    const slug = repo.name.toLowerCase();
    const title = repo.name.replace(/[-_]/g, " ");
    const summary = repo.description?.trim() || `${repo.name} 项目，介绍待完善。`;
    const techStack = [repo.language, ...(repo.topics ?? [])].filter(Boolean) as string[];

    await prismaAny.project.upsert({
      where: { slug },
      update: {
        order,
        title,
        subtitle: "来自 GitHub 仓库同步",
        role: "开发者",
        period: "持续迭代",
        summary,
        highlights: ["项目内容可在后台继续完善", "数据来源：GitHub 仓库同步", "支持点赞与浏览统计联动"],
        techStack,
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
        highlights: ["项目内容可在后台继续完善", "数据来源：GitHub 仓库同步", "支持点赞与浏览统计联动"],
        techStack,
        githubUrl: repo.html_url,
        demoUrl: repo.homepage || null,
        sourceRepo: repo.name,
        likesCount: Math.max(0, repo.stargazers_count),
        viewsCount: Math.max(0, repo.watchers_count)
      }
    });

    order += 1;
  }

  console.log(`Synced ${repos.length} repositories from ${username}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
