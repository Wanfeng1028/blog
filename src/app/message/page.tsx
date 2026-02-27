import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { MessageBoardSection } from "@/features/blog/components/message-board-section";
import { listMessages } from "@/lib/message-board";
import { cookies } from "next/headers";
import { getDictionary, type SupportedLang } from "@/features/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
    const d = await getDictionary(lang);

    return {
        title: d.message.title,
        description: d.message.metaDescription
    };
}

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
