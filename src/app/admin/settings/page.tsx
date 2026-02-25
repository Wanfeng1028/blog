import { db } from "@/lib/db";
import { getSecurityAlerts } from "@/lib/auth/security";
import { AdminSettingsPanel } from "@/features/admin/components/admin-settings-panel";
import { AdminProjectsPanel } from "@/features/admin/components/admin-projects-panel";
import { listMessages } from "@/lib/message-board";
import { listFriendLinks } from "@/lib/friend-links";
import { listDonations } from "@/lib/donations";
import { getSiteSettings } from "@/lib/site-settings";

async function getAdminProjects() {
  const projectClient = (db as any).project;
  if (!projectClient || typeof projectClient.findMany !== "function") return [];
  try {
    const rows = await projectClient.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "desc" }]
    });
    return rows as Array<{
      id: string;
      order: number;
      slug: string;
      title: string;
      subtitle: string;
      role: string;
      period: string;
      summary: string;
      highlights: unknown;
      techStack: string[];
      githubUrl: string | null;
      demoUrl: string | null;
      sourceRepo: string | null;
      likesCount: number;
      viewsCount: number;
      updatedAt: Date;
    }>;
  } catch {
    return [];
  }
}

export default async function AdminSettingsPage() {
  const [users, comments, alerts, projects, messages, friendLinks, donations, siteSettings] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, name: true, createdAt: true }
    }),
    db.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        content: true,
        status: true,
        post: {
          select: { title: true }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    }),
    getSecurityAlerts(30),
    getAdminProjects(),
    listMessages({ admin: true, status: "ALL", limit: 100 }),
    listFriendLinks({ status: "ALL", limit: 120 }),
    listDonations({ status: "ALL", limit: 120 }),
    getSiteSettings()
  ]);

  return (
    <div className="space-y-4">
      <AdminProjectsPanel
        initialProjects={projects.map((item) => ({
          id: item.id,
          order: item.order,
          slug: item.slug,
          title: item.title,
          subtitle: item.subtitle,
          role: item.role,
          period: item.period,
          summary: item.summary,
          highlights: Array.isArray(item.highlights) ? (item.highlights as string[]) : [],
          techStack: item.techStack,
          githubUrl: item.githubUrl,
          demoUrl: item.demoUrl,
          sourceRepo: item.sourceRepo,
          likesCount: item.likesCount,
          viewsCount: item.viewsCount,
          updatedAt: item.updatedAt.toISOString()
        }))}
      />
      <AdminSettingsPanel
        users={users.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          role: item.role,
          createdAt: item.createdAt.toISOString()
        }))}
        comments={comments.map((item) => ({
          id: item.id,
          content: item.content,
          status: item.status,
          postTitle: item.post.title,
          userName: item.user.name ?? "",
          userEmail: item.user.email
        }))}
        alerts={alerts.map((item) => ({
          id: item.id,
          severity: item.severity,
          message: item.message,
          email: item.email,
          createdAt: item.created_at.toISOString()
        }))}
        messages={messages.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          content: item.content,
          status: item.status,
          createdAt: item.createdAt.toISOString()
        }))}
        friendLinks={friendLinks.map((item) => ({
          id: item.id,
          avatarUrl: item.avatarUrl,
          name: item.name,
          email: item.email,
          siteName: item.siteName,
          siteUrl: item.siteUrl,
          description: item.description,
          status: item.status,
          createdAt: item.createdAt.toISOString()
        }))}
        donations={donations.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          amount: item.amount,
          message: item.message,
          paymentMethod: item.paymentMethod,
          status: item.status,
          createdAt: item.createdAt.toISOString()
        }))}
        siteSettings={siteSettings}
      />
    </div>
  );
}
