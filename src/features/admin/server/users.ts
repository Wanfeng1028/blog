import "server-only";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createUserSchema } from "@/features/admin/server-schema";

export async function createUser(input: unknown) {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid user payload");
  }
  const data = parsed.data;
  const exists = await db.user.findUnique({
    where: { email: data.email }
  });
  if (exists) throw new Error("Email already exists");

  const passwordHash = await bcrypt.hash(data.password, 12);

  return db.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      passwordHash
    }
  });
}
