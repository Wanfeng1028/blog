export default function ProjectsLoading() {
  return (
    <div className="space-y-5">
      <div className="h-8 w-48 animate-pulse rounded-xl border border-white/45 bg-white/55" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div className="h-52 animate-pulse rounded-2xl border border-white/45 bg-white/55" key={index} />
        ))}
      </div>
    </div>
  );
}
