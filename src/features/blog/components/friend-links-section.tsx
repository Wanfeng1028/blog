"use client";

import { useState } from "react";
import Link from "next/link";

type FriendLinkItem = {
  id: string;
  avatarUrl: string;
  name: string;
  email: string;
  siteName: string;
  siteUrl: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

type FriendLinksSectionProps = {
  initialLinks?: FriendLinkItem[];
};

export function FriendLinksSection({ initialLinks = [] }: FriendLinksSectionProps) {
  const [links] = useState<FriendLinkItem[]>(initialLinks);

  return (
    <section className="rounded-2xl border border-white/45 bg-white/65 p-6 backdrop-blur-md" id="friends">
      <h2 className="text-h2 font-semibold">朋友的网站链接</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.length === 0 ? <p className="text-sm text-muted">暂无已通过友链。</p> : null}
        {links.map((item) => (
          <article key={item.id} className="rounded-xl border border-border bg-white/80 p-4">
            <div className="mb-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="h-10 w-10 rounded-full object-cover" src={item.avatarUrl} alt={item.name} />
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-muted">{item.email}</p>
              </div>
            </div>
            <p className="line-clamp-2 text-sm text-muted">{item.description}</p>
            <Link href={item.siteUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary hover:underline">
              访问 {item.siteName}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
