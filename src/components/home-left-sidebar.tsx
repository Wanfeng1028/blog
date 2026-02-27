"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpenText, Clock3, Github, Globe, House, Mail, MessageCircle, PlaySquare } from "lucide-react";
import { useState } from "react";
import { useLang } from "@/features/i18n/lang-context";

function getMonthGrid(year: number, monthIndex: number): Array<number | null> {
  const firstDay = new Date(year, monthIndex, 1).getDay(); // 0 = 周日
  const startOffset = (firstDay + 6) % 7; // 转换为周一开始
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: 42 }, (_, i) => {
    const day = i - startOffset + 1;
    return day >= 1 && day <= daysInMonth ? day : null;
  });
}

type HomeLeftSidebarProps = {
  postCount: number;
  categoryCount: number;
  tagCount: number;
};

export function HomeLeftSidebar({ postCount, categoryCount, tagCount }: HomeLeftSidebarProps) {
  const { dictionary } = useLang();
  const d = dictionary!;
  const [activeTab, setActiveTab] = useState<"profile" | "calendar">("profile");

  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const today = now.getDate();
  const monthGrid = getMonthGrid(year, monthIndex);

  const weekLabels = d.sidebar.weekLabels;

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="overflow-hidden rounded-[22px] border border-white/50 bg-[linear-gradient(155deg,rgba(255,255,255,0.72)_0%,rgba(229,231,235,0.62)_48%,rgba(161,161,170,0.45)_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-md dark:border-white/10 dark:bg-[linear-gradient(155deg,rgba(24,24,27,0.85)_0%,rgba(39,39,42,0.8)_48%,rgba(9,9,11,0.75)_100%)]">
        <div className="space-y-3 px-5 py-5">
          <h3 className="text-3xl font-semibold tracking-wide text-blue-600 dark:text-blue-400">{d.sidebar.featured}</h3>
          <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{d.sidebar.featuredQuote}</p>
        </div>

        <div className="bg-[linear-gradient(180deg,rgba(82,82,91,0.72)_0%,rgba(212,212,216,0.45)_100%)] px-5 py-5 text-center">
          <h4 className="text-3xl font-semibold tracking-wide text-zinc-100">{d.sidebar.moment}</h4>
          <p className="mt-3 text-base font-medium leading-7 text-white/95">{d.sidebar.momentQuote}</p>
        </div>

        <nav className="space-y-1 bg-white/55 px-4 py-4 text-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200">
          <Link className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/60 dark:hover:bg-zinc-800/40" href="/">
            <House className="size-4" />
            {d.nav.home}
          </Link>
          <Link className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/60 dark:hover:bg-zinc-800/40" href="/blog">
            <BookOpenText className="size-4" />
            {d.nav.blog}
          </Link>
          <Link className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/60 dark:hover:bg-zinc-800/40" href="/message">
            <MessageCircle className="size-4" />
            {d.nav.message}
          </Link>
          <Link className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/60 dark:hover:bg-zinc-800/40" href="/blog">
            <Clock3 className="size-4" />
            {d.sidebar.archive}
          </Link>
        </nav>
      </section>

      <section className="rounded-[22px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(239,246,255,0.72)_100%)] px-5 py-6 shadow-[0_18px_38px_rgba(30,41,59,0.16)] backdrop-blur-md dark:border-white/10 dark:bg-[linear-gradient(180deg,rgba(15,23,42,0.8)_0%,rgba(9,9,11,0.9)_100%)]">
        <div className="flex items-center justify-between text-lg text-fuchsia-300">
          <button
            className={`border-b pb-1 transition ${activeTab === "profile" ? "border-fuchsia-300 text-fuchsia-300" : "border-transparent text-fuchsia-200/70"
              }`}
            onClick={() => setActiveTab("profile")}
            type="button"
          >
            {d.sidebar.profile}
          </button>
          <button
            className={`border-b pb-1 transition ${activeTab === "calendar" ? "border-fuchsia-300 text-fuchsia-300" : "border-transparent text-fuchsia-200/70"
              }`}
            onClick={() => setActiveTab("calendar")}
            type="button"
          >
            {d.sidebar.function}
          </button>
        </div>

        {activeTab === "profile" ? (
          <>
            <div className="mt-5 flex flex-col items-center">
              <Image
                alt="Wanfeng avatar"
                className="size-28 rounded-full border border-white/80 object-cover shadow-lg"
                height={112}
                src="/images/touxiang.jpg"
                width={112}
              />
              <p className="logo-title mt-3">@.晚风</p>
              <p className="mt-2 text-center text-sm text-rose-500 dark:text-rose-300">{d.sidebar.motto}</p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-zinc-700 dark:text-zinc-200">
              <div>
                <p className="text-3xl font-semibold">{postCount}</p>
                <p className="mt-1 text-sm">{d.nav.blog}</p>
              </div>
              <div className="border-x border-white/60 dark:border-white/10">
                <p className="text-3xl font-semibold">{categoryCount}</p>
                <p className="mt-1 text-sm">{d.sidebar.categories}</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{tagCount}</p>
                <p className="mt-1 text-sm">{d.sidebar.tags}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-6 text-lg text-zinc-700 dark:text-zinc-200">
              <a
                className="inline-flex items-center gap-2 hover:text-zinc-950 dark:hover:text-zinc-50"
                href="https://github.com/Wanfeng1028"
                rel="noreferrer"
                target="_blank"
              >
                <Github className="size-5" />
                GitHub
              </a>
              <a className="inline-flex items-center gap-2 hover:text-zinc-950 dark:hover:text-zinc-50" href="mailto:hello@example.com">
                <Mail className="size-5" />
                Gmail
              </a>
            </div>

            <div className="my-6 border-t border-dashed border-white/80 dark:border-white/10" />

            <div className="mt-6 flex justify-center gap-6 text-lg text-zinc-700 dark:text-zinc-200">
              <a
                className="inline-flex items-center gap-2 hover:text-zinc-950 dark:hover:text-zinc-50"
                href="https://www.xiaohongshu.com/user/profile/5627774308"
                rel="noreferrer"
                target="_blank"
              >
                <Globe className="size-5" />
                {d.sidebar.xiaohongshu}
              </a>
              <a
                className="inline-flex items-center gap-2 hover:text-zinc-950 dark:hover:text-zinc-50"
                href="https://space.bilibili.com/1102481373"
                rel="noreferrer"
                target="_blank"
              >
                <PlaySquare className="size-5" />
                Bilibili
              </a>
            </div>
          </>
        ) : (
          <div className="mt-6 rounded-2xl bg-white/55 p-4 dark:bg-zinc-900/40">
            <div className="grid grid-cols-7 text-center text-xs text-zinc-500 dark:text-zinc-400">
              {weekLabels.map((w: string) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-y-2 text-center">
              {monthGrid.map((day, idx) => (
                <span
                  className={`mx-auto flex size-8 items-center justify-center rounded-full text-sm ${day === today ? "bg-cyan-500 font-semibold text-white" : day ? "text-zinc-700" : "text-transparent"
                    }`}
                  key={`${year}-${monthIndex}-${idx}`}
                >
                  {day ?? "0"}
                </span>
              ))}
            </div>

            <p className="mt-3 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {d.sidebar.year.replace("{year}", year.toString())} {d.sidebar.month.replace("{month}", (monthIndex + 1).toString())}
            </p>
          </div>
        )}
      </section>
    </aside>
  );
}
