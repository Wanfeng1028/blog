"use client";

import { useState } from "react";
import { Button, Card, Form, Input, Space, Table, Tag, message } from "antd";
import { useLang } from "@/features/i18n/lang-context";

type EventRow = {
  id: string;
  eventType: string;
  success: boolean;
  ip: string | null;
  createdAt: string;
};

export function UserSecurityPanel({ events }: { events: EventRow[] }) {
  const [loading, setLoading] = useState(false);
  const { lang, dictionary } = useLang();
  const dict = dictionary!;

  const changePassword = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error(dict.userDashboard.passwordMismatch);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/user/security/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        message.error(result.message ?? dict.userDashboard.updatePasswordFail);
        return;
      }
      message.success(dict.userDashboard.updatePasswordSuccess);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Card className="wanfeng-user-panel" title={dict.userDashboard.changePassword}>
        <Form layout="vertical" onFinish={changePassword}>
          <Form.Item label={dict.userDashboard.currentPassword} name="currentPassword" rules={[{ required: true, message: dict.userDashboard.currentPasswordRequired }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            label={dict.userDashboard.newPassword2}
            name="newPassword"
            rules={[{ required: true, message: dict.userDashboard.newPasswordRequired }, { min: 8, message: dict.userDashboard.passwordMinLength }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label={dict.userDashboard.confirmNewPassword2} name="confirmPassword" rules={[{ required: true, message: dict.userDashboard.confirmNewPasswordRequired }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              {dict.userDashboard.updatePassword}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="wanfeng-user-panel" title={dict.userDashboard.recentLoginLogs}>
        <Table
          rowKey="id"
          pagination={{ pageSize: 10 }}
          dataSource={events}
          columns={[
            { title: dict.userDashboard.event, dataIndex: "eventType", key: "eventType" },
            {
              title: dict.userDashboard.status,
              dataIndex: "success",
              key: "success",
              render: (value: boolean) => <Tag color={value ? "success" : "error"}>{value ? dict.userDashboard.success : dict.userDashboard.fail}</Tag>
            },
            { title: dict.userDashboard.ip, dataIndex: "ip", key: "ip", render: (value: string | null) => value ?? "-" },
            {
              title: dict.userDashboard.time,
              dataIndex: "createdAt",
              key: "createdAt",
              render: (value: string) => new Date(value).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")
            }
          ]}
        />
      </Card>
    </Space>
  );
}
