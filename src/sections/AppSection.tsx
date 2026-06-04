'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

/**
 * App section, 2026-05-22 v2-canvas addition.
 *
 * The v2 design canvas places a dedicated /02.5 · THE APP/ board
 * between the problem section and the how-it-works section. It
 * demonstrates the product UI with three side-by-side phone
 * mockups (Today / The daily yes-no / Progress), the
 * "designed for iOS, Android, watch" frame, and the one-liner on
 * lockscreen widgets + one-tap check-ins.
 *
 * The mockups are CSS-only phone frames with mono text content. No
 * raster app screenshots are shipped because the iOS + Android apps
 * are not built yet (the homepage badge says "Now in private beta ·
 * iOS & Android coming soon"). The mockups are clearly stylized as
 * conceptual previews, not pixel-faithful product captures.
 */
const AppSection: React.FC = () => {
    return (
        <section
            id="app"
            aria-labelledby="app-heading"
            className="relative w-full px-6 md:px-12 flex flex-col justify-center"
            style={{
                minHeight: '720px',
                paddingTop: 'clamp(80px, 12vw, 140px)',
                paddingBottom: 'clamp(80px, 12vw, 140px)',
                // Floor only, no vh cap (see ProblemSection rationale).
            }}
        >
            <div className="max-w-[1200px] mx-auto w-full">
                <FadeIn block>
                    <div className="text-center">
                        <span className="font-mono text-[11px] tracking-[0.2em] text-primary uppercase inline-flex items-center gap-3">
                            <span className="h-px w-6 bg-primary inline-block" />
                            02 · The app
                            <span className="h-px w-6 bg-primary inline-block" />
                        </span>
                        <h2
                            id="app-heading"
                            className="mt-6 mx-auto max-w-[800px] font-medium tracking-[-0.04em] leading-[0.98] text-foreground"
                            style={{ fontSize: 'clamp(30px, 4.6vw, 64px)' }}
                        >
                            Three taps.<br />
                            One honest answer a day.
                        </h2>
                        <p
                            className="mt-6 mx-auto max-w-[640px] text-foreground/75 leading-relaxed"
                            style={{ fontSize: 'clamp(15px, 1.15vw, 18px)' }}
                        >
                            Built natively for iOS and Android. The whole thing fits on one screen, because the work is in your life, not in the app.
                        </p>
                    </div>
                </FadeIn>

                <FadeIn delay={150} block>
                    <div className="mt-14 md:mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-10">
                        <PhoneFrame label="01 · Today">
                            <TodayScreen />
                        </PhoneFrame>
                        <PhoneFrame label="02 · The daily yes/no">
                            <CheckInScreen />
                        </PhoneFrame>
                        <PhoneFrame label="03 · Progress">
                            <ProgressScreen />
                        </PhoneFrame>
                    </div>
                </FadeIn>

                {/* Designed-for line stays as a feature preview; the
                    App Store + Google Play badge row was removed
                    2026-06-04 because DownloadSection (the dedicated
                    "/04 · DOWNLOAD/" surface further down the page)
                    already ships the same two badges with the same
                    /waitlist destination. Two identical badge rows
                    within 200px of each other diluted the primary
                    CTA; one canonical surface is cleaner. */}
                <FadeIn delay={300} block>
                    <div className="mt-14 md:mt-20 flex flex-col items-center text-center gap-4">
                        <div className="max-w-[640px]">
                            <span className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
                                Designed for iOS · Android · Watch
                            </span>
                            <p className="mt-3 mx-auto text-foreground/75 leading-relaxed" style={{ fontSize: '15px' }}>
                                Lockscreen widgets. A watch complication. One-tap check-ins. Wherever you already are, that&apos;s where the commitment lives.
                            </p>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </section>
    );
};

/**
 * Stylized phone frame. CSS-only, no raster image. The label sits
 * below as a mono caption to make it obvious these are conceptual
 * mockups, not pixel-faithful product screenshots.
 */
function PhoneFrame({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center">
            <div
                className="relative w-full max-w-[240px] aspect-[9/19] border border-foreground/[0.16] bg-[#0d0d0e] overflow-hidden"
                style={{ borderRadius: '34px', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' }}
            >
                {/* Notch */}
                <div
                    className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-[#0a0a0b] z-10"
                    style={{ borderRadius: '14px' }}
                    aria-hidden="true"
                />
                {/* Screen content */}
                <div className="absolute inset-2 rounded-[26px] overflow-hidden">
                    {children}
                </div>
            </div>
            <span className="mt-5 font-mono text-[10px] tracking-[0.18em] text-muted uppercase">
                {label}
            </span>
        </div>
    );
}

function TodayScreen() {
    return (
        <div className="w-full h-full bg-[#0a0a0b] px-3 pt-8 pb-3 flex flex-col gap-3 font-mono text-[10px] text-foreground/85">
            <div className="flex justify-between text-[9px] text-muted">
                <span>Today</span>
                <span className="w-2 h-2 rounded-full bg-foreground/20 inline-block" />
            </div>
            <div className="mt-1">
                <div className="text-[28px] font-medium text-foreground leading-none">14</div>
                <div className="text-[8px] tracking-wider text-muted uppercase mt-1">Commitments live</div>
            </div>
            <div className="mt-2 px-2 py-2 border border-foreground/[0.16] bg-foreground/[0.02]">
                <div className="text-[10px] text-foreground">Run 4× this week</div>
                <div className="text-[8px] text-muted mt-0.5">$50 staked · day 3 of 7</div>
                <div className="mt-1.5 text-[8px] text-primary tracking-wider">CHECK IN</div>
            </div>
            <div className="px-2 py-2 border border-foreground/[0.16] bg-foreground/[0.02]">
                <div className="text-[10px] text-foreground">Ship v1 by friday</div>
                <div className="text-[8px] text-muted mt-0.5">$200 staked · day 1 of 4</div>
                <div className="mt-1.5 text-[8px] text-primary tracking-wider">CHECK IN</div>
            </div>
        </div>
    );
}

function CheckInScreen() {
    return (
        <div className="w-full h-full bg-[#0a0a0b] px-3 pt-8 pb-3 flex flex-col font-mono text-[10px] text-foreground/85">
            <div className="flex justify-between text-[9px] text-muted">
                <span>Today</span>
                <span>4:13 pm</span>
            </div>
            <div className="mt-6 text-[18px] font-medium text-foreground leading-tight">
                Did you do it<br />today?
            </div>
            <div className="mt-1 text-[9px] text-muted">
                Run 4× this week, three answers cover the next 48 hours.
            </div>
            <div className="mt-5 space-y-2">
                <div className="px-2 py-2 bg-primary text-[#0a0a0b] text-[10px] flex items-center justify-between">
                    <span>YES · DONE</span>
                    <span>→</span>
                </div>
                <div className="px-2 py-2 border border-foreground/[0.16] text-[10px] flex items-center justify-between">
                    <span>NOT YET · REMIND ME 6PM</span>
                    <span>→</span>
                </div>
                <div className="px-2 py-2 border border-foreground/[0.16] text-[10px] flex items-center justify-between text-foreground/75">
                    <span>NO · MISSED IT</span>
                    <span>→</span>
                </div>
            </div>
        </div>
    );
}

function ProgressScreen() {
    return (
        <div className="w-full h-full bg-[#0a0a0b] px-3 pt-8 pb-3 flex flex-col font-mono text-[10px] text-foreground/85">
            <div className="flex justify-between text-[9px] text-muted">
                <span>Progress</span>
                <span>30d</span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-[8px]">
                <div>
                    <div className="text-foreground text-[14px] font-medium">14</div>
                    <div className="text-muted uppercase tracking-wider">Live</div>
                </div>
                <div>
                    <div className="text-foreground text-[14px] font-medium">85%</div>
                    <div className="text-muted uppercase tracking-wider">Honor</div>
                </div>
                <div>
                    <div className="text-foreground text-[14px] font-medium">$0</div>
                    <div className="text-muted uppercase tracking-wider">Forfeit</div>
                </div>
            </div>
            <div className="mt-4 flex items-end gap-[3px] h-16">
                {[40, 55, 30, 70, 60, 80, 45, 95, 70, 85, 60, 75, 90, 80].map((h, i) => (
                    <span
                        key={i}
                        className={`flex-1 ${i >= 11 ? 'bg-primary' : 'bg-foreground/30'}`}
                        style={{ height: `${h}%` }}
                    />
                ))}
            </div>
            <div className="mt-3 text-[8px] text-muted uppercase tracking-wider">
                Last 14 days
            </div>
            <div className="mt-2 space-y-1 text-[9px]">
                <div className="flex justify-between"><span className="text-foreground/80">Run 4×</span><span className="text-primary">85%</span></div>
                <div className="flex justify-between"><span className="text-foreground/80">Ship v1</span><span className="text-foreground/60">28%</span></div>
                <div className="flex justify-between"><span className="text-foreground/80">No alcohol</span><span className="text-primary">94%</span></div>
            </div>
        </div>
    );
}

export default AppSection;
