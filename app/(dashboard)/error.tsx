"use client";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#050508' }}>
            <div className="text-center max-w-md">
                <div className="w-14 h-14 mx-auto mb-5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                </div>
                <h2 className="text-2xl font-medium text-white mb-2">Dashboard Error</h2>
                <p className="text-sm text-gray-400 font-mono mb-6">{error.message || 'An unexpected error occurred'}</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={reset} className="px-5 py-2.5 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-primary/80 transition-colors">
                        Retry
                    </button>
                    <a href="/app" className="px-5 py-2.5 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-xs font-bold uppercase tracking-wide hover:bg-white/10 transition-colors">
                        Dashboard Home
                    </a>
                </div>
            </div>
        </div>
    );
}
