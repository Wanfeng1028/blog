"use client";

import { useState } from "react";
import { Avatar, Button, Card, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, Upload, message } from "antd";
import { DeleteOutlined, PlusOutlined, MessageOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";
import { useDictionary, useLang } from "@/features/i18n/lang-context";

type MomentItem = {
  id: string;
  content: string;
  images: string[] | null;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
  _count: {
    comments: number;
  };
};

type AdminMomentsPanelProps = {
  moments: MomentItem[];
};

export function AdminMomentsPanel({ moments: initialMoments }: AdminMomentsPanelProps) {
  const dict = useDictionary();
  const lang = useLang().lang;
  const [moments, setMoments] = useState<MomentItem[]>(initialMoments);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMoments = async () => {
    try {
      const response = await fetch("/api/moments?limit=50", { cache: "no-store", headers: { "Cache-Control": "no-cache" } });
      const result = await response.json();
      if (response.ok && result.ok) {
        setMoments(result.data.items);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreate = async () => {
    if (!content.trim()) {
      message.error(dict.moments.contentRequired);
      return;
    }

    setSubmitting(true);
    try {
      const images = fileList
        .filter((f) => f.status === "done" && f.response?.ok)
        .map((f) => f.response.data.url as string);

      const response = await fetch("/api/moments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, images: images.length > 0 ? images : undefined })
      });

      const result = await response.json();
      if (response.ok && result.ok) {
        message.success(dict.moments.publishSuccess);
        setIsModalOpen(false);
        setContent("");
        setFileList([]);
        await fetchMoments();
      } else {
        message.error(result.message || "Failed to create");
      }
    } catch (error) {
      message.error("Failed to create moment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/moments/${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (response.ok && result.ok) {
        message.success(dict.moments.deleteSuccess);
        await fetchMoments();
      } else {
        message.error(result.message || "Failed to delete");
      }
    } catch (error) {
      message.error("Failed to delete moment");
    }
  };

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <div className="flex items-center justify-between">
        <Typography.Title level={3} className="!mb-0">
          {dict.moments.manageTitle}
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
          {dict.moments.addMoment}
        </Button>
      </div>

      <Card className="wanfeng-admin-panel">
        <Table
          rowKey="id"
          pagination={{ pageSize: 10 }}
          dataSource={moments}
          columns={[
            {
              title: "User",
              key: "user",
              width: 120,
              render: (_, row) => (
                <Space>
                  <Avatar src={row.user.image} size="small">
                    {!row.user.image && (row.user.name?.[0] || "?")}
                  </Avatar>
                  <span className="text-sm">{row.user.name || "Admin"}</span>
                </Space>
              )
            },
            {
              title: "Content",
              key: "content",
              render: (_, row) => (
                <div>
                  <p className="m-0 whitespace-pre-wrap text-sm line-clamp-3">{row.content}</p>
                  {row.images && row.images.length > 0 && (
                    <div className="mt-1 flex gap-1">
                      {row.images.map((img, i) => (
                        <img key={i} src={img} alt="" className="h-10 w-10 rounded object-cover border border-slate-200" />
                      ))}
                    </div>
                  )}
                </div>
              )
            },
            {
              title: "Comments",
              key: "comments",
              width: 100,
              render: (_, row) => (
                <Tag icon={<MessageOutlined />} color="blue">
                  {row._count?.comments || 0}
                </Tag>
              )
            },
            {
              title: "Time",
              key: "createdAt",
              width: 180,
              render: (_, row) => (
                <span className="text-xs text-slate-500" suppressHydrationWarning>
                  {new Date(row.createdAt).toLocaleString(lang === "zh" ? "zh-CN" : "en-US")}
                </span>
              )
            },
            {
              title: dict.admin.actions,
              key: "actions",
              width: 100,
              render: (_, row) => (
                <Popconfirm
                  title={dict.moments.deleteConfirm}
                  onConfirm={() => handleDelete(row.id)}
                  okText={dict.common.confirm}
                  cancelText={dict.common.cancel}
                >
                  <Button danger type="text" icon={<DeleteOutlined />} size="small">
                    {dict.common.delete}
                  </Button>
                </Popconfirm>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={dict.moments.addMoment}
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText={dict.moments.publish}
        cancelText={dict.common.cancel}
      >
        <Form layout="vertical">
          <Form.Item required>
            <Input.TextArea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={dict.moments.placeholder}
            />
          </Form.Item>
          <Form.Item label="Images (Optional)">
            <Upload
              action="/api/upload"
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              accept="image/*"
              name="file"
            >
              {fileList.length >= 9 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
