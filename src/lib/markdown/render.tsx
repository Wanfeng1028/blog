import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

const prettyCodeOptions = {
  theme: {
    dark: "github-dark",
    light: "github-light"
  },
  keepBackground: false,
  onVisitLine(node: any) {
    if (node.children.length === 0) {
      node.children = [{ type: "text", value: " " }];
    }
  }
};

/** async Server Component — 用 unified 原生异步流水线处理 Markdown，
 *  避免 rehype-pretty-code (shiki) 在 runSync 中报错 */
export async function MarkdownRenderer({ content }: { content: string }) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, { behavior: "append" })
    .use(rehypePrettyCode as any, prettyCodeOptions)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return (
    <div className="rounded-2xl border border-white/45 bg-white/65 p-6 shadow-lg backdrop-blur-md">
      <article
        className="prose prose-slate max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: String(file) }}
      />
    </div>
  );
}
