import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import { generateCode, isRateLimitedDistributed, saveShortCodeToken } from "@/lib/auth/security";
import { sendCodeMail } from "@/lib/auth/mailer";

const schema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase())
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const user = await db.user.findUnique({
      where: { email: payload.email },
      select: { email: true, emailVerified: true }
    });
    if (!user) return apiOk({ sent: true });
    if (user.emailVerified) return apiError("邮箱已激活", 400);

    if (await isRateLimitedDistributed(`verify-resend:${payload.email}`, 5, 60_000)) {
      return apiError("发送过于频繁，请稍后再试", 429);
    }

    const code = generateCode(6);
    await saveShortCodeToken(`verify-email:${payload.email}`, code, 10);
    const mail = await sendCodeMail({
      to: payload.email,
      subject: "晚风博客注册验证码",
      code,
      purpose: "verify"
    });
    return apiOk({
      sent: true,
      ...(process.env.NODE_ENV !== "production" && "debugCode" in mail ? { debugCode: mail.debugCode } : {})
    });
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.issues[0]?.message ?? "参数错误", 400);
    return apiError(error instanceof Error ? error.message : "发送失败", 500);
  }
}
