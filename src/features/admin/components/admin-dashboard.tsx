"use client";

import {
  AlertOutlined,
  FileTextOutlined,
  MessageOutlined,
  ProjectOutlined,
  TagsOutlined,
  TeamOutlined
} from "@ant-design/icons";
import { Card, Col, Row, Space, Statistic, Table, Tag, Typography } from "antd";

type DashboardProps = {
  overview: {
    users: number;
    posts: number;
    comments: number;
    tags: number;
    projects: number;
    publishedPosts: number;
    securityAlerts: number;
    failedLogins: number;
  };
  latestUsers: Array<{
    id: string;
    name: string | null;
    email: string;
    role: "ADMIN" | "USER";
    createdAt: string;
  }>;
  latestEvents: Array<{
    id: string;
    event_type: string;
    success: boolean;
    email: string | null;
    created_at: string;
  }>;
};

export function AdminDashboard({ overview, latestUsers, latestEvents }: DashboardProps) {
  const cards = [
    { title: "总用户数", value: overview.users, icon: <TeamOutlined />, color: "from-cyan-400 to-sky-500" },
    { title: "文章总数", value: overview.posts, icon: <FileTextOutlined />, color: "from-emerald-400 to-teal-500" },
    { title: "项目总数", value: overview.projects, icon: <ProjectOutlined />, color: "from-violet-400 to-purple-500" },
    { title: "标签总数", value: overview.tags, icon: <TagsOutlined />, color: "from-amber-400 to-orange-500" },
    { title: "评论总数", value: overview.comments, icon: <MessageOutlined />, color: "from-pink-400 to-rose-500" },
    { title: "已发布文章", value: overview.publishedPosts, icon: <FileTextOutlined />, color: "from-blue-400 to-cyan-500" },
    { title: "安全告警", value: overview.securityAlerts, icon: <AlertOutlined />, color: "from-red-400 to-rose-500" },
    { title: "登录失败", value: overview.failedLogins, icon: <AlertOutlined />, color: "from-slate-400 to-slate-600" }
  ];

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Card className="wanfeng-admin-panel !rounded-2xl !border-cyan-100 !bg-gradient-to-r !from-cyan-500 !to-sky-500">
        <Typography.Title level={3} className="!mb-1 !text-white">
          早上好，系统管理员
        </Typography.Title>
        <Typography.Text className="!text-cyan-50">
          这里是晚风博客后台概览，你可以在这里快速查看全站运行状态。
        </Typography.Text>
      </Card>

      <Row gutter={[14, 14]}>
        {cards.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.title}>
            <Card className="wanfeng-admin-panel">
              <div className={`mb-3 inline-flex rounded-lg bg-gradient-to-r px-2 py-1 text-white ${item.color}`}>
                {item.icon}
              </div>
              <Statistic title={item.title} value={item.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="wanfeng-admin-panel" title="最近注册用户">
            <div className="divide-y divide-slate-100">
              {latestUsers.map((user) => (
                <div key={user.id} className="flex flex-col gap-0.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{user.name ?? "未命名用户"}</span>
                    <Tag color={user.role === "ADMIN" ? "gold" : "blue"}>{user.role}</Tag>
                  </div>
                  <div className="text-sm text-slate-600">{user.email}</div>
                  <div className="text-xs text-slate-400">{new Date(user.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="wanfeng-admin-panel" title="最近认证事件">
            <Table
              rowKey="id"
              pagination={false}
              size="small"
              dataSource={latestEvents}
              columns={[
                { title: "事件", dataIndex: "event_type", key: "event_type" },
                {
                  title: "状态",
                  dataIndex: "success",
                  key: "success",
                  render: (value: boolean) => <Tag color={value ? "success" : "error"}>{value ? "成功" : "失败"}</Tag>
                },
                { title: "邮箱", dataIndex: "email", key: "email", render: (v: string | null) => v ?? "-" },
                {
                  title: "时间",
                  dataIndex: "created_at",
                  key: "created_at",
                  render: (value: string) => new Date(value).toLocaleString()
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
