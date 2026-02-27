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
import { useDictionary } from "@/features/i18n/lang-context";

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
  const dict = useDictionary();

  const cards = [
    { title: dict.admin.totalUsers, value: overview.users, icon: <TeamOutlined />, color: "bg-sky-500" },
    { title: dict.admin.totalPosts, value: overview.posts, icon: <FileTextOutlined />, color: "bg-teal-600" },
    { title: dict.admin.totalProjects, value: overview.projects, icon: <ProjectOutlined />, color: "bg-slate-500" },
    { title: dict.admin.totalTags, value: overview.tags, icon: <TagsOutlined />, color: "bg-amber-500" },
    { title: dict.admin.totalComments, value: overview.comments, icon: <MessageOutlined />, color: "bg-rose-400" },
    { title: dict.admin.publishedPosts, value: overview.publishedPosts, icon: <FileTextOutlined />, color: "bg-cyan-600" },
    { title: dict.admin.securityAlerts, value: overview.securityAlerts, icon: <AlertOutlined />, color: "bg-red-500" },
    { title: dict.admin.failedLogins, value: overview.failedLogins, icon: <AlertOutlined />, color: "bg-slate-400" }
  ];

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Card className="wanfeng-admin-panel !rounded-2xl !border-teal-700/30 !bg-teal-600">
        <Typography.Title level={3} className="!mb-1 !text-black/90">
          {dict.admin.welcomeAdmin}
        </Typography.Title>
        <Typography.Text className="!text-black/90">
          {dict.admin.adminOverview}
        </Typography.Text>
      </Card>

      <Row gutter={[14, 14]}>
        {cards.map((item) => (
          <Col xs={24} sm={12} lg={6} key={item.title}>
            <Card className="wanfeng-admin-panel">
              <div className={`mb-3 inline-flex rounded-lg px-2 py-1 text-white ${item.color}`}>
                {item.icon}
              </div>
              <Statistic title={item.title} value={item.value} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="wanfeng-admin-panel" title={dict.admin.recentUsers}>
            <div className="divide-y divide-slate-100">
              {latestUsers.map((user) => (
                <div key={user.id} className="flex flex-col gap-0.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-800">{user.name ?? dict.admin.unnamedUser}</span>
                    <Tag color={user.role === "ADMIN" ? "gold" : "blue"}>{user.role === "ADMIN" ? dict.admin.adminRole : dict.admin.userRole}</Tag>
                  </div>
                  <div className="text-sm text-slate-600">{user.email}</div>
                  <div className="text-xs text-slate-400">{new Date(user.createdAt).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card className="wanfeng-admin-panel" title={dict.admin.recentAuthEvents}>
            <Table
              rowKey="id"
              pagination={false}
              size="small"
              dataSource={latestEvents}
              columns={[
                { title: dict.admin.event, dataIndex: "event_type", key: "event_type" },
                {
                  title: dict.admin.status,
                  dataIndex: "success",
                  key: "success",
                  render: (value: boolean) => <Tag color={value ? "success" : "error"}>{value ? dict.admin.success : dict.admin.fail}</Tag>
                },
                { title: dict.admin.email, dataIndex: "email", key: "email", render: (v: string | null) => v ?? "-" },
                {
                  title: dict.admin.time,
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
