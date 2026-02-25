import { randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export type DonationStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export type DonationRecord = {
  id: string;
  name: string;
  email: string | null;
  amount: number;
  message: string | null;
  paymentMethod: string;
  status: DonationStatus;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
};

let readyPromise: Promise<void> | null = null;

async function ensureDonationsTable() {
  if (readyPromise) return readyPromise;
  readyPromise = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS donation_records (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NULL,
        amount NUMERIC(10,2) NOT NULL,
        message TEXT NULL,
        payment_method TEXT NOT NULL DEFAULT 'WECHAT',
        status TEXT NOT NULL DEFAULT 'PENDING',
        confirmed_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_donation_records_status_created_at
      ON donation_records (status, created_at DESC);
    `);
  })();
  return readyPromise;
}

function rowToDonation(row: {
  id: string;
  name: string;
  email: string | null;
  amount: string | number;
  message: string | null;
  payment_method: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  confirmed_at: Date | null;
}): DonationRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    amount: Number(row.amount),
    message: row.message,
    paymentMethod: row.payment_method,
    status: row.status as DonationStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    confirmedAt: row.confirmed_at
  };
}

export async function listDonations(params?: {
  status?: DonationStatus | "ALL";
  limit?: number;
}) {
  await ensureDonationsTable();
  const status = params?.status ?? "CONFIRMED";
  const limit = Math.min(Math.max(params?.limit ?? 80, 1), 300);

  const rows = await db.$queryRaw<
    Array<{
      id: string;
      name: string;
      email: string | null;
      amount: string | number;
      message: string | null;
      payment_method: string;
      status: string;
      created_at: Date;
      updated_at: Date;
      confirmed_at: Date | null;
    }>
  >(
    status === "ALL"
      ? Prisma.sql`
          SELECT id, name, email, amount, message, payment_method, status, created_at, updated_at, confirmed_at
          FROM donation_records
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
      : Prisma.sql`
          SELECT id, name, email, amount, message, payment_method, status, created_at, updated_at, confirmed_at
          FROM donation_records
          WHERE status = ${status}
          ORDER BY created_at DESC
          LIMIT ${limit}
        `
  );

  return rows.map(rowToDonation);
}

export async function createDonation(input: {
  name: string;
  email: string | null;
  amount: number;
  message: string | null;
  paymentMethod: string;
  status?: DonationStatus;
}) {
  await ensureDonationsTable();
  const id = randomUUID();
  const status = input.status ?? "PENDING";

  await db.$executeRaw(Prisma.sql`
    INSERT INTO donation_records (id, name, email, amount, message, payment_method, status, created_at, updated_at)
    VALUES (
      ${id},
      ${input.name},
      ${input.email},
      ${input.amount},
      ${input.message},
      ${input.paymentMethod},
      ${status},
      NOW(),
      NOW()
    )
  `);
  return id;
}

export async function updateDonationStatus(id: string, status: DonationStatus) {
  await ensureDonationsTable();
  await db.$executeRaw(Prisma.sql`
    UPDATE donation_records
    SET
      status = ${status},
      confirmed_at = CASE WHEN ${status} = 'CONFIRMED' THEN NOW() ELSE confirmed_at END,
      updated_at = NOW()
    WHERE id = ${id}
  `);
}

export async function deleteDonation(id: string) {
  await ensureDonationsTable();
  await db.$executeRaw(Prisma.sql`
    DELETE FROM donation_records
    WHERE id = ${id}
  `);
}
