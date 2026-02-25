export default function AdminLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-10 w-56 animate-pulse rounded-xl border border-white/25 bg-white/10" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="h-32 animate-pulse rounded-xl border border-white/20 bg-white/10" key={index} />
        ))}
      </div>
    </div>
  );
}
