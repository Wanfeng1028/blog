"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronRight,
  Globe,
  Loader2,
  Menu,
  Search,
  X
} from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import React from "react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/features/theme/theme-toggle";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/features/i18n/lang-context";
import { navItemDefs } from "@/features/i18n/nav-items";

type NavNode = {
  label: string;
  href?: string;
  children?: NavNode[];
};

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavNode[];
};

type SearchResultItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
};

type ArticleCategoryItem = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

type RecentPostItem = {
  id: string;
  title: string;
  slug: string;
};

const pathKey = (path: number[]) => path.join("-");

function collectNodeHrefs(nodes: NavNode[] | undefined, result: string[]) {
  if (!nodes?.length) return;
  for (const node of nodes) {
    if (node.href) result.push(node.href);
    if (node.children?.length) collectNodeHrefs(node.children, result);
  }
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchItems, setSearchItems] = useState<SearchResultItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [articleCategories, setArticleCategories] = useState<ArticleCategoryItem[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPostItem[]>([]);
  const [webKeyword, setWebKeyword] = useState("");
  const [webEngine, setWebEngine] = useState<"google" | "bing" | "baidu">("bing");
  const [activeDesktopItem, setActiveDesktopItem] = useState<string | null>(null);
  const [activeDesktopPath, setActiveDesktopPath] = useState<number[]>([]);
  const [submenuDirections, setSubmenuDirections] = useState<Record<string, "left" | "right">>({});
  const [isSigningOut, startSignOutTransition] = useTransition();
  const pathname = usePathname();
  const router = useRouter();
  const { data, status } = useSession();
  const { lang, toggle: toggleLang } = useLang();
  const isAdmin = data?.user?.role === "ADMIN";
  const isHome = pathname === "/";

  const searchRef = useRef<HTMLDivElement>(null);
  const desktopCloseTimerRef = useRef<number | null>(null);
  const submenuOpenTimerRef = useRef<number | null>(null);
  const hiddenRef = useRef(hidden);
  const lastScrollYRef = useRef(0);

  const navItems = useMemo(
    () =>
      navItemDefs.map((def) => ({
        href: def.href,
        label: lang === "zh" ? def.labelZh : def.labelEn,
        icon: def.icon,
        children: def.children
      })),
    [lang]
  );

  useEffect(() => {
    hiddenRef.current = hidden;
  }, [hidden]);

  useEffect(() => {
    const prefetchCommonRoutes = () => {
      const nestedHrefs: string[] = [];
      for (const item of navItemDefs) {
        prefetchHref(item.href);
        collectNodeHrefs(item.children, nestedHrefs);
      }
      for (const href of nestedHrefs) {
        prefetchHref(href);
      }
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(() => prefetchCommonRoutes(), { timeout: 1200 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timer = setTimeout(prefetchCommonRoutes, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!data?.user) {
      prefetchHref("/login");
      return;
    }
    if (data.user.role === "USER") {
      prefetchHref("/dashboard");
      prefetchHref("/dashboard/profile");
      prefetchHref("/dashboard/interactions");
      prefetchHref("/dashboard/security");
    }
    if (data.user.role === "ADMIN") {
      prefetchHref("/admin");
    }
    prefetchHref("/security");
  }, [data?.user?.role]);

  const isLinkActive = (href: string) => {
    const routePath = href.split("?")[0].split("#")[0];
    if (routePath === "/") return pathname === "/";
    return pathname.startsWith(routePath);
  };

  const prefetchHref = (href: string) => {
    if (!href.startsWith("/")) return;
    const routeHref = href.split("#")[0];
    if (!routeHref) return;
    void router.prefetch(routeHref);
  };

  const handleSignOut = () => {
    startSignOutTransition(async () => {
      await signOut({ redirect: false });
      router.replace("/");
      router.refresh();
    });
  };

  const clearDesktopCloseTimer = () => {
    if (desktopCloseTimerRef.current !== null) {
      window.clearTimeout(desktopCloseTimerRef.current);
      desktopCloseTimerRef.current = null;
    }
  };

  const clearSubmenuOpenTimer = () => {
    if (submenuOpenTimerRef.current !== null) {
      window.clearTimeout(submenuOpenTimerRef.current);
      submenuOpenTimerRef.current = null;
    }
  };

  const closeDesktopMenu = () => {
    clearDesktopCloseTimer();
    clearSubmenuOpenTimer();
    setActiveDesktopItem(null);
    setActiveDesktopPath([]);
    setSubmenuDirections({});
  };

  const scheduleDesktopClose = () => {
    clearDesktopCloseTimer();
    desktopCloseTimerRef.current = window.setTimeout(() => {
      closeDesktopMenu();
    }, 190);
  };

  const resolveSubmenuDirection = (triggerRect: DOMRect): "left" | "right" => {
    const submenuWidth = 240;
    const gap = 8;
    const canOpenRight = triggerRect.right + gap + submenuWidth <= window.innerWidth - 8;
    const canOpenLeft = triggerRect.left - gap - submenuWidth >= 8;
    if (canOpenRight) return "right";
    if (canOpenLeft) return "left";
    return triggerRect.right < window.innerWidth / 2 ? "right" : "left";
  };

  const isPathActive = (path: number[]) => path.every((value, index) => activeDesktopPath[index] === value);

  const getMenuChildren = (item: NavItem): NavNode[] | undefined => {
    if (item.href !== "/blog") return item.children;
    return [
      {
        label: "全部文章",
        children:
          recentPosts.length > 0
            ? recentPosts.map((post) => ({
                href: `/blog/${post.slug}`,
                label: post.title
              }))
            : [{ href: "/blog", label: "查看全部文章" }]
      },
      {
        label: "文章分类",
        children:
          articleCategories.length > 0
            ? articleCategories.map((category) => ({
                href: `/blog?category=${category.slug}`,
                label: `${category.name} (${category.count})`
              }))
            : [{ href: "/blog", label: "查看所有分类" }]
      }
    ];
  };

  const renderDesktopNodes = (nodes: NavNode[], pathPrefix: number[] = []) => (
    <ul className="relative w-60 rounded-2xl border border-white/45 bg-[linear-gradient(180deg,rgba(191,219,254,0.4)_0%,rgba(239,246,255,0.52)_100%)] p-1.5 shadow-2xl backdrop-blur-xl">
      {nodes.map((node, index) => {
        const nodePath = [...pathPrefix, index];
        const key = `${pathKey(nodePath)}-${node.href ?? node.label}`;
        const hasChildren = Boolean(node.children?.length);
        const expanded = hasChildren && isPathActive(nodePath);
        const direction = submenuDirections[pathKey(nodePath)] ?? "right";
        const itemClass = cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition",
          expanded ? "bg-white text-zinc-950" : "text-zinc-700 hover:bg-white/90 hover:text-zinc-950"
        );

        return (
          <li
            className="relative"
            key={key}
            onMouseEnter={(event) => {
              clearDesktopCloseTimer();
              clearSubmenuOpenTimer();

              if (!hasChildren) {
                setActiveDesktopPath(pathPrefix);
                return;
              }

              const target = event.currentTarget;
              submenuOpenTimerRef.current = window.setTimeout(() => {
                setSubmenuDirections((previous) => ({
                  ...previous,
                  [pathKey(nodePath)]: resolveSubmenuDirection(target.getBoundingClientRect())
                }));
                setActiveDesktopPath(nodePath);
              }, 90);
            }}
          >
            {node.href ? (
              <Link
                className={itemClass}
                href={node.href}
                onClick={closeDesktopMenu}
                onMouseEnter={() => prefetchHref(node.href!)}
              >
                <span className="line-clamp-1">{node.label}</span>
                {hasChildren ? <ChevronRight className={cn("size-3.5 shrink-0", direction === "left" ? "rotate-180" : "")} /> : null}
              </Link>
            ) : (
              <div className={cn(itemClass, hasChildren ? "cursor-pointer" : "cursor-default")}>
                <span className="line-clamp-1">{node.label}</span>
                {hasChildren ? <ChevronRight className={cn("size-3.5 shrink-0", direction === "left" ? "rotate-180" : "")} /> : null}
              </div>
            )}

            {hasChildren ? (
              <div
                className={cn(
                  "absolute top-0 z-50 transition-all duration-200",
                  direction === "right" ? "left-[calc(100%+0.5rem)]" : "right-[calc(100%+0.5rem)]",
                  expanded ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible translate-y-1 opacity-0"
                )}
                onMouseEnter={clearDesktopCloseTimer}
              >
                {renderDesktopNodes(node.children!, nodePath)}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  const renderMobileNodes = (nodes: NavNode[], depth = 0) =>
    nodes.map((node, index) => {
      const key = `${depth}-${index}-${node.href ?? node.label}`;
      const hasChildren = Boolean(node.children?.length);
      return (
        <div className={cn("space-y-1", depth > 0 ? "border-l border-white/20 pl-2" : "")} key={key}>
          {node.href ? (
            <Link
              className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-white/90 hover:bg-white/10"
              href={node.href}
              onClick={() => setOpen(false)}
            >
              <span>{node.label}</span>
              {hasChildren ? <ChevronRight className="size-3.5 text-white/65" /> : null}
            </Link>
          ) : (
            <p className="px-2 py-1 text-xs text-white/60">{node.label}</p>
          )}
          {hasChildren ? <div className="space-y-1">{renderMobileNodes(node.children!, depth + 1)}</div> : null}
        </div>
      );
    });

  useEffect(() => {
    setSearchOpen(false);
    if (desktopCloseTimerRef.current !== null) {
      window.clearTimeout(desktopCloseTimerRef.current);
      desktopCloseTimerRef.current = null;
    }
    if (submenuOpenTimerRef.current !== null) {
      window.clearTimeout(submenuOpenTimerRef.current);
      submenuOpenTimerRef.current = null;
    }
    setActiveDesktopItem(null);
    setActiveDesktopPath([]);
    setSubmenuDirections({});
  }, [pathname]);

  useEffect(() => {
    let active = true;
    const loadCategories = async () => {
      try {
        const response = await fetch("/api/blog/categories");
        if (!response.ok) {
          console.error("Failed to fetch categories:", response.status);
          setArticleCategories([]);
          return;
        }
        const result = await response.json();
        if (!active) return;
        if (result.ok && Array.isArray(result.data)) {
          setArticleCategories(result.data);
        } else {
          console.error("Invalid categories response:", result);
          setArticleCategories([]);
        }
      } catch (error) {
        console.error("Error loading categories:", error);
        if (active) setArticleCategories([]);
      }
    };
    void loadCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadRecentPosts = async () => {
      try {
        const response = await fetch("/api/blog/recent");
        if (!response.ok) {
          console.error("Failed to fetch recent posts:", response.status);
          setRecentPosts([]);
          return;
        }
        const result = await response.json();
        if (!active) return;
        if (result.ok && Array.isArray(result.data)) {
          setRecentPosts(result.data);
        } else {
          console.error("Invalid recent posts response:", result);
          setRecentPosts([]);
        }
      } catch (error) {
        console.error("Error loading recent posts:", error);
        if (active) setRecentPosts([]);
      }
    };
    void loadRecentPosts();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("keydown", onEsc);
    };
  }, [searchOpen]);

  useEffect(() => {
    const q = keyword.trim();

    // 字符不足 / 面板关闭 → 立即重置所有状态
    if (!searchOpen || q.length < 2) {
      setSearchItems([]);
      setSearchLoading(false);
      setSearchError(null);
      return;
    }

    // ① 立即清除 stale 结果，防止旧数据在防抖期间闪现
    setSearchItems([]);
    setSearchError(null);
    setSearchLoading(true);

    const controller = new AbortController();

    // ② 500ms 防抖：用户停止打字后才真正发请求
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(q)}&pageSize=6`,
          { cache: "no-store", signal: controller.signal }
        );

        if (!response.ok) {
          setSearchError("搜索服务暂时不可用，请稍后再试");
          return;
        }

        const result = await response.json();
        if (result.ok) {
          setSearchItems(result.data.items ?? []);
        } else {
          setSearchError("搜索服务暂时不可用，请稍后再试");
        }
      } catch (err) {
        // ③ 只有非 Abort 错误才显示报错提示
        if (controller.signal.aborted) return;
        setSearchError("搜索服务暂时不可用，请稍后再试");
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 500);

    return () => {
      // ④ cleanup：取消旧请求 + 清除未触发的定时器
      controller.abort();
      clearTimeout(timer);
    };
  }, [keyword, searchOpen]);

  useEffect(() => {
    let rafId: number | null = null;
    const getY = () => document.documentElement.scrollTop || document.body.scrollTop || window.scrollY;
    lastScrollYRef.current = getY();

    const applyHiddenByScroll = () => {
      const currentY = getY();
      const delta = currentY - lastScrollYRef.current;
      let nextHidden = hiddenRef.current;

      if (Math.abs(delta) >= 3) {
        if (currentY < 30) {
          nextHidden = false;
        } else if (delta > 0 && currentY > 60) {
          nextHidden = true;
        } else if (delta < 0) {
          nextHidden = false;
        }
        lastScrollYRef.current = currentY;
      }

      if (nextHidden !== hiddenRef.current) {
        hiddenRef.current = nextHidden;
        setHidden(nextHidden);
      }
      rafId = null;
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(applyHiddenByScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (desktopCloseTimerRef.current !== null) {
        window.clearTimeout(desktopCloseTimerRef.current);
        desktopCloseTimerRef.current = null;
      }
      if (submenuOpenTimerRef.current !== null) {
        window.clearTimeout(submenuOpenTimerRef.current);
        submenuOpenTimerRef.current = null;
      }
    };
  }, []);

  const submitWebSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = webKeyword.trim();
    if (!q) return;
    const encoded = encodeURIComponent(q);
    const engineUrl =
      webEngine === "google"
        ? `https://www.google.com/search?q=${encoded}`
        : webEngine === "baidu"
          ? `https://www.baidu.com/s?wd=${encoded}`
          : `https://www.bing.com/search?q=${encoded}`;
    window.open(engineUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-transform duration-300",
        hidden && !searchOpen ? "-translate-y-full" : "translate-y-0",
        isHome
          ? "bg-transparent"
          : "border-b border-white/40 bg-[linear-gradient(180deg,rgba(191,219,254,0.26)_0%,rgba(239,246,255,0.22)_55%,rgba(191,219,254,0.18)_100%)] backdrop-blur-xl"
      )}
    >
      <div className="flex h-16 w-full items-center justify-center gap-6 px-6">
        <Link className="logo-title shrink-0 whitespace-nowrap" href="/">
          @.晚风
        </Link>

        <nav className="hidden items-center gap-1.5 md:flex">
          {navItems.map((item) => {
            const children = getMenuChildren(item);
            const hasChildren = Boolean(children?.length);
            const menuOpen = activeDesktopItem === item.href;
            return (
              <div
                className="relative"
                key={item.href}
                onMouseEnter={() => {
                  if (!hasChildren) return;
                  clearDesktopCloseTimer();
                  if (!menuOpen) {
                    setActiveDesktopItem(item.href);
                    setActiveDesktopPath([]);
                    setSubmenuDirections({});
                  }
                }}
                onMouseLeave={() => {
                  if (!hasChildren) return;
                  scheduleDesktopClose();
                }}
              >
                <Link
                  className={cn(
                    "uiverse-nav-link inline-flex items-center gap-1.5 text-sm",
                    isHome ? "uiverse-nav-link--home" : "uiverse-nav-link--default",
                    isLinkActive(item.href) ? "uiverse-nav-link--active" : ""
                  )}
                  href={item.href}
                  onMouseEnter={() => prefetchHref(item.href)}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>

                {hasChildren ? (
                  <div
                    className={cn(
                      "absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 transition-all duration-200",
                      menuOpen ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
                    )}
                    onMouseEnter={clearDesktopCloseTimer}
                    onMouseLeave={scheduleDesktopClose}
                  >
                    {renderDesktopNodes(children!)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isHome ? (
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-white/40 bg-white/10 px-2 py-1 text-xs font-medium text-white transition hover:bg-white/20"
                onClick={toggleLang}
                title={lang === "zh" ? "Switch to English" : "切换到中文"}
                type="button"
              >
                {lang === "zh" ? "EN" : "中"}
              </button>
              <div className="relative" ref={searchRef}>
                <button
                  aria-expanded={searchOpen}
                  aria-haspopup="dialog"
                  aria-label="Search posts"
                  className="rounded-full p-2 text-white/90 transition hover:bg-white/10 hover:text-white"
                  onClick={() => setSearchOpen((value) => !value)}
                  type="button"
                >
                  <Search className="size-4" />
                </button>
                {searchOpen ? (
                  <div className="absolute right-0 top-full mt-2 w-[min(92vw,26rem)] rounded-2xl border border-white/35 bg-[linear-gradient(180deg,rgba(191,219,254,0.42)_0%,rgba(239,246,255,0.46)_50%,rgba(191,219,254,0.42)_100%)] p-3 shadow-2xl backdrop-blur-xl">
                    {/* ── 输入框（右侧内嵌 spinner） ── */}
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const q = keyword.trim();
                        if (!q) return;
                        setSearchOpen(false);
                        router.push(`/blog?query=${encodeURIComponent(q)}`);
                      }}
                    >
                      <div className="relative">
                        <input
                          autoFocus
                          className="w-full rounded-xl border border-white/40 bg-white/70 px-3 py-2 pr-9 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40"
                          onChange={(event) => setKeyword(event.target.value)}
                          placeholder="搜索站内文章（至少 2 个字符）"
                          value={keyword}
                        />
                        {searchLoading ? (
                          <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-sky-500" />
                        ) : null}
                      </div>
                    </form>

                    {/* ── 结果面板（美化滚动条） ── */}
                    <div className="mt-2 max-h-72 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/40">
                      {/* error 状态 */}
                      {!searchLoading && searchError ? (
                        <p className="px-1 py-2 text-sm text-red-300">{searchError}</p>
                      ) : null}

                      {/* empty 状态 */}
                      {!searchLoading && !searchError && keyword.trim().length >= 2 && searchItems.length === 0 ? (
                        <p className="px-1 py-2 text-sm text-white/70">未找到相关文章</p>
                      ) : null}

                      {/* 结果列表 */}
                      {!searchLoading && !searchError && searchItems.length > 0 ? (
                        <div className="space-y-2">
                          {searchItems.map((item) => (
                            <Link
                              className="block rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-zinc-900 transition hover:bg-white/85"
                              href={`/blog/${item.slug}`}
                              key={item.id}
                              onClick={() => setSearchOpen(false)}
                            >
                              <p className="line-clamp-1 text-sm font-semibold">{item.title}</p>
                              <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{item.summary}</p>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>

              <form
                className="flex items-center gap-1 rounded-full border border-white/35 bg-white/10 px-2 py-1 backdrop-blur-md"
                onSubmit={submitWebSearch}
              >
                <Globe className="size-3.5 text-white/90" />
                <select
                  className="bg-transparent text-xs text-white/90 outline-none"
                  onChange={(event) => setWebEngine(event.target.value as "google" | "bing" | "baidu")}
                  value={webEngine}
                >
                  <option className="text-zinc-900" value="google">
                    Google
                  </option>
                  <option className="text-zinc-900" value="bing">
                    Bing
                  </option>
                  <option className="text-zinc-900" value="baidu">
                    Baidu
                  </option>
                </select>
                <input
                  className="w-20 bg-transparent text-xs text-white placeholder:text-white/65 outline-none"
                  onChange={(event) => setWebKeyword(event.target.value)}
                  placeholder="网页搜索..."
                  value={webKeyword}
                />
              </form>
              {status === "loading" ? (
                <div className="ml-1 h-8 w-36 animate-pulse rounded-full bg-white/20" />
              ) : !data?.user ? (
                <div className="ml-1 flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-2 py-1 backdrop-blur-md">
                  <Button asChild className="border-white/40 bg-white/10 text-white hover:bg-white/20" size="sm" variant="outline">
                    <Link href="/login">登录</Link>
                  </Button>
                  <Button asChild className="border-white/40 bg-white/10 text-white hover:bg-white/20" size="sm" variant="outline">
                    <Link href="/register">注册</Link>
                  </Button>
                </div>
              ) : (
                <div className="ml-1 flex items-center gap-2 rounded-full border border-white/35 bg-white/10 px-2 py-1 backdrop-blur-md">
                  {isAdmin ? (
                    <Button asChild className="border-white/40 bg-white/10 text-white hover:bg-white/20" size="sm" variant="outline">
                      <Link href="/admin">后台管理</Link>
                    </Button>
                  ) : (
                    <Button asChild className="border-white/40 bg-white/10 text-white hover:bg-white/20" size="sm" variant="outline">
                      <Link href="/dashboard">个人中心</Link>
                    </Button>
                  )}
                  <Button asChild className="border-white/40 bg-white/10 text-white hover:bg-white/20" size="sm" variant="outline">
                    <Link href="/security">账号安全</Link>
                  </Button>
                  <Button
                    className="border-white/40 bg-white/10 text-white hover:bg-white/20"
                    loading={isSigningOut}
                    onClick={handleSignOut}
                    size="sm"
                    variant="outline"
                  >
                    退出登录
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <>
              <ThemeToggle />
              <button
                className="rounded-md border border-border/60 bg-transparent px-2 py-1 text-xs font-medium text-text transition hover:bg-secondary"
                onClick={toggleLang}
                title={lang === "zh" ? "Switch to English" : "切换到中文"}
                type="button"
              >
                {lang === "zh" ? "EN" : "中"}
              </button>
              {isAdmin ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin">后台管理</Link>
                </Button>
              ) : null}
              {status === "loading" ? (
                <div className="h-8 w-24 animate-pulse rounded-md bg-secondary" />
              ) : data?.user ? (
                <div className="flex items-center gap-2">
                  {data.user.role === "USER" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href="/dashboard" onMouseEnter={() => prefetchHref("/dashboard")}>
                        个人中心
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild size="sm" variant="outline">
                    <Link href="/security">账号安全</Link>
                  </Button>
                  <Button loading={isSigningOut} onClick={handleSignOut} size="sm" variant="ghost">
                    退出登录
                  </Button>
                </div>
              ) : (
                <Button asChild size="sm">
                  <Link href="/login" onMouseEnter={() => prefetchHref("/login")}>
                    登录
                  </Link>
                </Button>
              )}
            </>
          )}
        </div>

        <button
          className={cn("md:hidden", isHome ? "text-white" : "text-text")}
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden transition-all md:hidden",
          isHome ? "border-t border-white/20 bg-black/45 backdrop-blur" : "border-t border-border",
          open ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="container mx-auto flex flex-col gap-3 px-4 py-4">
          {navItems.map((item) => {
            const children = getMenuChildren(item);
            return (
              <details className="rounded-lg border border-white/20 bg-white/10 px-3 py-2" key={item.href}>
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm text-white/95">
                  <span className="inline-flex items-center gap-2">
                    <item.icon className="size-3.5" />
                    {item.label}
                  </span>
                </summary>
                <div className="mt-2 space-y-2 pb-1">
                  <Link
                    className="block rounded-md bg-white/10 px-2 py-1.5 text-sm text-white/90"
                    href={item.href}
                    onClick={() => setOpen(false)}
                  >
                    进入{item.label}
                  </Link>
                  {children ? <div className="space-y-1">{renderMobileNodes(children)}</div> : null}
                </div>
              </details>
            );
          })}

          {!isHome ? (
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {isAdmin ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/admin">后台管理</Link>
                </Button>
              ) : null}
              {status === "loading" ? (
                <div className="h-8 w-20 animate-pulse rounded-md bg-secondary" />
              ) : data?.user ? (
                <div className="flex items-center gap-2">
                  {data.user.role === "USER" ? (
                    <Button asChild size="sm" variant="outline">
                      <Link href="/dashboard" onMouseEnter={() => prefetchHref("/dashboard")}>
                        Dashboard
                      </Link>
                    </Button>
                  ) : null}
                  <Button asChild size="sm" variant="outline">
                    <Link href="/security">账号安全</Link>
                  </Button>
                  <Button loading={isSigningOut} onClick={handleSignOut} size="sm" variant="ghost">
                    退出登录
                  </Button>
                </div>
              ) : (
                <Button asChild size="sm">
                  <Link href="/login" onMouseEnter={() => prefetchHref("/login")}>
                    登录
                  </Link>
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
