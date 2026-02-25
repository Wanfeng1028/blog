"use client";

import { useMemo, useState } from "react";
import { Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Space, Table, Tag, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { ProjectMarkdownEditor } from "@/features/admin/components/project-markdown-editor";

type ProjectRow = {
  id: string;
  order: number;
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  period: string;
  summary: string;
  highlights: string[];
  techStack: string[];
  githubUrl: string | null;
  demoUrl: string | null;
  sourceRepo: string | null;
  content: string | null;
  likesCount: number;
  viewsCount: number;
  updatedAt: string;
};

type ProjectFormValues = {
  id?: string;
  order: number;
  title: string;
  subtitle: string;
  role: string;
  period: string;
  summary: string;
  highlightsText: string;
  techStackText: string;
  githubUrl?: string;
  demoUrl?: string;
  sourceRepo?: string;
  content?: string;
};

function toPayload(values: ProjectFormValues) {
  return {
    id: values.id,
    order: values.order,
    title: values.title.trim(),
    subtitle: values.subtitle.trim(),
    role: values.role.trim(),
    period: values.period.trim(),
    summary: values.summary.trim(),
    highlights: values.highlightsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean),
    techStack: values.techStackText
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
    githubUrl: values.githubUrl?.trim() || "",
    demoUrl: values.demoUrl?.trim() || "",
    sourceRepo: values.sourceRepo?.trim() || "",
    content: values.content ?? ""
  };
}

export function AdminProjectsPanel({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [syncingReadme, setSyncingReadme] = useState(false);
  const [form] = Form.useForm<ProjectFormValues>();

  /** Parse a GitHub URL or bare "owner/repo" string into "owner/repo" */
  function parseGithubRepo(input: string): string | null {
    const trimmed = input.trim();
    try {
      const url = new URL(trimmed);
      if (!url.hostname.includes("github.com")) return null;
      const parts = url.pathname.split("/").filter(Boolean);
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
    } catch {
      const parts = trimmed.split("/").filter(Boolean);
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
    }
  }

  /** Fetch README from GitHub and fill the content editor */
  const syncReadme = async () => {
    const githubUrl = form.getFieldValue("githubUrl") as string;
    const repo = parseGithubRepo(githubUrl ?? "");
    if (!repo) {
      message.warning("请先填写有效的 GitHub 仓库地址（如 https://github.com/owner/repo）");
      return;
    }
    setSyncingReadme(true);
    try {
      const res = await fetch(`/api/admin/projects/readme?repo=${encodeURIComponent(githubUrl ?? repo)}`);
      const result = await res.json();
      if (!res.ok || !result.ok) {
        message.error(result.message ?? "获取 README 失败");
        return;
      }
      form.setFieldValue("content", result.data.content as string);
      message.success(`README 已同步（${String(result.data.content).length.toLocaleString()} 字符）`);
    } catch {
      message.error("网络错误，请稍后重试");
    } finally {
      setSyncingReadme(false);
    }
  };

  const maxOrder = useMemo(
    () => (projects.length ? Math.max(...projects.map((item) => item.order)) : 0),
    [projects]
  );

  const refreshProjects = async () => {
    const response = await fetch("/api/projects?mode=admin");
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.message ?? "加载项目失败");
    }
    setProjects(result.data as ProjectRow[]);
  };

  const onCreate = () => {
    setEditingId(null);
    form.setFieldsValue({
      order: maxOrder + 1,
      title: "",
      subtitle: "",
      role: "",
      period: "",
      summary: "",
      highlightsText: "",
      techStackText: "",
      githubUrl: "",
      demoUrl: "",
      sourceRepo: "",
      content: ""
    });
    setOpen(true);
  };

  const onEdit = (row: ProjectRow) => {
    setEditingId(row.id);
    form.setFieldsValue({
      id: row.id,
      order: row.order,
      title: row.title,
      subtitle: row.subtitle,
      role: row.role,
      period: row.period,
      summary: row.summary,
      highlightsText: row.highlights.join("\n"),
      techStackText: row.techStack.join(", "),
      githubUrl: row.githubUrl ?? "",
      demoUrl: row.demoUrl ?? "",
      sourceRepo: row.sourceRepo ?? "",
      content: row.content ?? ""
    });
    setOpen(true);
  };

  const onDelete = async (id: string) => {
    const response = await fetch("/api/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "删除失败");
      return;
    }
    await refreshProjects();
    message.success("项目已删除");
  };

  const onSubmit = async () => {
    const values = await form.validateFields();
    const payload = toPayload(values);
    setSaving(true);
    try {
      const isEdit = Boolean(editingId);
      const response = await fetch("/api/projects", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        message.error(result.message ?? "保存失败");
        return;
      }
      await refreshProjects();
      setOpen(false);
      message.success(isEdit ? "项目已更新" : "项目已创建");
    } finally {
      setSaving(false);
    }
  };

  const columns: ColumnsType<ProjectRow> = [
    { title: "序号", dataIndex: "order", key: "order", width: 72 },
    {
      title: "项目",
      key: "project",
      render: (_, row) => (
        <div>
          <p className="m-0 font-medium">{row.title}</p>
          <p className="m-0 text-xs text-slate-500">{row.slug}</p>
        </div>
      )
    },
    { title: "角色", dataIndex: "role", key: "role", width: 180 },
    { title: "周期", dataIndex: "period", key: "period", width: 160 },
    {
      title: "技术栈",
      dataIndex: "techStack",
      key: "techStack",
      render: (value: string[]) => (
        <Space wrap>
          {value.slice(0, 4).map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
          {value.length > 4 ? <Tag>+{value.length - 4}</Tag> : null}
        </Space>
      )
    },
    {
      title: "统计",
      key: "stats",
      width: 140,
      render: (_, row) => (
        <div className="text-xs text-slate-600">
          <div>赞 {row.likesCount}</div>
          <div>浏览 {row.viewsCount}</div>
        </div>
      )
    },
    {
      title: "操作",
      key: "actions",
      width: 220,
      render: (_, row) => (
        <Space wrap>
          <Button size="small" onClick={() => onEdit(row)}>
            编辑
          </Button>
          <a href={`/projects/${row.slug}`} target="_blank" rel="noreferrer">
            <Button size="small">预览</Button>
          </a>
          <Popconfirm title="确认删除该项目？" okText="确认" cancelText="取消" onConfirm={() => onDelete(row.id)}>
            <Button danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <Card
      title={<Typography.Text strong>项目管理 CRUD</Typography.Text>}
      extra={
        <Button type="primary" onClick={onCreate}>
          新建项目
        </Button>
      }
    >
      <Table<ProjectRow> rowKey="id" columns={columns} dataSource={projects} pagination={{ pageSize: 8 }} />

      <Modal
        title={editingId ? "编辑项目" : "新建项目"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={onSubmit}
        okText={editingId ? "保存修改" : "创建项目"}
        confirmLoading={saving}
        width={880}
      >
        <Form layout="vertical" form={form}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Space className="w-full" align="start" size={12}>
            <Form.Item name="order" label="序号" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item className="flex-1" name="title" label="项目标题" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="subtitle" label="副标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space className="w-full" align="start" size={12}>
            <Form.Item className="flex-1" name="role" label="你的角色" rules={[{ required: true }]}>
              <Input placeholder="例如：全栈开发 / 项目负责人" />
            </Form.Item>
            <Form.Item className="flex-1" name="period" label="项目周期" rules={[{ required: true }]}>
              <Input placeholder="例如：2024-03 ~ 2025-06" />
            </Form.Item>
          </Space>
          <Form.Item name="summary" label="摘要" rules={[{ required: true }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="highlightsText" label="亮点（每行一条）" rules={[{ required: true }]}>
            <Input.TextArea rows={5} />
          </Form.Item>
          <Form.Item
            name="techStackText"
            label="技术栈（逗号分隔）"
            rules={[{ required: true }]}
            extra="示例：Next.js, TypeScript, PostgreSQL"
          >
            <Input />
          </Form.Item>
          <Space className="w-full" align="start" size={12}>
            <Form.Item className="flex-1" name="githubUrl" label="GitHub 链接">
              <Input />
            </Form.Item>
            <Form.Item className="flex-1" name="demoUrl" label="Demo 链接">
              <Input />
            </Form.Item>
          </Space>
          <Form.Item name="sourceRepo" label="仓库名（可选）">
            <Input placeholder="例如：wanfeng-blog-web" />
          </Form.Item>

          {/* ── Markdown content editor ── */}
          <div className="mb-2 mt-4 flex items-center justify-between">
            <Typography.Text strong>项目详情（Markdown）</Typography.Text>
            <Button
              size="small"
              loading={syncingReadme}
              onClick={syncReadme}
              title="根据上方 GitHub 链接，自动拉取仓库的 README.md 填入编辑器"
            >
              ⬇️ 一键同步 README
            </Button>
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: "block", marginBottom: 8 }}>
            填写后将在项目详情页以 GitHub 风格渲染，留空则继续展示摘要与亮点列表。
          </Typography.Text>
          <Form.Item name="content" noStyle>
            <ProjectMarkdownEditor />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
