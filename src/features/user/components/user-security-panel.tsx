"use client";

import { useState } from "react";
import { Button, Card, Form, Input, Space, Table, Tag, message } from "antd";

type EventRow = {
  id: string;
  eventType: string;
  success: boolean;
  ip: string | null;
  createdAt: string;
};

export function UserSecurityPanel({ events }: { events: EventRow[] }) {
  const [loading, setLoading] = useState(false);

  const changePassword = async (values: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error("两次输入的新密码不一致");
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
        message.error(result.message ?? "修改密码失败");
        return;
      }
      message.success("密码修改成功");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Card className="wanfeng-user-panel" title="修改密码">
        <Form layout="vertical" onFinish={changePassword}>
          <Form.Item label="当前密码" name="currentPassword" rules={[{ required: true, message: "请输入当前密码" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="新密码"
            name="newPassword"
            rules={[{ required: true, message: "请输入新密码" }, { min: 8, message: "至少 8 位" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label="确认新密码" name="confirmPassword" rules={[{ required: true, message: "请再次输入新密码" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              更新密码
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card className="wanfeng-user-panel" title="最近登录日志">
        <Table
          rowKey="id"
          pagination={{ pageSize: 10 }}
          dataSource={events}
          columns={[
            { title: "事件", dataIndex: "eventType", key: "eventType" },
            {
              title: "状态",
              dataIndex: "success",
              key: "success",
              render: (value: boolean) => <Tag color={value ? "success" : "error"}>{value ? "成功" : "失败"}</Tag>
            },
            { title: "IP", dataIndex: "ip", key: "ip", render: (value: string | null) => value ?? "-" },
            {
              title: "时间",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (value: string) => new Date(value).toLocaleString()
            }
          ]}
        />
      </Card>
    </Space>
  );
}
