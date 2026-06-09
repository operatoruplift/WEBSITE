'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Hero video. 2026-05-28 native-controls swap: the custom corner
 * play/pause + mute buttons (PR #753) didn't surface a volume
 * slider, which left users with no way to tune audio levels. The
 * unmute toggle dumped the reel at full system volume the moment
 * they clicked. Switch to the browser's native <video controls>
 * UI so users get scrubber, play/pause, mute toggle, volume
 * slider, and fullscreen in one familiar bar.
 *
 * Files: public/video/launch-1280.mp4 (h264 + aac 96k). The
 * WebM source was dropped 2026-06-03 because two-pass VP9 ended
 * up larger than the MP4 for this specific content (heavy text
 * + simple graphics, where H.264 has no efficiency disadvantage),
 * meaning every WebM-preferring browser was paying a larger
 * download. H.264 has universal browser support so a single
 * source is fine.
 *
 * Autoplay muted (the only way modern browsers allow inline
 * autoplay). A jpg poster paints before the first frame so we
 * never flash black during decode.
 *
 * Default volume is 0.3 (30%) so when the user clicks unmute the
 * reel doesn't blast their speakers, a soft default that they
 * can raise with the native volume slider if they want more.
 *
 * controlsList="nodownload" hides the "Download video" item from
 * the browser controls menu since the launch reel is not meant
 * to be a downloadable asset.
 */
const HeroVideo: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);

    // Set a conservative default volume so the first unmute click
    // doesn't blast the speakers. We can't ship `volume=0.3` as an
    // attribute (HTML doesn't expose volume as a markup attribute);
    // the imperative property is the only way.
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        v.volume = 0.3;
    }, []);

    // Respect prefers-reduced-motion: pause autoplay on mount so a
    // user with the OS-level motion-reduction preference doesn't get
    // a looping video they didn't ask for. The poster still paints
    // and the native controls let them play on demand. The global
    // CSS reduced-motion block only neutralizes CSS transitions, so
    // we need a JS guard for HTMLMediaElement playback specifically.
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        const apply = () => {
            if (reduced.matches && !v.paused) v.pause();
        };
        apply();
        reduced.addEventListener('change', apply);
        return () => reduced.removeEventListener('change', apply);
    }, []);

    // Pause when scrolled offscreen, resume when back in view.
    // Most browsers throttle offscreen autoplay heavily, but an
    // explicit pause is cleaner, saves battery on mobile/laptop,
    // and respects users who want the reel paused for scroll
    // performance. We only auto-resume if the video was playing
    // when it left the viewport, so a user who manually paused
    // it (via native controls) does not get re-played on scroll.
    // Reduced-motion users never auto-resume since wasPlayingWhenLeft
    // stays false (the prior effect paused them on mount).
    useEffect(() => {
        const v = videoRef.current;
        if (!v || typeof IntersectionObserver === 'undefined') return;

        const reducedMotion =
            window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        let wasPlayingWhenLeft = false;

        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        if (wasPlayingWhenLeft && v.paused && !reducedMotion) {
                            // Promise rejection ignored: autoplay can fail
                            // (user-gesture policies, fullscreen), no need
                            // to surface those.
                            v.play().catch(() => {});
                        }
                    } else {
                        wasPlayingWhenLeft = !v.paused;
                        if (!v.paused) v.pause();
                    }
                }
            },
            { threshold: 0.1 },
        );
        io.observe(v);
        return () => io.disconnect();
    }, []);

    return (
        <div className="relative w-full max-w-[1080px] mx-auto">
            {/* No hard bottom edge: the frame keeps its rounded top + side
                borders but the bottom is borderless so the video can melt
                into the page below. The gradient scrim (further down) fades
                the dark reel into --background, so the hero merges into the
                problem section with no visible dividing line. */}
            <div className="relative rounded-2xl rounded-b-none overflow-hidden border border-b-0 border-foreground/[0.08] bg-foreground/[0.02] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.4)]">
                {/* aspect-ratio holds the box at 16:9 (1080p source) so
                    nothing shifts when the video metadata lands. */}
                <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                    <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        controls
                        controlsList="nodownload"
                        preload="metadata"
                        poster="/video/launch-poster.jpg"
                        aria-label="Operator Uplift launch reel"
                    >
                        <source src="/video/launch-1280.mp4" type="video/mp4" />
                        Your browser does not support inline video. Visit{' '}
                        <a href="/video/launch-1280.mp4">the launch reel</a> directly.
                    </video>
                    {/* Bottom fade scrim: transparent -> page background so the
                        dark reel dissolves into the section below instead of
                        ending in a hard horizontal edge. pointer-events-none
                        keeps the native controls clickable through it. */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background"
                    />
                </div>
            </div>
        </div>
    );
};

export default HeroVideo;
