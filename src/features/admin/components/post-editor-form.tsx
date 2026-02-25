"use client";

import { PostStatus } from "@prisma/client";
import { useRef, useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PostMarkdownEditor } from "./post-markdown-editor";

type InitialPost = {
  id: string;
  title: string;
  summary: string;
  content: string;
  status: PostStatus;
  coverImage: string | null;
  tags: string[];
  categoryId: string | null;
};

type CategoryOption = {
  id: string;
  name: string;
};

export function PostEditorForm({
  initialPost,
  categories
}: {
  initialPost?: InitialPost;
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [summary, setSummary] = useState(initialPost?.summary ?? "");
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [coverImage, setCoverImage] = useState(initialPost?.coverImage ?? "");
  const [tagsText, setTagsText] = useState(initialPost?.tags.join(", ") ?? "");
  const [status, setStatus] = useState<PostStatus>(initialPost?.status ?? PostStatus.DRAFT);
  const [categoryId, setCategoryId] = useState(initialPost?.categoryId ?? categories[0]?.id ?? "");
  const [isCoverUploading, setIsCoverUploading] = useState(false);

  const coverFileInputRef = useRef<HTMLInputElement>(null);

  const tags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [tagsText]
  );

  // ── Cover image upload ───────────────────────────────────────────────────

  const handleCoverUpload = async (file: File) => {
    setIsCoverUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const result = await res.json() as { ok: boolean; data?: { url: string }; message?: string };
      if (!res.ok || !result.ok) {
        toast.error(result.message ?? "封面图上传失败");
        return;
      }
      setCoverImage(result.data!.url);
      toast.success("封面图上传成功");
    } finally {
      setIsCoverUploading(false);
      if (coverFileInputRef.current) coverFileInputRef.current.value = "";
    }
  };

  // ── Form submit ──────────────────────────────────────────────────────────

  const submit = () => {
    if (!categoryId) {
      toast.error("请选择所属分类");
      return;
    }

    startTransition(async () => {
      const payload = {
        title,
        summary,
        content,
        status,
        categoryId,
        coverImage,
        tags
      };
      const endpoint = initialPost ? `/api/admin/posts/${initialPost.id}` : "/api/admin/posts";
      const method = initialPost ? "PATCH" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "保存失败");
        return;
      }

      toast.success("保存成功");
      router.push("/admin/posts");
    });
  };

  return (
    <div className="space-y-5">
      {/* 标题 */}
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-title">
          标题
        </label>
        <Input id="post-title" onChange={(e) => setTitle(e.target.value)} value={title} />
      </div>

      {/* 摘要 */}
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-summary">
          摘要
        </label>
        <Input id="post-summary" onChange={(e) => setSummary(e.target.value)} value={summary} />
      </div>

      {/* 所属分类 */}
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-category">
          所属分类
        </label>
        <select
          className="h-10 w-full rounded-md border border-border bg-surface px-3"
          id="post-category"
          onChange={(e) => setCategoryId(e.target.value)}
          value={categoryId}
        >
          {categories.length === 0 ? (
            <option value="">请先在分类管理中创建分类</option>
          ) : null}
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      {/* 封面图 */}
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-cover">
          封面图
        </label>
        <div className="flex items-center gap-2">
          <Input
            id="post-cover"
            placeholder="https://... 或点击右侧按钮上传"
            onChange={(e) => setCoverImage(e.target.value)}
            value={coverImage}
            className="flex-1"
          />
          <Button
            type="button"
            loading={isCoverUploading}
            onClick={() => coverFileInputRef.current?.click()}
            className="shrink-0 whitespace-nowrap"
          >
            {isCoverUploading ? "上传中…" : "📷 上传图片"}
          </Button>
          <input
            ref={coverFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleCoverUpload(file);
            }}
          />
        </div>
        {/* Cover preview */}
        {coverImage && (
          <div className="mt-2 overflow-hidden rounded-md border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImage}
              alt="封面图预览"
              className="max-h-48 w-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* 标签 */}
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-tags">
          标签（英文逗号分隔）
        </label>
        <Input id="post-tags" onChange={(e) => setTagsText(e.target.value)} value={tagsText} />
      </div>

      {/* 状态 */}
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-status">
          状态
        </label>
        <select
          className="h-10 w-full rounded-md border border-border bg-surface px-3"
          id="post-status"
          onChange={(e) => setStatus(e.target.value as PostStatus)}
          value={status}
        >
          <option value={PostStatus.DRAFT}>DRAFT（草稿）</option>
          <option value={PostStatus.PUBLISHED}>PUBLISHED（已发布）</option>
          <option value={PostStatus.ARCHIVED}>ARCHIVED（已归档）</option>
        </select>
      </div>

      {/* Markdown 内容编辑器 */}
      <div className="space-y-1">
        <label className="text-sm text-muted">
          Markdown 内容
        </label>
        <PostMarkdownEditor
          value={content}
          onChange={setContent}
          placeholder={"# 文章标题\n\n在此输入文章的 Markdown 内容...\n\n## 一、前言\n\n...\n\n## 二、正文\n\n```typescript\nconsole.log('Hello World');\n```"}
        />
      </div>

      {/* 提交 */}
      <Button loading={isPending} onClick={submit} type="button">
        {initialPost ? "更新文章" : "创建文章"}
      </Button>
    </div>
  );
}
