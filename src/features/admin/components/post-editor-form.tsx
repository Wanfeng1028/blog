"use client";

import { PostStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const tags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [tagsText]
  );

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
        headers: {
          "Content-Type": "application/json"
        },
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
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-title">
          标题
        </label>
        <Input id="post-title" onChange={(event) => setTitle(event.target.value)} value={title} />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-summary">
          摘要
        </label>
        <Input id="post-summary" onChange={(event) => setSummary(event.target.value)} value={summary} />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-category">
          所属分类
        </label>
        <select
          className="h-10 w-full rounded-md border border-border bg-surface px-3"
          id="post-category"
          onChange={(event) => setCategoryId(event.target.value)}
          value={categoryId}
        >
          {categories.length === 0 ? <option value="">请先在分类管理中创建分类</option> : null}
          {categories.map((item) => (
            <option value={item.id} key={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-cover">
          封面图 URL
        </label>
        <Input id="post-cover" onChange={(event) => setCoverImage(event.target.value)} value={coverImage} />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-tags">
          标签（英文逗号分隔）
        </label>
        <Input id="post-tags" onChange={(event) => setTagsText(event.target.value)} value={tagsText} />
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-status">
          状态
        </label>
        <select
          className="h-10 w-full rounded-md border border-border bg-surface px-3"
          id="post-status"
          onChange={(event) => setStatus(event.target.value as PostStatus)}
          value={status}
        >
          <option value={PostStatus.DRAFT}>DRAFT</option>
          <option value={PostStatus.PUBLISHED}>PUBLISHED</option>
          <option value={PostStatus.ARCHIVED}>ARCHIVED</option>
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm text-muted" htmlFor="post-content">
          Markdown 内容
        </label>
        <textarea
          className="min-h-[360px] w-full rounded-md border border-border bg-surface p-3 font-mono text-sm"
          id="post-content"
          onChange={(event) => setContent(event.target.value)}
          value={content}
        />
      </div>
      <Button loading={isPending} onClick={submit} type="button">
        {initialPost ? "更新文章" : "创建文章"}
      </Button>
    </div>
  );
}
