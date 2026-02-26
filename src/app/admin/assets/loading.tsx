export default function AssetsLoading() {
    return (
        <div className="space-y-4 p-4">
            <div className="h-10 w-40 animate-pulse rounded-xl border border-white/25 bg-white/10" />
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div className="aspect-square animate-pulse rounded-xl border border-white/20 bg-white/10" key={i} />
                ))}
            </div>
        </div>
    );
}
