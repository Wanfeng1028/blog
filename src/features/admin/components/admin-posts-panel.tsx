"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Pagination, Select, Space, Table, Tag, Typography } from "antd";
import type { PostStatus } from "@prisma/client";
import { PostActions } from "@/features/admin/components/post-actions";

type PostItem = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  tags: string[];
  updatedAt: string;
};

type TagItem = {
  id: string;
  name: string;
  slug: string;
};

type AdminPostsPanelProps = {
  query: string;
  tag: string;
  status?: PostStatus;
  page: number;
  totalPages: number;
  posts: PostItem[];
  tags: TagItem[];
};

export function AdminPostsPanel(props: AdminPostsPanelProps) {
  const router = useRouter();
  const [form] = Form.useForm();

  const onFinish = (values: { query?: string; status?: PostStatus; tag?: string }) => {
    const params = new URLSearchParams();
    if (values.query) params.set("query", values.query.trim());
    if (values.status) params.set("status", values.status);
    if (values.tag) params.set("tag", values.tag);
    params.set("page", "1");
    router.push(`/admin/posts?${params.toString()}`);
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <div className="flex items-center justify-between">
        <Typography.Title level={3} className="!mb-0">
          文章管理
        </Typography.Title>
        <Link href="/admin/posts/new">
          <Button type="primary">新建文章</Button>
        </Link>
      </div>

      <Card>
        <Form
          form={form}
          layout="inline"
          initialValues={{ query: props.query, status: props.status, tag: props.tag }}
          onFinish={onFinish}
        >
          <Form.Item name="query">
            <Input allowClear placeholder="搜索标题或摘要" style={{ width: 240 }} />
          </Form.Item>
          <Form.Item name="status">
            <Select
              allowClear
              placeholder="状态"
              style={{ width: 150 }}
              options={[
                { value: "DRAFT", label: "草稿" },
                { value: "PUBLISHED", label: "已发布" },
                { value: "ARCHIVED", label: "归档" }
              ]}
            />
          </Form.Item>
          <Form.Item name="tag">
            <Select
              allowClear
              showSearch
              placeholder="标签"
              style={{ width: 180 }}
              options={props.tags.map((item) => ({ value: item.slug, label: item.name }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              筛选
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          rowKey="id"
          pagination={false}
          dataSource={props.posts}
          columns={[
            {
              title: "标题",
              key: "title",
              render: (_, row) => (
                <div>
                  <p className="m-0 font-medium">{row.title}</p>
                  <p className="m-0 text-xs text-slate-500">{row.slug}</p>
                </div>
              )
            },
            {
              title: "状态",
              dataIndex: "status",
              key: "status",
              render: (value: PostStatus) => {
                const color = value === "PUBLISHED" ? "green" : value === "DRAFT" ? "blue" : "default";
                return <Tag color={color}>{value}</Tag>;
              }
            },
            {
              title: "标签",
              dataIndex: "tags",
              key: "tags",
              render: (tags: string[]) => (
                <Space wrap>
                  {tags.length === 0 ? <Tag>-</Tag> : null}
                  {tags.map((item) => (
                    <Tag key={item}>{item}</Tag>
                  ))}
                </Space>
              )
            },
            {
              title: "更新时间",
              dataIndex: "updatedAt",
              key: "updatedAt",
              render: (value: string) => new Date(value).toLocaleString()
            },
            {
              title: "操作",
              key: "actions",
              render: (_, row) => <PostActions id={row.id} status={row.status} />
            }
          ]}
        />
        <div className="mt-4 flex justify-end">
          <Pagination
            current={props.page}
            total={props.totalPages * 10}
            pageSize={10}
            onChange={(nextPage) => {
              const params = new URLSearchParams();
              if (props.query) params.set("query", props.query);
              if (props.status) params.set("status", props.status);
              if (props.tag) params.set("tag", props.tag);
              params.set("page", String(nextPage));
              router.push(`/admin/posts?${params.toString()}`);
            }}
          />
        </div>
      </Card>
    </Space>
  );
}
