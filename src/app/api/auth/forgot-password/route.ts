import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import {
  consumeShortCodeToken,
  generateCode,
  isRateLimitedDistributed,
  recordAuthEvent,
  saveShortCodeToken
} from "@/lib/auth/security";
import { sendCodeMail } from "@/lib/auth/mailer";

const schema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  captchaId: z.string().min(1),
  captchaAnswer: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const captchaValid = await consumeShortCodeToken(
      `captcha:${payload.captchaId}`,
      payload.captchaAnswer.trim().toUpperCase()
    );
    if (!captchaValid) return apiError("验证码错误或已过期", 400);

    if (await isRateLimitedDistributed(`forgot:${payload.email}`, 5, 60_000)) {
      return apiError("请求过于频繁，请稍后再试", 429);
    }

    const user = await db.user.findUnique({
      where: { email: payload.email },
      select: { id: true, email: true }
    });
    if (!user) return apiOk({ sent: true });

    const code = generateCode(6);
    await saveShortCodeToken(`reset-password:${user.email}`, code, 10);
    const mail = await sendCodeMail({
      to: user.email,
      subject: "晚风博客重置密码验证码",
      code,
      purpose: "reset"
    });

    await recordAuthEvent({
      eventType: "forgot_password",
      success: true,
      userId: user.id,
      email: user.email
    });

    return apiOk({
      sent: true,
      ...(process.env.NODE_ENV !== "production" && "debugCode" in mail ? { debugCode: mail.debugCode } : {})
    });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.issues[0]?.message ?? "参数错误", 400);
    return apiError(error instanceof Error ? error.message : "请求失败", 500);
  }
}
