"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type UploadedAsset = {
  id: string;
  url: string;
  provider: string;
  createdAt: string;
};

export function UploadAssetForm({ onUploaded }: { onUploaded?: (asset: UploadedAsset) => void }) {
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("请选择图片");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      setProgress(0);
      const result = await new Promise<{ ok: boolean; data?: UploadedAsset; message?: string }>((resolve) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };
        xhr.onload = () => {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve({ ok: false, message: "响应解析失败" });
          }
        };
        xhr.onerror = () => resolve({ ok: false, message: "网络错误" });
        xhr.send(formData);
      });
      if (!result.ok || !result.data) {
        toast.error(result.message ?? "上传失败");
        return;
      }
      toast.success("上传成功");
      onUploaded?.(result.data);
      setPreview(result.data.url);
      setProgress(100);
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <h2 className="text-lg font-semibold">上传图片资源</h2>
      <input
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="block w-full text-sm"
        ref={inputRef}
        type="file"
      />
      <Button loading={pending} onClick={submit} type="button">
        上传
      </Button>
      {pending ? <p className="text-xs text-muted">上传进度: {progress}%</p> : null}
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="preview" className="max-h-48 rounded-md border border-border object-cover" src={preview} />
      ) : null}
    </div>
  );
}
