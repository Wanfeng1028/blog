import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import { consumeShortCodeToken, createSecurityAlert, recordAuthEvent } from "@/lib/auth/security";

const schema = z
  .object({
    email: z.string().email().transform((v) => v.trim().toLowerCase()),
    code: z.string().min(4),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72)
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"]
  });

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const valid = await consumeShortCodeToken(
      `reset-password:${payload.email}`,
      payload.code.trim().toUpperCase()
    );
    if (!valid) {
      await createSecurityAlert({
        alertType: "suspicious_reset",
        severity: "medium",
        email: payload.email,
        message: "重置密码验证码校验失败",
        meta: { email: payload.email }
      });
      return apiError("验证码错误或已过期", 400);
    }

    const hash = await bcrypt.hash(payload.password, 12);
    const user = await db.user.update({
      where: { email: payload.email },
      data: { passwordHash: hash },
      select: { id: true, email: true }
    });

    await recordAuthEvent({
      eventType: "reset_password",
      success: true,
      userId: user.id,
      email: user.email
    });
    return apiOk({ reset: true });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.issues[0]?.message ?? "参数错误", 400);
    return apiError(error instanceof Error ? error.message : "重置失败", 500);
  }
}
