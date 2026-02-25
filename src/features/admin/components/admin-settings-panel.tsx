"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Form, Input, Select, Space, Table, Tag, Typography, message } from "antd";

type UserItem = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

type CommentItem = {
  id: string;
  content: string;
  status: string;
  postTitle: string;
  userName: string;
  userEmail: string;
};

type AlertItem = {
  id: string;
  severity: string;
  message: string;
  email: string | null;
  createdAt: string;
};

type MessageItem = {
  id: string;
  name: string;
  email: string | null;
  content: string;
  status: "VISIBLE" | "HIDDEN" | "DELETED" | "PENDING";
  createdAt: string;
};

type FriendLinkItem = {
  id: string;
  avatarUrl: string;
  name: string;
  email: string;
  siteName: string;
  siteUrl: string;
  description: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

type DonationItem = {
  id: string;
  name: string;
  email: string | null;
  amount: number;
  message: string | null;
  paymentMethod: string;
  status: "PENDING" | "CONFIRMED" | "REJECTED";
  createdAt: string;
};

type SiteSettings = {
  bgmEnabled: boolean;
  bgmSrc: string;
  aboutContent: string;
};

type AdminSettingsPanelProps = {
  users: UserItem[];
  comments: CommentItem[];
  alerts: AlertItem[];
  messages: MessageItem[];
  friendLinks: FriendLinkItem[];
  donations: DonationItem[];
  siteSettings: SiteSettings;
};

export function AdminSettingsPanel({
  users,
  comments,
  alerts,
  messages,
  friendLinks,
  donations,
  siteSettings
}: AdminSettingsPanelProps) {
  const router = useRouter();
  const [userForm] = Form.useForm();
  const [siteForm] = Form.useForm<SiteSettings>();
  const [friendForm] = Form.useForm();

  const [messageList, setMessageList] = useState(messages);
  const [friendLinkList, setFriendLinkList] = useState(friendLinks);
  const [donationList, setDonationList] = useState(donations);
  const [savingSettings, setSavingSettings] = useState(false);

  const createUser = async (values: { name?: string; email: string; password: string; role: "ADMIN" | "USER" }) => {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values)
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "创建用户失败");
      return;
    }
    message.success("用户创建成功");
    userForm.resetFields();
    router.refresh();
  };

  const saveSiteSettings = async () => {
    const values = await siteForm.validateFields();
    setSavingSettings(true);
    try {
      const response = await fetch("/api/admin/users?mode=site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        message.error(result.message ?? "保存站点设置失败");
        return;
      }
      message.success("站点设置已保存，前台已实时生效");
      router.refresh();
    } finally {
      setSavingSettings(false);
    }
  };

  const createFriendLink = async (values: {
    avatarUrl: string;
    name: string;
    email: string;
    siteName: string;
    siteUrl: string;
    description: string;
  }) => {
    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "friend-link-admin",
        ...values
      })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "新增友链失败");
      return;
    }
    message.success("友链已新增并通过审核");
    friendForm.resetFields();
    router.refresh();
  };

  const updateMessageStatus = async (id: string, status: "VISIBLE" | "HIDDEN" | "DELETED") => {
    const response = await fetch(`/api/comments/${id}?mode=message`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "留言状态更新失败");
      return;
    }
    setMessageList((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    message.success("留言状态已更新");
  };

  const deleteMessage = async (id: string) => {
    const response = await fetch(`/api/comments/${id}?mode=message`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "删除留言失败");
      return;
    }
    setMessageList((prev) => prev.filter((item) => item.id !== id));
    message.success("留言已删除");
  };

  const updateFriendLinkStatus = async (id: string, status: "PENDING" | "APPROVED" | "REJECTED") => {
    const response = await fetch(`/api/comments/${id}?mode=friend-link`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ friendLinkStatus: status })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "友链状态更新失败");
      return;
    }
    setFriendLinkList((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    message.success("友链状态已更新");
  };

  const deleteFriendLink = async (id: string) => {
    const response = await fetch(`/api/comments/${id}?mode=friend-link`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "删除友链失败");
      return;
    }
    setFriendLinkList((prev) => prev.filter((item) => item.id !== id));
    message.success("友链已删除");
  };

  const updateDonationStatus = async (id: string, status: "PENDING" | "CONFIRMED" | "REJECTED") => {
    const response = await fetch(`/api/comments/${id}?mode=donation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donationStatus: status })
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "打赏状态更新失败");
      return;
    }
    setDonationList((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));
    message.success("打赏状态已更新");
  };

  const deleteDonation = async (id: string) => {
    const response = await fetch(`/api/comments/${id}?mode=donation`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "删除打赏记录失败");
      return;
    }
    setDonationList((prev) => prev.filter((item) => item.id !== id));
    message.success("打赏记录已删除");
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Typography.Title level={3} className="!mb-0 !text-slate-800">
        站点设置与互动管理
      </Typography.Title>

      <Card className="wanfeng-admin-panel" title="站点设置持久化（前台实时生效）">
        <Form
          form={siteForm}
          layout="vertical"
          initialValues={siteSettings}
          onFinish={saveSiteSettings}
          className="grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          <Form.Item
            name="bgmSrc"
            label="背景音乐路径（当前值）"
            tooltip="通过上方「BGM 音乐管理」面板一键切换时自动同步；也可在此手动输入外部音频 URL 后保存。"
          >
            <Input placeholder="/audio/home.mp3 或 https://cdn.example.com/xxx.mp3" />
          </Form.Item>
          <Form.Item name="bgmEnabled" label="默认开启 BGM">
            <Select
              options={[
                { label: "开启", value: true },
                { label: "关闭", value: false }
              ]}
            />
          </Form.Item>
          <Form.Item name="aboutContent" label="关于我内容（前台 About 页面）" className="lg:col-span-2">
            <Input.TextArea rows={8} placeholder="在这里维护关于我内容，保存后前台 About 页面实时更新。" />
          </Form.Item>
          <Form.Item className="lg:col-span-2 !mb-0">
            <Button type="primary" htmlType="submit" loading={savingSettings}>
              保存站点设置
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="wanfeng-admin-panel" title="创建后台用户">
        <Form form={userForm} layout="inline" onFinish={createUser}>
          <Form.Item name="name">
            <Input placeholder="用户名（可选）" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: "请输入邮箱" }]}>
            <Input placeholder="邮箱" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "请输入密码" }]}>
            <Input.Password placeholder="密码" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="role" initialValue="USER">
            <Select style={{ width: 120 }} options={[{ label: "USER", value: "USER" }, { label: "ADMIN", value: "ADMIN" }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              新增用户
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="wanfeng-admin-panel" title="友链管理（后台新增）">
        <Form form={friendForm} layout="inline" onFinish={createFriendLink}>
          <Form.Item name="avatarUrl" rules={[{ required: true, message: "请输入头像链接" }]}>
            <Input placeholder="头像链接 https://..." style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="name" rules={[{ required: true, message: "请输入昵称" }]}>
            <Input placeholder="昵称" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: "请输入邮箱" }]}>
            <Input placeholder="邮箱" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="siteName" rules={[{ required: true, message: "请输入站点名" }]}>
            <Input placeholder="站点名" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="siteUrl" rules={[{ required: true, message: "请输入站点链接" }]}>
            <Input placeholder="站点链接 https://..." style={{ width: 220 }} />
          </Form.Item>
          <Form.Item name="description" rules={[{ required: true, message: "请输入简介" }]}>
            <Input placeholder="简介" style={{ width: 220 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              新增并通过
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="wanfeng-admin-panel" title="友链申请审核">
        <Table
          rowKey="id"
          pagination={{ pageSize: 8 }}
          dataSource={friendLinkList}
          columns={[
            { title: "昵称", dataIndex: "name", key: "name" },
            { title: "邮箱", dataIndex: "email", key: "email" },
            { title: "站点", dataIndex: "siteName", key: "siteName" },
            { title: "简介", dataIndex: "description", key: "description" },
            {
              title: "状态",
              dataIndex: "status",
              key: "status",
              render: (value: string) => (
                <Tag color={value === "APPROVED" ? "green" : value === "PENDING" ? "orange" : "default"}>{value}</Tag>
              )
            },
            {
              title: "操作",
              key: "actions",
              render: (_, row) => (
                <Space>
                  <Button size="small" onClick={() => updateFriendLinkStatus(row.id, "APPROVED")}>
                    通过
                  </Button>
                  <Button size="small" onClick={() => updateFriendLinkStatus(row.id, "REJECTED")}>
                    拒绝
                  </Button>
                  <Button danger size="small" onClick={() => deleteFriendLink(row.id)}>
                    删除
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Card className="wanfeng-admin-panel" title="用户管理">
        <Table
          rowKey="id"
          pagination={{ pageSize: 8 }}
          dataSource={users}
          columns={[
            { title: "用户名", dataIndex: "name", key: "name", render: (v: string | null) => v ?? "-" },
            { title: "邮箱", dataIndex: "email", key: "email" },
            { title: "角色", dataIndex: "role", key: "role", render: (value: "ADMIN" | "USER") => <Tag color={value === "ADMIN" ? "gold" : "blue"}>{value}</Tag> },
            { title: "注册时间", dataIndex: "createdAt", key: "createdAt", render: (value: string) => new Date(value).toLocaleString() }
          ]}
        />
      </Card>

      <Card className="wanfeng-admin-panel" title="评论管理（只读）">
        <Table
          rowKey="id"
          pagination={{ pageSize: 6 }}
          dataSource={comments}
          columns={[
            { title: "评论内容", dataIndex: "content", key: "content" },
            { title: "状态", dataIndex: "status", key: "status" },
            { title: "文章", dataIndex: "postTitle", key: "postTitle" },
            { title: "用户", key: "user", render: (_, row) => `${row.userName || "-"} (${row.userEmail})` }
          ]}
        />
      </Card>

      <Card className="wanfeng-admin-panel" title="留言管理">
        <Table
          rowKey="id"
          pagination={{ pageSize: 8 }}
          dataSource={messageList}
          columns={[
            { title: "昵称", dataIndex: "name", key: "name" },
            { title: "邮箱", dataIndex: "email", key: "email", render: (v: string | null) => v ?? "-" },
            { title: "内容", dataIndex: "content", key: "content" },
            { title: "状态", dataIndex: "status", key: "status", render: (value: string) => <Tag>{value}</Tag> },
            { title: "时间", dataIndex: "createdAt", key: "createdAt", render: (value: string) => new Date(value).toLocaleString() },
            {
              title: "操作",
              key: "actions",
              render: (_, row) => (
                <Space>
                  <Button size="small" onClick={() => updateMessageStatus(row.id, "VISIBLE")}>
                    显示
                  </Button>
                  <Button size="small" onClick={() => updateMessageStatus(row.id, "HIDDEN")}>
                    隐藏
                  </Button>
                  <Button danger size="small" onClick={() => deleteMessage(row.id)}>
                    删除
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Card className="wanfeng-admin-panel" title="打赏记录管理">
        <Table
          rowKey="id"
          pagination={{ pageSize: 8 }}
          dataSource={donationList}
          columns={[
            { title: "昵称", dataIndex: "name", key: "name" },
            { title: "邮箱", dataIndex: "email", key: "email", render: (v: string | null) => v ?? "-" },
            { title: "金额", dataIndex: "amount", key: "amount", render: (value: number) => `¥${value.toFixed(2)}` },
            { title: "方式", dataIndex: "paymentMethod", key: "paymentMethod" },
            { title: "留言", dataIndex: "message", key: "message", render: (v: string | null) => v ?? "-" },
            { title: "状态", dataIndex: "status", key: "status", render: (value: string) => <Tag>{value}</Tag> },
            { title: "时间", dataIndex: "createdAt", key: "createdAt", render: (value: string) => new Date(value).toLocaleString() },
            {
              title: "操作",
              key: "actions",
              render: (_, row) => (
                <Space>
                  <Button size="small" onClick={() => updateDonationStatus(row.id, "CONFIRMED")}>
                    确认
                  </Button>
                  <Button size="small" onClick={() => updateDonationStatus(row.id, "REJECTED")}>
                    拒绝
                  </Button>
                  <Button danger size="small" onClick={() => deleteDonation(row.id)}>
                    删除
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Card className="wanfeng-admin-panel" title="安全告警">
        <Table
          rowKey="id"
          pagination={{ pageSize: 6 }}
          dataSource={alerts}
          columns={[
            { title: "等级", dataIndex: "severity", key: "severity", render: (value: string) => <Tag>{value}</Tag> },
            { title: "消息", dataIndex: "message", key: "message" },
            { title: "账号", dataIndex: "email", key: "email", render: (value: string | null) => value ?? "-" },
            { title: "时间", dataIndex: "createdAt", key: "createdAt", render: (value: string) => new Date(value).toLocaleString() }
          ]}
        />
      </Card>
    </Space>
  );
}
