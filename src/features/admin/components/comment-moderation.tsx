"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type CommentItem = {
  id: string;
  content: string;
  status: "VISIBLE" | "HIDDEN" | "DELETED";
  post: {
    slug: string;
    title: string;
  };
  user: {
    name: string | null;
    email: string;
  };
};

export function CommentModeration({ comments }: { comments: CommentItem[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const update = (id: string, status: "VISIBLE" | "HIDDEN" | "DELETED") => {
    startTransition(async () => {
      const response = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "更新失败");
        return;
      }
      toast.success("更新成功");
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div className="rounded-md border border-border p-3" key={comment.id}>
          <p className="text-xs text-muted">
            {comment.user.name ?? comment.user.email} · {comment.post.title}
          </p>
          <p className="my-2 text-sm">{comment.content}</p>
          <div className="flex gap-2">
            <Button disabled={pending} size="sm" variant="outline" onClick={() => update(comment.id, "VISIBLE")}>
              显示
            </Button>
            <Button disabled={pending} size="sm" variant="secondary" onClick={() => update(comment.id, "HIDDEN")}>
              隐藏
            </Button>
            <Button disabled={pending} size="sm" variant="danger" onClick={() => update(comment.id, "DELETED")}>
              删除
            </Button>
          </div>
        </div>
      ))}
      {comments.length === 0 ? <p className="text-sm text-muted">暂无评论</p> : null}
    </div>
  );
}
