import { cache } from "react";
import { auth } from "@/auth";

const getCachedSession = cache(async () => auth());

export async function getSessionOrThrow() {
  const session = await getCachedSession();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function requireAdmin() {
  const session = await getSessionOrThrow();
  if (session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export async function requireUser() {
  // Any authenticated user (USER or ADMIN) can access user-facing pages.
  // Only check that a valid session exists.
  const session = await getSessionOrThrow();
  return session;
}
