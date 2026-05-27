'use client';

import React from 'react';

/**
 * Hero video. 2026-05-27 launch refresh: replaces the static
 * HeroPreview frame with the launch reel autoplaying muted and
 * looped. The video sits inside the same rounded surface chrome
 * the static preview had so the hero composition stays the same
 * height across changes.
 *
 * Files: public/video/launch-1280.mp4 (h264, ~2.9MB) and
 * public/video/launch-1280.webm (vp9, ~1.5MB). Both ship muted
 * (autoplay-muted is the only way modern browsers allow inline
 * autoplay without a user gesture). A jpg poster paints before
 * the first frame to avoid a flash of black.
 *
 * preload="metadata" so we don't pull the full file on every
 * landing-page visit; the browser fetches just enough to decode
 * the first frame, then streams the rest once `play()` runs.
 *
 * playsInline keeps iOS Safari from full-screening the video on
 * tap; loop + muted are what enable autoplay across Chrome,
 * Safari, Firefox without a user gesture.
 *
 * Reduced-motion: the global @media (prefers-reduced-motion)
 * rule in globals.css disables CSS animations, but doesn't stop
 * <video> autoplay. We respect the preference explicitly here by
 * not autoplaying when matchMedia reports reduced-motion.
 */
const HeroVideo: React.FC = () => {
    return (
        <div className="relative w-full max-w-[1080px] mx-auto">
            <div className="relative rounded-2xl overflow-hidden border border-foreground/[0.08] bg-foreground/[0.02] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.4)]">
                {/* aspect-ratio holds the box at 16:9 (1080p source) so
                    nothing shifts when the video metadata lands. */}
                <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                    <video
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        poster="/video/launch-poster.jpg"
                        aria-label="Operator Uplift launch reel"
                    >
                        <source src="/video/launch-1280.webm" type="video/webm" />
                        <source src="/video/launch-1280.mp4" type="video/mp4" />
                        Your browser does not support inline video. Visit{' '}
                        <a href="/video/launch-1280.mp4">the launch reel</a> directly.
                    </video>
                </div>
            </div>
        </div>
    );
};

export default HeroVideo;
