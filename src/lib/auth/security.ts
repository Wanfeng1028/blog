import { createHash, randomBytes, randomUUID } from "crypto";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type AuthEventInput = {
  eventType: "login" | "register" | "verify_email" | "forgot_password" | "reset_password" | "logout";
  success: boolean;
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
  detail?: Record<string, unknown>;
};

type SecurityAlertInput = {
  alertType: "new_device" | "repeated_login_failure" | "suspicious_reset";
  severity: "low" | "medium" | "high";
  userId?: string | null;
  email?: string | null;
  message: string;
  meta?: Record<string, unknown>;
};

let tablesReady: Promise<void> | null = null;

function hashToken(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function ensureSecurityTables() {
  if (tablesReady) return tablesReady;
  tablesReady = (async () => {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS rate_limit_buckets (
        key TEXT PRIMARY KEY,
        count INTEGER NOT NULL,
        window_start TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS auth_events (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        success BOOLEAN NOT NULL,
        user_id TEXT NULL,
        email TEXT NULL,
        ip TEXT NULL,
        user_agent TEXT NULL,
        device_id TEXT NULL,
        detail JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS auth_devices (
        user_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        user_agent TEXT NULL,
        last_ip TEXT NULL,
        first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (user_id, device_id)
      );
    `);

    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS security_alerts (
        id TEXT PRIMARY KEY,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        user_id TEXT NULL,
        email TEXT NULL,
        message TEXT NOT NULL,
        meta JSONB NULL,
        resolved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  })();
  return tablesReady;
}

export async function isRateLimitedDistributed(key: string, max: number, windowMs: number) {
  await ensureSecurityTables();
  const now = new Date();
  const resetBefore = new Date(now.getTime() - windowMs);

  const rows = await db.$queryRawUnsafe<Array<{ count: number }>>(
    `
      INSERT INTO rate_limit_buckets (key, count, window_start, updated_at)
      VALUES ($1, 1, $2, NOW())
      ON CONFLICT (key)
      DO UPDATE SET
        count = CASE
          WHEN rate_limit_buckets.window_start <= $3 THEN 1
          ELSE rate_limit_buckets.count + 1
        END,
        window_start = CASE
          WHEN rate_limit_buckets.window_start <= $3 THEN $2
          ELSE rate_limit_buckets.window_start
        END,
        updated_at = NOW()
      RETURNING count
    `,
    key,
    now,
    resetBefore
  );

  return (rows[0]?.count ?? 0) > max;
}

export async function saveShortCodeToken(identifier: string, code: string, ttlMinutes: number) {
  const token = hashToken(code);
  const expires = new Date(Date.now() + ttlMinutes * 60_000);
  await db.verificationToken.create({
    data: {
      identifier,
      token,
      expires
    }
  });
}

export async function consumeShortCodeToken(identifier: string, code: string) {
  const token = hashToken(code);
  const now = new Date();
  const found = await db.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier,
        token
      }
    }
  });
  if (!found) return false;
  if (found.expires < now) {
    await db.verificationToken.delete({
      where: {
        identifier_token: {
          identifier,
          token
        }
      }
    });
    return false;
  }
  await db.verificationToken.delete({
    where: {
      identifier_token: {
        identifier,
        token
      }
    }
  });
  return true;
}

export function generateCode(length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

export async function recordAuthEvent(input: AuthEventInput) {
  await ensureSecurityTables();
  await db.$executeRaw(Prisma.sql`
    INSERT INTO auth_events (id, event_type, success, user_id, email, ip, user_agent, device_id, detail)
    VALUES (
      ${randomUUID()},
      ${input.eventType},
      ${input.success},
      ${input.userId ?? null},
      ${input.email ?? null},
      ${input.ip ?? null},
      ${input.userAgent ?? null},
      ${input.deviceId ?? null},
      ${input.detail ? JSON.stringify(input.detail) : null}::jsonb
    )
  `);
}

export async function upsertDevice(userId: string, deviceId: string, userAgent?: string | null, ip?: string | null) {
  await ensureSecurityTables();
  const existing = await db.$queryRaw<Array<{ device_id: string }>>(Prisma.sql`
    SELECT device_id FROM auth_devices
    WHERE user_id = ${userId} AND device_id = ${deviceId}
    LIMIT 1
  `);

  await db.$executeRaw(Prisma.sql`
    INSERT INTO auth_devices (user_id, device_id, user_agent, last_ip, first_seen_at, last_seen_at)
    VALUES (${userId}, ${deviceId}, ${userAgent ?? null}, ${ip ?? null}, NOW(), NOW())
    ON CONFLICT (user_id, device_id)
    DO UPDATE SET
      user_agent = EXCLUDED.user_agent,
      last_ip = EXCLUDED.last_ip,
      last_seen_at = NOW()
  `);

  return existing.length > 0;
}

export async function createSecurityAlert(input: SecurityAlertInput) {
  await ensureSecurityTables();
  await db.$executeRaw(Prisma.sql`
    INSERT INTO security_alerts (id, alert_type, severity, user_id, email, message, meta)
    VALUES (
      ${randomUUID()},
      ${input.alertType},
      ${input.severity},
      ${input.userId ?? null},
      ${input.email ?? null},
      ${input.message},
      ${input.meta ? JSON.stringify(input.meta) : null}::jsonb
    )
  `);
}

export async function getUserDevices(userId: string) {
  await ensureSecurityTables();
  return db.$queryRaw<
    Array<{
      device_id: string;
      user_agent: string | null;
      last_ip: string | null;
      first_seen_at: Date;
      last_seen_at: Date;
    }>
  >(Prisma.sql`
    SELECT device_id, user_agent, last_ip, first_seen_at, last_seen_at
    FROM auth_devices
    WHERE user_id = ${userId}
    ORDER BY last_seen_at DESC
  `);
}

export async function removeUserDevice(userId: string, deviceId: string) {
  await ensureSecurityTables();
  await db.$executeRaw(Prisma.sql`
    DELETE FROM auth_devices
    WHERE user_id = ${userId} AND device_id = ${deviceId}
  `);
}

export async function getSecurityAlerts(limit = 20) {
  await ensureSecurityTables();
  return db.$queryRaw<
    Array<{
      id: string;
      alert_type: string;
      severity: string;
      user_id: string | null;
      email: string | null;
      message: string;
      meta: unknown;
      resolved: boolean;
      created_at: Date;
    }>
  >(Prisma.sql`
    SELECT id, alert_type, severity, user_id, email, message, meta, resolved, created_at
    FROM security_alerts
    ORDER BY created_at DESC
    LIMIT ${limit}
  `);
}

export async function getAuthEvents(limit = 100, offset = 0) {
  await ensureSecurityTables();
  return db.$queryRaw<
    Array<{
      id: string;
      event_type: string;
      success: boolean;
      user_id: string | null;
      email: string | null;
      ip: string | null;
      user_agent: string | null;
      device_id: string | null;
      detail: unknown;
      created_at: Date;
    }>
  >(Prisma.sql`
    SELECT id, event_type, success, user_id, email, ip, user_agent, device_id, detail, created_at
    FROM auth_events
    ORDER BY created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `);
}

export async function getSecurityOverview() {
  await ensureSecurityTables();
  const [eventsTotal, failedLogins, activeDevices, openAlerts] = await Promise.all([
    db.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total FROM auth_events
    `),
    db.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM auth_events
      WHERE event_type = 'login' AND success = FALSE
    `),
    db.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total FROM auth_devices
    `),
    db.$queryRaw<Array<{ total: bigint }>>(Prisma.sql`
      SELECT COUNT(*)::bigint AS total
      FROM security_alerts
      WHERE resolved = FALSE
    `)
  ]);

  return {
    eventsTotal: Number(eventsTotal[0]?.total ?? 0n),
    failedLogins: Number(failedLogins[0]?.total ?? 0n),
    activeDevices: Number(activeDevices[0]?.total ?? 0n),
    openAlerts: Number(openAlerts[0]?.total ?? 0n)
  };
}
