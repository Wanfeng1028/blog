export const siteConfig = {
  name: "Wanfeng Blog",
  description: "A full-stack personal blog powered by Next.js App Router.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  author: "Wanfeng",
  links: {
    github: "https://github.com/",
    email: "hello@example.com"
  }
};

export function absoluteUrl(path: string) {
  return `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
}
