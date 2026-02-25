import { requireUser } from "@/lib/auth/guards";
import { UserSecurityPanel } from "@/features/user/components/user-security-panel";
import { getUserAuthEvents } from "@/features/user/server/dashboard";

export default async function DashboardSecurityPage() {
  const session = await requireUser();

  const events = await getUserAuthEvents(session.user.id, 30);

  return (
    <UserSecurityPanel
      events={events.map((item) => ({
        id: item.id,
        eventType: item.event_type,
        success: item.success,
        ip: item.ip,
        createdAt: new Date(item.created_at).toISOString()
      }))}
    />
  );
}
