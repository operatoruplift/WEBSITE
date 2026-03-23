export default function Loading() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <span className="text-xs font-mono text-gray-600 uppercase tracking-widest">Loading</span>
            </div>
        </div>
    );
}
