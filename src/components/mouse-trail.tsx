"use client";

import { useEffect, useRef } from "react";

type Dot = {
  x: number;
  y: number;
  life: number;
  size: number;
  hue: number;
  dx: number;
  dy: number;
};

const MAX_DOTS = 24;
const MAX_DPR = 1.5;

export function MouseTrail() {
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef<number | null>(null);
  const isEnabled = true;

  useEffect(() => {
    if (!isEnabled) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "60";
    document.body.appendChild(canvas);

    const context = canvas.getContext("2d");
    if (!context) {
      canvas.remove();
      return;
    }

    const getDpr = () => Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const resize = () => {
      const dpr = getDpr();
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const spawn = (x: number, y: number) => {
      dotsRef.current.push({
        x,
        y,
        life: 1,
        size: Math.random() * 3 + 2,
        hue: 45 + Math.random() * 80,
        dx: (Math.random() - 0.5) * 0.9,
        dy: (Math.random() - 0.5) * 0.9
      });
      if (dotsRef.current.length > MAX_DOTS) {
        dotsRef.current.shift();
      }
    };

    const ensureDrawLoop = () => {
      if (rafRef.current !== null) return;
      rafRef.current = requestAnimationFrame(draw);
    };

    let pendingX = 0;
    let pendingY = 0;
    let hasPending = false;
    let rafSpawn: number | null = null;

    const flushSpawn = () => {
      if (!hasPending) {
        rafSpawn = null;
        return;
      }
      spawn(pendingX, pendingY);
      if (Math.random() > 0.7) {
        spawn(pendingX + (Math.random() - 0.5) * 10, pendingY + (Math.random() - 0.5) * 10);
      }
      hasPending = false;
      rafSpawn = null;
      ensureDrawLoop();
    };

    const onMove = (event: MouseEvent) => {
      pendingX = event.clientX;
      pendingY = event.clientY;
      hasPending = true;
      if (!rafSpawn) {
        rafSpawn = requestAnimationFrame(flushSpawn);
      }
    };

    const draw = () => {
      rafRef.current = null;

      if (document.hidden || dotsRef.current.length === 0) {
        return;
      }

      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (const dot of dotsRef.current) {
        dot.life -= 0.03;
        dot.x += dot.dx;
        dot.y += dot.dy;
        dot.dy += 0.006;
      }
      dotsRef.current = dotsRef.current.filter((dot) => dot.life > 0);

      for (const dot of dotsRef.current) {
        context.save();
        context.globalAlpha = Math.max(0, dot.life);
        context.fillStyle = `hsl(${dot.hue} 90% 70%)`;
        context.beginPath();
        context.arc(dot.x, dot.y, dot.size * dot.life, 0, Math.PI * 2);
        context.fill();
        context.restore();
      }

      if (dotsRef.current.length > 0) {
        ensureDrawLoop();
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) return;
      if (dotsRef.current.length > 0) {
        ensureDrawLoop();
      }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (rafSpawn) cancelAnimationFrame(rafSpawn);
      canvas.remove();
      dotsRef.current = [];
    };
  }, [isEnabled]);

  return null;
}
