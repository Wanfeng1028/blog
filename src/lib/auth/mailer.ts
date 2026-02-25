type SendCodeMailInput = {
  to: string;
  subject: string;
  code: string;
  purpose: "verify" | "reset";
};

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type MailProvider = "resend" | "smtp" | "console";

type SendMailResult = {
  delivered: boolean;
  provider: MailProvider;
  debugCode?: string;
  messageId?: string;
};

function resolveProvider(): MailProvider {
  const configured = (process.env.MAIL_PROVIDER ?? "").toLowerCase();
  if (configured === "resend" || configured === "smtp" || configured === "console") {
    return configured;
  }
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  return "console";
}

async function sendByResend(input: SendMailInput, from: string): Promise<SendMailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("MAIL_PROVIDER=resend but RESEND_API_KEY is missing");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Resend failed: ${text}`);
  }

  const data = (await response.json()) as { id?: string };
  return { delivered: true, provider: "resend", messageId: data.id };
}

async function sendBySmtp(input: SendMailInput, from: string): Promise<SendMailResult> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("MAIL_PROVIDER=smtp requires SMTP_HOST, SMTP_USER, SMTP_PASS");
  }

  const importer = new Function("m", "return import(m)") as (m: string) => Promise<any>;
  const nodemailerModule = await importer("nodemailer");
  const nodemailer = nodemailerModule.default ?? nodemailerModule;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465 ? true : process.env.SMTP_SECURE === "true",
    auth: { user, pass }
  });

  const info = await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text
  });

  return { delivered: true, provider: "smtp", messageId: info.messageId };
}

export async function sendMail(input: SendMailInput): Promise<SendMailResult> {
  const from = process.env.AUTH_MAIL_FROM ?? "service.ai@outlook.com";
  const provider = resolveProvider();

  if (provider === "resend") return sendByResend(input, from);
  if (provider === "smtp") return sendBySmtp(input, from);

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[MAIL:console] to=${input.to} subject=${input.subject}`);
    // eslint-disable-next-line no-console
    console.log(input.text ?? input.html);
  }
  return { delivered: false, provider: "console" };
}

export async function sendCodeMail(input: SendCodeMailInput): Promise<SendMailResult> {
  const text =
    input.purpose === "verify"
      ? `欢迎来到晚风的博客，您的注册验证码为：${input.code}`
      : `欢迎来到晚风的博客，您的重置密码验证码为：${input.code}`;
  const html = `<p>${text}</p>`;

  const result = await sendMail({
    to: input.to,
    subject: input.subject,
    html,
    text
  });

  if (!result.delivered && result.provider === "console") {
    return { ...result, debugCode: input.code };
  }
  return result;
}
