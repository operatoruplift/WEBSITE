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

    // Respect prefers-reduced-motion: users with vestibular issues or
    // attention disorders opt out of motion at the OS level. Skip the
    // rAF loop entirely; the canvas stays blank and the hero composition
    // still reads (the visualization is decorative, not load-bearing).
    if (typeof window !== 'undefined' && window.matchMedia) {
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduceMotion) return;
    }

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let isMobile = false;
    let particles: Particle[] = [];
    let phase: 'FLOW' | 'SPARK' | 'CONNECT' | 'FORM' | 'GUARD' | 'CHAT' | 'RESPOND' | 'COMPLETE' = 'FLOW';
    let labelText = "";
    let startTime = Date.now();

    const PRIMARY = '#F97316';
    const GREEN = 'rgba(34, 197, 94,';

    // Theme-aware "page-bg" foreground for particles and decorations
    // drawn directly on the canvas surface. The canvas is mounted
    // inside the homepage's `.theme-light` wrapper, so plain white
    // particles render as white-on-near-white = invisible. Read the
    // `--color-foreground` token from the canvas's computed style
    // and construct the comparable rgba.
    //
    // Window-internal drawing (chat bubble, message text, "UPLIFT"
    // label, etc.) keeps its hardcoded white because the chat window
    // background fill at line 102 is `rgba(5,5,8,0.9)`. White text
    // on that dark surface stays white on either page theme.
    const fgRgb = (() => {
      const fg = getComputedStyle(canvas).getPropertyValue('--color-foreground').trim();
      // Hex (#RRGGBB or #RGB) -> "R, G, B"; rgb()/rgba() preserved as-is.
      if (fg.startsWith('#')) {
        const hex = fg.length === 4
          ? fg.slice(1).split('').map(c => c + c).join('')
          : fg.slice(1);
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `${r}, ${g}, ${b}`;
      }
      const m = fg.match(/(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
      return m ? `${m[1]}, ${m[2]}, ${m[3]}` : '255, 255, 255';
    })();
    const fg = (alpha: number) => `rgba(${fgRgb},${alpha})`;

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
      // Decoration line drawn on the page bg, theme-aware so the
      // mark stays visible on the light marketing surface.
      ctx.strokeStyle = fg(0.15);
      ctx.beginPath(); ctx.moveTo(-20, 12); ctx.lineTo(20, 12); ctx.stroke();
      ctx.restore();
    };

    // Draw the chat window, progress controls how many messages appear
    // showComplete: if true, show final response instead of typing dots
    // respondProgress: 0-1 for the RESPOND phase progress bar animation
    const drawChat = (cx: number, cy: number, progress: number, showComplete: boolean, respondProgress?: number) => {
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

      // Messages, tighter spacing (32px between bubbles)
      const t = Math.min(6, progress * 8);
      const fs = isMobile ? 7 : 9;
      const gap = 32;
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
        const y = -h/2 + 38 + (i * gap);
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

      // Show success status line inside chat when complete
      if (showComplete && t > 4.5) {
        const statusY = -h/2 + 38 + (4 * gap);
        // Green status bar
        const statusW = w * 0.75;
        const statusX = -w/2 + (w - statusW) / 2;
        ctx.fillStyle = `${GREEN}0.08)`;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(statusX, statusY, statusW, 22, 5);
        else ctx.rect(statusX, statusY, statusW, 22);
        ctx.fill();
        ctx.strokeStyle = `${GREEN}0.2)`; ctx.lineWidth = 0.5; ctx.stroke();
        // Checkmark
        ctx.strokeStyle = `${GREEN}0.9)`; ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(statusX + 8, statusY + 11);
        ctx.lineTo(statusX + 11, statusY + 14);
        ctx.lineTo(statusX + 16, statusY + 8);
        ctx.stroke();
        // Status text
        ctx.font = `${fs - 1}px 'SF Mono', monospace`; ctx.textAlign = 'left';
        ctx.fillStyle = `${GREEN}0.7)`;
        ctx.fillText('PR #47 · 14 files · 3.2s', statusX + 22, statusY + 14);

        // Session closing progress bar below status
        const barY = statusY + 32;
        const barW = w - 40;
        const barX = -w/2 + 20;
        // Progress fills over the RESPOND phase using actual elapsed time
        const barProgress = respondProgress !== undefined ? respondProgress : 0;
        // Track background
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(barX, barY, barW, 4, 2);
        else ctx.rect(barX, barY, barW, 4);
        ctx.fill();
        // Progress fill
        if (barProgress > 0) {
          ctx.fillStyle = `${GREEN}0.3)`;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(barX, barY, barW * barProgress, 4, 2);
          else ctx.rect(barX, barY, barW * barProgress, 4);
          ctx.fill();
        }
        // Label
        ctx.font = `${fs - 2}px 'SF Mono', monospace`; ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillText(barProgress >= 1 ? 'SESSION READY TO CLOSE' : 'ENCRYPTING MEMORY...', 0, barY + 16);
      }

      ctx.restore();
    };

    const render = () => {
      const now = Date.now();
      let elapsed = now - startTime;
      const LOOP = 18000;
      if (elapsed > LOOP) { startTime = now; elapsed = 0; phase = 'FLOW'; initParticles(); }

      // Phase timing (18s total - fast enough users see the full story)
      if      (elapsed < 1200)  { phase = 'FLOW';     labelText = "AWAITING INPUT"; }
      else if (elapsed < 2400)  { phase = 'SPARK';    labelText = "DETECTING SIGNAL"; }
      else if (elapsed < 3800)  { phase = 'CONNECT';  labelText = "ESTABLISHING CONTEXT"; }
      else if (elapsed < 5200)  { phase = 'FORM';     labelText = "ISOLATING ENVIRONMENT"; }
      else if (elapsed < 6800)  { phase = 'GUARD';    labelText = "APPLYING GUARDRAILS"; }
      else if (elapsed < 12000) { phase = 'CHAT';     labelText = "AGENT ACTIVE"; }
      else if (elapsed < 15000) { phase = 'RESPOND';  labelText = "TASK COMPLETE"; }
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
            ctx.strokeStyle = fg(0.12); ctx.lineWidth = 0.5; ctx.stroke();
          });
        }

        // Draw particle. Default fill follows the theme via fg(); hero
        // and active-agent particles stay PRIMARY orange (visible on
        // both themes). Particles overlapping the chat window blend
        // slightly with its dark fill, but the orange particles and
        // the dark window itself carry the visual story so the
        // tradeoff is acceptable.
        const alphaMod = isMobile ? 0.4 : 1;
        ctx.fillStyle = (p.isHero || (phase !== 'FLOW' && p.isAgent)) ? PRIMARY : fg(1);
        if ((phase === 'CHAT' || phase === 'RESPOND') && p.isAgent) ctx.fillStyle = fg(1);
        ctx.globalAlpha = p.alpha * alphaMod;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size*(isMobile?0.7:1), 0, Math.PI*2); ctx.fill();
        ctx.globalAlpha = 1;
      });

      // --- Phase-specific overlays ---

      // GUARD: dashed boundary + scan line
      if (phase === 'GUARD') {
        const sz = isMobile ? 130 : 160;
        ctx.save(); ctx.translate(cx, cy);
        // Drawn on the page bg, theme-aware via fg().
        ctx.strokeStyle = fg(0.15 + Math.abs(Math.sin(elapsed/200))*0.3);
        ctx.lineWidth = 1; ctx.setLineDash([8, 6]);
        ctx.beginPath(); ctx.rect(-sz/2, -sz/2, sz, sz); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(231,118,48,0.04)';
        ctx.fillRect(-sz/2, -sz/2 + (elapsed%1200)/1200*sz, sz, 2);
        ctx.restore();
      }

      // CHAT: draw conversation with typing dots
      if (phase === 'CHAT') {
        drawChat(cx, cy, Math.min(1, (elapsed-6800)/4000), false);
      }

      // RESPOND: show completed conversation with success status + animated progress bar
      if (phase === 'RESPOND') {
        const rp = Math.min(1, (elapsed - 12000) / 2500);
        drawChat(cx, cy, 1, true, rp);
      }

      // COMPLETE: crossfade from chat → session closed
      if (phase === 'COMPLETE') {
        const cp = Math.min(1, (elapsed-15000)/3000);
        // Chat fades out slowly over 70% of phase
        const chatAlpha = Math.max(0, 1 - cp * 1.5);
        if (chatAlpha > 0.01) {
          ctx.save(); ctx.globalAlpha = chatAlpha;
          drawChat(cx, cy, 1, true, 1); ctx.restore();
        }
        // Session terminated text fades IN starting at 40%, full at 80%
        const textAlpha = Math.max(0, Math.min(0.8, (cp - 0.4) * 2));
        if (textAlpha > 0) {
          ctx.save();
          ctx.globalAlpha = textAlpha;
          ctx.font = "10px 'SF Mono', monospace"; ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(231,118,48,${0.5 + Math.sin(elapsed*0.003)*0.15})`;
          ctx.fillText('[ SESSION TERMINATED ]', cx, cy - 5);
          ctx.font = "7px 'SF Mono', monospace";
          // Subtitle drawn on the page bg, theme-aware via fg().
          ctx.fillStyle = fg(0.25);
          ctx.fillText('session closed · receipt anchored', cx, cy + 12);
          ctx.restore();
        }
      }

      // Phase label
      if (phase !== 'FLOW') {
        const starts: Record<string,number> = { SPARK:1200, CONNECT:2400, FORM:3800, GUARD:5200, CHAT:6800, RESPOND:12000, COMPLETE:15000 };
        const durs: Record<string,number> = { SPARK:1200, CONNECT:1400, FORM:1400, GUARD:1600, CHAT:5200, RESPOND:3000, COMPLETE:3000 };
        const p = Math.min(1, Math.max(0, (elapsed-(starts[phase]||0))/(durs[phase]||2500)));
        drawLabel(cx, cy, labelText, p, phase === 'CHAT' || phase === 'RESPOND' || phase === 'COMPLETE');
      }

      if (isOnscreen) animationFrameId = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);

    // Pause the rAF loop when the hero scrolls offscreen so we stop
    // burning ~60fps of canvas work while the user reads further down
    // the page. render() reads isOnscreen at end-of-frame; the observer
    // handles the resume case. Eliminates a steady ~5-10% CPU draw on
    // mid-tier laptops once the user scrolls past the hero.
    let isOnscreen = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const wasOnscreen = isOnscreen;
        isOnscreen = entry.isIntersecting;
        if (!isOnscreen) {
          cancelAnimationFrame(animationFrameId);
        } else if (!wasOnscreen) {
          render();
        }
      },
      { threshold: 0 },
    );
    observer.observe(canvas);

    render();

    return () => {
      window.removeEventListener('resize', resize);
      observer.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative ${className}`} aria-hidden="true">
      {/* Decorative particle visualization. role + aria-hidden hide it
          from assistive tech: there's no information here, just motion. */}
      <canvas ref={canvasRef} className="w-full h-full block" role="presentation" aria-hidden="true" />
    </div>
  );
};

export default HeroAnimation;
