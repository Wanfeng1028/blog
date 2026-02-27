"use client";

import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Space, Table, Tag, Typography, message } from "antd";
import { useDictionary } from "@/features/i18n/lang-context";

type TagItem = {
  id: string;
  name: string;
  slug: string;
  postCount: number;
};

export function AdminTagsPanel({ tags }: { tags: TagItem[] }) {
  const router = useRouter();
  const dict = useDictionary();
  const [form] = Form.useForm<{ name: string }>();

  const createTag = async (values: { name: string }) => {
    const response = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? dict.admin.createTagFail);
      return;
    }
    message.success(dict.admin.createTagSuccess);
    form.resetFields();
    router.refresh();
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Typography.Title level={3} className="!mb-0">
        {dict.admin.tagManage}
      </Typography.Title>
      <Card title={dict.admin.newTag}>
        <Form form={form} layout="inline" onFinish={createTag}>
          <Form.Item name="name" rules={[{ required: true, message: dict.admin.tagNameRequired }]}>
            <Input placeholder={dict.admin.tagNamePlaceholder} style={{ width: 240 }} />
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
          dataSource={tags}
          columns={[
            { title: dict.admin.tagName, dataIndex: "name", key: "name" },
            { title: "Slug", dataIndex: "slug", key: "slug", render: (value: string) => <Tag>{value}</Tag> },
            { title: dict.admin.postCount, dataIndex: "postCount", key: "postCount" }
          ]}
        />
      </Card>
    </Space>
  );
}
