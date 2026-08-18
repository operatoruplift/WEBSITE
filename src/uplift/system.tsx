'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';

export const ORANGE = 'var(--orange)';
export const ORANGE_D = 'var(--orange-d)';
export const MINT = 'var(--mint)';
export const MINT_D = 'var(--mint-d)';
export const CORAL = 'var(--coral)';
export const GOLD = 'var(--gold)';
export const VIOLET = 'var(--violet)';
export const SKY = 'var(--sky)';

export function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);
  const W = 390;
  const H = 844;
  
  useEffect(() => {
    const fit = () => {
      const pad = window.innerWidth < 480 ? 0 : 40;
      const s = window.innerWidth < 480 ? 1 : Math.min((window.innerWidth - pad) / W, (window.innerHeight - pad) / H, 1.1);
      setScale(s);
    };
    fit(); 
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const isMobile = window.innerWidth < 480;

  return (
    <div style={{ 
      width: isMobile ? '100vw' : W * scale, 
      height: isMobile ? '100dvh' : H * scale, 
      position: 'relative',
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: isMobile ? '100%' : W, 
        height: isMobile ? '100%' : H, 
        position: 'absolute', 
        top: 0, 
        transformOrigin: 'top center', 
        transform: isMobile ? 'none' : `scale(${scale})`,
        background: 'var(--bg)', 
        borderRadius: isMobile ? 0 : 52, 
        overflow: 'hidden',
        border: isMobile ? 'none' : `11px solid #0c0a09`,
        boxShadow: isMobile ? 'none' : '0 40px 90px -30px rgba(80,50,20,0.55), 0 0 0 2px rgba(0,0,0,0.25)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* notch */}
        {!isMobile && (
          <div style={{ position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)', width: 120, height: 30, background: '#0c0a09', borderRadius: 20, zIndex: 200 }}/>
        )}
        <div style={{ height: 18, flexShrink: 0 }} />
        {children}
      </div>
    </div>
  );
}

export function Btn({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'lg', 
  icon, 
  full = true, 
  style = {}, 
  disabled = false, 
  pulse = false 
}: {
  children: React.ReactNode, onClick?: () => void, variant?: 'primary' | 'success' | 'coral' | 'dark' | 'soft' | 'ghost',
  size?: 'sm' | 'md' | 'lg' | 'xl', icon?: React.ReactNode, full?: boolean, style?: React.CSSProperties, disabled?: boolean, pulse?: boolean
}) {
  const H = { sm: 44, md: 52, lg: 60, xl: 68 }[size];
  const FS = { sm: 15, md: 16, lg: 18, xl: 20 }[size];
  
  const variants = {
    primary: { bg: 'var(--orange)', fg: '#fff', shadow: `0 8px 0 var(--orange-dk)`, border: 'none' },
    success: { bg: 'var(--mint)', fg: '#053D2C', shadow: `0 8px 0 var(--mint-d)`, border: 'none' },
    coral:   { bg: 'var(--coral)', fg: '#fff', shadow: `0 8px 0 var(--coral-d)`, border: 'none' },
    dark:    { bg: 'var(--text)', fg: 'var(--bg)', shadow: 'none', border: 'none' },
    soft:    { bg: 'color-mix(in srgb, var(--orange) 16%, transparent)', fg: 'var(--orange-d)', shadow: 'none', border: 'none' },
    ghost:   { bg: 'var(--card)', fg: 'var(--text)', shadow: 'none', border: `2px solid var(--border-s)` },
  };
  
  const v = variants[variant];
  return (
    <button onClick={disabled ? undefined : onClick} className="ou-squish" style={{
      height: H, width: full ? '100%' : 'auto', padding: '0 26px',
      borderRadius: 22, border: v.border, background: v.bg, color: v.fg,
      fontFamily: 'var(--font-app-display)', fontWeight: 700, fontSize: FS, letterSpacing: '0.01em',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.45 : 1,
      boxShadow: pulse ? undefined : v.shadow, position: 'relative',
      animation: pulse ? 'ou_pulse 1.8s ease-in-out infinite' : 'none',
      ...style,
    }}>{icon}{children}</button>
  );
}

export function Card({ children, onClick, style = {}, pad = 18, radius = 24, alt = false, flat = false }: any) {
  return (
    <div onClick={onClick} className={onClick ? 'ou-squish' : ''} style={{
      background: alt ? 'var(--card-alt)' : 'var(--card)', borderRadius: radius, padding: pad,
      boxShadow: flat ? 'none' : 'var(--shadow-soft)', border: `1.5px solid var(--border)`,
      cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  );
}

export function Progress({ value, max = 100, color = 'var(--orange)', height = 14, animate = true }: any) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div style={{ width: '100%', height, borderRadius: 999, background: 'color-mix(in srgb, var(--text) 10%, transparent)', overflow: 'hidden', position: 'relative' }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 999,
        background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 80%, white))`,
        boxShadow: `inset 0 -3px 0 rgba(0,0,0,0.12), inset 0 2px 0 rgba(255,255,255,0.35)`,
        animation: animate ? 'ou_bar 0.9s cubic-bezier(0.22,1,0.36,1)' : 'none',
      }}/>
    </div>
  );
}

export function Pill({ children, color = 'var(--orange)', solid = false, icon, style = {} }: any) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 12.5, letterSpacing: '0.01em',
      padding: '6px 12px', borderRadius: 999,
      color: solid ? '#fff' : color, background: solid ? color : `color-mix(in srgb, ${color} 15%, transparent)`,
      ...style,
    }}>{icon}{children}</span>
  );
}

export function Confetti({ count = 60 }) {
  const colors = ['var(--orange)', 'var(--mint)', 'var(--gold)', 'var(--violet)', 'var(--sky)', 'var(--coral)'];
  const bits = useMemo(() => Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.6, dur: 1.6 + Math.random() * 1.4,
    color: colors[i % colors.length], size: 7 + Math.random() * 9, round: Math.random() > 0.5,
  })), [count]);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 300 }}>
      {bits.map((b, i) => (
        <div key={i} style={{
          position: 'absolute', top: 0, left: `${b.left}%`, width: b.size, height: b.size * (b.round ? 1 : 1.6),
          background: b.color, borderRadius: b.round ? '50%' : 3,
          animation: `ou_confetti ${b.dur}s cubic-bezier(0.3,0.6,0.5,1) ${b.delay}s forwards`,
        }}/>
      ))}
    </div>
  );
}

export function Sheet({ children, onClose, height = 'auto' }: any) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 250, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(28,25,23,0.5)', backdropFilter: 'blur(2px)', animation: 'ou_fadein 0.25s ease both' }}/>
      <div style={{
        position: 'relative', background: 'var(--bg)', borderRadius: '32px 32px 0 0', padding: '12px 22px 30px',
        maxHeight: '88%', height, overflowY: 'auto', boxShadow: '0 -16px 50px -10px rgba(0,0,0,0.4)',
        animation: 'ou_slideup 0.42s cubic-bezier(0.22,1,0.36,1) both',
      }} className="ou-scroll">
        <div style={{ width: 44, height: 5, borderRadius: 999, background: 'var(--border-s)', margin: '0 auto 18px' }}/>
        {children}
      </div>
    </div>
  );
}

export function TabBar({ active }: { active: string }) {
  const [, setLocation] = useLocation();
  const tabs = [
    { id: '/app', icon: 'home', label: 'Home' },
    { id: '/app/social', icon: 'users', label: 'Community' },
    { id: '/app/journey', icon: 'star', label: 'Journey' },
    { id: '/app/vault', icon: 'vault', label: 'Vault' },
  ];
  return (
    <div style={{
      flexShrink: 0, display: 'flex', justifyContent: 'space-around', alignItems: 'center',
      padding: '10px 8px 26px', background: 'var(--card)', borderTop: `1.5px solid var(--border)`,
      boxShadow: '0 -6px 20px -10px rgba(120,90,50,0.18)', zIndex: 50
    }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => setLocation(t.id)} className="ou-squish" style={{
            background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 16,
          }}>
            <Icon name={t.icon} size={26} color={on ? 'var(--orange)' : 'var(--text3)'} filled={on}/>
            <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 11, color: on ? 'var(--orange)' : 'var(--text3)' }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export function TopBar({ title, onBack, right, tint = 'var(--text)' }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 18px 10px' }}>
      {onBack && (
        <button onClick={onBack} className="ou-squish" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--card)', border: `1.5px solid var(--border)`, display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: 0 }}>
          <Icon name="arrow-l" size={22} color={tint}/>
        </button>
      )}
      <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 21, color: tint, flex: 1 }}>{title}</div>
      {right}
    </div>
  );
}

export const Icon = ({ name, size = 24, color = 'currentColor', filled = false, strokeWidth = 2.4 }: any) => {
  const s = { width: size, height: size, viewBox: '0 0 24 24', fill: filled ? color : 'none', stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  const fillP = { width: size, height: size, viewBox: '0 0 24 24', fill: color };
  switch (name) {
    case 'home': return filled
      ? <svg {...fillP}><path d="M11.3 2.6a1 1 0 0 1 1.4 0l8 7.6a1 1 0 0 1 .3.7V20a1 1 0 0 1-1 1h-4.5v-6h-6v6H4a1 1 0 0 1-1-1v-9.1a1 1 0 0 1 .3-.7z"/></svg>
      : <svg {...s}><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></svg>;
    case 'medal': return filled
      ? <svg {...fillP}><path d="M8 2h8l-2.2 6.2a5 5 0 1 1-3.6 0z"/><circle cx="12" cy="15" r="5"/></svg>
      : <svg {...s}><path d="M9 2 7 8M15 2l-2 6"/><circle cx="12" cy="15" r="6"/><path d="M12 12.5l1 2 2 .2-1.5 1.4.4 2L12 17l-1.9 1 .4-2L9 14.7l2-.2z" fill={color} stroke="none"/></svg>;
    case 'vault': return filled
      ? <svg {...fillP}><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="4" fill="#fff"/><circle cx="12" cy="12" r="1.4" fill={color}/></svg>
      : <svg {...s}><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="12" cy="12" r="3.5"/><path d="M12 8.5V6M12 18v-2.5M15.5 12H18M6 12h2.5"/></svg>;
    case 'flame': return <svg {...fillP}><path d="M12 2c1.5 3.5 5 5.2 5 9.5A5 5 0 0 1 7 12c0-1.2.4-2 1.2-2.9.2 1.6 1 2.4 1.8 2.4.9 0 .5-2.2-.4-4 1.3-1 2.1-3 2.4-5.5z"/></svg>;
    case 'target': return <svg {...fillP}><circle cx="12" cy="12" r="9" fill={color} opacity="0.18" stroke="none"/><circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2.4"/><circle cx="12" cy="12" r="4.6" fill="none" stroke={color} strokeWidth="2.4"/><circle cx="12" cy="12" r="1.4" fill={color} stroke="none"/></svg>;
    case 'camera': return filled
      ? <svg {...fillP}><path d="M9 4h6l1.5 2H20a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5z"/><circle cx="12" cy="13" r="4" fill="#fff"/></svg>
      : <svg {...s}><path d="M3 8a2 2 0 0 1 2-2h2.5L9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.6"/></svg>;
    case 'check': return <svg {...s}><path d="M4 12.5 9 17.5 20 6.5"/></svg>;
    case 'check-circle': return <svg {...fillP}><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5 11 16l5.5-6.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'x': return <svg {...s}><path d="M6 6l12 12M18 6 6 18"/></svg>;
    case 'lock': return <svg {...fillP}><rect x="4" y="10" width="16" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke={color} strokeWidth="2.4"/></svg>;
    case 'shield': return <svg {...fillP}><path d="M12 2l8 3v6c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V5z"/><path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>;
    case 'bolt': return <svg {...fillP}><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>;
    case 'star': return <svg {...fillP}><path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.3l6.5-.9z"/></svg>;
    case 'trophy': return <svg {...fillP}><path d="M6 4h12v3a6 6 0 0 1-12 0z"/><path d="M6 5H3v2a3 3 0 0 0 3 3M18 5h3v2a3 3 0 0 1-3 3" fill="none" stroke={color} strokeWidth="2.2"/><path d="M9 19h6M12 13v6" stroke={color} strokeWidth="2.4" fill="none"/></svg>;
    case 'coin': return <svg {...fillP}><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.2c0-1 1.1-1.7 2.5-1.7s2.5.7 2.5 1.7-1 1.5-2.5 1.8-2.5.8-2.5 1.8 1.1 1.7 2.5 1.7 2.5-.7 2.5-1.7" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round"/></svg>;
    case 'plus': return <svg {...s}><path d="M12 5v14M5 12h14"/></svg>;
    case 'chevron-r': return <svg {...s}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chevron-l': return <svg {...s}><path d="M15 6l-6 6 6 6"/></svg>;
    case 'arrow-l': return <svg {...s}><path d="M19 12H5M11 18l-6-6 6-6"/></svg>;
    case 'arrow-r': return <svg {...s}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'sparkle': return <svg {...fillP}><path d="M12 2l1.8 5.7L19.5 9l-5.7 1.8L12 16l-1.8-5.2L4.5 9l5.7-1.3z"/><path d="M18.5 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9z" opacity="0.7"/></svg>;
    case 'gift': return <svg {...fillP}><rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 9h18M12 9v12" fill="none" stroke="#fff" strokeWidth="2"/><path d="M12 9C12 6 9 4 7.5 5.5S9 9 12 9zM12 9c0-3 3-5 4.5-3.5S15 9 12 9z" fill={color} stroke="#fff" strokeWidth="1.2"/></svg>;
    case 'apple': return <svg {...fillP}><path d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1 2.8-2.1c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.2 5.9c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.4-.6.7-1.1 1.8-.9 2.8 1 .1 2-.5 2.7-1.2z"/></svg>;
    case 'google': return <svg width={size} height={size} viewBox="0 0 24 24"><path fill="#4285F4" d="M21.6 12.2c0-.6-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22z"/><path fill="#FBBC05" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.5l3.3 2.6c.8-2.4 3-4.2 5.6-4.2z"/></svg>;
    case 'bell': return <svg {...fillP}><path d="M12 3a6 6 0 0 0-6 6c0 5-2 6-2 6h16s-2-1-2-6a6 6 0 0 0-6-6z"/><path d="M10 20a2 2 0 0 0 4 0" fill="none" stroke={color} strokeWidth="2.2"/></svg>;
    case 'settings': return <svg {...s}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.2a1.7 1.7 0 0 0-2.9-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.1-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10 4.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4z"/></svg>;
    case 'calendar': return <svg {...s}><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>;
    case 'eye': return <svg {...s}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>;
    case 'sun': return <svg {...s}><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.5 4.5l1.8 1.8M17.7 17.7l1.8 1.8M4.5 19.5l1.8-1.8M17.7 6.3l1.8-1.8"/></svg>;
    case 'moon': return <svg {...fillP}><path d="M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z"/></svg>;
    case 'play': return <svg {...fillP}><path d="M7 4l13 8-13 8z"/></svg>;
    case 'logout': return <svg {...s}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
    case 'plus-circle': return <svg {...fillP}><circle cx="12" cy="12" r="10"/><path d="M12 7v10M7 12h10" fill="none" stroke="#fff" strokeWidth="2.6"/></svg>;
    case 'download': return <svg {...s}><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>;
    case 'signal': return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><rect x="2" y="14" width="3.5" height="6" rx="1"/><rect x="7.5" y="10" width="3.5" height="10" rx="1"/><rect x="13" y="6" width="3.5" height="14" rx="1"/><rect x="18.5" y="3" width="3.5" height="17" rx="1"/></svg>;
    case 'wifi': return <svg {...s}><path d="M2 8.5a15 15 0 0 1 20 0M5 12a10 10 0 0 1 14 0M8.5 15.5a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill={color}/></svg>;
    case 'battery': return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6"><rect x="2" y="7" width="18" height="10" rx="3"/><rect x="4" y="9" width="13" height="6" rx="1.5" fill={color}/><path d="M22 10v4" strokeWidth="2"/></svg>;
    case 'heart': return <svg {...fillP}><path d="M12 21s-7-4.5-9.5-9C1 9 2.5 5.5 6 5.5c2 0 3.2 1.3 4 2.5.8-1.2 2-2.5 4-2.5 3.5 0 5 3.5 3.5 6.5-2.5 4.5-9.5 9-9.5 9z"/></svg>;
    case 'brain': return <svg {...fillP}><path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 5 1V3a1 1 0 0 0-1 0zM15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1 5 3 3 0 0 1-5 1V3z"/></svg>;
    case 'users': return filled
      ? <svg {...fillP}><circle cx="9" cy="8" r="3.6"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6z"/><circle cx="17" cy="8.5" r="2.8" opacity="0.55"/><path d="M16 13.6c3 .2 5.2 2.3 5.2 5.4H18" opacity="0.55"/></svg>
      : <svg {...s}><circle cx="9" cy="8" r="3.4"/><path d="M3 20c0-3.4 2.7-5.6 6-5.6s6 2.2 6 5.6"/><path d="M16 5.2a3 3 0 0 1 0 5.8M17.5 14.2c2.4.3 4 2.2 4 4.8"/></svg>;
    default: return null;
  }
};