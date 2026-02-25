"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type SearchResultItem = {
  id: string;
  title: string;
  slug: string;
  summary: string;
};

export function SearchBox({ initialKeyword = "" }: { initialKeyword?: string }) {
  const [keyword, setKeyword] = useState(initialKeyword);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchResultItem[]>([]);

  const debounced = useMemo(() => keyword.trim(), [keyword]);

  useEffect(() => {
    if (debounced.length < 2) {
      setItems([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(debounced)}&pageSize=5`, {
          cache: "no-store"
        });
        const result = await response.json();
        if (response.ok && result.ok) {
          setItems(result.data.items);
        } else {
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [debounced]);

  return (
    <div className="space-y-3">
      <Input
        className="border-white/65 bg-white/58 text-zinc-900 placeholder:text-zinc-600 shadow-[0_10px_24px_rgba(15,23,42,0.12)] focus-visible:ring-sky-500"
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="搜索文章..."
        value={keyword}
      />
      {loading ? <p className="text-sm text-zinc-700">搜索中...</p> : null}
      {!loading && debounced.length >= 2 && items.length === 0 ? (
        <p className="text-sm text-zinc-700">没有找到相关内容</p>
      ) : null}
      <div className="grid gap-2">
        {items.map((item) => (
          <Link
            className="rounded-md border border-white/70 bg-white/70 p-3 text-zinc-900 shadow-[0_8px_20px_rgba(15,23,42,0.1)] transition hover:border-sky-400"
            href={`/blog/${item.slug}`}
            key={item.id}
          >
            <p className="font-semibold text-zinc-900">{item.title}</p>
            <p className="text-sm text-zinc-700">{item.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
