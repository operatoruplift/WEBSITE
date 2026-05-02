/**
 * Global loading state. Wrapped in `.theme-light` to match the
 * marketing surfaces (homepage, /docs, /pricing, /blog) so a slow
 * route transition doesn't briefly flash the dashboard's dark chrome
 * before the destination route renders.
 */
export default function Loading() {
    return (
        <div className="theme-light min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-xs font-mono text-muted uppercase tracking-widest">Loading</span>
            </div>
        </div>
    );
}
