import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import { recordAuthEvent } from "@/lib/auth/security";

const schema = z
  .object({
    currentPassword: z.string().min(8).max(72),
    newPassword: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72)
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "两次输入的新密码不一致"
  });

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "USER") return apiError("Unauthorized", 401);

  try {
    const payload = schema.parse(await request.json());
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, email: true, passwordHash: true }
    });
    if (!user) return apiError("User not found", 404);

    const valid = await bcrypt.compare(payload.currentPassword, user.passwordHash);
    if (!valid) return apiError("当前密码不正确", 400);

    const passwordHash = await bcrypt.hash(payload.newPassword, 12);
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    await recordAuthEvent({
      eventType: "reset_password",
      success: true,
      userId: user.id,
      email: user.email
    });

    return apiOk({ changed: true });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.issues[0]?.message ?? "Invalid payload", 400);
    return apiError(error instanceof Error ? error.message : "Failed to change password", 500);
  }
}
