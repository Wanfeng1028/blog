import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import {
  consumeShortCodeToken,
  createSecurityAlert,
  generateCode,
  isRateLimitedDistributed,
  recordAuthEvent,
  saveShortCodeToken
} from "@/lib/auth/security";
import { sendCodeMail } from "@/lib/auth/mailer";

const registerSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    email: z.string().email().transform((value) => value.trim().toLowerCase()),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
    captchaId: z.string().min(1),
    captchaAnswer: z.string().min(1),
    ip: z.string().optional(),
    userAgent: z.string().optional()
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"]
  });

export async function POST(request: Request) {
  try {
    const payload = registerSchema.parse(await request.json());

    const captchaValid = await consumeShortCodeToken(
      `captcha:${payload.captchaId}`,
      payload.captchaAnswer.trim().toUpperCase()
    );
    if (!captchaValid) {
      return apiError("验证码错误或已过期", 400);
    }

    const max = Number(process.env.RATE_LIMIT_MAX_REGISTER ?? 5);
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
    if (await isRateLimitedDistributed(`register:${payload.email}`, max, windowMs)) {
      return apiError("注册请求过于频繁，请稍后再试", 429);
    }

    const exists = await db.user.findUnique({ where: { email: payload.email } });
    if (exists) {
      return apiError("邮箱已存在", 409);
    }

    const passwordHash = await bcrypt.hash(payload.password, 12);
    const user = await db.user.create({
      data: {
        email: payload.email,
        name: payload.name,
        role: "USER",
        passwordHash
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    const verifyCode = generateCode(6);
    await saveShortCodeToken(`verify-email:${user.email}`, verifyCode, 10);
    const mail = await sendCodeMail({
      to: user.email,
      subject: "晚风博客注册验证码",
      code: verifyCode,
      purpose: "verify"
    });

    await recordAuthEvent({
      eventType: "register",
      success: true,
      userId: user.id,
      email: user.email,
      ip: payload.ip ?? null,
      userAgent: payload.userAgent ?? null,
      detail: { emailVerified: false }
    });

    return apiOk(
      {
        ...user,
        needsEmailVerify: true,
        ...(process.env.NODE_ENV !== "production" && "debugCode" in mail
          ? { debugCode: mail.debugCode }
          : {})
      },
      201
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(error.issues[0]?.message ?? "请求参数错误", 400);
    }
    await createSecurityAlert({
      alertType: "suspicious_reset",
      severity: "low",
      message: "注册流程出现异常",
      meta: { error: error instanceof Error ? error.message : String(error) }
    });
    return apiError(error instanceof Error ? error.message : "注册失败", 500);
  }
}
