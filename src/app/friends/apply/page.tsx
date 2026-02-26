import type { Metadata } from "next";
import { FriendLinkApplySection } from "@/features/blog/components/friend-link-apply-section";

export const metadata: Metadata = {
    title: "友链申请",
    description: "提交友链申请，等待管理员审核"
};

export default function FriendApplyPage() {
    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <FriendLinkApplySection />
        </div>
    );
}
