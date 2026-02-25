"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateTagForm() {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    startTransition(async () => {
      const response = await fetch("/api/admin/tags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "创建标签失败");
        return;
      }
      toast.success("标签已创建");
      setName("");
      router.refresh();
    });
  };

  return (
    <div className="space-y-2">
      <Input onChange={(event) => setName(event.target.value)} placeholder="标签名" value={name} />
      <Button loading={pending} onClick={submit} type="button">
        创建标签
      </Button>
    </div>
  );
}
