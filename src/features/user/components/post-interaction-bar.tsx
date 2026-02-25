"use client";

import { useEffect, useState } from "react";
import { HeartOutlined, StarOutlined } from "@ant-design/icons";
import { Button, Space, message } from "antd";

type State = {
  liked: boolean;
  favorited: boolean;
};

export function PostInteractionBar({ postId }: { postId: string }) {
  const [state, setState] = useState<State>({ liked: false, favorited: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [favoriteRes, likeRes] = await Promise.all([
          fetch(`/api/blog/posts/${postId}/favorite`, { cache: "no-store" }),
          fetch(`/api/blog/posts/${postId}/like`, { cache: "no-store" })
        ]);
        const [favoriteJson, likeJson] = await Promise.all([favoriteRes.json(), likeRes.json()]);
        if (!active) return;
        setState({
          favorited: Boolean(favoriteJson?.data?.favorited),
          liked: Boolean(likeJson?.data?.liked)
        });
      } catch {
        if (active) setState({ liked: false, favorited: false });
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [postId]);

  const toggle = async (type: "favorite" | "like") => {
    setLoading(true);
    try {
      const response = await fetch(`/api/blog/posts/${postId}/${type}`, { method: "POST" });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        message.error(result.message ?? "操作失败");
        return;
      }
      if (type === "favorite") {
        setState((prev) => ({ ...prev, favorited: Boolean(result.data.favorited) }));
      } else {
        setState((prev) => ({ ...prev, liked: Boolean(result.data.liked) }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space>
      <Button
        icon={<StarOutlined />}
        type={state.favorited ? "primary" : "default"}
        loading={loading}
        onClick={() => toggle("favorite")}
      >
        {state.favorited ? "已收藏" : "收藏"}
      </Button>
      <Button icon={<HeartOutlined />} danger={state.liked} loading={loading} onClick={() => toggle("like")}>
        {state.liked ? "已点赞" : "点赞"}
      </Button>
    </Space>
  );
}
