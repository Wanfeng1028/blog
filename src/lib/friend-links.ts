import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type FriendLinkStatus = "PENDING" | "APPROVED" | "REJECTED";

export type FriendLinkEntry = {
  id: string;
  avatarUrl: string;
  name: string;
  email: string;
  siteName: string;
  siteUrl: string;
  description: string;
  status: FriendLinkStatus;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
  reviewNote: string | null;
};

let readyPromise: Promise<void> | null = null;

async function ensureFriendLinksTable() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS friend_link_entries (
        id TEXT PRIMARY KEY,
        avatar_url TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        site_name TEXT NOT NULL,
        site_url TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        review_note TEXT NULL,
        reviewed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_friend_link_entries_status_created_at
      ON friend_link_entries (status, created_at DESC);
    `);
  })();
  return readyPromise;
}

function rowToEntry(row: {
  id: string;
  avatar_url: string;
  name: string;
  email: string;
  site_name: string;
  site_url: string;
  description: string;
  status: string;
  review_note: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}): FriendLinkEntry {
  return {
    id: row.id,
    avatarUrl: row.avatar_url,
    name: row.name,
    email: row.email,
    siteName: row.site_name,
    siteUrl: row.site_url,
    description: row.description,
    status: row.status as FriendLinkStatus,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listFriendLinks(params?: { status?: FriendLinkStatus | "ALL"; limit?: number }) {
  await ensureFriendLinksTable();
  const status = params?.status ?? "APPROVED";
  const limit = Math.min(Math.max(params?.limit ?? 100, 1), 300);

  const rows = await db.$queryRaw<
    Array<{
      id: string;
      avatar_url: string;
      name: string;
      email: string;
      site_name: string;
      site_url: string;
      description: string;
      status: string;
      review_note: string | null;
      reviewed_at: Date | null;
      created_at: Date;
      updated_at: Date;
    }>
  >(
    status === "ALL"
      ? Prisma.sql`
          SELECT id, avatar_url, name, email, site_name, site_url, description, status, review_note, reviewed_at, created_at, updated_at
          FROM friend_link_entries
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
      : Prisma.sql`
          SELECT id, avatar_url, name, email, site_name, site_url, description, status, review_note, reviewed_at, created_at, updated_at
          FROM friend_link_entries
          WHERE status = ${status}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
  );

  return rows.map(rowToEntry);
}

export async function createFriendLink(input: {
  avatarUrl: string;
  name: string;
  email: string;
  siteName: string;
  siteUrl: string;
  description: string;
  status?: FriendLinkStatus;
}) {
  await ensureFriendLinksTable();
  const status = input.status ?? "PENDING";
  const id = randomUUID();
  await db.$executeRaw(Prisma.sql`
    INSERT INTO friend_link_entries (
      id, avatar_url, name, email, site_name, site_url, description, status, created_at, updated_at
    ) VALUES (
      ${id},
      ${input.avatarUrl},
      ${input.name},
      ${input.email},
      ${input.siteName},
      ${input.siteUrl},
      ${input.description},
      ${status},
      NOW(),
      NOW()
    )
  `);
  return id;
}

export async function updateFriendLinkStatus(id: string, status: FriendLinkStatus, reviewNote?: string | null) {
  await ensureFriendLinksTable();
  await db.$executeRaw(Prisma.sql`
    UPDATE friend_link_entries
    SET
      status = ${status},
      review_note = ${reviewNote ?? null},
      reviewed_at = NOW(),
      updated_at = NOW()
    WHERE id = ${id}
  `);
}

export async function deleteFriendLink(id: string) {
  await ensureFriendLinksTable();
  await db.$executeRaw(Prisma.sql`
    DELETE FROM friend_link_entries
    WHERE id = ${id}
  `);
}
