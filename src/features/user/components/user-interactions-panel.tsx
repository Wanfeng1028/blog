"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, Space, Table, Tabs, Tag, message } from "antd";

type FavoriteRow = {
  id: string;
  createdAt: string;
  post: {
    id: string;
    title: string;
    slug: string;
    summary: string;
  };
};

type LikeRow = {
  id: string;
  createdAt: string;
  post: {
    id: string;
    title: string;
    slug: string;
    summary: string;
  };
};

type CommentRow = {
  id: string;
  content: string;
  status: string;
  createdAt: string;
  post: {
    title: string;
    slug: string;
  };
};

type Props = {
  favorites: FavoriteRow[];
  likes: LikeRow[];
  comments: CommentRow[];
};

export function UserInteractionsPanel({ favorites, likes, comments }: Props) {
  const [favoriteRows, setFavoriteRows] = useState(favorites);
  const [likeRows, setLikeRows] = useState(likes);

  const removeFavorite = async (postId: string) => {
    const response = await fetch("/api/user/interactions/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "取消收藏失败");
      return;
    }
    setFavoriteRows((prev) => prev.filter((item) => item.post.id !== postId));
    message.success("已取消收藏");
  };

  const removeLike = async (postId: string) => {
    const response = await fetch("/api/user/interactions/likes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "取消点赞失败");
      return;
    }
    setLikeRows((prev) => prev.filter((item) => item.post.id !== postId));
    message.success("已取消点赞");
  };

  return (
    <Card className="wanfeng-user-panel" title="我的互动与内容">
      <Tabs
        items={[
          {
            key: "favorites",
            label: `我的收藏 (${favoriteRows.length})`,
            children: (
              <Table
                rowKey="id"
                pagination={{ pageSize: 8 }}
                dataSource={favoriteRows}
                columns={[
                  {
                    title: "文章",
                    key: "title",
                    render: (_, row: FavoriteRow) => (
                      <Space direction="vertical" size={0}>
                        <Link href={`/blog/${row.post.slug}`} className="hover:underline">
                          {row.post.title}
                        </Link>
                        <span className="text-xs text-slate-500">{row.post.summary}</span>
                      </Space>
                    )
                  },
                  {
                    title: "收藏时间",
                    dataIndex: "createdAt",
                    key: "createdAt",
                    render: (value: string) => new Date(value).toLocaleString()
                  },
                  {
                    title: "操作",
                    key: "actions",
                    render: (_, row: FavoriteRow) => (
                      <Button danger size="small" onClick={() => removeFavorite(row.post.id)}>
                        取消收藏
                      </Button>
                    )
                  }
                ]}
              />
            )
          },
          {
            key: "likes",
            label: `我的点赞 (${likeRows.length})`,
            children: (
              <Table
                rowKey="id"
                pagination={{ pageSize: 8 }}
                dataSource={likeRows}
                columns={[
                  {
                    title: "文章",
                    key: "title",
                    render: (_, row: LikeRow) => (
                      <Space direction="vertical" size={0}>
                        <Link href={`/blog/${row.post.slug}`} className="hover:underline">
                          {row.post.title}
                        </Link>
                        <span className="text-xs text-slate-500">{row.post.summary}</span>
                      </Space>
                    )
                  },
                  {
                    title: "点赞时间",
                    dataIndex: "createdAt",
                    key: "createdAt",
                    render: (value: string) => new Date(value).toLocaleString()
                  },
                  {
                    title: "操作",
                    key: "actions",
                    render: (_, row: LikeRow) => (
                      <Button danger size="small" onClick={() => removeLike(row.post.id)}>
                        取消点赞
                      </Button>
                    )
                  }
                ]}
              />
            )
          },
          {
            key: "comments",
            label: `我的评论 (${comments.length})`,
            children: (
              <Table
                rowKey="id"
                pagination={{ pageSize: 10 }}
                dataSource={comments}
                columns={[
                  {
                    title: "评论内容",
                    dataIndex: "content",
                    key: "content",
                    render: (value: string) => <span className="line-clamp-2">{value}</span>
                  },
                  {
                    title: "所属文章",
                    key: "post",
                    render: (_, row: CommentRow) => (
                      <Link href={`/blog/${row.post.slug}`} className="hover:underline">
                        {row.post.title}
                      </Link>
                    )
                  },
                  {
                    title: "状态",
                    dataIndex: "status",
                    key: "status",
                    render: (value: string) => <Tag>{value}</Tag>
                  },
                  {
                    title: "时间",
                    dataIndex: "createdAt",
                    key: "createdAt",
                    render: (value: string) => new Date(value).toLocaleString()
                  }
                ]}
              />
            )
          }
        ]}
      />
    </Card>
  );
}
