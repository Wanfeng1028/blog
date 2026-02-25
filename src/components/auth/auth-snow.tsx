"use client";

import { useMemo } from "react";

type Flake = {
  left: string;
  delay: string;
  duration: string;
  size: string;
  opacity: number;
};

export function AuthSnow() {
  const flakes = useMemo<Flake[]>(
    () =>
      Array.from({ length: 36 }).map((_, i) => ({
        left: `${(i * 73) % 100}%`,
        delay: `${(i * 0.37) % 6}s`,
        duration: `${6 + ((i * 0.61) % 6)}s`,
        size: `${2 + (i % 4)}px`,
        opacity: 0.3 + ((i % 6) * 0.1)
      })),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {flakes.map((flake, idx) => (
        <span
          className="auth-flake"
          key={idx}
          style={{
            left: flake.left,
            animationDelay: flake.delay,
            animationDuration: flake.duration,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity
          }}
        />
      ))}
    </div>
  );
}

