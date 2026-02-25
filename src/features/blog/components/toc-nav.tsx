import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import type { TocItem } from "@/lib/utils/toc";

export function TocNav({ toc }: { toc: TocItem[] }) {
  if (toc.length === 0) return null;

  return (
    <aside className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-3 text-sm font-semibold">目录</h3>
      <ul className="space-y-2">
        {toc.map((item) => (
          <li className={cn("text-sm text-muted", item.depth === 2 ? "pl-3" : item.depth === 3 ? "pl-6" : "")} key={item.id}>
            <Link className="hover:text-text" href={`#${item.id}`}>
              {item.text}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
