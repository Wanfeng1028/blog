"use client";

import { useRef, useState, useTransition } from "react";
import { renderMarkdownPreviewAction } from "@/features/projects/actions";
import { ImageInsertDialog } from "./image-insert-dialog";

// ─── Toolbar config ─────────────────────────────────────────────────────────

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

// ─── Component ──────────────────────────────────────────────────────────────

interface ProjectMarkdownEditorProps {
  /** Controlled value (Markdown source string) */
  value?: string;
  /** Called when the textarea content changes */
  onChange?: (value: string) => void;
}

/**
 * Split-pane Markdown editor for the admin project form.
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
 *
 * Integrates with Ant Design Form.Item via value/onChange props.
 */
export function ProjectMarkdownEditor({ value = "", onChange }: ProjectMarkdownEditorProps) {
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [previewHtml, setPreviewHtml] = useState("");
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // ── Toolbar: format buttons ────────────────────────────────────────────────

  const insertAtCursor = (btn: ToolbarButton) => {
    const ta = textareaRef.current;
    if (!ta) return;

    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);

    let insertion: string;
    if (btn.blockPrefix) {
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
    <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
      {/* ── Tab header ── */}
      <div className="flex items-center border-b border-gray-200 bg-gray-50 px-2">
        <button
          type="button"
          onClick={switchToWrite}
          className={[
            "px-3 py-2 text-sm transition-colors",
            tab === "write"
              ? "-mb-px border-b-2 border-blue-500 bg-white font-semibold text-gray-900"
              : "text-gray-500 hover:text-gray-700"
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
              ? "-mb-px border-b-2 border-blue-500 bg-white font-semibold text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          ].join(" ")}
        >
          {isPending ? "⏳ 渲染中…" : "👁️ 预览"}
        </button>
        <span className="ml-auto pr-3 text-xs text-gray-400">
          {value.length.toLocaleString()} 字符
        </span>
      </div>

      {/* ── Toolbar — write mode only ── */}
      {tab === "write" && (
        <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-gray-50/60 px-2 py-1.5">
          {TOOLBAR_BUTTONS.map((btn) => (
            <button
              key={btn.label}
              type="button"
              title={btn.title}
              onClick={() => insertAtCursor(btn)}
              className="rounded px-2 py-0.5 font-mono text-xs text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
            >
              {btn.label}
            </button>
          ))}

          <span className="select-none text-gray-300">│</span>

          {/* Image insert — opens dialog with upload + size/align options */}
          <button
            type="button"
            title="插入图片（支持上传、设置尺寸与对齐）"
            onClick={openImageDialog}
            className="rounded px-2 py-0.5 text-xs text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
          >
            🖼️ 插入图片
          </button>
        </div>
      )}

      {/* ── Write pane ── */}
      {tab === "write" && (
        <textarea
          ref={textareaRef}
          className="block w-full min-h-[380px] resize-y border-0 bg-white p-3 font-mono text-sm leading-6 text-gray-800 outline-none focus:ring-0"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={"# 项目名称\n\n在此输入项目的 Markdown 格式详细介绍...\n\n## 功能特性\n\n- 特性一\n- 特性二\n\n## 快速开始\n\n```bash\nnpm install\n```"}
          spellCheck={false}
        />
      )}

      {/* ── Preview pane ── */}
      {tab === "preview" && (
        <div
          className="gh-markdown min-h-[380px] p-5"
          dangerouslySetInnerHTML={{
            __html: isPending
              ? "<p style='color:#888;font-style:italic'>正在渲染…</p>"
              : previewHtml || "<p style='color:#aaa;font-style:italic'>暂无内容，请先在「编写」标签页输入 Markdown。</p>"
          }}
        />
      )}
    </div>

    {/* Image insert dialog */}
    <ImageInsertDialog
      open={dialogOpen}
      onClose={() => setDialogOpen(false)}
      onInsert={handleImageInsert}
    />
    </>
  );
}
