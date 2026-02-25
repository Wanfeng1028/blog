"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

type TocEntry = {
  id: string;
  text: string;
  depth: number;
};

function scanHeadings(): TocEntry[] {
  const selectors = "article h1[id], article h2[id], article h3[id], article h4[id], article h5[id], article h6[id]";
  return Array.from(document.querySelectorAll<HTMLElement>(selectors)).map((el) => ({
    id: el.id,
    text: el.textContent?.replace(/\s*#\s*$/, "").trim() ?? "",
    depth: Number(el.tagName[1])
  }));
}

export function SidebarToc() {
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 扫描 DOM 中的标题
  useEffect(() => {
    // 等待文章内容渲染完毕
    const timer = setTimeout(() => {
      const entries = scanHeadings();
      setToc(entries);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Scrollspy
  useEffect(() => {
    if (toc.length === 0) return;

    observerRef.current?.disconnect();

    const headingEls = toc
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (headingEls.length === 0) return;

    // 使用 rootMargin 让高亮提前触发，使阅读体验更佳
    observerRef.current = new IntersectionObserver(
      (observations) => {
        // 找最靠近顶部且 isIntersecting 的那个
        const visible = observations
          .filter((o) => o.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-60px 0px -60% 0px",
        threshold: 0
      }
    );

    headingEls.forEach((el) => observerRef.current!.observe(el));

    return () => observerRef.current?.disconnect();
  }, [toc]);

  if (toc.length === 0) return null;

  const depthPad: Record<number, string> = {
    1: "pl-0",
    2: "pl-0",
    3: "pl-3",
    4: "pl-6",
    5: "pl-9",
    6: "pl-12"
  };

  return (
    <nav aria-label="文章目录" className="rounded-[18px] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.62)_0%,rgba(239,246,255,0.72)_100%)] px-4 py-4 shadow-[0_12px_28px_rgba(30,41,59,0.12)] backdrop-blur-md">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">目录</p>
      <ul className="space-y-1 text-sm">
        {toc.map((item) => (
          <li className={cn(depthPad[item.depth] ?? "pl-0")} key={item.id}>
            <a
              className={cn(
                "block rounded-md px-2 py-1 leading-snug transition-colors duration-150",
                activeId === item.id
                  ? "bg-sky-100/70 font-semibold text-sky-700"
                  : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900"
              )}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(item.id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  setActiveId(item.id);
                }
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
