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
import { useDictionary } from "@/features/i18n/lang-context";

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
  const dict = useDictionary();

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
      message.error(dict.admin.formatNotSupported);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      message.error(dict.admin.fileSizeExceeded);
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
          message.success(dict.admin.uploadSuccess);
          refreshRecords();
        } else {
          message.error(result.message ?? dict.admin.uploadFailed);
        }
      } catch {
        message.error(dict.admin.uploadServerError);
      }
    });
    xhr.addEventListener("error", () => {
      setUploading(false);
      setUploadProgress(0);
      message.error(dict.admin.uploadNetworkError);
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
      if (!res.ok || !result.ok) { message.error(result.message ?? dict.admin.switchFailed); return; }
      setRecords((prev) => prev.map((r) => ({ ...r, is_active: r.id === id })));
      message.success(dict.admin.setBgmSuccess);
    } finally {
      setActivating(null);
    }
  };

  const deleteRecord = async (id: string) => {
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/bgm/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (!res.ok || !result.ok) { message.error(result.message ?? dict.admin.bgmDeleteFailed); return; }
      if (playingId === id) stopPreview();
      await refreshRecords();
      message.success(dict.admin.bgmDeleted);
    } finally {
      setDeleting(null);
    }
  };

  const togglePreview = (row: BgmRecord) => {
    if (playingId === row.id) { stopPreview(); return; }
    stopPreview();
    const audio = new Audio(row.file_path);
    audio.addEventListener("ended", () => setPlayingId(null));
    audio.play().catch(() => message.error(dict.admin.playFailed));
    audioRef.current = audio;
    setPlayingId(row.id);
  };

  /* ── columns ── */

  const columns = [
    {
      title: dict.admin.fileName,
      dataIndex: "original_name",
      key: "name",
      render: (name: string, row: BgmRecord) => (
        <Space>
          {row.is_active && <Tag color="success">{dict.admin.inUse}</Tag>}
          <span className="font-medium">{name}</span>
        </Space>
      )
    },
    {
      title: dict.admin.uploadTime,
      dataIndex: "upload_time",
      key: "time",
      width: 170,
      render: (v: string) => new Date(v).toLocaleString("zh-CN")
    },
    {
      title: dict.admin.actions,
      key: "actions",
      width: 300,
      render: (_: unknown, row: BgmRecord) => (
        <Space size={6}>
          {!row.is_active && (
            <Tooltip title={dict.admin.setAsHomeBgmDesc}>
              <Button
                size="small"
                type="primary"
                loading={activating === row.id}
                onClick={() => setActive(row.id)}
              >
                {dict.admin.setAsHomeBgm}
              </Button>
            </Tooltip>
          )}
          <Tooltip title={playingId === row.id ? dict.admin.stopPreviewText : dict.admin.preview}>
            <Button
              size="small"
              icon={playingId === row.id ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={() => togglePreview(row)}
            >
              {playingId === row.id ? dict.admin.stopBtn : dict.admin.previewBtn}
            </Button>
          </Tooltip>
          <Popconfirm
            title={dict.admin.confirmDeleteBgm}
            description={dict.admin.confirmDeleteBgmDesc}
            okText={dict.admin.delete}
            cancelText={dict.admin.cancel}
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteRecord(row.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} loading={deleting === row.id}>
              {dict.admin.delete}
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
          <span>{dict.admin.bgmManage}</span>
          <Tag color="blue">{dict.admin.bgmManageDesc}</Tag>
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
            <Typography.Text className="block">{dict.admin.uploading}</Typography.Text>
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
              {dict.admin.uploadPrompt}
            </Typography.Text>
            <Typography.Text type="secondary" className="mt-1 block text-sm">
              {dict.admin.uploadSupportInfo}
            </Typography.Text>
            <Button
              icon={<CloudUploadOutlined />}
              className="mt-4"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            >
              {dict.admin.selectMusicFile}
            </Button>
          </div>
        )}
      </div>

      {/* ─── Record List ─── */}
      {records.length === 0 ? (
        <div className="py-10 text-center text-gray-400">
          {dict.admin.noUploadedMusic}
        </div>
      ) : (
        <Table<BgmRecord>
          rowKey="id"
          dataSource={records}
          columns={columns}
          pagination={{ pageSize: 8, showTotal: (t) => dict.admin.totalSongs.replace("{total}", String(t)) }}
          rowClassName={(row) => (row.is_active ? "ant-table-row-selected" : "")}
          size="middle"
        />
      )}
    </Card>
  );
}
