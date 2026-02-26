import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { DonationSection } from "@/features/blog/components/donation-section";
import { listDonations } from "@/lib/donations";

export const metadata: Metadata = {
    title: "打赏 / 支持我",
    description: "感谢你的支持，每一份鼓励都会让我持续更新内容"
};

export const revalidate = 120;

const getCachedDonationData = unstable_cache(
    async () => {
        const donations = await listDonations({ status: "CONFIRMED", limit: 30 });
        return { donations };
    },
    ["donate-page-data"],
    { revalidate: 120, tags: ["donate-page"] }
);

export default async function DonatePage() {
    const { donations } = await getCachedDonationData();

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <DonationSection
                initialItems={donations.map((item) => ({
                    id: item.id,
                    name: item.name,
                    email: item.email,
                    amount: item.amount,
                    message: item.message,
                    paymentMethod: item.paymentMethod,
                    status: item.status,
                    createdAt: String(item.createdAt)
                }))}
            />
        </div>
    );
}
