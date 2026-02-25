export default function BlogDetailLoading() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
      <div className="space-y-4">
        <div className="h-10 w-3/4 animate-pulse rounded-xl border border-white/45 bg-white/55" />
        <div className="h-5 w-1/2 animate-pulse rounded-xl border border-white/45 bg-white/55" />
        <div className="h-80 animate-pulse rounded-2xl border border-white/45 bg-white/55" />
      </div>
      <div className="h-56 animate-pulse rounded-2xl border border-white/45 bg-white/55" />
    </div>
  );
}
