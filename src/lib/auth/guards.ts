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
  const session = await getSessionOrThrow();
  if (session.user.role !== "USER") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
