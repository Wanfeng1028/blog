"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpenText, Clock3, Github, Globe, House, Mail, MessageCircle, PlaySquare } from "lucide-react";
import { useState } from "react";

const WEEK_LABELS = ["一", "二", "三", "四", "五", "六", "日"] as const;

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
  const [activeTab, setActiveTab] = useState<"profile" | "calendar">("profile");

  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  const today = now.getDate();
  const monthGrid = getMonthGrid(year, monthIndex);

  return (
    <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
      <section className="overflow-hidden rounded-[22px] border border-white/50 bg-[linear-gradient(155deg,rgba(255,255,255,0.72)_0%,rgba(229,231,235,0.62)_48%,rgba(161,161,170,0.45)_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-md">
        <div className="space-y-3 px-5 py-5">
          <h3 className="text-3xl font-semibold tracking-wide text-blue-600">精选（实则鸡汤）</h3>
          <p className="text-base font-semibold text-zinc-900">你不必完美，也可以很棒👍。</p>
        </div>

        <div className="bg-[linear-gradient(180deg,rgba(82,82,91,0.72)_0%,rgba(212,212,216,0.45)_100%)] px-5 py-5 text-center">
          <h4 className="text-3xl font-semibold tracking-wide text-zinc-100">片刻</h4>
          <p className="mt-3 text-base font-medium leading-7 text-white/95">没有伞的孩子，我必须努力奔跑。</p>
        </div>

        <nav className="space-y-1 bg-white/55 px-4 py-4 text-zinc-800">
          <Link className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/60" href="/">
            <House className="size-4" />
            首页
          </Link>
          <Link className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/60" href="/blog">
            <BookOpenText className="size-4" />
            文章
          </Link>
          <Link className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/60" href="/about#message">
            <MessageCircle className="size-4" />
            说说
          </Link>
          <Link className="flex items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-white/60" href="/blog">
            <Clock3 className="size-4" />
            归档
          </Link>
        </nav>
      </section>

      <section className="rounded-[22px] border border-white/50 bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(239,246,255,0.72)_100%)] px-5 py-6 shadow-[0_18px_38px_rgba(30,41,59,0.16)] backdrop-blur-md">
        <div className="flex items-center justify-between text-lg text-fuchsia-300">
          <button
            className={`border-b pb-1 transition ${
              activeTab === "profile" ? "border-fuchsia-300 text-fuchsia-300" : "border-transparent text-fuchsia-200/70"
            }`}
            onClick={() => setActiveTab("profile")}
            type="button"
          >
            个人简介
          </button>
          <button
            className={`border-b pb-1 transition ${
              activeTab === "calendar" ? "border-fuchsia-300 text-fuchsia-300" : "border-transparent text-fuchsia-200/70"
            }`}
            onClick={() => setActiveTab("calendar")}
            type="button"
          >
            功能
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
              <p className="mt-2 text-center text-sm text-rose-500">万物皆有裂痕，那是光照进来的地方。</p>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-zinc-700">
              <div>
                <p className="text-3xl font-semibold">{postCount}</p>
                <p className="mt-1 text-sm">文章</p>
              </div>
              <div className="border-x border-white/60">
                <p className="text-3xl font-semibold">{categoryCount}</p>
                <p className="mt-1 text-sm">分类</p>
              </div>
              <div>
                <p className="text-3xl font-semibold">{tagCount}</p>
                <p className="mt-1 text-sm">标签</p>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-6 text-lg text-zinc-700">
              <a
                className="inline-flex items-center gap-2 hover:text-zinc-950"
                href="https://github.com/Wanfeng1028"
                rel="noreferrer"
                target="_blank"
              >
                <Github className="size-5" />
                GitHub
              </a>
              <a className="inline-flex items-center gap-2 hover:text-zinc-950" href="mailto:hello@example.com">
                <Mail className="size-5" />
                Gmail
              </a>
            </div>

            <div className="my-6 border-t border-dashed border-white/80" />

            <div className="mt-6 flex justify-center gap-6 text-lg text-zinc-700">
              <a
                className="inline-flex items-center gap-2 hover:text-zinc-950"
                href="https://www.xiaohongshu.com/user/profile/5627774308"
                rel="noreferrer"
                target="_blank"
              >
                <Globe className="size-5" />
                小红书
              </a>
              <a
                className="inline-flex items-center gap-2 hover:text-zinc-950"
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
          <div className="mt-6 rounded-2xl bg-white/55 p-4">
            <div className="grid grid-cols-7 text-center text-xs text-zinc-500">
              {WEEK_LABELS.map((w) => (
                <span key={w}>{w}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-y-2 text-center">
              {monthGrid.map((day, idx) => (
                <span
                  className={`mx-auto flex size-8 items-center justify-center rounded-full text-sm ${
                    day === today ? "bg-cyan-500 font-semibold text-white" : day ? "text-zinc-700" : "text-transparent"
                  }`}
                  key={`${year}-${monthIndex}-${idx}`}
                >
                  {day ?? "0"}
                </span>
              ))}
            </div>

            <p className="mt-3 text-center text-sm text-zinc-500">
              {year} 年 {monthIndex + 1} 月
            </p>
          </div>
        )}
      </section>
    </aside>
  );
}
