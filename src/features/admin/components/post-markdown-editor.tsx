"use client";

import { useRef, useState, useTransition } from "react";
import { renderMarkdownPreviewAction } from "@/features/projects/actions";
import { ImageInsertDialog } from "./image-insert-dialog";

interface PostMarkdownEditorProps {
  /** Controlled Markdown source value */
  value?: string;
  /** Called whenever the content changes */
  onChange?: (value: string) => void;
  /** Placeholder shown in the write tab */
  placeholder?: string;
}

interface ToolbarButton {
  label: string;
  title: string;
  prefix: string;
  suffix: string;
  blockPrefix?: boolean;
}

const TOOLBAR_BUTTONS: ToolbarButton[] = [
  { label: "H2", title: "二级标题", prefix: "## ", suffix: "", blockPrefix: true },
  { label: "H3", title: "三级标题", prefix: "### ", suffix: "", blockPrefix: true },
  { label: "粗体", title: "粗体 (Bold)", prefix: "**", suffix: "**" },
  { label: "斜体", title: "斜体 (Italic)", prefix: "_", suffix: "_" },
  { label: "链接", title: "超链接", prefix: "[", suffix: "](https://)" },
  { label: "代码", title: "行内代码", prefix: "`", suffix: "`" },
  { label: "代码块", title: "代码块", prefix: "```\n", suffix: "\n```" },
  { label: "引用", title: "引用块", prefix: "> ", suffix: "", blockPrefix: true },
];

/**
 * Full-featured split-pane Markdown editor for the admin post form.
 *
 * Tabs:
 *   编写 — raw textarea with a formatting toolbar + image-insert button
 *   预览 — calls renderMarkdownPreviewAction (Server Action) → .gh-markdown div
 *
 * Image insertion:
 *   Clicking "🖼️ 插入图片" opens ImageInsertDialog which supports:
 *     - Local file upload (POST /api/upload) or direct URL input
 *     - Width preset (original / 25% / 50% / 75% / 100% / custom px)
 *     - Alignment (default / left / center / right)
 *   The dialog generates plain Markdown `![alt](url)` for simple cases, or
 *   inline HTML for styled images, and inserts it at the current cursor position.
 */
export function PostMarkdownEditor({
  value = "",
  onChange,
  placeholder = "# 文章标题\n\n在此输入文章的 Markdown 内容...\n\n## 一、前言\n\n...",
}: PostMarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Saves caret position when the dialog is opened so we can insert at the right spot
  const savedSelectionRef = useRef<[number, number]>([0, 0]);

  // ── Tab switching ──────────────────────────────────────────────────────────

  const switchToPreview = () => {
    setTab("preview");
    startTransition(async () => {
      const html = await renderMarkdownPreviewAction(value);
      setPreviewHtml(html);
    });
  };

  const switchToWrite = () => setTab("write");

  // ── Toolbar helpers ────────────────────────────────────────────────────────

  /**
   * Insert markdown wrapping (or block prefix) around the currently selected
   * text in the textarea, then restore focus & cursor.
   */
  const insertAtCursor = (btn: ToolbarButton) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);

    let insertion: string;
    if (btn.blockPrefix) {
      // For block-level elements (headings, blockquotes) prepend the prefix
      // to the start of the current line if it doesn't already have it.
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const beforeLine = value.slice(lineStart, start);
      insertion = beforeLine.length > 0
        ? `\n${btn.prefix}${selected || "文本"}`
        : `${btn.prefix}${selected || "文本"}`;
    } else {
      insertion = `${btn.prefix}${selected || "文本"}${btn.suffix}`;
    }

    const newVal = value.slice(0, start) + insertion + value.slice(end);
    onChange?.(newVal);

    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + insertion.length;
      ta.setSelectionRange(cursor, cursor);
    });
  };

  // ── Image insert dialog ────────────────────────────────────────────────────

  const openImageDialog = () => {
    const ta = textareaRef.current;
    savedSelectionRef.current = ta ? [ta.selectionStart, ta.selectionEnd] : [value.length, value.length];
    setDialogOpen(true);
  };

  const handleImageInsert = (snippet: string) => {
    const [start, end] = savedSelectionRef.current;
    const newVal = value.slice(0, start) + snippet + value.slice(end);
    onChange?.(newVal);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursor = start + snippet.length;
        textareaRef.current.setSelectionRange(cursor, cursor);
      }
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
    <div className="overflow-hidden rounded-md border border-border bg-surface">
      {/* Tab header */}
      <div className="flex items-center border-b border-border bg-muted/30 px-2">
        <button
          type="button"
          onClick={switchToWrite}
          className={[
            "px-3 py-2 text-sm transition-colors",
            tab === "write"
              ? "-mb-px border-b-2 border-blue-500 bg-surface font-semibold text-foreground"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          ✏️ 编写
        </button>
        <button
          type="button"
          onClick={switchToPreview}
          className={[
            "px-3 py-2 text-sm transition-colors",
            tab === "preview"
              ? "-mb-px border-b-2 border-blue-500 bg-surface font-semibold text-foreground"
              : "text-muted hover:text-foreground",
          ].join(" ")}
        >
          {isPending ? "⏳ 渲染中…" : "👁️ 预览"}
        </button>
        <span className="ml-auto pr-3 text-xs text-muted">
          {value.length.toLocaleString()} 字符
        </span>
      </div>

      {/* Toolbar — only shown in write mode */}
      {tab === "write" && (
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/20 px-2 py-1.5">
          {TOOLBAR_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              type="button"
              title={btn.title}
              onClick={() => insertAtCursor(btn)}
              className="rounded px-2 py-0.5 font-mono text-xs text-muted transition-colors hover:bg-accent hover:text-foreground"
            >
              {btn.label}
            </button>
          ))}

          <span className="select-none text-border">│</span>

          {/* Image insert — opens dialog with upload + size/align options */}
          <button
            type="button"
            title="插入图片（支持上传、设置尺寸与对齐）"
            onClick={openImageDialog}
            className="rounded px-2 py-0.5 text-xs text-muted transition-colors hover:bg-accent hover:text-foreground"
          >
            🖼️ 插入图片
          </button>
        </div>
      )}

      {/* Write pane */}
      {tab === "write" && (
        <textarea
          ref={textareaRef}
          className="block min-h-[520px] w-full resize-y border-0 bg-surface p-4 font-mono text-sm leading-6 text-foreground outline-none focus:ring-0"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
        />
      )}

      {/* Preview pane */}
      {tab === "preview" && (
        <div
          className="gh-markdown min-h-[520px] p-6"
          dangerouslySetInnerHTML={{
            __html: isPending
              ? "<p style='color:#888;font-style:italic'>正在渲染预览…</p>"
              : previewHtml ||
                "<p style='color:#aaa;font-style:italic'>暂无内容，请先在「编写」标签页输入 Markdown。</p>",
          }}
        />
      )}
    </div>

    {/* Image insert dialog — rendered outside the editor box so it can overlay the page */}
    <ImageInsertDialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      onInsert={handleImageInsert}
    />
    </>
  );
}
