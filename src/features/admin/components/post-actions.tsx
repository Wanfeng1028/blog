"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { PostStatus } from "@prisma/client";
import { toast } from "sonner";
import { Button, Popconfirm, Space } from "antd";
import { useDictionary } from "@/features/i18n/lang-context";

export function PostActions({ id, status }: { id: string; status: PostStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const dict = useDictionary();

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
        toast.error(result.message ?? dict.admin.operationFailed);
        return;
      }
      toast.success(publish ? dict.admin.postPublishedSuccess : dict.admin.postOfflineSuccess);
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
        toast.error(result.message ?? dict.admin.deleteFailed);
        return;
      }
      toast.success(dict.admin.deletedSuccess);
      router.refresh();
    });
  };

  return (
    <Space wrap>
      <Link href={`/admin/posts/${id}/edit`}>
        <Button size="small">{dict.admin.edit}</Button>
      </Link>
      {status !== "PUBLISHED" ? (
        <Button size="small" type="primary" loading={pending} onClick={() => togglePublish(true)}>
          {dict.admin.publish}
        </Button>
      ) : (
        <Button size="small" loading={pending} onClick={() => togglePublish(false)}>
          {dict.admin.takeOffline}
        </Button>
      )}
      <Popconfirm title={dict.admin.confirmDeletePost} okText={dict.admin.confirm} cancelText={dict.admin.cancel} onConfirm={remove}>
        <Button danger size="small" loading={pending}>
          {dict.admin.delete}
        </Button>
      </Popconfirm>
    </Space>
  );
}
