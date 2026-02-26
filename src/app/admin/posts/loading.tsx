export default function PostsLoading() {
    return (
        <div className="space-y-4 p-4">
            <div className="h-10 w-48 animate-pulse rounded-xl border border-white/25 bg-white/10" />
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div className="h-20 animate-pulse rounded-xl border border-white/20 bg-white/10" key={i} />
                ))}
            </div>
        </div>
    );
}
