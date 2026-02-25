import { PostStatus } from "@prisma/client";
import { listAdminPosts } from "@/features/admin/server/posts";
import { getTagsWithCount } from "@/features/blog/server/queries";
import { AdminPostsPanel } from "@/features/admin/components/admin-posts-panel";

type PageProps = {
  searchParams: Promise<{
    query?: string;
    tag?: string;
    status?: PostStatus;
    page?: string;
  }>;
};

export default async function AdminPostsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = params.query?.trim() ?? "";
  const tag = params.tag?.trim() ?? "";
  const status = params.status;
  const page = Number(params.page ?? "1");

  const [{ items, totalPages }, tags] = await Promise.all([
    listAdminPosts({
      query,
      tag,
      status,
      page,
      pageSize: 10
    }),
    getTagsWithCount()
  ]);

  return (
    <AdminPostsPanel
      query={query}
      tag={tag}
      status={status}
      page={page}
      totalPages={totalPages}
      posts={items.map((item) => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        status: item.status,
        tags: item.tags,
        updatedAt: item.updatedAt.toISOString()
      }))}
      tags={tags.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug
      }))}
    />
  );
}
