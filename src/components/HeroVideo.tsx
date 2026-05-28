'use client';

import React, { useEffect, useRef, useState } from 'react';

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
 * the first frame, then streams the rest once play() runs.
 *
 * playsInline keeps iOS Safari from full-screening the video on
 * tap; loop + muted are what enable autoplay across Chrome,
 * Safari, Firefox without a user gesture.
 *
 * 2026-05-28: added an audio toggle in the bottom-right corner so
 * a visitor can unmute the reel without leaving the page. Audio
 * starts muted (required for autoplay), and we expose two corner
 * controls: unmute / mute, and pause / play. Both have visible
 * focus rings and aria-labels for keyboard / screen-reader users.
 */
const HeroVideo: React.FC = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [muted, setMuted] = useState(true);
    const [paused, setPaused] = useState(false);

    // Sync state with actual video element on mount so we don't
    // drift if the video pauses for buffering or the browser blocks
    // autoplay for any reason.
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const onPlay = () => setPaused(false);
        const onPause = () => setPaused(true);
        const onVolumeChange = () => setMuted(v.muted);
        v.addEventListener('play', onPlay);
        v.addEventListener('pause', onPause);
        v.addEventListener('volumechange', onVolumeChange);
        return () => {
            v.removeEventListener('play', onPlay);
            v.removeEventListener('pause', onPause);
            v.removeEventListener('volumechange', onVolumeChange);
        };
    }, []);

    const toggleMute = () => {
        const v = videoRef.current;
        if (!v) return;
        v.muted = !v.muted;
        setMuted(v.muted);
    };

    const togglePlay = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
            void v.play();
        } else {
            v.pause();
        }
    };

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
                        preload="metadata"
                        poster="/video/launch-poster.jpg"
                        aria-label="Operator Uplift launch reel"
                    >
                        <source src="/video/launch-1280.webm" type="video/webm" />
                        <source src="/video/launch-1280.mp4" type="video/mp4" />
                        Your browser does not support inline video. Visit{' '}
                        <a href="/video/launch-1280.mp4">the launch reel</a> directly.
                    </video>

                    {/* Corner controls. Bottom-right, glass pill, fade in on
                        hover for desktop, always-visible on touch. The
                        gradient mask underneath keeps the controls legible
                        against any frame the video lands on. */}
                    <div
                        className="absolute inset-x-0 bottom-0 h-20 pointer-events-none bg-gradient-to-t from-black/40 to-transparent"
                        aria-hidden="true"
                    />
                    <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        <button
                            type="button"
                            onClick={togglePlay}
                            aria-label={paused ? 'Play launch reel' : 'Pause launch reel'}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F08A4C]"
                        >
                            {paused ? <PlayIcon /> : <PauseIcon />}
                        </button>
                        <button
                            type="button"
                            onClick={toggleMute}
                            aria-label={muted ? 'Unmute launch reel' : 'Mute launch reel'}
                            className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F08A4C]"
                        >
                            {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

function PlayIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
        </svg>
    );
}

function PauseIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
            <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
        </svg>
    );
}

function SpeakerOnIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 010 7.07" />
            <path d="M19.07 4.93a10 10 0 010 14.14" />
        </svg>
    );
}

function SpeakerOffIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
        </svg>
    );
}

export default HeroVideo;
