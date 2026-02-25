import slugify from "slugify";
import { db } from "@/lib/db";

export function toSlug(text: string) {
  const slug = slugify(text, {
    lower: true,
    strict: true,
    trim: true,
    locale: "zh"
  });
  return slug || `post-${Date.now()}`;
}

export async function createUniquePostSlug(title: string, currentId?: string) {
  const base = toSlug(title);
  let candidate = base;
  let index = 2;

  for (;;) {
    const conflict = await db.post.findFirst({
      where: {
        slug: candidate,
        ...(currentId ? { id: { not: currentId } } : {})
      },
      select: { id: true }
    });
    if (!conflict) return candidate;
    candidate = `${base}-${index}`;
    index += 1;
  }
}
