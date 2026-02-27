import { requireAdmin } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { AdminMomentsPanel } from "@/features/admin/components/admin-moments-panel";

export default async function AdminMomentsPage() {
  await requireAdmin();

  const moments = await db.moment.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          name: true,
          image: true
        }
      },
      _count: {
        select: { comments: true }
      }
    }
  });

  return (
    <AdminMomentsPanel
      moments={moments.map((item) => ({
        id: item.id,
        content: item.content,
        images: item.images as string[] | null,
        createdAt: item.createdAt.toISOString(),
        user: {
          name: item.user.name,
          image: item.user.image
        },
        _count: {
          comments: item._count.comments
        }
      }))}
    />
  );
}
