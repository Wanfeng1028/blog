import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/guards";
import { apiError, apiOk } from "@/lib/utils/api";

const allowedTypes = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function getLimitInBytes() {
  const sizeMb = Number(process.env.UPLOAD_MAX_FILE_SIZE_MB ?? 5);
  return Math.max(1, sizeMb) * 1024 * 1024;
}

async function uploadToR2(file: File, key: string) {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    throw new Error("R2 is not configured");
  }

  const client = new S3Client({
    region: process.env.R2_REGION ?? "auto",
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  });

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type
    })
  );

  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) throw new Error("R2_PUBLIC_BASE_URL is required");
  return `${base.replace(/\/$/, "")}/${key}`;
}

async function uploadToLocal(file: File, key: string) {
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const filePath = path.join(uploadDir, `${key}.${ext}`);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));
  return `/uploads/${key}.${ext}`;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File)) {
      return apiError("No file uploaded", 400);
    }
    if (!allowedTypes.has(file.type)) {
      return apiError("Unsupported image type", 415);
    }
    if (file.size > getLimitInBytes()) {
      return apiError("File is too large", 413);
    }

    const key = `${Date.now()}-${randomUUID()}`;
    const provider = process.env.NODE_ENV === "production" ? "r2" : "local";
    const url = provider === "r2" ? await uploadToR2(file, key) : await uploadToLocal(file, key);

    const asset = await db.imageAsset.create({
      data: {
        url,
        provider
      }
    });
    return apiOk(asset, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHORIZED" ? 401 : 500;
    return apiError(message, status);
  }
}
