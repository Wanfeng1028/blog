import { db } from "@/lib/db";
import { AdminSettingsPanel } from "@/features/admin/components/admin-settings-panel";
import { AdminBgmPanel, type BgmRecord } from "@/features/admin/components/admin-bgm-panel";
import { getSiteSettings } from "@/lib/site-settings";
import { Prisma } from "@prisma/client";

async function getBgmRecords(): Promise<BgmRecord[]> {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS bgm_manager (
        id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
        original_name TEXT      NOT NULL,
        file_path   TEXT        NOT NULL,
        is_active   BOOLEAN     NOT NULL DEFAULT false,
        upload_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const rows = await db.$queryRaw<BgmRecord[]>(
      Prisma.sql`SELECT id, original_name, file_path, is_active, upload_time::text AS upload_time
                 FROM bgm_manager ORDER BY upload_time DESC`
    );
    return rows;
  } catch {
    return [];
  }
}

export default async function AdminSettingsPage() {
  const [siteSettings, bgmRecords] = await Promise.all([
    getSiteSettings(),
    getBgmRecords()
  ]);

  return (
    <div className="space-y-4">
      <AdminBgmPanel initialRecords={bgmRecords} />
      <AdminSettingsPanel
        users={[]}
        comments={[]}
        alerts={[]}
        messages={[]}
        friendLinks={[]}
        donations={[]}
        siteSettings={siteSettings}
      />
    </div>
  );
}
