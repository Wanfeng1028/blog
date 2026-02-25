import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { apiError, apiOk } from "@/lib/utils/api";

const ALLOWED_EXTS = new Set([".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a"]);
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function ensureBgmTable() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS bgm_manager (
      id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
      original_name TEXT      NOT NULL,
      file_path   TEXT        NOT NULL,
      is_active   BOOLEAN     NOT NULL DEFAULT false,
      upload_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export type BgmRow = {
  id: string;
  original_name: string;
  file_path: string;
  is_active: boolean;
  upload_time: Date;
};

/** GET /api/admin/bgm — list all records */
export async function GET() {
  try {
    await requireAdmin();
    await ensureBgmTable();
    const rows = await db.$queryRaw<BgmRow[]>(
      Prisma.sql`SELECT id, original_name, file_path, is_active, upload_time
                 FROM bgm_manager
                 ORDER BY upload_time DESC`
    );
    return apiOk(rows);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to list BGM";
    if (msg === "UNAUTHORIZED") return apiError(msg, 401);
    if (msg === "FORBIDDEN") return apiError(msg, 403);
    return apiError(msg, 500);
  }
}

/** POST /api/admin/bgm — upload an audio file */
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) return apiError("No file uploaded", 400);

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTS.has(ext)) {
      return apiError(
        `不支持的格式，仅允许 ${Array.from(ALLOWED_EXTS).join(" / ")}`,
        415
      );
    }
    if (file.size > MAX_SIZE) return apiError("文件大小超出 10 MB 限制", 413);

    // Save to /public/uploads/audio/
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    const audioDir = path.join(process.cwd(), "public", "uploads", "audio");
    await mkdir(audioDir, { recursive: true });
    await writeFile(path.join(audioDir, filename), Buffer.from(await file.arrayBuffer()));
    const filePath = `/uploads/audio/${filename}`;

    // Persist record
    await ensureBgmTable();
    const id = randomUUID();
    await db.$executeRaw(
      Prisma.sql`INSERT INTO bgm_manager (id, original_name, file_path, is_active, upload_time)
                 VALUES (${id}, ${file.name}, ${filePath}, false, NOW())`
    );

    const rows = await db.$queryRaw<BgmRow[]>(
      Prisma.sql`SELECT id, original_name, file_path, is_active, upload_time
                 FROM bgm_manager WHERE id = ${id}`
    );
    return apiOk(rows[0], 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "上传失败";
    if (msg === "UNAUTHORIZED") return apiError(msg, 401);
    if (msg === "FORBIDDEN") return apiError(msg, 403);
    return apiError(msg, 500);
  }
}
