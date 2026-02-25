"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateUserForm() {
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"ADMIN" | "USER">("USER");

  const submit = () => {
    startTransition(async () => {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password, name, role })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        toast.error(result.message ?? "创建用户失败");
        return;
      }
      toast.success("用户创建成功");
      setEmail("");
      setPassword("");
      setName("");
      setRole("USER");
    });
  };

  return (
    <div className="space-y-2 rounded-lg border border-border p-4">
      <h2 className="text-lg font-semibold">创建后台用户</h2>
      <Input onChange={(event) => setName(event.target.value)} placeholder="Name" value={name} />
      <Input onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" value={email} />
      <Input
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
        type="password"
        value={password}
      />
      <select
        className="h-10 w-full rounded-md border border-border bg-surface px-3"
        onChange={(event) => setRole(event.target.value as "ADMIN" | "USER")}
        value={role}
      >
        <option value="USER">USER</option>
        <option value="ADMIN">ADMIN</option>
      </select>
      <Button loading={pending} onClick={submit} type="button">
        创建用户
      </Button>
    </div>
  );
}
