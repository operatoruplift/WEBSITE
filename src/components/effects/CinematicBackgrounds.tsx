'use client';

import React, { useEffect, useRef } from 'react';

interface Particle { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number; color: string; }

interface ParticleBackgroundProps {
    particleCount?: number;
    colors?: string[];
    className?: string;
    speed?: number;
    interactive?: boolean;
}

export function ParticleBackground({ particleCount = 80, colors = ['#E77630', '#F97316', '#FFEDD5', '#FFFFFF'], className = '', speed = 0.5 }: ParticleBackgroundProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number>(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        particlesRef.current = Array.from({ length: particleCount }, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5, speedX: (Math.random() - 0.5) * speed,
            speedY: (Math.random() - 0.5) * speed, opacity: Math.random() * 0.4 + 0.1,
            color: colors[Math.floor(Math.random() * colors.length)],
        }));

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particlesRef.current.forEach(p => {
                p.x += p.speedX; p.y += p.speedY;
                if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
                if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
                ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color; ctx.globalAlpha = p.opacity; ctx.fill();
            });
            ctx.globalAlpha = 1;
            animationRef.current = requestAnimationFrame(animate);
        };
        animate();
        return () => { window.removeEventListener('resize', resizeCanvas); cancelAnimationFrame(animationRef.current); };
    }, [particleCount, colors, speed]);

    return <canvas ref={canvasRef} className={`fixed inset-0 pointer-events-none z-0 ${className}`} style={{ background: 'transparent', willChange: 'transform' }} />;
}

export function NebulaBackground({ className = '' }: { className?: string }) {
    return (
        <div className={`fixed inset-0 z-0 ${className}`}>
            <div className="absolute inset-0 bg-[#050508]" />
            <div className="absolute inset-0 opacity-40" style={{
                background: `radial-gradient(ellipse 80% 50% at 20% 20%, rgba(231, 118, 48, 0.1) 0%, transparent 50%),
                    radial-gradient(ellipse 60% 40% at 80% 30%, rgba(249, 115, 22, 0.08) 0%, transparent 40%),
                    radial-gradient(ellipse 70% 60% at 50% 80%, rgba(255, 237, 213, 0.05) 0%, transparent 50%)`
            }} />
            <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: `radial-gradient(1px 1px at 20px 30px, rgba(255,255,255,0.8), transparent),
                    radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.6), transparent),
                    radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.7), transparent),
                    radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.5), transparent),
                    radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.4), transparent),
                    radial-gradient(2px 2px at 160px 120px, rgba(231,118,48,0.8), transparent)`,
                backgroundSize: '200px 200px'
            }} />
            <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.4) 100%)' }} />
        </div>
    );
}
