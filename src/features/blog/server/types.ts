import { CommentStatus, PostStatus } from "@prisma/client";
import type { TocItem } from "@/lib/utils/toc";

export type PostListQuery = {
  query?: string;
  tag?: string;
  category?: string;
  page?: number;
  pageSize?: number;
  includeDraft?: boolean;
};

export type PostPreview = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  coverImage: string | null;
  status: PostStatus;
  publishedAt: Date | null;
  readingTime: number;
  tags: string[];
  likesCount: number;
  viewsCount: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  createdAt: Date;
};

export type PostDetail = PostPreview & {
  content: string;
  toc: TocItem[];
};

export type AdjacentPosts = {
  previous: Pick<PostPreview, "title" | "slug"> | null;
  next: Pick<PostPreview, "title" | "slug"> | null;
};

export type TagWithCount = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export type ArticleCategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  order: number;
  count: number;
};

export type CommentView = {
  id: string;
  content: string;
  status: CommentStatus;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};
