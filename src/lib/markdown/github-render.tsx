import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

/**
 * Async Server Component — renders Markdown with GitHub-style .gh-markdown class.
 * Used by the project detail page to display the `content` field.
 * Visual output mirrors GitHub's official README rendering.
 */
export async function GithubMarkdownRenderer({ content }: { content: string }) {
  if (!content?.trim()) return null;

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypePrettyCode, {
      theme: { dark: "github-dark", light: "github-light" },
      keepBackground: false,
      onVisitLine(node: any) {
        if (node.children.length === 0) {
          node.children = [{ type: "text", value: " " }];
        }
      }
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return (
    <div
      className="gh-markdown"
      dangerouslySetInnerHTML={{ __html: String(file) }}
    />
  );
}
