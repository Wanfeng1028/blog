import { unlink } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { apiError, apiOk } from "@/lib/utils/api";
import { updateSiteSettings } from "@/lib/site-settings";
import { ensureBgmTable, type BgmRow } from "@/app/api/admin/bgm/route";

type RouteContext = { params: Promise<{ id: string }> };

/** PATCH /api/admin/bgm/[id] — set this track as the active BGM */
export async function PATCH(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    await ensureBgmTable();

    const rows = await db.$queryRaw<Pick<BgmRow, "file_path">[]>(
      Prisma.sql`SELECT file_path FROM bgm_manager WHERE id = ${id}`
    );
    if (!rows.length) return apiError("BGM 记录不存在", 404);

    // Atomic-style toggle: clear all, then set this one
    await db.$executeRaw(Prisma.sql`UPDATE bgm_manager SET is_active = false`);
    await db.$executeRaw(Prisma.sql`UPDATE bgm_manager SET is_active = true WHERE id = ${id}`);

    // Sync to site_settings so home-bgm.tsx picks it up immediately
    await updateSiteSettings({ bgmSrc: rows[0].file_path });

    return apiOk({ activated: id, filePath: rows[0].file_path });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "切换失败";
    if (msg === "UNAUTHORIZED") return apiError(msg, 401);
    if (msg === "FORBIDDEN") return apiError(msg, 403);
    return apiError(msg, 500);
  }
}

/** DELETE /api/admin/bgm/[id] — remove DB record + physical file */
export async function DELETE(_req: NextRequest, { params }: RouteContext) {
  try {
    await requireAdmin();
    const { id } = await params;
    await ensureBgmTable();

    const rows = await db.$queryRaw<Pick<BgmRow, "file_path" | "is_active">[]>(
      Prisma.sql`SELECT file_path, is_active FROM bgm_manager WHERE id = ${id}`
    );
    if (!rows.length) return apiError("BGM 记录不存在", 404);

    const { file_path, is_active } = rows[0];

    // Remove DB record
    await db.$executeRaw(Prisma.sql`DELETE FROM bgm_manager WHERE id = ${id}`);

    // Remove physical file (only uploaded files, not the built-in /audio/ ones)
    if (file_path.startsWith("/uploads/")) {
      try {
        await unlink(path.join(process.cwd(), "public", file_path));
      } catch {
        // file already gone — silently ignore
      }
    }

    // If the deleted track was active, promote the newest remaining one
    if (is_active) {
      const next = await db.$queryRaw<Pick<BgmRow, "id" | "file_path">[]>(
        Prisma.sql`SELECT id, file_path FROM bgm_manager ORDER BY upload_time DESC LIMIT 1`
      );
      if (next.length) {
        await db.$executeRaw(Prisma.sql`UPDATE bgm_manager SET is_active = true WHERE id = ${next[0].id}`);
        await updateSiteSettings({ bgmSrc: next[0].file_path });
      } else {
        await updateSiteSettings({ bgmSrc: "/audio/home.mp3" });
      }
    }

    return apiOk({ deleted: id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "删除失败";
    if (msg === "UNAUTHORIZED") return apiError(msg, 401);
    if (msg === "FORBIDDEN") return apiError(msg, 403);
    return apiError(msg, 500);
  }
}
