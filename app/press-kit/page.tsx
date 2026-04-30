'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { ArrowRight, Check, Mail } from 'lucide-react';

/**
 * Press Kit, gated by a simple email capture. Anything we can't verify
 * publicly (former media mentions, follower badges, etc.) lives here and
 * is sent on request.
 */

export default function PressKitPage() {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        if (!email) return;
        try {
            await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, source: 'press-kit' }),
            });
        } catch { /* best-effort */ }
        setSubmitted(true);
    };

    return (
        <div className="theme-light min-h-screen bg-background text-foreground">
            <Navbar currentPage="press-kit" />

            <main className="pt-32 pb-20 px-6 md:px-12">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <span className="h-px w-16 bg-[#F97316]/40" />
                            <span className="text-xs font-bold tracking-[0.25em] text-[#F97316] uppercase">Press Kit</span>
                            <span className="h-px w-16 bg-[#F97316]/40" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4">
                            Press & media resources
                        </h1>
                        <p className="text-muted leading-relaxed">
                            Past coverage, founder bio, product screenshots, and the architecture deck are available on request. Drop your email and we&apos;ll send a kit within 24h.
                        </p>
                    </div>

                    {submitted ? (
                        <div className="rounded-2xl border border-[#F97316]/30 bg-[#F97316]/5 p-8 text-center">
                            <div className="w-12 h-12 rounded-xl bg-[#F97316]/15 border border-[#F97316]/30 flex items-center justify-center mx-auto mb-4">
                                <Check size={22} className="text-[#F97316]" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">Request received</h2>
                            <p className="text-sm text-muted">
                                We&apos;ll send the kit to <span className="font-mono text-white">{email}</span> within 24 hours.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-border bg-card p-8">
                            <label htmlFor="pk-email" className="block text-sm text-muted mb-3">
                                Email
                            </label>
                            <div className="flex items-center gap-2 mb-4">
                                <Mail size={16} className="text-muted shrink-0" />
                                <input
                                    id="pk-email"
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="journalist@outlet.com"
                                    className="flex-1 h-11 bg-background border border-border rounded-lg px-3 text-sm text-foreground placeholder:text-muted focus:border-[#F97316]/50 focus:outline-none transition-colors"
                                />
                            </div>
                            <button
                                onClick={handleSubmit}
                                className="w-full h-11 rounded-lg bg-[#F97316] text-white font-bold uppercase tracking-widest text-sm hover:bg-[#F97316]/90 transition-colors flex items-center justify-center gap-2"
                            >
                                Request Press Kit <ArrowRight size={14} />
                            </button>
                            <p className="text-[11px] text-[#52525B] mt-4 text-center">
                                For product inquiries, use the <Link href="/contact" className="text-[#F97316] hover:underline">contact page</Link>.
                            </p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
