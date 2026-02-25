import { z } from "zod";
import { requireAdmin } from "@/lib/auth/guards";
import { sendMail } from "@/lib/auth/mailer";
import { apiError, apiOk } from "@/lib/utils/api";

const schema = z.object({
  to: z.string().email().transform((value) => value.trim().toLowerCase())
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const payload = schema.parse(await request.json());
    const now = new Date().toLocaleString("zh-CN", { hour12: false });

    const result = await sendMail({
      to: payload.to,
      subject: "Wanfeng Blog 发信联调测试",
      text: `这是一封联调测试邮件，发送时间：${now}`,
      html: `<p>这是一封联调测试邮件。</p><p>发送时间：<b>${now}</b></p>`
    });

    return apiOk(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(error.issues[0]?.message ?? "Invalid payload", 400);
    }
    const message = error instanceof Error ? error.message : "Failed to send test mail";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 500;
    return apiError(message, status);
  }
}
