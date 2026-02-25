"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Space, Table, Tag, Typography, message } from "antd";

type TagItem = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

export function AdminTagsPanel({ tags }: { tags: TagItem[] }) {
  const router = useRouter();
  const [form] = Form.useForm<{ name: string }>();

  const createTag = async (values: { name: string }) => {
    const response = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "创建标签失败");
      return;
    }
    message.success("标签创建成功");
    form.resetFields();
    router.refresh();
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Typography.Title level={3} className="!mb-0">
        标签管理
      </Typography.Title>
      <Card title="新增标签">
        <Form form={form} layout="inline" onFinish={createTag}>
          <Form.Item name="name" rules={[{ required: true, message: "请输入标签名" }]}>
            <Input placeholder="例如：nextjs" style={{ width: 240 }} />
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
          dataSource={tags}
          columns={[
            { title: "标签名", dataIndex: "name", key: "name" },
            { title: "Slug", dataIndex: "slug", key: "slug", render: (value: string) => <Tag>{value}</Tag> },
            { title: "文章数量", dataIndex: "postCount", key: "postCount" }
          ]}
        />
      </Card>
    </Space>
  );
}
