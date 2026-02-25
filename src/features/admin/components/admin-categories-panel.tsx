"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Popconfirm, Space, Table, Tag, Typography, message } from "antd";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  order: number;
  postCount: number;
};

export function AdminCategoriesPanel({ categories }: { categories: CategoryItem[] }) {
  const router = useRouter();
  const [form] = Form.useForm<{ name: string }>();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const sorted = useMemo(
    () => [...categories].sort((a, b) => a.order - b.order || a.name.localeCompare(b.name)),
    [categories]
  );

  const createCategory = async (values: { name: string }) => {
    const response = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "创建分类失败");
      return;
    }
    message.success("分类创建成功");
    form.resetFields();
    router.refresh();
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    const response = await fetch(`/api/admin/categories/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editingName.trim() })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "更新分类失败");
      return;
    }
    message.success("分类已更新");
    setEditingId(null);
    setEditingName("");
    router.refresh();
  };

  const removeCategory = async (id: string) => {
    const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "删除分类失败");
      return;
    }
    message.success("分类已删除");
    router.refresh();
  };

  const moveCategory = async (id: string, direction: "up" | "down") => {
    const index = sorted.findIndex((item) => item.id === id);
    if (index < 0) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;

    const next = [...sorted];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    const response = await fetch("/api/admin/categories/reorder", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: next.map((item) => item.id) })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "分类排序失败");
      return;
    }
    router.refresh();
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Typography.Title level={3} className="!mb-0">
        文章分类管理
      </Typography.Title>

      <Card title="新增分类">
        <Form form={form} layout="inline" onFinish={createCategory}>
          <Form.Item name="name" rules={[{ required: true, message: "请输入分类名称" }]}>
            <Input placeholder="例如：计算机网络" style={{ width: 240 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              创建
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={sorted}
          columns={[
            { title: "排序", dataIndex: "order", key: "order", width: 80 },
            {
              title: "分类名称",
              key: "name",
              render: (_, row: CategoryItem) =>
                editingId === row.id ? (
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    onPressEnter={saveEdit}
                    onBlur={saveEdit}
                  />
                ) : (
                  row.name
                )
            },
            { title: "Slug", dataIndex: "slug", key: "slug", render: (value: string) => <Tag>{value}</Tag> },
            { title: "文章数量", dataIndex: "postCount", key: "postCount", width: 120 },
            {
              title: "操作",
              key: "actions",
              width: 280,
              render: (_, row: CategoryItem) => (
                <Space>
                  <Button size="small" onClick={() => moveCategory(row.id, "up")}>
                    上移
                  </Button>
                  <Button size="small" onClick={() => moveCategory(row.id, "down")}>
                    下移
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingId(row.id);
                      setEditingName(row.name);
                    }}
                  >
                    重命名
                  </Button>
                  <Popconfirm
                    title="确认删除该分类？"
                    okText="删除"
                    cancelText="取消"
                    onConfirm={() => removeCategory(row.id)}
                  >
                    <Button danger size="small">
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>
    </Space>
  );
}
