"use client";

import { useState, useTransition } from "react";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Form, Input, Space, Typography, Upload, message } from "antd";

type ProfileData = {
  email: string;
  role: "USER" | "ADMIN";
  createdAt: string;
  name: string | null;
  image: string | null;
  bio: string | null;
  githubUrl: string | null;
  websiteUrl: string | null;
};

export function UserProfilePanel({ profile }: { profile: ProfileData }) {
  const [form] = Form.useForm<{
    name: string;
    bio: string;
    githubUrl: string;
    websiteUrl: string;
    image: string;
  }>();
  const [avatar, setAvatar] = useState(profile.image ?? "");
  const [pending, startTransition] = useTransition();

  const uploadAvatar = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    const response = await fetch("/api/user/avatar", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? "头像上传失败");
      return false;
    }
    const url = result.data.url as string;
    setAvatar(url);
    form.setFieldValue("image", url);
    message.success("头像上传成功");
    return false;
  };

  const save = (values: { name: string; bio: string; githubUrl: string; websiteUrl: string; image: string }) => {
    startTransition(async () => {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        message.error(result.message ?? "保存失败");
        return;
      }
      message.success("资料已更新");
    });
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Card className="wanfeng-user-panel" title="基础信息">
        <Space orientation="vertical" size={6}>
          <Typography.Text>注册邮箱：{profile.email}</Typography.Text>
          <Typography.Text>注册时间：{new Date(profile.createdAt).toLocaleString()}</Typography.Text>
          <Typography.Text>角色：{profile.role}</Typography.Text>
        </Space>
      </Card>

      <Card className="wanfeng-user-panel" title="个人资料">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            name: profile.name ?? "",
            bio: profile.bio ?? "",
            githubUrl: profile.githubUrl ?? "",
            websiteUrl: profile.websiteUrl ?? "",
            image: profile.image ?? ""
          }}
          onFinish={save}
        >
          <Form.Item label="头像">
            <Space align="center">
              <Avatar size={72} src={avatar || undefined} icon={<UserOutlined />} />
              <Upload beforeUpload={uploadAvatar} showUploadList={false} accept="image/png,image/jpeg,image/webp,image/gif">
                <Button icon={<UploadOutlined />}>上传头像</Button>
              </Upload>
            </Space>
          </Form.Item>
          <Form.Item name="image" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="name" label="昵称" rules={[{ required: true, message: "请输入昵称" }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="bio" label="个人简介">
            <Input.TextArea rows={4} maxLength={300} />
          </Form.Item>
          <Form.Item name="githubUrl" label="GitHub 链接">
            <Input placeholder="https://github.com/yourname" />
          </Form.Item>
          <Form.Item name="websiteUrl" label="个人主页">
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={pending}>
              保存资料
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}
