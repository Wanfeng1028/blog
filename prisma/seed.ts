import bcrypt from "bcryptjs";
import { PrismaClient, PostStatus, UserRole } from "@prisma/client";
import slugify from "slugify";
import readingTime from "reading-time";
import { projectSeeds, GITHUB_PROFILE_URL } from "../src/features/projects/data";

const prisma = new PrismaClient();
const prismaAny = prisma as any;

function makeToc(content: string) {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const items: Array<{ depth: number; text: string; id: string }> = [];
  for (const match of content.matchAll(headingRegex)) {
    const depth = match[1].length;
    const text = match[2].trim();
    const id = slugify(text, { lower: true, strict: true, locale: "zh" });
    items.push({ depth, text, id });
  }
  return items;
}

const demoPosts = [
  {
    title: "Next.js App Router 全栈博客实践",
    summary: "从架构到部署，完整走通个人博客全栈方案。",
    status: PostStatus.PUBLISHED,
    tags: ["nextjs", "typescript"],
    coverImage:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1280&auto=format&fit=crop",
    content: `# Next.js App Router 全栈博客实践

## 为什么选择 App Router
App Router 提供了更清晰的服务端渲染边界，适合内容型站点。

## 数据层设计
使用 Prisma + PostgreSQL，文章与标签采用显式多对多关系。

## 部署建议
Vercel + Neon + R2 是成本和可维护性平衡较好的方案。`
  },
  {
    title: "设计 Token 如何驱动博客 UI 统一性",
    summary: "把设计稿视觉规范沉淀为变量，降低维护成本。",
    status: PostStatus.PUBLISHED,
    tags: ["design", "tailwind"],
    coverImage:
      "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?q=80&w=1280&auto=format&fit=crop",
    content: `# 设计 Token 如何驱动博客 UI 统一性

## 语义化颜色
将背景、文本、边框、强调色转为语义 token。

## Typography
字号和行高应覆盖桌面端与移动端。

## 组件复用
Button / Card / Input 统一读取 token，减少样式漂移。`
  },
  {
    title: "草稿文章示例：上线前检查清单",
    summary: "这是一篇草稿，不应在公开页显示。",
    status: PostStatus.DRAFT,
    tags: ["checklist"],
    coverImage: null,
    content: `# 草稿文章示例

这篇文章用于验证草稿逻辑，公开列表不会展示。`
  }
];

async function main() {
  const adminName = process.env.SEED_ADMIN_NAME ?? "dy";
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "wanfeng572@gmail.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "123456789wanfeng";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      passwordHash,
      role: UserRole.ADMIN
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash,
      role: UserRole.ADMIN
    }
  });

  for (const name of ["nextjs", "typescript", "design", "tailwind", "checklist"]) {
    await prisma.tag.upsert({
      where: { slug: name },
      update: { name, slug: name },
      create: { name, slug: name }
    });
  }

  const categoryNames = ["数据结构", "算法", "GIS", "前端", "计算机网络"];
  const categories = await Promise.all(
    categoryNames.map((name, index) =>
      prisma.articleCategory.upsert({
        where: { slug: slugify(name, { lower: true, strict: true, locale: "zh" }) },
        update: { name, order: index + 1 },
        create: {
          name,
          slug: slugify(name, { lower: true, strict: true, locale: "zh" }),
          order: index + 1
        }
      })
    )
  );

  for (const post of demoPosts) {
    const slug = slugify(post.title, { lower: true, strict: true, locale: "zh" });
    const read = Math.max(1, Math.ceil(readingTime(post.content).minutes));
    const publishedAt = post.status === PostStatus.PUBLISHED ? new Date() : null;

    const saved = await prisma.post.upsert({
      where: { slug },
      update: {
        title: post.title,
        summary: post.summary,
        content: post.content,
        status: post.status,
        categoryId: categories[0]?.id ?? null,
        coverImage: post.coverImage ?? undefined,
        tags: post.tags,
        toc: makeToc(post.content),
        readingTime: read,
        publishedAt
      },
      create: {
        title: post.title,
        slug,
        summary: post.summary,
        content: post.content,
        status: post.status,
        categoryId: categories[0]?.id ?? null,
        coverImage: post.coverImage ?? undefined,
        tags: post.tags,
        toc: makeToc(post.content),
        readingTime: read,
        publishedAt
      }
    });

    for (const tagName of post.tags) {
      const tag = await prisma.tag.findUnique({ where: { slug: tagName } });
      if (tag) {
        await prisma.postTag.upsert({
          where: { postId_tagId: { postId: saved.id, tagId: tag.id } },
          update: {},
          create: { postId: saved.id, tagId: tag.id }
        });
      }
    }
  }

  for (const project of projectSeeds) {
    await prismaAny.project.upsert({
      where: { slug: project.slug },
      update: {
        order: project.order,
        title: project.title,
        subtitle: project.subtitle,
        role: project.role,
        period: project.period,
        summary: project.summary,
        highlights: project.highlights,
        techStack: project.techStack,
        githubUrl: project.githubUrl ?? GITHUB_PROFILE_URL,
        demoUrl: project.demoUrl ?? null
      },
      create: {
        order: project.order,
        slug: project.slug,
        title: project.title,
        subtitle: project.subtitle,
        role: project.role,
        period: project.period,
        summary: project.summary,
        highlights: project.highlights,
        techStack: project.techStack,
        githubUrl: project.githubUrl ?? GITHUB_PROFILE_URL,
        demoUrl: project.demoUrl ?? null,
        likesCount: 0,
        viewsCount: 0
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
