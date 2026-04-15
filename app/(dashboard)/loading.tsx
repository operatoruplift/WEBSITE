export default function DashboardLoading() {
    return (
        <div className="min-h-screen p-6 lg:p-8" style={{ background: '#050508' }}>
            <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
                {/* Header skeleton */}
                <div className="flex items-end justify-between">
                    <div>
                        <div className="h-4 w-32 bg-foreground/[0.04] rounded mb-3" />
                        <div className="h-10 w-72 bg-foreground/[0.04] rounded" />
                    </div>
                    <div className="h-10 w-40 bg-foreground/[0.04] rounded" />
                </div>
                {/* Stats skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 rounded-2xl bg-foreground/[0.04] border border-foreground/10" />
                    ))}
                </div>
                {/* Content skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="col-span-2 h-96 rounded-2xl bg-foreground/[0.04] border border-foreground/10" />
                    <div className="h-96 rounded-2xl bg-foreground/[0.04] border border-foreground/10" />
                </div>
            </div>
        </div>
    );
}
