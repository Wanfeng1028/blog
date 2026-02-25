import { z } from "zod";
import { db } from "@/lib/db";
import { apiError, apiOk } from "@/lib/utils/api";
import { consumeShortCodeToken, recordAuthEvent } from "@/lib/auth/security";

const schema = z.object({
  email: z.string().email().transform((v) => v.trim().toLowerCase()),
  code: z.string().min(4)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const valid = await consumeShortCodeToken(
      `verify-email:${payload.email}`,
      payload.code.trim().toUpperCase()
    );
    if (!valid) return apiError("验证码错误或已过期", 400);

    const user = await db.user.update({
      where: { email: payload.email },
      data: { emailVerified: new Date() },
      select: { id: true, email: true, role: true, emailVerified: true }
    });

    await recordAuthEvent({
      eventType: "verify_email",
      success: true,
      userId: user.id,
      email: user.email
    });
    return apiOk(user);
  } catch (error) {
    if (error instanceof z.ZodError) return apiError(error.issues[0]?.message ?? "参数错误", 400);
    return apiError(error instanceof Error ? error.message : "激活失败", 500);
  }
}
