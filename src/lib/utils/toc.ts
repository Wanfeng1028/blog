import slugify from "slugify";

export type TocItem = {
  depth: number;
  text: string;
  id: string;
};

export function extractToc(markdown: string): TocItem[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const toc: TocItem[] = [];

  for (const match of markdown.matchAll(headingRegex)) {
    const depth = match[1].length;
    const text = match[2].trim();
    toc.push({
      depth,
      text,
      id: slugify(text, { lower: true, strict: true, locale: "zh" })
    });
  }

  return toc;
}
