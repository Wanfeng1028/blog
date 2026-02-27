import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppChrome } from "@/components/app-chrome";
import { Providers } from "@/components/providers";
import { siteConfig } from "@/lib/site";
import "./globals.css";
import { Inter, JetBrains_Mono, Noto_Sans_SC } from "next/font/google";
import { cookies } from "next/headers";
import { getDictionary, type SupportedLang } from "@/features/i18n/get-dictionary";

// 主 UI / 正文字体（Latin + 数字）
const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap"
});

// 代码字体
const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"]
});

// 中文 fallback（Noto Sans SC，谷歌 CDN，按需加载）
const chineseFont = Noto_Sans_SC({
  subsets: ["latin"],
  variable: "--font-zh",
  display: "swap",
  weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description
  }
};

export default async function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("site_lang")?.value || "zh") as SupportedLang;
  const dictionary = await getDictionary(lang);

  return (
    <html lang={lang === "zh" ? "zh-CN" : "en"} suppressHydrationWarning>
      {/* 霞鹜文楷 Screen 版 — 专为屏幕阅读优化的文艺中文字体 */}
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen-webfont@1.1.0/style.css"
        />
      </head>
      <body className={`${sansFont.variable} ${monoFont.variable} ${chineseFont.variable} min-h-dvh`}>
        <Providers lang={lang} dictionary={dictionary}>
          <AppChrome>{children}</AppChrome>
        </Providers>
      </body>
    </html>
  );
}
