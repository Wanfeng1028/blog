import { requireUser } from "@/lib/auth/guards";
import { UserInteractionsPanel } from "@/features/user/components/user-interactions-panel";
import { getUserComments, getUserFavorites, getUserLikes } from "@/features/user/server/dashboard";

export default async function DashboardInteractionsPage() {
  const session = await requireUser();

  const [favorites, likes, comments] = await Promise.all([
    getUserFavorites(session.user.id),
    getUserLikes(session.user.id),
    getUserComments(session.user.id)
  ]);

  return (
    <UserInteractionsPanel
      favorites={favorites.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        post: {
          id: item.post.id,
          title: item.post.title,
          slug: item.post.slug,
          summary: item.post.summary
        }
      }))}
      likes={likes.map((item) => ({
        id: item.id,
        createdAt: item.createdAt.toISOString(),
        post: {
          id: item.post.id,
          title: item.post.title,
          slug: item.post.slug,
          summary: item.post.summary
        }
      }))}
      comments={comments.map((item) => ({
        id: item.id,
        content: item.content,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        post: {
          title: item.post.title,
          slug: item.post.slug
        }
      }))}
    />
  );
}
