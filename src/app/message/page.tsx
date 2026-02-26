import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { MessageBoardSection } from "@/features/blog/components/message-board-section";
import { listMessages } from "@/lib/message-board";

export const metadata: Metadata = {
    title: "留言板",
    description: "给我留言，分享你的想法"
};

export const revalidate = 120;

const getCachedMessageData = unstable_cache(
    async () => {
        const messages = await listMessages({ status: "VISIBLE", limit: 60 });
        return { messages };
    },
    ["message-page-data"],
    { revalidate: 120, tags: ["message-page"] }
);

export default async function MessagePage() {
    const { messages } = await getCachedMessageData();

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <MessageBoardSection
                initialMessages={messages.map((item) => ({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                    avatarUrl: item.avatarUrl,
                    content: item.content,
                    parentId: item.parentId,
                    status: item.status,
                    createdAt: String(item.createdAt)
                }))}
            />
        </div>
    );
}
