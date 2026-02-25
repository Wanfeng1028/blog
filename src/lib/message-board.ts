import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type MessageStatus = "VISIBLE" | "HIDDEN" | "DELETED" | "PENDING";

export type MessageEntry = {
  id: string;
  name: string;
  email: string | null;
  content: string;
  status: MessageStatus;
  createdAt: Date;
  updatedAt: Date;
  ip: string | null;
  userId: string | null;
};

let readyPromise: Promise<void> | null = null;

async function ensureMessageTable() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS message_board_entries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NULL,
        content TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'VISIBLE',
        ip TEXT NULL,
        user_id TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_message_board_entries_status_created_at
      ON message_board_entries (status, created_at DESC);
    `);
  })();
  return readyPromise;
}

function rowToMessageEntry(row: {
  id: string;
  name: string;
  email: string | null;
  content: string;
  status: string;
  ip: string | null;
  user_id: string | null;
  created_at: Date;
  updated_at: Date;
}): MessageEntry {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    content: row.content,
    status: row.status as MessageStatus,
    ip: row.ip,
    userId: row.user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function listMessages(params?: { admin?: boolean; status?: MessageStatus | "ALL"; limit?: number }) {
  await ensureMessageTable();
  const limit = Math.min(Math.max(params?.limit ?? 60, 1), 200);
  const status = params?.status ?? (params?.admin ? "ALL" : "VISIBLE");

  const rows = await db.$queryRaw<
    Array<{
      id: string;
      name: string;
      email: string | null;
      content: string;
      status: string;
      ip: string | null;
      user_id: string | null;
      created_at: Date;
      updated_at: Date;
    }>
  >(
    status === "ALL"
      ? Prisma.sql`
          SELECT id, name, email, content, status, ip, user_id, created_at, updated_at
          FROM message_board_entries
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
      : Prisma.sql`
          SELECT id, name, email, content, status, ip, user_id, created_at, updated_at
          FROM message_board_entries
          WHERE status = ${status}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
  );

  return rows.map(rowToMessageEntry);
}

export async function createMessage(input: {
  id: string;
  name: string;
  email: string | null;
  content: string;
  status: MessageStatus;
  ip: string | null;
  userId: string | null;
}) {
  await ensureMessageTable();
  await db.$executeRaw(Prisma.sql`
    INSERT INTO message_board_entries (id, name, email, content, status, ip, user_id, created_at, updated_at)
    VALUES (
      ${input.id},
      ${input.name},
      ${input.email},
      ${input.content},
      ${input.status},
      ${input.ip},
      ${input.userId},
      NOW(),
      NOW()
    )
  `);
}

export async function updateMessageStatus(id: string, status: MessageStatus) {
  await ensureMessageTable();
  await db.$executeRaw(Prisma.sql`
    UPDATE message_board_entries
    SET status = ${status}, updated_at = NOW()
    WHERE id = ${id}
  `);
}

export async function deleteMessage(id: string) {
  await ensureMessageTable();
  await db.$executeRaw(Prisma.sql`
    DELETE FROM message_board_entries
    WHERE id = ${id}
  `);
}
