"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { useLang } from "@/features/i18n/lang-context";

const SOUND_KEY = "hero_typing_sound_enabled";

type Phase = "typing1" | "pause1" | "typing2" | "hold" | "deleting2" | "deleting1";

function randomDelay(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function HeroTyping({ loop = true }: { loop?: boolean }) {
  const { lang, dictionary } = useLang();
  const d = dictionary!;
  const LINE_ONE = d.hero.line1;
  const LINE_TWO = d.hero.line2;

  const [lineOneCount, setLineOneCount] = useState(() => (loop ? 0 : LINE_ONE.length));
  const [lineTwoCount, setLineTwoCount] = useState(() => (loop ? 0 : LINE_TWO.length));
  const [phase, setPhase] = useState<Phase>(() => (loop ? "typing1" : "hold"));

  // Reset progress when lang changes
  useEffect(() => {
    if (loop) {
      setLineOneCount(0);
      setLineTwoCount(0);
      setPhase("typing1");
    } else {
      setLineOneCount(LINE_ONE.length);
      setLineTwoCount(LINE_TWO.length);
    }
  }, [lang, loop, LINE_ONE.length, LINE_TWO.length]);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  const audioContextRef = useRef<AudioContext | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(SOUND_KEY);
    setSoundEnabled(stored === "1");
  }, []);

  const playKeySound = useCallback(() => {
    if (!loop || !soundEnabled) return;
    const Ctx = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new Ctx();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;

    const bodyOsc = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    bodyOsc.type = "square";
    // Slightly higher frequency for a crisp mechanical click
    bodyOsc.frequency.setValueAtTime(randomDelay(2200, 3200), now);

    bodyGain.gain.setValueAtTime(0.0001, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.06, now + 0.001);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(ctx.destination);
    bodyOsc.start(now);
    bodyOsc.stop(now + 0.02);

    const clickBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.012), ctx.sampleRate);
    const channel = clickBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i += 1) {
      channel[i] = (Math.random() * 2 - 1) * (1 - i / channel.length);
    }
    const clickSource = ctx.createBufferSource();
    clickSource.buffer = clickBuffer;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    // Lower filter threshold to let more sound through
    highpass.frequency.setValueAtTime(1200, now);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.0001, now);
    clickGain.gain.exponentialRampToValueAtTime(0.04, now + 0.0007);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.01);

    clickSource.connect(highpass);
    highpass.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickSource.start(now);
  }, [loop, soundEnabled]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(target);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      setIsDocumentVisible(!document.hidden);
    };
    onVisibilityChange();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const animationActive = isInViewport && isDocumentVisible;

  useEffect(() => {
    if (!animationActive) return;

    if (phase === "typing1") {
      if (lineOneCount < LINE_ONE.length) {
        const timer = window.setTimeout(() => {
          setLineOneCount((value) => value + 1);
          playKeySound();
        }, randomDelay(45, 125));
        return () => window.clearTimeout(timer);
      }
      const timer = window.setTimeout(() => setPhase("pause1"), 420);
      return () => window.clearTimeout(timer);
    }

    if (phase === "pause1") {
      const timer = window.setTimeout(() => setPhase("typing2"), 260);
      return () => window.clearTimeout(timer);
    }

    if (phase === "typing2") {
      if (lineTwoCount < LINE_TWO.length) {
        const timer = window.setTimeout(() => {
          setLineTwoCount((value) => value + 1);
          playKeySound();
        }, randomDelay(35, 95));
        return () => window.clearTimeout(timer);
      }
      const timer = window.setTimeout(() => setPhase("hold"), 1400);
      return () => window.clearTimeout(timer);
    }

    if (phase === "hold") {
      if (!loop) return;
      const timer = window.setTimeout(() => setPhase("deleting2"), 220);
      return () => window.clearTimeout(timer);
    }

    if (phase === "deleting2") {
      if (lineTwoCount > 0) {
        const timer = window.setTimeout(() => {
          setLineTwoCount((value) => value - 1);
          playKeySound();
        }, randomDelay(20, 45));
        return () => window.clearTimeout(timer);
      }
      const timer = window.setTimeout(() => setPhase("deleting1"), 120);
      return () => window.clearTimeout(timer);
    }

    if (phase === "deleting1") {
      if (lineOneCount > 0) {
        const timer = window.setTimeout(() => {
          setLineOneCount((value) => value - 1);
          playKeySound();
        }, randomDelay(24, 50));
        return () => window.clearTimeout(timer);
      }
      const timer = window.setTimeout(() => setPhase("typing1"), 420);
      return () => window.clearTimeout(timer);
    }
  }, [animationActive, lineOneCount, lineTwoCount, loop, phase, playKeySound]);

  const toggleSound = async () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    window.localStorage.setItem(SOUND_KEY, next ? "1" : "0");

    if (next) {
      if (!audioContextRef.current) {
        const Ctx =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (Ctx) audioContextRef.current = new Ctx();
      }
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
    }
  };

  // Ensure AudioContext is resumed on any user interaction if sound is enabled
  useEffect(() => {
    if (!soundEnabled) return;

    const handleInteraction = async () => {
      if (audioContextRef.current?.state === "suspended") {
        await audioContextRef.current.resume();
      }
    };

    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });
    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [soundEnabled]);

  const caretLineOne = phase === "typing1" || phase === "deleting1";
  const caretLineTwo = phase === "typing2" || phase === "deleting2";

  return (
    <div className="text-center text-white" ref={containerRef}>
      <h1 className="font-serif text-5xl font-semibold tracking-wide md:text-7xl">
        {LINE_ONE.slice(0, lineOneCount)}
        <span
          className={cn(
            "ml-1 inline-block h-[1em] w-[2px] animate-pulse bg-white align-[-0.08em]",
            caretLineOne ? "opacity-100" : "opacity-0"
          )}
        />
      </h1>
      <p className="mt-6 bg-gradient-to-r from-violet-300 via-indigo-300 to-pink-300 bg-clip-text text-xl text-transparent md:text-3xl">
        {LINE_TWO.slice(0, lineTwoCount)}
        <span
          className={cn(
            "ml-1 inline-block h-[1em] w-[2px] animate-pulse bg-violet-200 align-[-0.08em]",
            caretLineTwo ? "opacity-100" : "opacity-0"
          )}
        />
      </p>
      {loop ? (
        <button
          className="mt-6 rounded-full border border-white/40 bg-black/20 px-3 py-1 text-xs text-white/90 backdrop-blur transition hover:bg-black/30"
          onClick={toggleSound}
          type="button"
        >
          {d.hero.sound}: {soundEnabled ? d.hero.on : d.hero.off}
        </button>
      ) : null}
    </div>
  );
}
