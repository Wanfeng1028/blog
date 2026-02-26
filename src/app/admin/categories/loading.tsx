export default function CategoriesLoading() {
    return (
        <div className="space-y-4 p-4">
            <div className="h-10 w-40 animate-pulse rounded-xl border border-white/25 bg-white/10" />
            <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div className="h-14 animate-pulse rounded-xl border border-white/20 bg-white/10" key={i} />
                ))}
            </div>
        </div>
    );
}
