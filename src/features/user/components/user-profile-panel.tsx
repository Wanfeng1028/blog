"use client";

import { useState, useTransition } from "react";
import { UploadOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Card, Form, Input, Space, Typography, Upload, message } from "antd";
import { useLang } from "@/features/i18n/lang-context";

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
  const { lang, dictionary } = useLang();
  const dict = dictionary!;

  const uploadAvatar = async (file: File) => {
    const data = new FormData();
    data.append("file", file);
    const response = await fetch("/api/user/avatar", { method: "POST", body: data });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      message.error(result.message ?? dict.userDashboard.updateProfileFail);
      return false;
    }
    const url = result.data.url as string;
    setAvatar(url);
    form.setFieldValue("image", url);
    message.success(dict.userDashboard.updateProfileSuccess);
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
        message.error(result.message ?? dict.userDashboard.updateProfileFail);
        return;
      }
      message.success(dict.userDashboard.updateProfileSuccess);
    });
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <Card className="wanfeng-user-panel" title={dict.userDashboard.basicInfo}>
        <Space orientation="vertical" size={6}>
          <Typography.Text>{dict.userDashboard.registerEmail}{profile.email}</Typography.Text>
          <Typography.Text>{dict.userDashboard.registerTime}{new Date(profile.createdAt).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}</Typography.Text>
          <Typography.Text>{dict.userDashboard.role}{profile.role === "ADMIN" ? dict.admin.adminRole : dict.admin.userRole}</Typography.Text>
        </Space>
      </Card>

      <Card className="wanfeng-user-panel" title={dict.userDashboard.profile}>
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
          <Form.Item label={dict.userDashboard.avatar}>
            <Space align="center">
              <Avatar size={72} src={avatar || undefined} icon={<UserOutlined />} />
              <Upload beforeUpload={uploadAvatar} showUploadList={false} accept="image/png,image/jpeg,image/webp,image/gif">
                <Button icon={<UploadOutlined />}>{dict.userDashboard.uploadAvatar}</Button>
              </Upload>
            </Space>
          </Form.Item>
          <Form.Item name="image" hidden>
            <Input />
          </Form.Item>

          <Form.Item name="name" label={dict.userDashboard.nickname} rules={[{ required: true, message: dict.userDashboard.nicknameRequired }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item name="bio" label={dict.userDashboard.bio}>
            <Input.TextArea rows={4} maxLength={300} />
          </Form.Item>
          <Form.Item name="githubUrl" label={dict.userDashboard.githubUrl}>
            <Input placeholder="https://github.com/yourname" />
          </Form.Item>
          <Form.Item name="websiteUrl" label={dict.userDashboard.websiteUrl}>
            <Input placeholder="https://example.com" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={pending}>
              {dict.userDashboard.saveProfile}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
}
