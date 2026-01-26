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
    let phase: 'FLOW' | 'SPARK' | 'CONNECT' | 'FORM' | 'GUARD' | 'CHAT' = 'FLOW';
    let labelText = "";
    let startTime = Date.now();

        const PRIMARY_COLOR = '#E77630';
          const PRIMARY_COLOR_RGB = '231, 118, 48'; // RGB equivalent of #E77630

    const resize = () => {
      width = canvas.width = canvas.parentElement?.offsetWidth || window.innerWidth;
      height = canvas.parentElement?.offsetHeight || window.innerHeight;
            isMobile = width < 768;
      initParticles();
    };
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

    const drawLabel = (cx: number, cy: number, text: string, progress: number) => {
        if (!text) return;
        ctx.save();
        ctx.translate(cx, cy + 160);
        ctx.globalAlpha = Math.min(1, Math.sin(progress * Math.PI));
        
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
      // @ts-ignore
      if (ctx.roundRect) {
         ctx.roundRect(-w/2, -h/2, w, h, 12);
      } else {
         ctx.rect(-w/2, -h/2, w, h);
      }
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-w/2, -h/2 + 30);
      ctx.lineTo(w/2, -h/2 + 30);
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.arc(-w/2 + 20, -h/2 + 15, 2, 0, Math.PI*2);
      ctx.arc(-w/2 + 32, -h/2 + 15, 2, 0, Math.PI*2);
      ctx.fill();

      const timeInChat = progress * 5; 
      
      const bubbles = [
        { start: 0.5, type: 'user', width: w * 0.6, height: 24 },
        { start: 1.5, type: 'system', width: w * 0.7, height: 40 },
        { start: 3.5, type: 'user', width: w * 0.4, height: 24 },
        { start: 4.5, type: 'typing', width: 40, height: 20 },
      ];

      bubbles.forEach((b, i) => {
         if (timeInChat > b.start) {
             const isUser = b.type === 'user';
             const xPos = isUser ? (w/2 - 20 - b.width) : (-w/2 + 20);
             const yPos = -h/2 + 50 + (i * 50);
             
             ctx.fillStyle = isUser ? 'rgba(255, 255, 255, 0.08)' : `rgba(${PRIMARY_COLOR_RGB}, 0.1)';
             ctx.beginPath();
             if (ctx.roundRect) {
                 ctx.roundRect(xPos, yPos, b.width, b.height, 6);
             } else {
                 ctx.rect(xPos, yPos, b.width, b.height);
             }
             ctx.fill();

             if (b.type === 'typing') {
                 const dotTime = Date.now() / 200;
                 ctx.fillStyle = PRIMARY_COLOR;
                 for(let d=0; d<3; d++) {
                     const active = Math.floor(dotTime) % 3 === d;
                     ctx.globalAlpha = active ? 1 : 0.3;
                     ctx.beginPath();
                     ctx.arc(xPos + 12 + (d*8), yPos + 10, 1.5, 0, Math.PI*2);
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
      const LOOP_DURATION = 18000;

      if (elapsed > LOOP_DURATION) {
        startTime = now;
        elapsed = 0;
        phase = 'FLOW';
        initParticles(); 
      }

      if (elapsed < 2000) { phase = 'FLOW'; labelText = "AWAITING INPUT"; }
      else if (elapsed < 4000) { phase = 'SPARK'; labelText = "DETECTING SIGNAL"; }
      else if (elapsed < 6500) { phase = 'CONNECT'; labelText = "ESTABLISHING CONTEXT"; }
      else if (elapsed < 9000) { phase = 'FORM'; labelText = "ISOLATING ENVIRONMENT"; }
      else if (elapsed < 11500) { phase = 'GUARD'; labelText = "APPLYING GUARDRAILS"; }
      else { phase = 'CHAT'; labelText = "AGENT ACTIVE"; }

      ctx.clearRect(0, 0, width, height);
      
      const cx = isMobile ? width / 2 : (width > 1024 ? width * 0.75 : width / 2);
      const cy = height / 2;

      particles.forEach((p, i) => {
        if (phase === 'FLOW' || phase === 'SPARK' || (phase === 'CONNECT' && !p.isHero)) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x > width) p.x = 0;
          if (p.y > height) p.y = 0;
          if (p.y < 0) p.y = height;
        } 
        else if (phase === 'FORM' || phase === 'GUARD' || phase === 'CHAT') {
          if (p.isAgent) {
            let tx = cx;
            let ty = cy;
            const w = isMobile ? 160 : 200;
            const h = isMobile ? 200 : 260;
            
            if (i === 0) { tx = cx - w/2; ty = cy - h/2; } 
            else if (i === 1) { tx = cx + w/2; ty = cy - h/2; } 
            else if (i === 2) { tx = cx + w/2; ty = cy + h/2; } 
            else if (i === 3) { tx = cx - w/2; ty = cy + h/2; } 
            else if (i === 4) { tx = cx; ty = cy - h/2; } 
            else if (i === 5) { tx = cx; ty = cy + h/2; } 
            
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
                        ctx.stroke();
                    }
                });
          
              } else {} ctx.strokeStyle = `rgba(${PRIMARY_COLOR_RGB}, ${1 - dist/(isMobile ? 150 : 300)})`;
        }

        if ((phase === 'FORM' || phase === 'GUARD') && p.isAgent) {
             p
              ctx.strokeStylerticles.filter(n => n.isAgent && n !== p).forEach(neighbor => {
                 ctx.beginPath();
                 ctx.moveTo(p.x, p.y);
                 ctx.lineTo(neighbor.x, neighbor.y);
                 ctx.strokeStyle = `rgba(255, 255, 255, 0.15)`;
                 ctx.lineWidth = 0.5;
                 ctx.stroke();
             });
        }
        
        if (phase === 'GUARD') {
            const size = isMobile ? 130 : 160;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(elapsed / 200)) * 0.4 + 0.1})`;
            ctx.lineWidth = 1;
            ctx.setLineDash([10, 10]);
            ctx.beginPath();
            ctx.rect(-size/2, -size/2, size, size);
            ctx.stroke();
            
            ctx.fillStyle = `rgba(${PRIMARY_COLOR_RGB}, 0.05)';
            ctx.fillRect(-size/2, -size/2 + (elapsed % 1000)/1000 * size, size, 2);
            ctx.restore();
        )`
        if (phase === 'CHAT') {
           drawChatInterface(cx, cy, Math.min(1, (elapsed - 11500) / 1000));
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

      if (phase !== 'FLOW') {
          const phaseStartTimes = { SPARK: 2000, CONNECT: 4000, FORM: 6500, GUARD: 9000, CHAT: 11500 };
          const phaseDuration = 2500;
          // @ts-ignore
          const currentPhaseStart = phaseStartTimes[phase] || 0;
          const progress = Math.min(1, Math.max(0, (elapsed - currentPhaseStart) / phaseDuration));
          
          drawLabel(cx, cy, labelText, progress);
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
