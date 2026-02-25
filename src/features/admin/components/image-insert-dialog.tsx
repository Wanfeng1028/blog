"use client";

import { useRef, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────────────────

type ImageAlign = "default" | "left" | "center" | "right";

const WIDTH_PRESETS = [
  { label: "原始", value: "" },
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
  { label: "自定义", value: "custom" },
] as const;

const ALIGN_OPTIONS: { label: string; value: ImageAlign; icon: string }[] = [
  { label: "默认", value: "default", icon: "▤" },
  { label: "居左", value: "left", icon: "⬅" },
  { label: "居中", value: "center", icon: "↔" },
  { label: "居右", value: "right", icon: "➡" },
];

// ─── HTML/Markdown snippet builder ─────────────────────────────────────────

/** Escape a value for use in an HTML attribute (double-quoted). */
function escAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Build the Markdown / inline-HTML snippet to insert into the editor.
 *
 * - No width, no align  → plain Markdown `![alt](url)`
 * - Center              → `<div style="text-align:center">…</div>`
 * - Left / Right float  → `<img style="float:…" />`
 * - Width only          → `<img style="width:…" />`
 */
function buildSnippet(url: string, alt: string, widthValue: string, align: ImageAlign): string {
  const safeUrl = escAttr(url);
  const safeAlt = escAttr(alt || "image");
  const hasWidth = !!widthValue;
  const hasAlign = align !== "default";

  // Default: plain Markdown
  if (!hasWidth && !hasAlign) {
    return `![${alt || "image"}](${url})`;
  }

  const imgStyles: string[] = [];
  if (hasWidth) imgStyles.push(`width:${widthValue}`);
  imgStyles.push("max-width:100%");

  const styleAttr = ` style="${imgStyles.join(";")}"`;

  if (align === "center") {
    return `<div style="text-align:center;margin:1em 0"><img src="${safeUrl}" alt="${safeAlt}"${styleAttr} /></div>`;
  }
  if (align === "left") {
    const s = `float:left;margin:0 1em 1em 0;${imgStyles.join(";")}`;
    return `<img src="${safeUrl}" alt="${safeAlt}" style="${s}" />\n`;
  }
  if (align === "right") {
    const s = `float:right;margin:0 0 1em 1em;${imgStyles.join(";")}`;
    return `<img src="${safeUrl}" alt="${safeAlt}" style="${s}" />\n`;
  }
  // Width only, no float
  return `<img src="${safeUrl}" alt="${safeAlt}"${styleAttr} />`;
}

// ─── Component ─────────────────────────────────────────────────────────────

interface ImageInsertDialogProps {
  open: boolean;
  onClose: () => void;
  /** Receives the final Markdown/HTML snippet to insert at cursor */
  onInsert: (snippet: string) => void;
}

export function ImageInsertDialog({ open, onClose, onInsert }: ImageInsertDialogProps) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [widthPreset, setWidthPreset] = useState("");
  const [customPx, setCustomPx] = useState("400");
  const [align, setAlign] = useState<ImageAlign>("default");
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const resolvedWidth = widthPreset === "custom" ? `${customPx}px` : widthPreset;

  // ── Upload ──────────────────────────────────────────────────────────────

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { ok: boolean; data?: { url: string }; message?: string };
      if (!res.ok || !data.ok) {
        alert(data.message ?? "图片上传失败，请重试");
        return;
      }
      setUrl(data.data!.url);
      setImgError(false);
      if (!alt) setAlt(file.name.replace(/\.[^.]+$/, ""));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  // ── Confirm ─────────────────────────────────────────────────────────────

  const handleInsert = () => {
    const trimmed = url.trim();
    if (!trimmed) {
      alert("请先上传图片或填写图片地址");
      return;
    }
    onInsert(buildSnippet(trimmed, alt.trim(), resolvedWidth, align));
    handleClose();
  };

  // ── Reset on close ───────────────────────────────────────────────────────

  const handleClose = () => {
    setUrl("");
    setAlt("");
    setWidthPreset("");
    setCustomPx("400");
    setAlign("default");
    setImgError(false);
    onClose();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="font-semibold text-foreground">🖼️ 插入图片</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-muted hover:bg-accent hover:text-foreground transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 p-5">

          {/* ── 来源 ── */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">图片来源</span>
            <div className="flex gap-2">
              <input
                type="text"
                className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                placeholder="粘贴图片地址 https://…"
                value={url}
                onChange={(e) => { setUrl(e.target.value); setImgError(false); }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="h-9 shrink-0 rounded-md border border-border bg-muted/20 px-3 text-xs text-muted transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? "上传中…" : "📂 本地上传"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>

            {/* Thumbnail preview */}
            {url && !imgError && (
              <div className="overflow-hidden rounded-md border border-border bg-muted/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="预览"
                  className="max-h-36 w-full object-contain"
                  onError={() => setImgError(true)}
                />
              </div>
            )}
            {url && imgError && (
              <p className="text-xs text-red-500">⚠ 图片无法加载，请检查地址</p>
            )}
          </div>

          {/* ── Alt 文本 ── */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">替代文本（Alt）</span>
            <input
              type="text"
              className="h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="图片说明文字，有助于 SEO 和无障碍访问"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          </div>

          {/* ── 宽度 ── */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">宽度</span>
            <div className="flex flex-wrap gap-1.5">
              {WIDTH_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setWidthPreset(p.value)}
                  className={[
                    "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                    widthPreset === p.value
                      ? "bg-blue-500 text-white shadow-sm"
                      : "border border-border text-muted hover:bg-accent hover:text-foreground",
                  ].join(" ")}
                >
                  {p.label}
                </button>
              ))}
            </div>
            {widthPreset === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={9999}
                  className="h-8 w-28 rounded-md border border-border bg-surface px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={customPx}
                  onChange={(e) => setCustomPx(e.target.value)}
                />
                <span className="text-sm text-muted">px</span>
              </div>
            )}
          </div>

          {/* ── 对齐 ── */}
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">对齐方式</span>
            <div className="grid grid-cols-4 gap-1.5">
              {ALIGN_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  title={opt.label}
                  onClick={() => setAlign(opt.value)}
                  className={[
                    "flex flex-col items-center gap-1 rounded-md py-2.5 text-xs font-medium transition-colors",
                    align === opt.value
                      ? "bg-blue-500 text-white shadow-sm"
                      : "border border-border text-muted hover:bg-accent hover:text-foreground",
                  ].join(" ")}
                >
                  <span className="text-lg leading-none">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── 预览结果 ── */}
          {url && !imgError && (
            <div className="rounded-md border border-dashed border-border bg-muted/10 p-3">
              <p className="mb-1.5 text-xs text-muted">生成的代码预览：</p>
              <code className="break-all text-xs text-foreground">
                {buildSnippet(url.trim(), alt.trim(), resolvedWidth, align)}
              </code>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border bg-muted/10 px-5 py-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-border px-4 py-1.5 text-sm text-muted transition-colors hover:bg-accent hover:text-foreground"
          >
            取消
          </button>
          <button
            type="button"
            disabled={!url.trim() || uploading || imgError}
            onClick={handleInsert}
            className="rounded-md bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            插入
          </button>
        </div>
      </div>
    </div>
  );
}
