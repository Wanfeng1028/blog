"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
};

export function CommentSection({
  postId,
  initialComments
}: {
  postId: string;
  initialComments: CommentItem[];
}) {
  const { data } = useSession();
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const submitComment = () => {
    if (!content.trim()) return;
    startTransition(async () => {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postId,
          content
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "评论失败");
        return;
      }

      toast.success("评论成功");
      setContent("");
      const listResponse = await fetch(`/api/comments?postId=${postId}`, {
        cache: "no-store"
      });
      const listResult = await listResponse.json();
      if (listResponse.ok && listResult.ok) {
        setComments(listResult.data);
      }
    });
  };

  return (
    <section className="space-y-4 rounded-lg border border-border bg-surface p-5">
      <h3 className="text-lg font-semibold">评论</h3>
      {data?.user ? (
        <div className="space-y-2">
          <Input
            onChange={(event) => setContent(event.target.value)}
            placeholder="写下你的评论..."
            value={content}
          />
          <Button loading={isPending} onClick={submitComment} type="button">
            提交评论
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted">登录后可以发表评论。</p>
      )}

      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-muted">还没有评论。</p>
        ) : (
          comments.map((comment) => (
            <div className="rounded-md border border-border p-3" key={comment.id}>
              <p className="text-sm font-medium">{comment.user.name ?? "匿名用户"}</p>
              <p className="mt-1 text-sm text-muted">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
