import { db } from "@/lib/db";
import { getSecurityAlerts } from "@/lib/auth/security";
import { AdminSettingsPanel } from "@/features/admin/components/admin-settings-panel";

export default async function AdminUsersPage() {
    const [users, alerts] = await Promise.all([
        db.user.findMany({
            orderBy: { createdAt: "desc" },
            select: { id: true, email: true, role: true, name: true, createdAt: true }
        }),
        getSecurityAlerts(30)
    ]);

    return (
        <AdminSettingsPanel
            users={users.map((item) => ({
                id: item.id,
                name: item.name,
                email: item.email,
                role: item.role,
                createdAt: item.createdAt.toISOString()
            }))}
            comments={[]}
            alerts={alerts.map((item) => ({
                id: item.id,
                severity: item.severity,
                message: item.message,
                email: item.email,
                createdAt: item.created_at.toISOString()
            }))}
            messages={[]}
            friendLinks={[]}
            donations={[]}
            siteSettings={{ bgmEnabled: false, bgmSrc: "", aboutContent: "" }}
        />
    );
}
