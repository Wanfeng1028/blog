import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { FriendLinksSection } from "@/features/blog/components/friend-links-section";
import { listFriendLinks } from "@/lib/friend-links";
import { cookies } from "next/headers";
import { getDictionary, type SupportedLang } from "@/features/i18n/get-dictionary";

export async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
    const d = await getDictionary(lang);

    return {
        title: d.friends.title,
        description: d.friends.metaDescription
    };
}

export const revalidate = 120;

const getCachedFriendsData = unstable_cache(
    async () => {
        const friendLinks = await listFriendLinks({ status: "APPROVED", limit: 60 });
        return { friendLinks };
    },
    ["friends-page-data"],
    { revalidate: 120, tags: ["friends-page"] }
);

export default async function FriendsPage() {
    const { friendLinks } = await getCachedFriendsData();

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <FriendLinksSection
                initialLinks={friendLinks.map((item) => ({
                    id: item.id,
                    avatarUrl: item.avatarUrl,
                    name: item.name,
                    email: item.email,
                    siteName: item.siteName,
                    siteUrl: item.siteUrl,
                    description: item.description,
                    status: item.status,
                    createdAt: String(item.createdAt)
                }))}
            />
        </div>
    );
}
