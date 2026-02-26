import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Prisma, PostStatus, CommentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import type { PostListQuery, PostDetail, AdjacentPosts, TagWithCount, CommentView, ArticleCategoryWithCount } from "./types";
import type { TocItem } from "@/lib/utils/toc";

export const BLOG_POSTS_CACHE_TAG = "blog-posts";
export const BLOG_POST_DETAIL_CACHE_TAG = "blog-post-detail";
export const BLOG_ADJACENT_CACHE_TAG = "blog-adjacent";
export const BLOG_TAGS_CACHE_TAG = "blog-tags";
export const BLOG_CATEGORIES_CACHE_TAG = "blog-categories";

type NormalizedPostListQuery = {
  query: string;
  tag: string;
  category: string;
  page: number;
  pageSize: number;
  includeDraft: boolean;
};

function normalizePostListQuery(params: PostListQuery = {}): NormalizedPostListQuery {
  return {
    query: params.query?.trim() ?? "",
    tag: params.tag?.trim() ?? "",
    category: params.category?.trim() ?? "",
    page: Math.max(1, params.page ?? 1),
    pageSize: Math.max(1, params.pageSize ?? 10),
    includeDraft: Boolean(params.includeDraft)
  };
}

async function getPostsInternal(params: NormalizedPostListQuery) {
  const skip = Math.max(0, (params.page - 1) * params.pageSize);

  const where: Prisma.PostWhereInput = {
    ...(params.includeDraft ? {} : { status: PostStatus.PUBLISHED }),
    ...(params.tag ? { tags: { has: params.tag } } : {}),
    ...(params.category ? { category: { slug: params.category } } : {}),
    ...(params.query
      ? {
        OR: [
          { title: { contains: params.query, mode: "insensitive" } },
          { summary: { contains: params.query, mode: "insensitive" } },
          { content: { contains: params.query, mode: "insensitive" } }
        ]
      }
      : {})
  };

  const [items, total] = await Promise.all([
    db.post.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, slug: true }
        }
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      skip,
      take: params.pageSize
    }),
    db.post.count({ where })
  ]);

  return {
    items,
    total,
    page: params.page,
    pageSize: params.pageSize,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize))
  };
}

const getPostsPublicCached = unstable_cache(
  async (params: Omit<NormalizedPostListQuery, "includeDraft">) =>
    getPostsInternal({
      ...params,
      includeDraft: false
    }),
  ["blog-posts-public"],
  {
    revalidate: 60,
    tags: [BLOG_POSTS_CACHE_TAG]
  }
);

export async function getPosts(params: PostListQuery = {}) {
  const normalized = normalizePostListQuery(params);
  if (normalized.includeDraft) {
    return getPostsInternal(normalized);
  }
  return getPostsPublicCached({
    query: normalized.query,
    tag: normalized.tag,
    category: normalized.category,
    page: normalized.page,
    pageSize: normalized.pageSize
  });
}

const getPostBySlugCached = cache(async (slug: string, includeDraft: boolean): Promise<PostDetail | null> => {
  const post = await db.post.findUnique({
    where: { slug },
    include: {
      category: {
        select: { id: true, name: true, slug: true }
      }
    }
  });

  if (!post) return null;
  if (!includeDraft && post.status !== PostStatus.PUBLISHED) return null;

  return {
    ...post,
    toc: (post.toc as TocItem[] | null) ?? []
  };
});

export async function getPostBySlug(slug: string, includeDraft = false): Promise<PostDetail | null> {
  return getPostBySlugCached(slug, includeDraft);
}

const getAdjacentPostsCached = unstable_cache(
  async (slug: string): Promise<AdjacentPosts> => {
    const current = await db.post.findUnique({
      where: { slug },
      select: { publishedAt: true }
    });
    if (!current?.publishedAt) return { previous: null, next: null };

    const [previous, next] = await Promise.all([
      db.post.findFirst({
        where: {
          status: PostStatus.PUBLISHED,
          publishedAt: { lt: current.publishedAt }
        },
        orderBy: { publishedAt: "desc" },
        select: { title: true, slug: true }
      }),
      db.post.findFirst({
        where: {
          status: PostStatus.PUBLISHED,
          publishedAt: { gt: current.publishedAt }
        },
        orderBy: { publishedAt: "asc" },
        select: { title: true, slug: true }
      })
    ]);

    return { previous, next };
  },
  ["blog-adjacent-posts"],
  {
    revalidate: 300,
    tags: [BLOG_ADJACENT_CACHE_TAG, BLOG_POST_DETAIL_CACHE_TAG]
  }
);

export async function getAdjacentPosts(slug: string): Promise<AdjacentPosts> {
  return getAdjacentPostsCached(slug);
}

const getTagsWithCountCached = unstable_cache(
  async (): Promise<TagWithCount[]> => {
    const tags = await db.tag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            postLinks: {
              where: {
                post: {
                  status: PostStatus.PUBLISHED
                }
              }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      count: tag._count.postLinks
    }));
  },
  ["blog-tags-with-count"],
  {
    revalidate: 120,
    tags: [BLOG_TAGS_CACHE_TAG]
  }
);

export async function getTagsWithCount(): Promise<TagWithCount[]> {
  return getTagsWithCountCached();
}

const getArticleCategoriesWithCountCached = unstable_cache(
  async (): Promise<ArticleCategoryWithCount[]> => {
    const categories = await db.articleCategory.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        order: true,
        _count: {
          select: {
            posts: {
              where: {
                status: PostStatus.PUBLISHED
              }
            }
          }
        }
      }
    });

    return categories.map((item) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      order: item.order,
      count: item._count.posts
    }));
  },
  ["blog-categories-with-count"],
  {
    revalidate: 120,
    tags: [BLOG_CATEGORIES_CACHE_TAG]
  }
);

export async function getArticleCategoriesWithCount(): Promise<ArticleCategoryWithCount[]> {
  return getArticleCategoriesWithCountCached();
}

export async function getCommentsByPostSlug(slug: string) {
  return db.comment.findMany({
    where: {
      post: { slug },
      status: CommentStatus.VISIBLE,
      // @ts-ignore — parentId exists in DB, remove after `npx prisma generate`
      parentId: null
    },
    select: {
      id: true,
      content: true,
      status: true,
      // @ts-ignore — parentId exists in DB, remove after `npx prisma generate`
      parentId: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          email: true
        }
      },
      // @ts-ignore — replies relation exists in DB, remove after `npx prisma generate`
      replies: {
        where: { status: CommentStatus.VISIBLE },
        select: {
          id: true,
          content: true,
          parentId: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}
