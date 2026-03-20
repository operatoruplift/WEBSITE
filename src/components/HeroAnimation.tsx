import React, { useEffect, useRef } from 'react';

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

    const PRIMARY = '#E77630';
    const GREEN = 'rgba(34, 197, 94,';

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
      ctx.globalAlpha = hold ? Math.min(1, progress * 4) : Math.min(1, Math.sin(progress * Math.PI));
      ctx.font = "10px 'SF Mono', 'Menlo', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = PRIMARY;
      ctx.shadowColor = PRIMARY;
      ctx.shadowBlur = 10;
      const chars = Math.floor(text.length * Math.min(1, progress * 3));
      ctx.fillText(`[ ${text.substring(0, chars)} ]`, 0, 0);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath(); ctx.moveTo(-20, 12); ctx.lineTo(20, 12); ctx.stroke();
      ctx.restore();
    };

    // Draw the chat window — progress controls how many messages appear
    // showComplete: if true, show final response instead of typing dots
    const drawChat = (cx: number, cy: number, progress: number, showComplete: boolean) => {
      ctx.save();
      ctx.translate(cx, cy);
      const w = isMobile ? 160 : 200;
      const h = isMobile ? 200 : 260;
      const scale = Math.min(1, Math.max(0.85, progress * 3));
      ctx.scale(scale, scale);

      // Window background
      ctx.fillStyle = 'rgba(5, 5, 8, 0.9)';
      ctx.strokeStyle = `rgba(255,255,255,${0.08 + Math.min(0.12, progress * 0.2)})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(-w/2, -h/2, w, h, 10);
      else ctx.rect(-w/2, -h/2, w, h);
      ctx.fill(); ctx.stroke();

      // Title bar
      ctx.beginPath(); ctx.moveTo(-w/2, -h/2 + 28); ctx.lineTo(w/2, -h/2 + 28); ctx.stroke();
      // Window dots
      [['rgba(255,80,80,0.5)', -w/2+14], ['rgba(255,180,0,0.5)', -w/2+26], ['rgba(80,200,80,0.5)', -w/2+38]].forEach(([c, x]) => {
        ctx.fillStyle = c as string; ctx.beginPath(); ctx.arc(x as number, -h/2+14, 2.5, 0, Math.PI*2); ctx.fill();
      });
      ctx.font = "7px 'SF Mono', monospace"; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillText('UPLIFT', 0, -h/2+17);
      // Online dot
      ctx.fillStyle = `${GREEN}0.7)`; ctx.beginPath(); ctx.arc(w/2-14, -h/2+14, 2.5, 0, Math.PI*2); ctx.fill();

      // Messages
      const t = Math.min(6, progress * 8);
      const fs = isMobile ? 7 : 9;
      const msgs = [
        { at: 0.3, user: true,  text: 'Refactor auth module' },
        { at: 1.2, user: false, text: 'Scanning 14 files...' },
        { at: 2.8, user: true,  text: 'Use session tokens' },
        { at: 3.8, user: false, text: showComplete ? 'Done. PR #47 ready.' : '', typing: !showComplete },
      ];

      msgs.forEach((m, i) => {
        if (t < m.at) return;
        const bw = m.user ? w * 0.6 : w * 0.65;
        const bh = 20;
        const x = m.user ? (w/2 - 16 - bw) : (-w/2 + 16);
        const y = -h/2 + 38 + (i * 42);
        // Bubble
        ctx.fillStyle = m.user ? 'rgba(255,255,255,0.1)' : 'rgba(231,118,48,0.15)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, 5);
        else ctx.rect(x, y, bw, bh);
        ctx.fill();
        // Content
        if (m.typing) {
          const dt = Date.now() / 220;
          ctx.fillStyle = PRIMARY;
          for (let d = 0; d < 3; d++) {
            ctx.globalAlpha = Math.floor(dt) % 3 === d ? 0.9 : 0.25;
            ctx.beginPath(); ctx.arc(x+12+(d*7), y+10, 1.5, 0, Math.PI*2); ctx.fill();
          }
          ctx.globalAlpha = 1;
        } else if (m.text) {
          ctx.font = `${fs}px 'SF Mono', monospace`; ctx.textAlign = 'left';
          ctx.fillStyle = m.user ? 'rgba(255,255,255,0.8)' : `rgba(231,118,48,0.85)`;
          ctx.fillText(m.text, x+7, y+13);
        }
      });

      ctx.restore();
    };

    const render = () => {
      const now = Date.now();
      let elapsed = now - startTime;
      const LOOP = 32000;
      if (elapsed > LOOP) { startTime = now; elapsed = 0; phase = 'FLOW'; initParticles(); }

      // Phase timing (32s total)
      if      (elapsed < 2500)  { phase = 'FLOW';     labelText = "AWAITING INPUT"; }
      else if (elapsed < 5000)  { phase = 'SPARK';    labelText = "DETECTING SIGNAL"; }
      else if (elapsed < 7500)  { phase = 'CONNECT';  labelText = "ESTABLISHING CONTEXT"; }
      else if (elapsed < 10500) { phase = 'FORM';     labelText = "ISOLATING ENVIRONMENT"; }
      else if (elapsed < 14000) { phase = 'GUARD';    labelText = "APPLYING GUARDRAILS"; }
      else if (elapsed < 22000) { phase = 'CHAT';     labelText = "AGENT ACTIVE"; }
      else if (elapsed < 27000) { phase = 'RESPOND';  labelText = "TASK COMPLETE"; }
      else                      { phase = 'COMPLETE'; labelText = "SESSION CLOSED"; }

      ctx.clearRect(0, 0, width, height);
      const cx = width > 1024 ? width * 0.75 : width / 2;
      const cy = height / 2;

      // --- Particles ---
      particles.forEach((p, i) => {
        // Movement
        if (phase === 'FLOW' || phase === 'SPARK' || (phase === 'CONNECT' && !p.isHero)) {
          p.x += p.vx; p.y += p.vy;
          if (p.x > width) p.x = 0;
          if (p.y > height) p.y = 0;
          if (p.y < 0) p.y = height;
        } else if (['FORM','GUARD','CHAT','RESPOND'].includes(phase)) {
          if (p.isAgent) {
            const w = isMobile ? 160 : 200; const h = isMobile ? 200 : 260;
            const targets = [[cx-w/2,cy-h/2],[cx+w/2,cy-h/2],[cx+w/2,cy+h/2],[cx-w/2,cy+h/2],[cx,cy-h/2],[cx,cy+h/2]];
            if (targets[i]) { p.x += (targets[i][0]-p.x)*0.08; p.y += (targets[i][1]-p.y)*0.08; }
          } else { p.alpha *= 0.96; }
        } else if (phase === 'COMPLETE') {
          if (p.isAgent) {
            const angle = Math.atan2(p.y-cy, p.x-cx);
            p.x += Math.cos(angle) * 0.5; p.y += Math.sin(angle) * 0.5;
          }
          p.alpha *= 0.985;
        }

        // SPARK: hero particle glows
        if (phase === 'SPARK' && p.isHero) {
          p.x += (cx-p.x)*0.05; p.y += (cy-p.y)*0.05;
          ctx.shadowBlur = 15; ctx.shadowColor = PRIMARY;
          ctx.fillStyle = PRIMARY; ctx.beginPath();
          ctx.arc(p.x, p.y, p.size*2, 0, Math.PI*2); ctx.fill();
          ctx.shadowBlur = 0;
        }

        // CONNECT: lines from hero to nearby particles
        if ((phase === 'CONNECT' || phase === 'FORM') && p.isHero) {
          particles.forEach(o => {
            const d = Math.hypot(p.x-o.x, p.y-o.y);
            if (d < (isMobile?150:300)) {
              ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(o.x,o.y);
              ctx.lineWidth = isMobile?0.2:0.5;
              ctx.strokeStyle = `rgba(231,118,48,${1-d/(isMobile?150:300)})`; ctx.stroke();
            }
          });
        }

        // FORM/GUARD: agent-to-agent lines
        if ((phase === 'FORM' || phase === 'GUARD') && p.isAgent) {
          particles.filter(n => n.isAgent && n !== p).forEach(n => {
            ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(n.x,n.y);
            ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.5; ctx.stroke();
          });
        }

        // Draw particle
        const alphaMod = isMobile ? 0.4 : 1;
        ctx.fillStyle = (p.isHero || (phase !== 'FLOW' && p.isAgent)) ? PRIMARY : '#fff';
        if ((phase === 'CHAT' || phase === 'RESPOND') && p.isAgent) ctx.fillStyle = '#fff';
        ctx.globalAlpha = p.alpha * alphaMod;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size*(isMobile?0.7:1), 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      // --- Phase-specific overlays ---

      // GUARD: dashed boundary + scan line
      if (phase === 'GUARD') {
        const sz = isMobile ? 130 : 160;
        ctx.save(); ctx.translate(cx, cy);
        ctx.strokeStyle = `rgba(255,255,255,${0.15 + Math.abs(Math.sin(elapsed/200))*0.3})`;
        ctx.lineWidth = 1; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.rect(-sz/2, -sz/2, sz, sz); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(231,118,48,0.04)';
        ctx.fillRect(-sz/2, -sz/2 + (elapsed%1200)/1200*sz, sz, 2);
        ctx.restore();
      }

      // CHAT: draw conversation with typing dots
      if (phase === 'CHAT') {
        drawChat(cx, cy, Math.min(1, (elapsed-14000)/6000), false);
      }

      // RESPOND: show completed conversation + success badge below
      if (phase === 'RESPOND') {
        const rp = Math.min(1, (elapsed-22000)/2000);
        drawChat(cx, cy, 1, true);
        // Success badge below the chat window
        ctx.save(); ctx.translate(cx, cy);
        const badgeY = (isMobile ? 120 : 160);
        ctx.globalAlpha = Math.min(1, rp * 2);
        // Badge background — opaque dark fill so text is readable over chat
        ctx.fillStyle = 'rgba(5, 5, 8, 0.95)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(-50, badgeY-12, 100, 24, 12);
        else ctx.rect(-50, badgeY-12, 100, 24);
        ctx.fill();
        ctx.strokeStyle = `${GREEN}0.4)`; ctx.lineWidth = 0.5; ctx.stroke();
        // Checkmark + text
        if (rp > 0.3) {
          ctx.strokeStyle = `${GREEN}1)`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(-22, badgeY); ctx.lineTo(-18, badgeY+4); ctx.lineTo(-12, badgeY-4); ctx.stroke();
          ctx.font = "bold 8px 'SF Mono', monospace"; ctx.textAlign = 'left';
          ctx.fillStyle = `${GREEN}0.9)`; ctx.fillText('DELIVERED', -6, badgeY+3);
        }
        ctx.restore();
      }

      // COMPLETE: fade chat → session closed
      if (phase === 'COMPLETE') {
        const cp = Math.min(1, (elapsed-27000)/4000);
        // Fading chat
        if (cp < 0.6) {
          ctx.save(); ctx.globalAlpha = 1 - cp * 1.8;
          drawChat(cx, cy, 1, true); ctx.restore();
        }
        // Session terminated
        if (cp > 0.25) {
          ctx.save();
          ctx.globalAlpha = Math.min(0.7, (cp-0.25)*2);
          ctx.font = "10px 'SF Mono', monospace"; ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(231,118,48,${0.4 + Math.sin(elapsed*0.003)*0.15})`;
          ctx.fillText('[ SESSION TERMINATED ]', cx, cy - 5);
          ctx.font = "7px 'SF Mono', monospace";
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillText('vault sealed · memory encrypted', cx, cy + 12);
          // Subtle underline
          ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 0.5;
          ctx.beginPath(); ctx.moveTo(cx-55, cy+18); ctx.lineTo(cx+55, cy+18); ctx.stroke();
          ctx.restore();
        }
      }

      // Phase label
      if (phase !== 'FLOW') {
        const starts: Record<string,number> = { SPARK:2500, CONNECT:5000, FORM:7500, GUARD:10500, CHAT:14000, RESPOND:22000, COMPLETE:27000 };
        const durs: Record<string,number> = { SPARK:2500, CONNECT:2500, FORM:3000, GUARD:3500, CHAT:8000, RESPOND:5000, COMPLETE:5000 };
        const p = Math.min(1, Math.max(0, (elapsed-(starts[phase]||0))/(durs[phase]||2500)));
        drawLabel(cx, cy, labelText, p, phase === 'CHAT' || phase === 'RESPOND' || phase === 'COMPLETE');
      }

      animationFrameId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    render();
    return () => { window.removeEventListener('resize', resize); cancelAnimationFrame(animationFrameId); };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default HeroAnimation;
