import { PostStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { getAuthEvents, getSecurityOverview } from "@/lib/auth/security";
import { AdminDashboard } from "@/features/admin/components/admin-dashboard";

async function getProjectCount() {
  const projectClient = (db as any).project;
  if (!projectClient || typeof projectClient.count !== "function") return 0;
  try {
    return (await projectClient.count()) as number;
  } catch {
    return 0;
  }
}

export default async function AdminPage() {
  const [users, posts, comments, tags, projects, publishedPosts, security, latestUsers, latestEvents] =
    await Promise.all([
      db.user.count(),
      db.post.count(),
      db.comment.count(),
      db.tag.count(),
      getProjectCount(),
      db.post.count({ where: { status: PostStatus.PUBLISHED } }),
      getSecurityOverview(),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      getAuthEvents(8, 0)
    ]);

  return (
    <AdminDashboard
      overview={{
        users,
        posts,
        comments,
        tags,
        projects,
        publishedPosts,
        securityAlerts: security.openAlerts,
        failedLogins: security.failedLogins
      }}
      latestUsers={latestUsers.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() }))}
      latestEvents={latestEvents.map((item) => ({
        ...item,
        created_at: item.created_at.toISOString()
      }))}
    />
  );
}
