"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

export function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <footer
      className={cn(
        "mt-auto border-t border-white/50 bg-[linear-gradient(180deg,rgba(191,219,254,0.66)_0%,rgba(239,246,255,0.72)_42%,rgba(191,219,254,0.66)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_-10px_35px_rgba(30,64,175,0.12)]",
        isHome ? "backdrop-blur-md" : "backdrop-blur-[1px]"
      )}
    >
      <div className="container mx-auto flex flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted md:flex-row">
        <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link className="hover:text-text" href="/feed.xml">
            RSS
          </Link>
          <Link className="hover:text-text" href="/sitemap.xml">
            Sitemap
          </Link>
          <a className="hover:text-text" href={siteConfig.links.github} rel="noreferrer" target="_blank">
            GitHub
          </a>
          <button
            aria-label="回到顶部"
            className="inline-flex items-center gap-1 rounded-md border border-current/20 px-2 py-1 text-xs text-muted transition hover:text-text"
            onClick={() => {
              document.documentElement.scrollTop = 0;
              document.body.scrollTop = 0;
            }}
            type="button"
          >
            <ChevronUp className="size-3" />
            回到顶部
          </button>
        </div>
      </div>
    </footer>
  );
}
