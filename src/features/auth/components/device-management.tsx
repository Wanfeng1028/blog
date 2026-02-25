"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DeviceItem = {
  device_id: string;
  user_agent: string | null;
  last_ip: string | null;
  first_seen_at: string;
  last_seen_at: string;
};

export function DeviceManagement() {
  const [items, setItems] = useState<DeviceItem[]>([]);
  const [pending, startTransition] = useTransition();

  const load = async () => {
    const response = await fetch("/api/auth/devices", { cache: "no-store" });
    const result = await response.json();
    if (response.ok && result.ok) setItems(result.data);
  };

  useEffect(() => {
    void load();
  }, []);

  const remove = (deviceId: string) => {
    startTransition(async () => {
      const response = await fetch("/api/auth/devices", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "删除设备失败");
        return;
      }
      toast.success("设备已移除");
      await load();
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
      <h2 className="text-lg font-semibold">设备管理</h2>
      {items.length === 0 ? <p className="text-sm text-muted">暂无设备记录</p> : null}
      {items.map((item) => (
        <div className="flex items-center justify-between rounded-md border border-border p-3" key={item.device_id}>
          <div className="space-y-1 text-sm">
            <p className="font-medium">{item.user_agent ?? "Unknown device"}</p>
            <p className="text-muted">IP: {item.last_ip ?? "-"}</p>
            <p className="text-muted">最近活跃: {new Date(item.last_seen_at).toLocaleString()}</p>
          </div>
          <Button loading={pending} onClick={() => remove(item.device_id)} size="sm" type="button" variant="outline">
            移除
          </Button>
        </div>
      ))}
    </div>
  );
}
