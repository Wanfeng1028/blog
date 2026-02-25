"use server";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

/**
 * Server Action: Renders a Markdown string to HTML using the same
 * unified pipeline as the project detail page.
 * Used by the admin Markdown editor's live preview tab.
 */
export async function renderMarkdownPreviewAction(content: string): Promise<string> {
  if (!content?.trim()) return "";
  try {
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
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
    return String(file);
  } catch {
    return "<p style='color:red;font-style:italic'>Markdown 渲染失败，请检查语法</p>";
  }
}
