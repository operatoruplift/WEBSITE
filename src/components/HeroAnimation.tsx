import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  isHero?: boolean;
  isAgent?: boolean;
}

interface HeroAnimationProps {
  className?: string;
}

const HeroAnimation: React.FC<HeroAnimationProps> = ({ className = "w-full h-full block" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let phase: 'FLOW' | 'SPARK' | 'CONNECT' | 'FORM' | 'GUARD' | 'CHAT' = 'FLOW';
    let startTime = Date.now();
    const PRIMARY_COLOR = '#E77630';

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        width = canvas.width = parent.offsetWidth;
        height = canvas.height = parent.offsetHeight;
      }
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = 50;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() + 0.1) * 1.5,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.4 + 0.1,
          isHero: i === 0,
          isAgent: i < 6
        });
      }
    };

    const render = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      
      if (elapsed > 15000) {
        setCompleted(true);
        cancelAnimationFrame(animationFrameId);
        return;
      }

      if (elapsed < 2000) phase = 'FLOW';
      else if (elapsed < 4000) phase = 'SPARK';
      else if (elapsed < 6000) phase = 'CONNECT';
      else if (elapsed < 8500) phase = 'FORM';
      else if (elapsed < 11000) phase = 'GUARD';
      else phase = 'CHAT';

      ctx.clearRect(0, 0, width, height);
      
      const cx = width * 0.65;
      const cy = height * 0.5;

      particles.forEach((p, i) => {
        if (phase === 'FLOW' || phase === 'SPARK') {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x > width) p.x = 0;
          if (p.y > height) p.y = 0;
        } else if (p.isAgent) {
          let tx = cx;
          let ty = cy;
          const orbit = 80;
          if (i === 0) { tx = cx - orbit; ty = cy - orbit; }
          else if (i === 1) { tx = cx + orbit; ty = cy - orbit; }
          else if (i === 2) { tx = cx + orbit; ty = cy + orbit; }
          else if (i === 3) { tx = cx - orbit; ty = cy + orbit; }
          else if (i === 4) { tx = cx; ty = cy - orbit * 1.2; }
          else if (i === 5) { tx = cx; ty = cy + orbit * 1.2; }

          p.x += (tx - p.x) * 0.06;
          p.y += (ty - p.y) * 0.06;
        } else {
          p.alpha *= 0.98;
        }

        ctx.fillStyle = (p.isHero || p.isAgent) ? PRIMARY_COLOR : '#ffffff';
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      if (phase === 'CONNECT' || phase === 'FORM' || phase === 'GUARD') {
        ctx.strokeStyle = `rgba(231, 118, 48, 0.2)`;
        ctx.lineWidth = 0.5;
        for (let i = 0; i < 6; i++) {
          for (let j = i + 1; j < 6; j++) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      {completed && (
        <div className="absolute top-4 right-4 font-mono text-[10px] text-primary/40 uppercase tracking-widest">
          System_Ready
        </div>
      )}
    </div>
  );
};

export default HeroAnimation;
