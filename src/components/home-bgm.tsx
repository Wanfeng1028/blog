"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, SkipForward } from "lucide-react";

const STORAGE_KEY = "home_bgm_enabled";
const SETTINGS_CACHE_KEY = "home_bgm_settings_cache_v1";
const SETTINGS_CACHE_TTL = 5 * 60 * 1000;

const SONGS = ["/audio/home.mp3", "/audio/second.mp3", "/audio/third.mp3", "/audio/fourth.mp3"];

type SiteSettings = {
  bgmEnabled: boolean;
  bgmSrc: string;
  aboutContent: string;
};

const defaultSettings: SiteSettings = {
  bgmEnabled: true,
  bgmSrc: "/audio/home.mp3",
  aboutContent: ""
};

export function HomeBgm() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastShowTopRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [songIndex, setSongIndex] = useState(0);

  useEffect(() => {
    const loadSettings = async () => {
      const now = Date.now();
      const cachedRaw = window.sessionStorage.getItem(SETTINGS_CACHE_KEY);
      if (cachedRaw) {
        try {
          const cached = JSON.parse(cachedRaw) as { at: number; data: SiteSettings };
          if (now - cached.at < SETTINGS_CACHE_TTL) {
            setSettings(cached.data);
            return;
          }
        } catch {
          window.sessionStorage.removeItem(SETTINGS_CACHE_KEY);
        }
      }

      try {
        const response = await fetch("/api/comments?mode=site-settings", { cache: "force-cache" });
        const result = await response.json();
        if (response.ok && result.ok) {
          const data = result.data as SiteSettings;
          setSettings(data);
          window.sessionStorage.setItem(
            SETTINGS_CACHE_KEY,
            JSON.stringify({
              at: Date.now(),
              data
            })
          );
        }
      } catch {
        setSettings(defaultSettings);
      }
    };
    void loadSettings();
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextSrc = settings.bgmSrc || defaultSettings.bgmSrc;
    const resolvedNextSrc = new URL(nextSrc, window.location.origin).toString();
    if (audio.src !== resolvedNextSrc) {
      audio.src = nextSrc;
      audio.load();
    }

    if (!playing) return;
    audio.play().catch(() => setPlaying(false));
  }, [settings.bgmSrc, playing]);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const enabled = saved === null ? settings.bgmEnabled : saved === "1";
    if (!enabled || !audioRef.current) return;
    audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [settings.bgmEnabled]);

  useEffect(() => {
    let rafId: number | null = null;
    const getY = () => document.documentElement.scrollTop || document.body.scrollTop || window.scrollY;

    const updateShowTop = () => {
      const next = getY() > 120;
      if (lastShowTopRef.current !== next) {
        lastShowTopRef.current = next;
        setShowTop(next);
      }
      rafId = null;
    };

    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(updateShowTop);
    };

    updateShowTop();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const toggle = async () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      window.localStorage.setItem(STORAGE_KEY, "0");
      return;
    }
    try {
      await audioRef.current.play();
      setPlaying(true);
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      setPlaying(false);
    }
  };

  const nextSong = () => {
    const next = (songIndex + 1) % SONGS.length;
    setSongIndex(next);
    if (!audioRef.current) return;
    audioRef.current.src = SONGS[next];
    audioRef.current.load();
    if (playing) {
      audioRef.current.play().catch(() => setPlaying(false));
    }
  };

  return (
    <>
      <audio ref={audioRef} loop preload="auto" />
      <div className="fixed bottom-5 right-5 z-[70] flex items-center gap-2">
        <button
          aria-label="back to top"
          className={`back-to-top relative flex size-9 items-center justify-center overflow-hidden rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-md transition-all duration-300 hover:bg-white/20 dark:border-white/10 dark:bg-white/5 ${showTop ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
            }`}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          type="button"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          aria-label="next song"
          className="rounded-full border border-white/40 bg-white/10 p-2 text-white backdrop-blur-md transition hover:bg-white/20 dark:border-white/10 dark:bg-white/5"
          onClick={nextSong}
          title={`下一曲 (${songIndex + 1}/${SONGS.length})`}
          type="button"
        >
          <SkipForward className="size-4" />
        </button>
        <button
          className="rounded-full border border-white/40 bg-white/10 px-3 py-2 text-xs text-white backdrop-blur-md transition hover:bg-white/20 dark:border-white/10 dark:bg-white/5"
          onClick={toggle}
          type="button"
        >
          BGM: {playing ? "On" : "Off"}
        </button>
      </div>
    </>
  );
}
