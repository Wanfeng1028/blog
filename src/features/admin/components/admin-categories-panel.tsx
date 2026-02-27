"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import { useDictionary } from "@/features/i18n/lang-context";

type CategoryItem = {
  id: string;
  name: string;
  slug: string;
  order: number;
  postCount: number;
};

export function AdminCategoriesPanel({ categories }: { categories: CategoryItem[] }) {
  const router = useRouter();
  const dict = useDictionary();
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
      message.error(result.message ?? dict.admin.createCategoryFail);
      return;
    }
    message.success(dict.admin.createCategorySuccess);
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
      message.error(result.message ?? dict.admin.updateCategoryFail);
      return;
    }
    message.success(dict.admin.updateCategorySuccess);
    setEditingId(null);
    setEditingName("");
    router.refresh();
  };

  const removeCategory = async (id: string) => {
    const response = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? dict.admin.deleteCategoryFail);
      return;
    }
    message.success(dict.admin.deleteCategorySuccess);
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
      message.error(result.message ?? dict.admin.reorderCategoryFail);
      return;
    }
    router.refresh();
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Typography.Title level={3} className="!mb-0">
        {dict.admin.categoryManage}
      </Typography.Title>

      <Card title={dict.admin.newCategory}>
        <Form form={form} layout="inline" onFinish={createCategory}>
          <Form.Item name="name" rules={[{ required: true, message: dict.admin.categoryNameRequired }]}>
            <Input placeholder={dict.admin.categoryNamePlaceholder} style={{ width: 240 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {dict.admin.create}
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
            { title: dict.admin.order, dataIndex: "order", key: "order", width: 80 },
            {
              title: dict.admin.categoryName,
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
            { title: dict.admin.postCount, dataIndex: "postCount", key: "postCount", width: 120 },
            {
              title: dict.admin.actions,
              key: "actions",
              width: 280,
              render: (_, row: CategoryItem) => (
                <Space>
                  <Button size="small" onClick={() => moveCategory(row.id, "up")}>
                    {dict.admin.moveUp}
                  </Button>
                  <Button size="small" onClick={() => moveCategory(row.id, "down")}>
                    {dict.admin.moveDown}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingId(row.id);
                      setEditingName(row.name);
                    }}
                  >
                    {dict.admin.rename}
                  </Button>
                  <Popconfirm
                    title={dict.admin.confirmDeleteCategory}
                    okText={dict.admin.delete}
                    cancelText={dict.admin.cancel}
                    onConfirm={() => removeCategory(row.id)}
                  >
                    <Button danger size="small">
                      {dict.admin.delete}
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
