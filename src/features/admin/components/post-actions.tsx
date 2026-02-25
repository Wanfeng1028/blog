"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PostStatus } from "@prisma/client";
import { toast } from "sonner";
import { Button, Popconfirm, Space } from "antd";

export function PostActions({ id, status }: { id: string; status: PostStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const togglePublish = (publish: boolean) => {
    startTransition(async () => {
      const response = await fetch(`/api/admin/posts/${id}/publish`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ publish })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "操作失败");
        return;
      }
      toast.success(publish ? "文章已发布" : "文章已下线");
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      const response = await fetch(`/api/admin/posts/${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "删除失败");
        return;
      }
      toast.success("已删除");
      router.refresh();
    });
  };

  return (
    <Space wrap>
      <Link href={`/admin/posts/${id}/edit`}>
        <Button size="small">编辑</Button>
      </Link>
      {status !== "PUBLISHED" ? (
        <Button size="small" type="primary" loading={pending} onClick={() => togglePublish(true)}>
          发布
        </Button>
      ) : (
        <Button size="small" loading={pending} onClick={() => togglePublish(false)}>
          下线
        </Button>
      )}
      <Popconfirm title="确认删除这篇文章吗？" okText="确认" cancelText="取消" onConfirm={remove}>
        <Button danger size="small" loading={pending}>
          删除
        </Button>
      </Popconfirm>
    </Space>
  );
}
