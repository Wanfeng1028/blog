"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  Popconfirm,
  Progress,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message
} from "antd";
import { CloudUploadOutlined, DeleteOutlined, PauseCircleOutlined, PlayCircleOutlined } from "@ant-design/icons";

export type BgmRecord = {
  id: string;
  original_name: string;
  file_path: string;
  is_active: boolean;
  upload_time: string;
};

export function AdminBgmPanel({ initialRecords }: { initialRecords: BgmRecord[] }) {
  const [records, setRecords] = useState<BgmRecord[]>(initialRecords);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activating, setActivating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount
  useEffect(() => () => stopPreview(), []);

  /* ── helpers ── */

  const refreshRecords = async () => {
    const res = await fetch("/api/admin/bgm");
    const result = await res.json();
    if (result.ok) setRecords(result.data as BgmRecord[]);
  };

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPlayingId(null);
  };

  /* ── upload ── */

  const doUpload = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["mp3", "wav", "ogg", "flac", "aac", "m4a"];
    if (!allowed.includes(ext)) {
      message.error("不支持的格式，仅允许 MP3 / WAV / OGG / FLAC / AAC / M4A");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error("文件大小不能超过 10 MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      setUploading(false);
      setUploadProgress(0);
      try {
        const result = JSON.parse(xhr.responseText);
        if (result.ok) {
          message.success("✅ 上传成功");
          refreshRecords();
        } else {
          message.error(result.message ?? "上传失败");
        }
      } catch {
        message.error("上传失败，服务器响应异常");
      }
    });
    xhr.addEventListener("error", () => {
      setUploading(false);
      setUploadProgress(0);
      message.error("网络错误，上传失败");
    });

    setUploading(true);
    setUploadProgress(0);
    xhr.open("POST", "/api/admin/bgm");
    xhr.send(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) doUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) doUpload(file);
  };

  /* ── actions ── */

  const setActive = async (id: string) => {
    setActivating(id);
    try {
      const res = await fetch(`/api/admin/bgm/${id}`, { method: "PATCH" });
      const result = await res.json();
      if (!res.ok || !result.ok) { message.error(result.message ?? "切换失败"); return; }
      setRecords((prev) => prev.map((r) => ({ ...r, is_active: r.id === id })));
      message.success("🎵 已设为当前 BGM，前台即刻生效！");
    } finally {
      setActivating(null);
    }
  };

  const deleteRecord = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/bgm/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.ok) { message.error(result.message ?? "删除失败"); return; }
      if (playingId === id) stopPreview();
      await refreshRecords();
      message.success("已删除");
    } finally {
      setDeleting(null);
    }
  };

  const togglePreview = (row: BgmRecord) => {
    if (playingId === row.id) { stopPreview(); return; }
    stopPreview();
    const audio = new Audio(row.file_path);
    audio.addEventListener("ended", () => setPlayingId(null));
    audio.play().catch(() => message.error("播放失败，请检查文件路径"));
    audioRef.current = audio;
    setPlayingId(row.id);
  };

  /* ── columns ── */

  const columns = [
    {
      title: "文件名",
      dataIndex: "original_name",
      key: "name",
      render: (name: string, row: BgmRecord) => (
        <Space>
          {row.is_active && <Tag color="success">当前使用中</Tag>}
          <span className="font-medium">{name}</span>
        </Space>
      )
    },
    {
      title: "上传时间",
      dataIndex: "upload_time",
      key: "time",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN")
    },
    {
      title: "操作",
      key: "actions",
      width: 300,
      render: (_: unknown, row: BgmRecord) => (
        <Space size={6}>
          {!row.is_active && (
            <Tooltip title="设为首页背景音乐并立即生效">
              <Button
                size="small"
                type="primary"
                loading={activating === row.id}
                onClick={() => setActive(row.id)}
              >
                设为首页 BGM
              </Button>
            </Tooltip>
          )}
          <Tooltip title={playingId === row.id ? "停止预览" : "试听"}>
            <Button
              size="small"
              icon={playingId === row.id ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => togglePreview(row)}
            >
              {playingId === row.id ? "停止" : "预览"}
            </Button>
          </Tooltip>
          <Popconfirm
            title="确认删除？"
            description="将同时删除服务器文件，无法恢复。"
            okText="删除"
            cancelText="取消"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteRecord(row.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} loading={deleting === row.id}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  /* ── render ── */

  return (
    <Card
      className="wanfeng-admin-panel"
      title={
        <Space>
          <span>🎵 BGM 音乐管理</span>
          <Tag color="blue">上传后可一键切换为首页背景音乐</Tag>
        </Space>
      }
    >
      {/* ─── Drop Zone ─── */}
      <div
        className={[
          "mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-10",
          "cursor-pointer select-none transition-colors",
          isDragOver
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40 dark:bg-gray-900",
          uploading ? "pointer-events-none opacity-60" : ""
        ].join(" ")}
        onClick={() => !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.ogg,.flac,.aac,.m4a"
          className="hidden"
          onChange={handleFileChange}
        />

        {uploading ? (
          <div className="w-full max-w-xs text-center">
            <CloudUploadOutlined className="mb-3 text-4xl text-blue-500" />
            <Typography.Text className="block">正在上传中...</Typography.Text>
            <Progress
              percent={uploadProgress}
              status="active"
              strokeColor={{ from: "#3b82f6", to: "#06b6d4" }}
              className="mt-3"
            />
          </div>
        ) : (
          <div className="text-center">
            <CloudUploadOutlined className="mb-3 text-5xl text-gray-400" />
            <Typography.Text className="block text-base text-gray-600">
              点击选择文件，或将音乐文件拖拽到此区域
            </Typography.Text>
            <Typography.Text type="secondary" className="mt-1 block text-sm">
              支持 MP3 · WAV · OGG · FLAC · AAC · M4A，单文件最大 10 MB
            </Typography.Text>
            <Button
              icon={<CloudUploadOutlined />}
              className="mt-4"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              选择音乐文件
            </Button>
          </div>
        )}
      </div>

      {/* ─── Record List ─── */}
      {records.length === 0 ? (
        <div className="py-10 text-center text-gray-400">
          暂无已上传的音乐，请先使用上方区域上传 BGM 文件
        </div>
      ) : (
        <Table<BgmRecord>
          rowKey="id"
          dataSource={records}
          columns={columns}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 首` }}
          rowClassName={(row) => (row.is_active ? "ant-table-row-selected" : "")}
          size="middle"
        />
      )}
    </Card>
  );
}
