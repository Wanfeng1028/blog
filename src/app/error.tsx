"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl space-y-3 py-16 text-center">
      <h2 className="text-2xl font-semibold">发生错误</h2>
      <p className="text-muted">{error.message}</p>
      <Button onClick={reset} type="button">
        重试
      </Button>
    </div>
  );
}
