"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpenText, Github, Globe, House, Mail, MessageCircle, PlaySquare } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLang } from "@/features/i18n/lang-context";

// SidebarToc 只在有文章内容时渲染，动态 import 避免 SSR 差异
const SidebarToc = dynamic(
  () => import("@/components/sidebar-toc").then((m) => m.SidebarToc),
  { ssr: false }
);

type Stats = {
  postCount: number;
  tagCount: number;
  categoryCount: number;
};

export function GlobalSidebar() {
  const pathname = usePathname();
  const isArticlePage = /^\/blog\/[^/]+/.test(pathname);
  const { dictionary } = useLang();
  const d = dictionary!;

  const [stats, setStats] = useState<Stats>({ postCount: 0, tagCount: 0, categoryCount: 0 });

  useEffect(() => {
    fetch("/api/blog/stats")
      .then((r) => r.json())
      .then((res) => {
        if (res.ok && res.data) setStats(res.data);
      })
      .catch(() => {/* 静默失败 */ });
  }, []);

  return (
    <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col lg:gap-4">
      <div className="sticky top-24 flex flex-col gap-4">
        {/* ── 个人简介卡片 ── */}
        <section className="overflow-hidden rounded-[22px] border border-white/50 bg-[linear-gradient(155deg,rgba(255,255,255,0.72)_0%,rgba(229,231,235,0.62)_48%,rgba(161,161,170,0.45)_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-md dark:border-white/10 dark:bg-[linear-gradient(155deg,rgba(24,24,27,0.85)_0%,rgba(39,39,42,0.8)_48%,rgba(9,9,11,0.75)_100%)]">
          {/* 头像 + 签名 */}
          <div className="flex flex-col items-center px-5 pt-6 pb-4">
            <Image
              alt="Wanfeng avatar"
              className="size-20 rounded-full border border-white/80 object-cover shadow-lg"
              height={80}
              src="/images/touxiang.jpg"
              width={80}
            />
            <p className="logo-title mt-3 text-lg">@.晚风</p>
            <p className="mt-1.5 text-center text-xs text-rose-500 leading-5 dark:text-rose-300">
              {d.sidebar.motto}
            </p>
          </div>

          {/* 统计数字 */}
          <div className="grid grid-cols-3 gap-1 border-y border-white/40 bg-white/30 px-3 py-3 text-center text-zinc-700 dark:border-white/10 dark:bg-zinc-900/40 dark:text-zinc-200">
            <div>
              <p className="text-xl font-semibold">{stats.postCount}</p>
              <p className="text-xs text-zinc-500">{d.nav.blog}</p>
            </div>
            <div className="border-x border-white/50 dark:border-white/10">
              <p className="text-xl font-semibold">{stats.categoryCount}</p>
              <p className="text-xs text-zinc-500">{d.sidebar.categories}</p>
            </div>
            <div>
              <p className="text-xl font-semibold">{stats.tagCount}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{d.sidebar.tags}</p>
            </div>
          </div>

          {/* 快捷导航 */}
          <nav className="space-y-0.5 bg-white/45 px-3 py-3 text-sm text-zinc-700 dark:bg-zinc-950/40 dark:text-zinc-200">
            <Link className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition hover:bg-white/60" href="/">
              <House className="size-3.5 shrink-0" />
              {d.nav.home}
            </Link>
            <Link className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition hover:bg-white/60" href="/blog">
              <BookOpenText className="size-3.5 shrink-0" />
              {d.nav.blog}
            </Link>
            <Link className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 transition hover:bg-white/60 dark:hover:bg-zinc-800/40" href="/message">
              <MessageCircle className="size-3.5 shrink-0" />
              {d.nav.message}
            </Link>
          </nav>

          {/* 社交链接 */}
          <div className="flex flex-wrap justify-center gap-4 px-4 py-4 text-sm text-zinc-600 dark:text-zinc-400">
            <a
              className="inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-zinc-50"
              href="https://github.com/Wanfeng1028"
              rel="noreferrer"
              target="_blank"
            >
              <Github className="size-4" />
              GitHub
            </a>
            <a className="inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-zinc-50" href="mailto:wanfeng572@gmail.com">
              <Mail className="size-4" />
              Gmail
            </a>
            <a
              className="inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-zinc-50"
              href="https://www.xiaohongshu.com/user/profile/5627774308"
              rel="noreferrer"
              target="_blank"
            >
              <Globe className="size-4" />
              {d.sidebar.xiaohongshu}
            </a>
            <a
              className="inline-flex items-center gap-1.5 hover:text-zinc-950 dark:hover:text-zinc-50"
              href="https://space.bilibili.com/1102481373"
              rel="noreferrer"
              target="_blank"
            >
              <PlaySquare className="size-4" />
              Bilibili
            </a>
          </div>
        </section>

        {/* ── TOC 目录（仅文章详情页） ── */}
        {isArticlePage ? <SidebarToc /> : null}
      </div>
    </aside>
  );
}
