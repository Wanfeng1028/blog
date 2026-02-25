export default function GlobalLoading() {
  return (
    <div className="flex min-h-[40svh] items-center justify-center px-4 pt-24">
      <div className="rounded-2xl border border-white/40 bg-[linear-gradient(180deg,rgba(191,219,254,0.36)_0%,rgba(239,246,255,0.44)_100%)] px-5 py-3 text-sm text-zinc-700 shadow-xl backdrop-blur-xl">
        页面加载中...
      </div>
    </div>
  );
}
