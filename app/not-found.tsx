import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
            <div className="text-center max-w-md">
                <div className="text-[120px] font-black leading-none text-white/[0.03] select-none">404</div>
                <h1 className="text-4xl font-medium text-white tracking-tight -mt-16 mb-4">Page Not Found</h1>
                <p className="text-gray-400 mb-8 font-mono text-sm">
                    The route you requested doesn&apos;t exist or has been moved.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/" className="px-6 py-3 bg-primary text-white rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-primary/80 transition-colors text-center">
                        Go Home
                    </Link>
                    <Link href="/contact" className="px-6 py-3 bg-white/5 border border-white/10 text-gray-300 rounded-lg text-sm font-bold uppercase tracking-wide hover:bg-white/10 transition-colors text-center">
                        Contact Us
                    </Link>
                </div>
                <div className="mt-12 flex items-center justify-center gap-2 text-[10px] font-mono text-gray-600 uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                    Operator Uplift
                </div>
            </div>
        </div>
    );
}
