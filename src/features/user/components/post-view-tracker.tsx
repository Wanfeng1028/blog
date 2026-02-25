"use client";

import { useEffect } from "react";

const SESSION_WINDOW_MS = 30 * 60 * 1000; // 30 分钟内同一 session 不重复计数

export function PostViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    try {
      const key = `pv:${postId}`;
      const last = sessionStorage.getItem(key);
      if (last && Date.now() - Number(last) < SESSION_WINDOW_MS) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      // sessionStorage 不可用时跳过去重，直接上报（服务端仍有 IP 防刷兜底）
    }
    void fetch(`/api/blog/posts/${postId}/view`, { method: "POST" });
  }, [postId]);

  return null;
}
