'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';

/**
 * Press Kit, immediate-download version.
 *
 * The earlier version gated everything behind an email form that
 * promised a 24h email delivery, except no transactional email
 * infrastructure was wired up so journalists who requested the kit
 * received nothing. The honest fix is to surface every asset
 * directly on the page with download links, and route press
 * inquiries to the contact email for anything that genuinely needs
 * a personal reply (founder bio details, exclusive screenshots).
 */

interface AssetRow {
    label: string;
    href: string;
    note: string;
}

const BRAND_ASSETS: AssetRow[] = [
    {
        label: 'Operator Uplift mark (PNG)',
        href: '/brand/operator-uplift-mark.png',
        note: 'Primary brand mark on transparent background.',
    },
    {
        label: 'Open Graph image (1200x630 PNG)',
        href: '/opengraph-image',
        note: 'Social-share card with the headline lockup. Auto-generated; pulls the latest brand palette.',
    },
];

interface FactRow {
    label: string;
    value: string;
}

const FACT_SHEET: FactRow[] = [
    { label: 'Company', value: 'Operator Uplift, Inc.' },
    { label: 'Founded', value: '2026, San Francisco' },
    { label: 'Founder', value: 'Matthew Sim (solo)' },
    { label: 'Positioning', value: 'Commitment infrastructure for people who actually ship.' },
    { label: 'Mechanism', value: 'commit, stake, prove, settle' },
    { label: 'Stage', value: 'Private beta. iOS + Android apps coming soon.' },
    { label: 'How it settles', value: 'User stake locks in escrow, AI Game Master adjudicates check-ins, the protocol returns or redistributes the stake on-chain.' },
    { label: 'Press email', value: 'operatoruplift@gmail.com' },
];

const PALETTE = [
    { name: 'Primary', hex: '#F08A4C', note: 'Brand orange. Used for accents and active states.' },
    { name: 'Background', hex: '#0A0A0B', note: 'Deep black field across every marketing surface.' },
    { name: 'Foreground', hex: '#F4F4F5', note: 'Primary text on dark surfaces.' },
    { name: 'Muted', hex: '#71717A', note: 'Secondary text and hairlines.' },
];

const HEADLINE_OPTIONS = [
    'Keep your word. Bet on yourself.',
    'Commitment infrastructure for people who actually ship.',
    'Real money, visible proof, consequences people cannot talk their way out of.',
];

export default function PressKitPage() {
    return (
        <div className="relative w-full bg-background min-h-screen text-foreground">
            <div className="bg-grid-dots" aria-hidden="true" />
            <Navbar currentPage="press-kit" />

            <main className="relative z-10 pt-32 pb-20 px-6 md:px-12">
                <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-3 mb-4">
                            <span className="h-px w-16 bg-[#F08A4C]/40" />
                            <span className="text-xs font-bold tracking-[0.25em] text-[#F08A4C] uppercase">Press Kit</span>
                            <span className="h-px w-16 bg-[#F08A4C]/40" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-medium text-foreground tracking-tight mb-4">
                            Press &amp; media resources
                        </h1>
                        <p className="text-muted leading-relaxed">
                            Direct downloads, the company fact sheet, brand palette, and approved headline copy. For interviews or anything specific to your story, email <a className="text-[#F08A4C] underline" href="mailto:operatoruplift@gmail.com">operatoruplift@gmail.com</a> and we&apos;ll reply within a business day.
                        </p>
                    </div>

                    <section aria-labelledby="brand-assets-heading" className="mb-12">
                        <h2 id="brand-assets-heading" className="text-xs font-mono tracking-[0.18em] text-foreground/60 uppercase mb-4 text-center">
                            // Brand assets
                        </h2>
                        <ul className="space-y-3">
                            {BRAND_ASSETS.map(asset => (
                                <li key={asset.href} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-sm font-medium text-foreground">{asset.label}</div>
                                        <p className="text-xs text-muted mt-1 leading-relaxed">{asset.note}</p>
                                    </div>
                                    <a
                                        href={asset.href}
                                        download
                                        className="shrink-0 inline-flex items-center gap-2 px-3 py-2 text-xs font-mono tracking-[0.06em] uppercase rounded-lg border border-[#F08A4C]/40 bg-[#F08A4C]/[0.06] text-[#F08A4C] hover:bg-[#F08A4C]/[0.14] transition-colors"
                                    >
                                        Download
                                        <span aria-hidden="true">↓</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </section>

                    <section aria-labelledby="palette-heading" className="mb-12">
                        <h2 id="palette-heading" className="text-xs font-mono tracking-[0.18em] text-foreground/60 uppercase mb-4 text-center">
                            // Brand palette
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {PALETTE.map(swatch => (
                                <div key={swatch.hex} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 flex items-center gap-4">
                                    <span
                                        className="w-12 h-12 rounded-lg border border-foreground/15 shrink-0"
                                        style={{ background: swatch.hex }}
                                        aria-hidden="true"
                                    />
                                    <div>
                                        <div className="text-sm font-medium text-foreground">{swatch.name}</div>
                                        <div className="font-mono text-xs text-muted">{swatch.hex}</div>
                                        <p className="text-[11px] text-muted/80 mt-1 leading-relaxed">{swatch.note}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section aria-labelledby="facts-heading" className="mb-12">
                        <h2 id="facts-heading" className="text-xs font-mono tracking-[0.18em] text-foreground/60 uppercase mb-4 text-center">
                            // Fact sheet
                        </h2>
                        <dl className="rounded-xl border border-foreground/10 bg-foreground/[0.02] divide-y divide-foreground/10">
                            {FACT_SHEET.map(row => (
                                <div key={row.label} className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-2 sm:gap-6 p-4">
                                    <dt className="text-xs font-mono tracking-wide text-muted/80 uppercase">
                                        {row.label}
                                    </dt>
                                    <dd className="text-sm text-foreground/90 leading-relaxed">
                                        {row.value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </section>

                    <section aria-labelledby="headlines-heading" className="mb-12">
                        <h2 id="headlines-heading" className="text-xs font-mono tracking-[0.18em] text-foreground/60 uppercase mb-4 text-center">
                            // Approved headlines + boilerplate
                        </h2>
                        <ul className="space-y-2">
                            {HEADLINE_OPTIONS.map((line, i) => (
                                <li key={i} className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-4 text-sm text-foreground/90">
                                    <span className="font-mono text-xs text-muted mr-2">{String(i + 1).padStart(2, '0')}</span>
                                    {line}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4 text-xs text-muted leading-relaxed">
                            Boilerplate: <em>Operator Uplift is commitment infrastructure for people who actually ship. Founded in 2026, headquartered in San Francisco. Users declare goals, lock real money in escrow, upload proof on a schedule, and settle on-chain. The protocol returns the stake when the user honors the commitment and redistributes it to operators who kept their word when the user misses.</em>
                        </p>
                    </section>

                    <section aria-labelledby="contact-heading" className="mb-12 text-center">
                        <h2 id="contact-heading" className="text-xs font-mono tracking-[0.18em] text-foreground/60 uppercase mb-4">
                            // Press contact
                        </h2>
                        <p className="text-sm text-foreground/90">
                            <a className="text-[#F08A4C] underline" href="mailto:operatoruplift@gmail.com">operatoruplift@gmail.com</a>
                        </p>
                        <p className="text-xs text-muted mt-2">
                            Founder bio, exclusive product screenshots, or beta-cohort interviews on request.
                        </p>
                        <p className="text-[11px] text-muted/70 mt-4">
                            For product inquiries, use the <Link href="/contact" className="text-[#F08A4C] hover:underline">contact page</Link>.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
