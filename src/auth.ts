import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  consumeShortCodeToken,
  createSecurityAlert,
  isRateLimitedDistributed,
  recordAuthEvent,
  upsertDevice
} from "@/lib/auth/security";

const credentialSchema = z.object({
  email: z.string().email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8),
  captchaId: z.string().min(1),
  captchaAnswer: z.string().min(1),
  deviceId: z.string().min(8).optional(),
  userAgent: z.string().optional(),
  ip: z.string().optional()
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    Credentials({
      name: "Email/Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      authorize: async (credentials) => {
        const parsed = credentialSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password, captchaId, captchaAnswer, deviceId, userAgent, ip } = parsed.data;
        const captchaValid = await consumeShortCodeToken(
          `captcha:${captchaId}`,
          captchaAnswer.trim().toUpperCase()
        );
        if (!captchaValid) {
          await recordAuthEvent({
            eventType: "login",
            success: false,
            email,
            ip: ip ?? null,
            userAgent: userAgent ?? null,
            deviceId: deviceId ?? null,
            detail: { reason: "captcha_invalid" }
          });
          return null;
        }

        const max = Number(process.env.RATE_LIMIT_MAX_LOGIN ?? 10);
        const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
        if (await isRateLimitedDistributed(`login:${email}`, max, windowMs)) {
          await recordAuthEvent({
            eventType: "login",
            success: false,
            email,
            ip: ip ?? null,
            userAgent: userAgent ?? null,
            deviceId: deviceId ?? null,
            detail: { reason: "rate_limited" }
          });
          await createSecurityAlert({
            alertType: "repeated_login_failure",
            severity: "medium",
            email,
            message: "登录失败次数过多，已触发限流。",
            meta: { email, ip, deviceId }
          });
          return null;
        }

        const user = await db.user.findUnique({ where: { email } });

        if (!user?.passwordHash) {
          await recordAuthEvent({
            eventType: "login",
            success: false,
            email,
            ip: ip ?? null,
            userAgent: userAgent ?? null,
            deviceId: deviceId ?? null,
            detail: { reason: "user_not_found" }
          });
          return null;
        }

        if ((process.env.AUTH_REQUIRE_EMAIL_VERIFIED ?? "true") === "true" && !user.emailVerified) {
          await recordAuthEvent({
            eventType: "login",
            success: false,
            userId: user.id,
            email,
            ip: ip ?? null,
            userAgent: userAgent ?? null,
            deviceId: deviceId ?? null,
            detail: { reason: "email_not_verified" }
          });
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          await recordAuthEvent({
            eventType: "login",
            success: false,
            userId: user.id,
            email,
            ip: ip ?? null,
            userAgent: userAgent ?? null,
            deviceId: deviceId ?? null,
            detail: { reason: "password_invalid" }
          });
          return null;
        }

        if (deviceId) {
          const knownDevice = await upsertDevice(user.id, deviceId, userAgent, ip);
          if (!knownDevice) {
            await createSecurityAlert({
              alertType: "new_device",
              severity: "low",
              userId: user.id,
              email: user.email,
              message: "检测到新设备登录。",
              meta: { deviceId, userAgent, ip }
            });
          }
        }

        await recordAuthEvent({
          eventType: "login",
          success: true,
          userId: user.id,
          email,
          ip: ip ?? null,
          userAgent: userAgent ?? null,
          deviceId: deviceId ?? null
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role ?? "USER";
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = (token.role as "ADMIN" | "USER") ?? "USER";
      }
      return session;
    }
  },
  trustHost: process.env.AUTH_TRUST_HOST === "true",
  secret: process.env.AUTH_SECRET
});
