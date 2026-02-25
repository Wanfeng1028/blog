import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await db.post.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true }
  });

  const staticRoutes = ["", "/about", "/blog", "/projects"].map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date()
  }));

  const postRoutes = posts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: post.updatedAt
  }));

  return [...staticRoutes, ...postRoutes];
}
