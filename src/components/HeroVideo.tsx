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
 * Files: public/video/launch-1280.mp4 (h264 + aac 96k) and
 * public/video/launch-1280.webm (vp9 + opus 96k). Both autoplay
 * muted (the only way modern browsers allow inline autoplay).
 * A jpg poster paints before the first frame so we never flash
 * black during decode.
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

    // Pause when scrolled offscreen, resume when back in view.
    // Most browsers throttle offscreen autoplay heavily, but an
    // explicit pause is cleaner, saves battery on mobile/laptop,
    // and respects users who want the reel paused for scroll
    // performance. We only auto-resume if the video was playing
    // when it left the viewport, so a user who manually paused
    // it (via native controls) does not get re-played on scroll.
    useEffect(() => {
        const v = videoRef.current;
        if (!v || typeof IntersectionObserver === 'undefined') return;

        let wasPlayingWhenLeft = false;

        const io = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        if (wasPlayingWhenLeft && v.paused) {
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
            <div className="relative rounded-2xl overflow-hidden border border-foreground/[0.08] bg-foreground/[0.02] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.4)]">
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
