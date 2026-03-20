import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  targetX?: number;
  targetY?: number;
  alpha: number;
  isHero?: boolean;
  isAgent?: boolean;
}

interface HeroAnimationProps {
  className?: string;
}

const HeroAnimation: React.FC<HeroAnimationProps> = ({ className = "w-full h-full block" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let isMobile = false;
    let particles: Particle[] = [];
    let phase: 'FLOW' | 'SPARK' | 'CONNECT' | 'FORM' | 'GUARD' | 'CHAT' | 'RESPOND' | 'COMPLETE' = 'FLOW';
    let labelText = "";
    let startTime = Date.now();

    const PRIMARY_COLOR = '#E77630';

    const resize = () => {
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.offsetHeight || window.innerHeight;
      isMobile = width < 768;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const count = isMobile ? 30 : 60;

      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() + 0.2) * (isMobile ? 1 : 2),
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.1,
          isHero: i === 0,
          isAgent: i < 6
        });
      }
    };

    const drawLabel = (cx: number, cy: number, text: string, progress: number, hold?: boolean) => {
      if (!text) return;
      ctx.save();
      ctx.translate(cx, cy + 160);
      // For held labels (CHAT phase), fade in then stay visible; otherwise fade in and out
      if (hold) {
        ctx.globalAlpha = Math.min(1, progress * 4);
      } else {
        ctx.globalAlpha = Math.min(1, Math.sin(progress * Math.PI));
      }

      ctx.font = "10px 'SF Mono', 'Menlo', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = PRIMARY_COLOR;
      ctx.shadowColor = PRIMARY_COLOR;
      ctx.shadowBlur = 10;

      const chars = Math.floor(text.length * Math.min(1, progress * 3));
      const currentText = text.substring(0, chars);

      ctx.fillText(`[ ${currentText} ]`, 0, 0);

      ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
      ctx.beginPath();
      ctx.moveTo(-20, 15);
      ctx.lineTo(20, 15);
      ctx.stroke();

      ctx.restore();
    };

    const drawChatInterface = (cx: number, cy: number, progress: number) => {
      ctx.save();
      ctx.translate(cx, cy);

      const w = isMobile ? 160 : 200;
      const h = isMobile ? 200 : 260;
      const scale = Math.min(1, Math.max(0.8, progress * 2));

      ctx.scale(scale, scale);

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.min(0.2, progress)})`;
      ctx.lineWidth = 0.5;
      ctx.fillStyle = 'rgba(5, 5, 5, 0.8)';

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(-w / 2, -h / 2, w, h, 12);
      } else {
        ctx.rect(-w / 2, -h / 2, w, h);
      }
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2 + 30);
      ctx.lineTo(w / 2, -h / 2 + 30);
      ctx.stroke();

      // Window dots
      ctx.fillStyle = 'rgba(255, 80, 80, 0.5)';
      ctx.beginPath(); ctx.arc(-w / 2 + 16, -h / 2 + 15, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255, 180, 0, 0.5)';
      ctx.beginPath(); ctx.arc(-w / 2 + 28, -h / 2 + 15, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(80, 200, 80, 0.5)';
      ctx.beginPath(); ctx.arc(-w / 2 + 40, -h / 2 + 15, 3, 0, Math.PI * 2); ctx.fill();

      // Title text
      ctx.font = "8px 'SF Mono', monospace";
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillText('UPLIFT SESSION', 0, -h / 2 + 18);

      // Online indicator
      ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
      ctx.beginPath(); ctx.arc(w / 2 - 16, -h / 2 + 15, 3, 0, Math.PI * 2); ctx.fill();

      // Bubbles appear in first 60% of chat progress, leaving 40% for viewing
      const timeInChat = Math.min(5, progress * 8);

      const bubbles = [
        { start: 0.5, type: 'user', width: w * 0.6, height: 24 },
        { start: 1.5, type: 'system', width: w * 0.7, height: 40 },
        { start: 3.5, type: 'user', width: w * 0.4, height: 24 },
        { start: 4.5, type: 'typing', width: 40, height: 20 },
      ];

      bubbles.forEach((b, i) => {
        if (timeInChat > b.start) {
          const isUser = b.type === 'user';
          const xPos = isUser ? (w / 2 - 20 - b.width) : (-w / 2 + 20);
          const yPos = -h / 2 + 50 + (i * 50);

          ctx.fillStyle = isUser ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 85, 0, 0.1)';
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(xPos, yPos, b.width, b.height, 6);
          } else {
            ctx.rect(xPos, yPos, b.width, b.height);
          }
          ctx.fill();

          // Draw text placeholder lines inside bubbles
          if (b.type === 'user' || b.type === 'system') {
            const lineColor = isUser ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 85, 0, 0.2)';
            const lineCount = b.type === 'system' ? 3 : (b.height > 24 ? 2 : 1);
            for (let ln = 0; ln < lineCount; ln++) {
              const lineWidth = b.width * (ln === lineCount - 1 ? 0.6 : 0.85) - 16;
              ctx.fillStyle = lineColor;
              ctx.fillRect(xPos + 8, yPos + 7 + (ln * 9), Math.max(lineWidth, 20), 2);
            }
          }

          if (b.type === 'typing') {
            const dotTime = Date.now() / 200;
            ctx.fillStyle = PRIMARY_COLOR;
            for (let d = 0; d < 3; d++) {
              const active = Math.floor(dotTime) % 3 === d;
              ctx.globalAlpha = active ? 1 : 0.3;
              ctx.beginPath();
              ctx.arc(xPos + 12 + (d * 8), yPos + 10, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.globalAlpha = 1;
          }
        }
      });

      ctx.restore();
    };

    const render = () => {
      const now = Date.now();
      let elapsed = now - startTime;
      const LOOP_DURATION = 34000;

      if (elapsed > LOOP_DURATION) {
        startTime = now;
        elapsed = 0;
        phase = 'FLOW';
        initParticles();
      }

      if (elapsed < 2500) { phase = 'FLOW'; labelText = "AWAITING INPUT"; }
      else if (elapsed < 5000) { phase = 'SPARK'; labelText = "DETECTING SIGNAL"; }
      else if (elapsed < 8000) { phase = 'CONNECT'; labelText = "ESTABLISHING CONTEXT"; }
      else if (elapsed < 11500) { phase = 'FORM'; labelText = "ISOLATING ENVIRONMENT"; }
      else if (elapsed < 15000) { phase = 'GUARD'; labelText = "APPLYING GUARDRAILS"; }
      else if (elapsed < 24000) { phase = 'CHAT'; labelText = "AGENT ACTIVE"; }
      else if (elapsed < 29000) { phase = 'RESPOND'; labelText = "TASK COMPLETE"; }
      else { phase = 'COMPLETE'; labelText = "SESSION CLOSED"; }

      ctx.clearRect(0, 0, width, height);

      const cx = width > 1024 ? width * 0.75 : width / 2;
      const cy = height / 2;

      particles.forEach((p, i) => {
        if (phase === 'FLOW' || phase === 'SPARK' || (phase === 'CONNECT' && !p.isHero)) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x > width) p.x = 0;
          if (p.y > height) p.y = 0;
          if (p.y < 0) p.y = height;
        }
        else if (phase === 'FORM' || phase === 'GUARD' || phase === 'CHAT' || phase === 'RESPOND' || phase === 'COMPLETE') {
          if (p.isAgent) {
            let tx = cx;
            let ty = cy;
            const w = isMobile ? 160 : 200;
            const h = isMobile ? 200 : 260;

            if (i === 0) { tx = cx - w / 2; ty = cy - h / 2; }
            else if (i === 1) { tx = cx + w / 2; ty = cy - h / 2; }
            else if (i === 2) { tx = cx + w / 2; ty = cy + h / 2; }
            else if (i === 3) { tx = cx - w / 2; ty = cy + h / 2; }
            else if (i === 4) { tx = cx; ty = cy - h / 2; }
            else if (i === 5) { tx = cx; ty = cy + h / 2; }

            p.x += (tx - p.x) * 0.08;
            p.y += (ty - p.y) * 0.08;
          } else {
            p.alpha *= 0.95;
          }
        }

        if (phase === 'SPARK' && p.isHero) {
          p.x += (cx - p.x) * 0.05;
          p.y += (cy - p.y) * 0.05;

          ctx.shadowBlur = 15;
          ctx.shadowColor = PRIMARY_COLOR;
          ctx.fillStyle = PRIMARY_COLOR;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        if (phase === 'CONNECT' || phase === 'FORM') {
          if (p.isHero) {
            particles.forEach(other => {
              const dist = Math.hypot(p.x - other.x, p.y - other.y);
              if (dist < (isMobile ? 150 : 300)) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(other.x, other.y);
                ctx.lineWidth = isMobile ? 0.2 : 0.5;
                ctx.strokeStyle = `rgba(255, 85, 0, ${1 - dist / (isMobile ? 150 : 300)})`;
                ctx.stroke();
              }
            });
          }
        }

        if ((phase === 'FORM' || phase === 'GUARD') && p.isAgent) {
          particles.filter(n => n.isAgent && n !== p).forEach(neighbor => {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(neighbor.x, neighbor.y);
            ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          });
        }

        // RESPOND phase: agents drift outward slowly
        if (phase === 'RESPOND' && p.isAgent) {
          const angle = Math.atan2(p.y - cy, p.x - cx);
          p.x += Math.cos(angle) * 0.3;
          p.y += Math.sin(angle) * 0.3;
        }

        // COMPLETE phase: everything fades out
        if (phase === 'COMPLETE') {
          p.alpha *= 0.97;
        }


        const mobileAlphaMod = isMobile ? 0.4 : 1;

        ctx.fillStyle = p.isHero || (phase !== 'FLOW' && p.isAgent) ? PRIMARY_COLOR : '#fff';
        if (phase === 'CHAT' && p.isAgent) ctx.fillStyle = '#fff';

        ctx.globalAlpha = p.alpha * mobileAlphaMod;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (isMobile ? 0.7 : 1), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw GUARD boundary ONCE per frame (outside particle loop)
      if (phase === 'GUARD') {
        const size = isMobile ? 130 : 160;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(elapsed / 200)) * 0.4 + 0.1})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.rect(-size / 2, -size / 2, size, size);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = 'rgba(255, 85, 0, 0.05)';
        ctx.fillRect(-size / 2, -size / 2 + (elapsed % 1000) / 1000 * size, size, 2);
        ctx.restore();
      }

      // Draw CHAT interface ONCE per frame (outside particle loop)
      if (phase === 'CHAT') {
        drawChatInterface(cx, cy, Math.min(1, (elapsed - 15000) / 8000));
      }

      // RESPOND phase: completed chat + success indicator + stats
      if (phase === 'RESPOND') {
        drawChatInterface(cx, cy, 1);

        const respondProgress = Math.min(1, (elapsed - 24000) / 2000);
        ctx.save();
        ctx.translate(cx, cy);

        // Expanding green ring
        const ringRadius = 20 + respondProgress * 30;
        ctx.globalAlpha = respondProgress * 0.15;
        ctx.strokeStyle = 'rgba(34, 197, 94, 1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 50, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.globalAlpha = respondProgress;

        // Success glow
        const glowGrad = ctx.createRadialGradient(0, 50, 0, 0, 50, 35);
        glowGrad.addColorStop(0, 'rgba(34, 197, 94, 0.4)');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 50, 35, 0, Math.PI * 2);
        ctx.fill();

        // Checkmark circle with fill
        ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        ctx.beginPath();
        ctx.arc(0, 50, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(34, 197, 94, 0.9)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Animated checkmark draw
        const checkProg = Math.min(1, respondProgress * 2.5);
        ctx.strokeStyle = 'rgba(34, 197, 94, 1)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (checkProg < 0.4) {
          const t = checkProg / 0.4;
          ctx.moveTo(-6, 50);
          ctx.lineTo(-6 + 5 * t, 50 + 5 * t);
        } else {
          const t = (checkProg - 0.4) / 0.6;
          ctx.moveTo(-6, 50);
          ctx.lineTo(-1, 55);
          ctx.lineTo(-1 + 8 * t, 55 - 11 * t);
        }
        ctx.stroke();

        // "DELIVERED" text
        if (respondProgress > 0.4) {
          const textAlpha = Math.min(1, (respondProgress - 0.4) * 2);
          ctx.globalAlpha = textAlpha;
          ctx.font = "bold 9px 'SF Mono', monospace";
          ctx.textAlign = 'center';
          ctx.fillStyle = 'rgba(34, 197, 94, 0.8)';
          ctx.fillText('TASK DELIVERED', 0, 80);

          // Stats line
          if (respondProgress > 0.6) {
            const statsAlpha = Math.min(1, (respondProgress - 0.6) * 3);
            ctx.globalAlpha = statsAlpha * 0.5;
            ctx.font = "8px 'SF Mono', monospace";
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillText('14 files · 1 PR · 3.2s', 0, 95);
          }
        }

        ctx.restore();
      }

      // COMPLETE phase: graceful shutdown with dissolve effect
      if (phase === 'COMPLETE') {
        const completeProgress = Math.min(1, (elapsed - 29000) / 4000);

        // Fading chat interface with glitch
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - completeProgress * 1.5);
        drawChatInterface(cx, cy, 1);
        ctx.restore();

        // Dissolving particles scatter outward
        if (completeProgress > 0.2) {
          const scatterProg = (completeProgress - 0.2) / 0.8;
          ctx.save();
          for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 + elapsed * 0.001;
            const dist = 20 + scatterProg * 120;
            const px = cx + Math.cos(angle) * dist;
            const py = cy + Math.sin(angle) * dist;
            ctx.globalAlpha = Math.max(0, 0.6 - scatterProg * 0.8);
            ctx.fillStyle = PRIMARY_COLOR;
            ctx.beginPath();
            ctx.arc(px, py, 1.5 - scatterProg, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }

        // Session closed text with horizontal scan line
        if (completeProgress > 0.3) {
          ctx.save();
          const textAlpha = Math.min(1, (completeProgress - 0.3) * 2);
          ctx.globalAlpha = textAlpha;

          // Scan line
          const scanY = cy - 15 + Math.sin(elapsed * 0.003) * 5;
          ctx.fillStyle = 'rgba(231, 118, 48, 0.03)';
          ctx.fillRect(cx - 80, scanY, 160, 2);

          // Box around text
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(elapsed * 0.005) * 0.05})`;
          ctx.lineWidth = 0.5;
          ctx.setLineDash([4, 4]);
          if (ctx.roundRect) {
            ctx.beginPath();
            ctx.roundRect(cx - 75, cy - 18, 150, 36, 4);
            ctx.stroke();
          }
          ctx.setLineDash([]);

          // Text
          ctx.font = "bold 11px 'SF Mono', monospace";
          ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(231, 118, 48, ${0.5 + Math.sin(elapsed * 0.004) * 0.2})`;
          ctx.fillText('SESSION TERMINATED', cx, cy + 1);

          // Subtext
          ctx.globalAlpha = textAlpha * 0.4;
          ctx.font = "8px 'SF Mono', monospace";
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillText('memory encrypted · vault sealed', cx, cy + 18);

          ctx.restore();
        }
      }

      if (phase !== 'FLOW') {
        const phaseStartTimes: Record<string, number> = { SPARK: 2500, CONNECT: 5000, FORM: 8000, GUARD: 11500, CHAT: 15000, RESPOND: 24000, COMPLETE: 29000 };
        const phaseDurations: Record<string, number> = { SPARK: 2500, CONNECT: 3000, FORM: 3500, GUARD: 3500, CHAT: 9000, RESPOND: 5000, COMPLETE: 5000 };
        const currentPhaseStart = phaseStartTimes[phase] || 0;
        const phaseDuration = phaseDurations[phase] || 2500;
        const progress = Math.min(1, Math.max(0, (elapsed - currentPhaseStart) / phaseDuration));

        drawLabel(cx, cy, labelText, progress, phase === 'CHAT' || phase === 'RESPOND' || phase === 'COMPLETE');
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
    </div>
  );
};

export default HeroAnimation;
