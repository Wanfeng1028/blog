import type { Metadata } from "next";
import { DonationSection } from "@/features/blog/components/donation-section";
import { FriendLinksSection } from "@/features/blog/components/friend-links-section";
import { MessageBoardSection } from "@/features/blog/components/message-board-section";
import { getSiteSettings } from "@/lib/site-settings";
import { listMessages } from "@/lib/message-board";
import { listFriendLinks } from "@/lib/friend-links";
import { listDonations } from "@/lib/donations";

export const metadata: Metadata = {
  title: "关于我",
  description: "个人介绍、友链与留言板"
};

export const revalidate = 60;

export default async function AboutPage() {
  const [settings, donations, friendLinks, messages] = await Promise.all([
    getSiteSettings(),
    listDonations({ status: "CONFIRMED", limit: 30 }),
    listFriendLinks({ status: "APPROVED", limit: 60 }),
    listMessages({ status: "VISIBLE", limit: 40 })
  ]);
  const aboutText = settings.aboutContent?.trim();

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-2xl border border-white/45 bg-white/65 p-6 backdrop-blur-md">
        <h1 className="text-h1 font-semibold">关于我</h1>
        <p className="mt-3 whitespace-pre-wrap text-muted">
          {aboutText || "这里是关于我页面占位内容。你可以在后台 -> 站点设置中编辑并实时生效。"}
        </p>
      </section>

      <DonationSection
        initialItems={donations.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          amount: item.amount,
          message: item.message,
          paymentMethod: item.paymentMethod,
          status: item.status,
          createdAt: item.createdAt.toISOString()
        }))}
      />
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
          createdAt: item.createdAt.toISOString()
        }))}
      />
      <MessageBoardSection
        initialMessages={messages.map((item) => ({
          id: item.id,
          name: item.name,
          email: item.email,
          content: item.content,
          status: item.status,
          createdAt: item.createdAt.toISOString()
        }))}
      />
    </div>
  );
}
