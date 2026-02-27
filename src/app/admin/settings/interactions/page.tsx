import { db } from "@/lib/db";
import { AdminSettingsPanel } from "@/features/admin/components/admin-settings-panel";
import { listMessages } from "@/lib/message-board";
import { listFriendLinks } from "@/lib/friend-links";
import { listDonations } from "@/lib/donations";

export default async function AdminInteractionsPage() {
    const [comments, messages, friendLinks, donations] = await Promise.all([
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
        listMessages({ admin: true, status: "ALL", limit: 100 }),
        listFriendLinks({ status: "ALL", limit: 120 }),
        listDonations({ status: "ALL", limit: 120 })
    ]);

    return (
        <AdminSettingsPanel
            users={[]}
            comments={comments.map((item) => ({
                id: item.id,
                content: item.content,
                status: item.status,
                postTitle: item.post?.title ?? "Moment",
                userName: item.user.name ?? "",
                userEmail: item.user.email
            }))}
            alerts={[]}
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
            siteSettings={{ bgmEnabled: false, bgmSrc: "", aboutContent: "" }}
        />
    );
}
