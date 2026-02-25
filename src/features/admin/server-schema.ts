import { z } from "zod";
import { PostStatus } from "@prisma/client";

export const postInputSchema = z.object({
  title: z.string().min(2).max(140),
  summary: z.string().min(1).max(360),
  content: z.string().min(1),
  status: z.nativeEnum(PostStatus),
  categoryId: z.string().min(1),
  coverImage: z.union([z.string().url(), z.literal("")]).optional(),
  tags: z.array(z.string().min(1)).max(10)
});

export const tagInputSchema = z.object({
  name: z.string().min(1).max(40)
});

export const articleCategoryInputSchema = z.object({
  name: z.string().min(1).max(40)
});

export const articleCategorySortSchema = z.object({
  ids: z.array(z.string().min(1)).min(1)
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(50).optional(),
  role: z.enum(["ADMIN", "USER"]).default("USER")
});

export const projectInputSchema = z.object({
  id: z.string().optional(),
  order: z.number().int().min(1),
  title: z.union([z.string().min(1).max(140), z.literal("")]).optional(),
  subtitle: z.union([z.string().min(1).max(180), z.literal("")]).optional(),
  role: z.union([z.string().min(1).max(120), z.literal("")]).optional(),
  period: z.union([z.string().min(1).max(120), z.literal("")]).optional(),
  summary: z.union([z.string().min(1).max(1200), z.literal("")]).optional(),
  highlights: z.array(z.string().min(1).max(300)).min(0).max(12),
  techStack: z.array(z.string().min(1).max(60)).min(0).max(20),
  githubUrl: z.union([z.string().url(), z.literal("")]).optional(),
  demoUrl: z.union([z.string().url(), z.literal("")]).optional(),
  sourceRepo: z.string().max(200).optional().or(z.literal("")),
  slug: z.string().optional()
});
