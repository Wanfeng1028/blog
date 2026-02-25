import { Prisma } from "@prisma/client";
import { revalidateTag, unstable_cache } from "next/cache";
import { db } from "@/lib/db";

export type SiteSettings = {
  bgmEnabled: boolean;
  bgmSrc: string;
  aboutContent: string;
};

const DEFAULT_SETTINGS: SiteSettings = {
  bgmEnabled: true,
  bgmSrc: "/audio/home.mp3",
  aboutContent: ""
};

export const SITE_SETTINGS_CACHE_TAG = "site-settings";

let readyPromise: Promise<void> | null = null;

async function ensureSiteSettingsTable() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  })();
  return readyPromise;
}

async function getSettingValue(key: string) {
  await ensureSiteSettingsTable();
  const rows = await db.$queryRaw<Array<{ value: string }>>(
    Prisma.sql`SELECT value FROM site_settings WHERE key = ${key} LIMIT 1`
  );
  return rows[0]?.value ?? null;
}

async function setSettingValue(key: string, value: string) {
  await ensureSiteSettingsTable();
  await db.$executeRaw(
    Prisma.sql`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (${key}, ${value}, NOW())
      ON CONFLICT (key)
      DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
    `
  );
}

async function readSiteSettings(): Promise<SiteSettings> {
  await ensureSiteSettingsTable();

  const rows = await db.$queryRaw<Array<{ key: string; value: string }>>(
    Prisma.sql`
      SELECT key, value
      FROM site_settings
      WHERE key IN ('bgm_enabled', 'bgm_src', 'about_content')
    `
  );
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const bgmEnabled = map.get("bgm_enabled") ?? null;
  const bgmSrc = map.get("bgm_src") ?? null;
  const aboutContent = map.get("about_content") ?? null;

  return {
    bgmEnabled: bgmEnabled === null ? DEFAULT_SETTINGS.bgmEnabled : bgmEnabled === "1",
    bgmSrc: bgmSrc ?? DEFAULT_SETTINGS.bgmSrc,
    aboutContent: aboutContent ?? DEFAULT_SETTINGS.aboutContent
  };
}

const getSiteSettingsCached = unstable_cache(readSiteSettings, ["site-settings"], {
  revalidate: 60,
  tags: [SITE_SETTINGS_CACHE_TAG]
});

export async function getSiteSettings(): Promise<SiteSettings> {
  return getSiteSettingsCached();
}

export async function updateSiteSettings(input: Partial<SiteSettings>) {
  await ensureSiteSettingsTable();

  const writes: Promise<unknown>[] = [];
  if (typeof input.bgmEnabled === "boolean") {
    writes.push(setSettingValue("bgm_enabled", input.bgmEnabled ? "1" : "0"));
  }
  if (typeof input.bgmSrc === "string") {
    writes.push(setSettingValue("bgm_src", input.bgmSrc.trim() || DEFAULT_SETTINGS.bgmSrc));
  }
  if (typeof input.aboutContent === "string") {
    writes.push(setSettingValue("about_content", input.aboutContent));
  }

  if (writes.length > 0) {
    await Promise.all(writes);
    revalidateTag(SITE_SETTINGS_CACHE_TAG);
  }

  return getSiteSettings();
}
