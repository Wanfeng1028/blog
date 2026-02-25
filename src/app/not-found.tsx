import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-3 py-16 text-center">
      <h1 className="text-3xl font-semibold">404</h1>
      <p className="text-muted">页面不存在或已被移除。</p>
      <Link className="text-primary hover:underline" href="/">
        返回首页
      </Link>
    </div>
  );
}
