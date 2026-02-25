"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

const LINE_ONE = "Welcome to my home!";
const LINE_TWO = "Life is coding, I will debug it.";

type Phase = "typing1" | "pause" | "typing2" | "hold" | "deleting2" | "deleting1" | "restart";

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * 非首页 hero 区域的双行打字机组件。
 * 第一行打字完停顿，再打第二行，全部完成后光标持续闪烁。
 */
export function SubPageTyping() {
  const [lineOneCount, setLineOneCount] = useState(0);
  const [lineTwoCount, setLineTwoCount] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing1");

  useEffect(() => {
    if (phase === "typing1") {
      if (lineOneCount < LINE_ONE.length) {
        const t = window.setTimeout(() => setLineOneCount((c) => c + 1), randomDelay(55, 130));
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setPhase("pause"), 380);
      return () => window.clearTimeout(t);
    }
    if (phase === "pause") {
      const t = window.setTimeout(() => setPhase("typing2"), 240);
      return () => window.clearTimeout(t);
    }
    if (phase === "typing2") {
      if (lineTwoCount < LINE_TWO.length) {
        const t = window.setTimeout(() => setLineTwoCount((c) => c + 1), randomDelay(38, 90));
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setPhase("hold"), 1400);
      return () => window.clearTimeout(t);
    }
    if (phase === "hold") {
      const t = window.setTimeout(() => setPhase("deleting2"), 200);
      return () => window.clearTimeout(t);
    }
    if (phase === "deleting2") {
      if (lineTwoCount > 0) {
        const t = window.setTimeout(() => setLineTwoCount((c) => c - 1), randomDelay(22, 48));
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setPhase("deleting1"), 120);
      return () => window.clearTimeout(t);
    }
    if (phase === "deleting1") {
      if (lineOneCount > 0) {
        const t = window.setTimeout(() => setLineOneCount((c) => c - 1), randomDelay(25, 52));
        return () => window.clearTimeout(t);
      }
      const t = window.setTimeout(() => setPhase("restart"), 400);
      return () => window.clearTimeout(t);
    }
    if (phase === "restart") {
      setPhase("typing1");
    }
  }, [phase, lineOneCount, lineTwoCount]);

  const caretOne = phase === "typing1" || phase === "deleting1";
  const caretTwo = phase === "typing2" || phase === "deleting2" || phase === "hold";

  return (
    <div className="text-center text-white">
      {/* 第一行：大标题，字色白色 */}
      <h1 className="font-serif text-5xl font-semibold tracking-wide md:text-7xl">
        {LINE_ONE.slice(0, lineOneCount)}
        <span
          className={cn(
            "ml-1 inline-block h-[1em] w-[2px] bg-white align-[-0.08em]",
            caretOne ? "animate-pulse" : "opacity-0"
          )}
        />
      </h1>

      {/* 第二行：渐变色副标题 */}
      <p className="mt-6 bg-gradient-to-r from-violet-300 via-indigo-300 to-pink-300 bg-clip-text text-xl text-transparent md:text-3xl">
        {LINE_TWO.slice(0, lineTwoCount)}
        <span
          className={cn(
            "ml-0.5 inline-block h-[1em] w-[2px] bg-violet-200 align-[-0.08em]",
            caretTwo ? "animate-pulse" : "opacity-0"
          )}
        />
      </p>
    </div>
  );
}
