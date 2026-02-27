"use client";

import { useState } from "react";
import Link from "next/link";
import { useLang } from "@/features/i18n/lang-context";

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
  const { dictionary } = useLang();
  const d = dictionary!;
  const [links] = useState<FriendLinkItem[]>(initialLinks);

  return (
    <section className="rounded-2xl border border-white/45 bg-white/65 p-6 backdrop-blur-md dark:border-white/10 dark:bg-zinc-900/40" id="friends">
      <h2 className="text-h2 font-semibold">{d.friends.subtitle}</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {links.length === 0 ? <p className="text-sm text-muted">{d.friends.empty}</p> : null}
        {links.map((item) => (
          <article key={item.id} className="rounded-xl border border-border bg-white/80 p-4 dark:border-white/10 dark:bg-zinc-950/40">
            <div className="mb-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="h-10 w-10 rounded-full object-cover" src={item.avatarUrl} alt={item.name} />
              <div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                <p className="text-xs text-muted dark:text-zinc-400">{item.email}</p>
              </div>
            </div>
            <p className="line-clamp-2 text-sm text-muted dark:text-zinc-400">{item.description}</p>
            <Link href={item.siteUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-primary hover:underline">
              {d.friends.visit.replace("{name}", item.siteName)}
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
