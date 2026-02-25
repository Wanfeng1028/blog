export default function BlogLoading() {
  return (
    <div className="space-y-5">
      <div className="h-12 animate-pulse rounded-2xl border border-white/45 bg-white/55" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="h-48 animate-pulse rounded-2xl border border-white/45 bg-white/55" key={index} />
        ))}
      </div>
    </div>
  );
}
