import { db } from "@/lib/db";
import { AdminCategoriesPanel } from "@/features/admin/components/admin-categories-panel";

export default async function AdminCategoriesPage() {
  const categories = await db.articleCategory.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      _count: {
        select: { posts: true }
      }
    }
  });

  return (
    <AdminCategoriesPanel
      categories={categories.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        order: item.order,
        postCount: item._count.posts
      }))}
    />
  );
}
