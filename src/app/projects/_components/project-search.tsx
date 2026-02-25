"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe2 } from "lucide-react";

type Props = {
  cat: string;
  defaultQ: string;
};

export function ProjectSearch({ cat, defaultQ }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    params.set("group", "ai-tools");
    params.set("cat", cat);
    if (q.trim()) params.set("q", q.trim());
    router.push(`/projects?${params.toString()}`, { scroll: false });
  };

  return (
    <form
      className="flex flex-col gap-2 rounded-2xl border border-white/50 bg-white/58 p-3 backdrop-blur-md sm:flex-row"
      onSubmit={handleSubmit}
    >
      <input
        className="h-10 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-300/30"
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索工具名、标签、说明..."
        value={q}
      />
      <button
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition hover:opacity-90"
        type="submit"
      >
        <Globe2 className="size-4" />
        搜索
      </button>
    </form>
  );
}
