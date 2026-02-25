import "server-only";
import { PostStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { calculateReadingTime } from "@/lib/utils/reading-time";
import { createUniquePostSlug, toSlug } from "@/lib/utils/slug";
import { extractToc } from "@/lib/utils/toc";
import { articleCategoryInputSchema, articleCategorySortSchema, postInputSchema } from "@/features/admin/server-schema";

export async function listAdminPosts({
  query,
  tag,
  status,
  page = 1,
  pageSize = 10
}: {
  query?: string;
  tag?: string;
  status?: PostStatus;
  page?: number;
  pageSize?: number;
}) {
  const where: Prisma.PostWhereInput = {
    ...(status ? { status } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } }
          ]
        }
      : {})
  };
  const skip = Math.max(0, (page - 1) * pageSize);
  const [items, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip,
      take: pageSize
    }),
    db.post.count({ where })
  ]);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function createPost(input: unknown) {
  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid post payload");
  }

  const data = parsed.data;
  const slug = await createUniquePostSlug(data.title);
  const readingTime = calculateReadingTime(data.content);
  const toc = extractToc(data.content);
  const publishedAt = data.status === PostStatus.PUBLISHED ? new Date() : null;

  const post = await db.post.create({
    data: {
      title: data.title,
      slug,
      summary: data.summary,
      content: data.content,
      status: data.status,
      categoryId: data.categoryId,
      coverImage: data.coverImage || null,
      tags: data.tags,
      readingTime,
      toc,
      publishedAt
    }
  });

  await syncPostTags(post.id, data.tags);
  return post;
}

export async function updatePost(postId: string, input: unknown) {
  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid post payload");
  }
  const data = parsed.data;
  const existing = await db.post.findUnique({ where: { id: postId } });
  if (!existing) throw new Error("Post not found");

  const readingTime = calculateReadingTime(data.content);
  const toc = extractToc(data.content);
  const slug = existing.title !== data.title ? await createUniquePostSlug(data.title, postId) : existing.slug;

  const statusChangedToPublished =
    existing.status !== PostStatus.PUBLISHED && data.status === PostStatus.PUBLISHED;

  const post = await db.post.update({
    where: { id: postId },
    data: {
      title: data.title,
      slug,
      summary: data.summary,
      content: data.content,
      status: data.status,
      categoryId: data.categoryId,
      coverImage: data.coverImage || null,
      tags: data.tags,
      readingTime,
      toc,
      publishedAt: statusChangedToPublished
        ? new Date()
        : data.status === PostStatus.PUBLISHED
          ? existing.publishedAt ?? new Date()
          : null
    }
  });

  await syncPostTags(post.id, data.tags);
  return post;
}

export async function togglePostPublish(postId: string, publish: boolean) {
  const post = await db.post.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");

  return db.post.update({
    where: { id: postId },
    data: {
      status: publish ? PostStatus.PUBLISHED : PostStatus.DRAFT,
      publishedAt: publish ? post.publishedAt ?? new Date() : null
    }
  });
}

export async function deletePost(postId: string) {
  await db.post.delete({
    where: { id: postId }
  });
}

export async function upsertTag(name: string) {
  const slug = toSlug(name);
  return db.tag.upsert({
    where: { slug },
    update: { name },
    create: { name, slug }
  });
}

export async function listArticleCategories() {
  return db.articleCategory.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      _count: {
        select: { posts: true }
      }
    }
  });
}

export async function createArticleCategory(input: unknown) {
  const parsed = articleCategoryInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid category payload");
  }

  const name = parsed.data.name.trim();
  const slug = await createUniqueCategorySlug(name);
  const maxOrder = await db.articleCategory.aggregate({ _max: { order: true } });
  const nextOrder = (maxOrder._max.order ?? 0) + 1;

  return db.articleCategory.create({
    data: {
      name,
      slug,
      order: nextOrder
    }
  });
}

export async function updateArticleCategory(categoryId: string, input: unknown) {
  const parsed = articleCategoryInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid category payload");
  }

  const name = parsed.data.name.trim();
  const slug = await createUniqueCategorySlug(name, categoryId);

  return db.articleCategory.update({
    where: { id: categoryId },
    data: { name, slug }
  });
}

export async function deleteArticleCategory(categoryId: string) {
  await db.articleCategory.delete({
    where: { id: categoryId }
  });
}

export async function reorderArticleCategories(input: unknown) {
  const parsed = articleCategorySortSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid sort payload");
  }

  const ids = parsed.data.ids;
  await db.$transaction(
    ids.map((id, index) =>
      db.articleCategory.update({
        where: { id },
        data: { order: index + 1 }
      })
    )
  );
}

async function syncPostTags(postId: string, tagNames: string[]) {
  const uniqueTagNames = [...new Set(tagNames.map((name) => name.trim()).filter(Boolean))];
  const tags = await Promise.all(
    uniqueTagNames.map((name) =>
      db.tag.upsert({
        where: { slug: toSlug(name) },
        update: { name },
        create: { name, slug: toSlug(name) }
      })
    )
  );

  await db.postTag.deleteMany({ where: { postId } });
  if (tags.length === 0) return;
  await db.postTag.createMany({
    data: tags.map((tag) => ({ postId, tagId: tag.id }))
  });
}

async function createUniqueCategorySlug(name: string, currentId?: string) {
  const base = toSlug(name);
  let candidate = base;
  let index = 2;

  for (;;) {
    const conflict = await db.articleCategory.findFirst({
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
