"use client";

import Link from "next/link";
import { useLang } from "@/features/i18n/lang-context";

type InteractionType = "comment" | "favorite" | "like" | "view";

type DashboardProps = {
  overview: {
    joinedDays: number;
    commentCount: number;
    favoriteCount: number;
    likeCount: number;
  };
  recent: Array<{
    id: string;
    type: InteractionType;
    at: string;
    title: string;
    slug: string;
    description: string;
  }>;
};

const getTypeLabel = (type: InteractionType, dict: any) => {
  const dictionaryLabel: Record<InteractionType, string> = {
    comment: dict.userDashboard.typeComment,
    favorite: dict.userDashboard.typeFavorite,
    like: dict.userDashboard.typeLike,
    view: dict.userDashboard.typeView
  };
  return dictionaryLabel[type];
};

const typeClass: Record<InteractionType, string> = {
  comment: "bg-sky-100 text-sky-700",
  favorite: "bg-amber-100 text-amber-700",
  like: "bg-rose-100 text-rose-700",
  view: "bg-slate-100 text-slate-700"
};

export function UserDashboard({ overview, recent }: DashboardProps) {
  const { lang, dictionary } = useLang();
  const dict = dictionary!;

  const cards = [
    { title: dict.userDashboard.joinedDays, value: overview.joinedDays },
    { title: dict.userDashboard.commentCount, value: overview.commentCount },
    { title: dict.userDashboard.favoriteCount, value: overview.favoriteCount },
    { title: dict.userDashboard.likeCount, value: overview.likeCount }
  ];

  return (
    <div className="w-full space-y-4">
      <section className="wanfeng-user-panel rounded-2xl border border-teal-700/30 bg-teal-600 p-6">
        <h2 className="mb-1 text-3xl font-bold text-black">{dict.userDashboard.welcomeTitle}</h2>
        <p className="text-black">{dict.userDashboard.welcomeSubtitle}</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.title} className="wanfeng-user-panel rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm">
            <p className="text-sm text-slate-600">{card.title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="wanfeng-user-panel rounded-2xl border border-slate-200/60 bg-white/80 p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold text-slate-900">{dict.userDashboard.recentActivity}</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-500">{dict.userDashboard.noActivity}</p>
        ) : (
          <div className="space-y-3">
            {recent.map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-200/70 bg-white/60 p-3">
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeClass[item.type]}`}>{getTypeLabel(item.type, dict)}</span>
                  <Link className="font-medium text-slate-900 hover:underline" href={`/blog/${item.slug}`}>
                    {item.title}
                  </Link>
                </div>
                <p className="text-sm text-slate-700">{item.description}</p>
                <p className="mt-1 text-xs text-slate-500">{new Date(item.at).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
