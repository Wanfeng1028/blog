import { db } from "@/lib/db";
import { AdminTagsPanel } from "@/features/admin/components/admin-tags-panel";

export default async function AdminTagsPage() {
  const tags = await db.tag.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { postLinks: true }
      }
    }
  });

  return (
    <AdminTagsPanel
      tags={tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        postCount: tag._count.postLinks
      }))}
    />
  );
}
