'use client';

import React from 'react';
import { FadeIn } from '@/src/components/Animators';

/* ------------------------------------------------------------------ */
/* Inline phone screen components                                       */
/* ------------------------------------------------------------------ */

const HomeScreen: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FDFBF7', overflowY: 'auto' }}>
    {/* Orange header */}
    <div style={{
      background: 'linear-gradient(160deg, #F08A4C, #E0742F)',
      padding: '14px 16px 18px',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <div aria-hidden="true" style={{ position: 'absolute', right: -22, top: -22, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.14)', pointerEvents: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <div style={{ width: 32, height: 32, borderRadius: 11, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, color: '#E0742F', fontFamily: 'var(--font-baloo2, sans-serif)' }}>K</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 12, color: '#fff', lineHeight: 1.2, fontFamily: 'var(--font-baloo2, sans-serif)' }}>Kai</div>
            <div style={{ fontWeight: 700, fontSize: 9, color: 'rgba(255,255,255,0.88)' }}>Level 12 Operator</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <span style={{ fontSize: 12 }}>🔥</span>
          <span style={{ fontWeight: 800, fontSize: 12, color: '#fff', fontFamily: 'var(--font-baloo2, sans-serif)' }}>12</span>
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 9, color: 'rgba(255,255,255,0.82)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5, position: 'relative', zIndex: 2 }}>Active batch</div>
      <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 14, padding: '10px 12px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
          <div>
            <span style={{ fontSize: 16 }}>🌅</span>
            <div style={{ fontWeight: 800, fontSize: 12, color: '#fff', marginTop: 2, fontFamily: 'var(--font-baloo2, sans-serif)' }}>The 6 AM Club</div>
            <div style={{ fontWeight: 600, fontSize: 9, color: 'rgba(255,255,255,0.85)' }}>Wake up 6 AM for 28 days</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 800, fontSize: 10, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-baloo2, sans-serif)' }}>Day 3/28</div>
            <div style={{ fontWeight: 700, fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>$1.50/day</div>
          </div>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.25)' }}>
          <div style={{ height: '100%', width: '10.7%', borderRadius: 99, background: '#fff' }} />
        </div>
      </div>
      <div style={{
        width: '100%', marginTop: 10, height: 38,
        background: '#fff', borderRadius: 12,
        fontWeight: 800, fontSize: 13, color: '#E0742F',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        fontFamily: 'var(--font-baloo2, sans-serif)',
        position: 'relative', zIndex: 2,
        boxShadow: '0 6px 16px -8px rgba(100,40,0,0.45)',
      }}>
        📸 Prove It
      </div>
    </div>

    {/* Discover */}
    <div style={{ padding: '12px 14px 8px', flexShrink: 0 }}>
      <div style={{ fontWeight: 800, fontSize: 11, color: '#1C1917', marginBottom: 9, fontFamily: 'var(--font-baloo2, sans-serif)' }}>Discover batches</div>
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 3 }}>
        {[
          { emoji: '🏃', name: 'Jumpstart', bg: 'rgba(52,211,153,0.12)', price: '$0.50' },
          { emoji: '🏋️', name: 'Iron Month', bg: 'rgba(96,165,250,0.12)', price: '$2.00' },
          { emoji: '🧠', name: 'Deep Work', bg: 'rgba(167,139,250,0.12)', price: '$1.00' },
        ].map((b) => (
          <div key={b.name} style={{ flexShrink: 0, width: 86, borderRadius: 13, overflow: 'hidden', border: '1.5px solid #EDE6DA', background: '#fff' }}>
            <div style={{ background: b.bg, padding: '8px 8px 4px', borderBottom: '1.5px solid #EDE6DA' }}>
              <span style={{ fontSize: 18 }}>{b.emoji}</span>
            </div>
            <div style={{ padding: '6px 8px 8px' }}>
              <div style={{ fontWeight: 800, fontSize: 9.5, color: '#1C1917', lineHeight: 1.2, fontFamily: 'var(--font-baloo2, sans-serif)' }}>{b.name}</div>
              <div style={{ fontWeight: 700, fontSize: 9, color: '#A8A29E', marginTop: 2 }}>{b.price}/day</div>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Category grid */}
    <div style={{ padding: '8px 14px 12px', flex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
        {[
          { emoji: '🧠', label: 'Focus' },
          { emoji: '🏋️', label: 'Fitness' },
          { emoji: '🌅', label: 'Mornings' },
          { emoji: '🧘', label: 'Mindful' },
          { emoji: '📚', label: 'Learning' },
          { emoji: '💰', label: 'Finance' },
        ].map((cat) => (
          <div key={cat.label} style={{ background: '#F4EEE4', borderRadius: 11, padding: '8px 6px', textAlign: 'center', border: '1.5px solid #EDE6DA' }}>
            <div style={{ fontSize: 16 }}>{cat.emoji}</div>
            <div style={{ fontWeight: 700, fontSize: 8.5, color: '#57534E', marginTop: 2 }}>{cat.label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const ProofScreen: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1C1917', overflow: 'hidden' }}>
    <div style={{ padding: '13px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <div>
        <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', fontFamily: 'var(--font-baloo2, sans-serif)' }}>Snap your proof</div>
        <div style={{ fontWeight: 600, fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>The 6 AM Club - Day 3</div>
      </div>
      <span style={{ fontSize: 20 }}>🌅</span>
    </div>

    {/* Viewfinder */}
    <div style={{ flex: 1, margin: '0 14px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
      <div style={{
        width: '100%', aspectRatio: '3/4', borderRadius: 18,
        background: '#2A2420', position: 'relative', overflow: 'hidden',
        boxShadow: '0 0 0 1.5px rgba(240,138,76,0.35)',
        maxHeight: '100%',
      }}>
        {/* Corner brackets */}
        {([
          { top: '10px', left: '10px' as string } as React.CSSProperties,
          { top: '10px', right: '10px' as string } as React.CSSProperties,
          { bottom: '10px', left: '10px' as string } as React.CSSProperties,
          { bottom: '10px', right: '10px' as string } as React.CSSProperties,
        ] as Array<{ top?: string; left?: string; right?: string; bottom?: string }>).map((pos, idx) => (
          <div key={idx} style={{
            position: 'absolute',
            width: 18, height: 18,
            border: '2px solid #F08A4C',
            borderRadius: 3,
            borderRight: pos.right !== undefined ? '2px solid #F08A4C' : 'none',
            borderLeft: pos.left !== undefined ? '2px solid #F08A4C' : 'none',
            borderTop: pos.top !== undefined ? '2px solid #F08A4C' : 'none',
            borderBottom: pos.bottom !== undefined ? '2px solid #F08A4C' : 'none',
            ...pos,
          }} />
        ))}
        {/* Scene pill */}
        <div style={{ position: 'absolute', bottom: 36, left: 0, right: 0, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(240,138,76,0.22)', borderRadius: 99,
            padding: '5px 13px', border: '1.5px solid rgba(240,138,76,0.5)',
          }}>
            <span style={{ fontSize: 13 }}>🌅</span>
            <span style={{ fontWeight: 700, fontSize: 10.5, color: 'rgba(255,255,255,0.9)' }}>Morning scene</span>
          </div>
        </div>
      </div>
    </div>

    {/* Shutter */}
    <div style={{ padding: '12px 16px 18px', textAlign: 'center', flexShrink: 0 }}>
      <div style={{ fontWeight: 600, fontSize: 10, color: 'rgba(255,255,255,0.55)', marginBottom: 12 }}>
        AI confirms in seconds
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          width: 58, height: 58, borderRadius: '50%',
          background: '#F08A4C',
          border: '3px solid rgba(240,138,76,0.35)',
          boxShadow: '0 0 0 5px rgba(240,138,76,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          📸
        </div>
      </div>
    </div>
  </div>
);

const JourneyScreen: React.FC = () => (
  <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FDFBF7', overflowY: 'auto' }}>
    <div style={{
      background: 'linear-gradient(160deg, #F08A4C, #E0742F)',
      padding: '14px 16px 18px',
      position: 'relative', overflow: 'hidden', flexShrink: 0,
    }}>
      <div aria-hidden="true" style={{ position: 'absolute', right: -22, top: -22, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.14)' }} />
      <div style={{ fontWeight: 800, fontSize: 14, color: '#fff', marginBottom: 12, fontFamily: 'var(--font-baloo2, sans-serif)', position: 'relative', zIndex: 2 }}>My Journey</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 50, height: 50, borderRadius: 16, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#E0742F', fontFamily: 'var(--font-baloo2, sans-serif)' }}>K</div>
          <div style={{ position: 'absolute', bottom: -5, right: -6, background: '#FBBF24', color: '#5A3A00', fontWeight: 800, fontSize: 9, padding: '1px 6px', borderRadius: 99, border: '2px solid #fff' }}>12</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18, color: '#fff', fontFamily: 'var(--font-baloo2, sans-serif)' }}>Kai</div>
          <div style={{ fontWeight: 700, fontSize: 10, color: 'rgba(255,255,255,0.88)' }}>Level 12 Operator</div>
        </div>
      </div>
      <div style={{ marginTop: 11, position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontWeight: 700, fontSize: 9.5, color: 'rgba(255,255,255,0.88)' }}>720 XP</span>
          <span style={{ fontWeight: 700, fontSize: 9.5, color: 'rgba(255,255,255,0.88)' }}>1000 XP - Lvl 13</span>
        </div>
        <div style={{ height: 6, borderRadius: 99, background: 'rgba(255,255,255,0.25)' }}>
          <div style={{ height: '100%', width: '72%', borderRadius: 99, background: '#fff' }} />
        </div>
      </div>
    </div>

    {/* Stat chips */}
    <div style={{ display: 'flex', gap: 7, padding: '11px 12px 0', flexShrink: 0 }}>
      {[
        { emoji: '🔥', val: '12', label: 'Streak', color: '#F08A4C' },
        { emoji: '🏆', val: '3', label: 'Badges', color: '#FBBF24' },
        { emoji: '✅', val: '47', label: 'Proven', color: '#34D399' },
      ].map((s) => (
        <div key={s.label} style={{ flex: 1, background: '#fff', borderRadius: 13, padding: '8px 5px', textAlign: 'center', border: '1.5px solid #EDE6DA' }}>
          <div style={{ fontSize: 15 }}>{s.emoji}</div>
          <div style={{ fontWeight: 800, fontSize: 14, color: s.color, fontFamily: 'var(--font-baloo2, sans-serif)' }}>{s.val}</div>
          <div style={{ fontWeight: 700, fontSize: 8.5, color: '#A8A29E' }}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* Attributes */}
    <div style={{ padding: '11px 12px 0', flexShrink: 0 }}>
      <div style={{ fontWeight: 800, fontSize: 11, color: '#1C1917', marginBottom: 8, fontFamily: 'var(--font-baloo2, sans-serif)' }}>Your stats</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {[
          { key: 'Focus', emoji: '🧠', val: 78, color: '#A78BFA' },
          { key: 'Vitality', emoji: '💪', val: 64, color: '#34D399' },
          { key: 'Consistency', emoji: '🔥', val: 91, color: '#F08A4C' },
        ].map((a) => (
          <div key={a.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontWeight: 700, fontSize: 10, color: '#1C1917', display: 'flex', alignItems: 'center', gap: 3 }}>
                {a.emoji} {a.key}
              </span>
              <span style={{ fontWeight: 800, fontSize: 10, color: a.color, fontFamily: 'var(--font-baloo2, sans-serif)' }}>{a.val}</span>
            </div>
            <div style={{ height: 5, borderRadius: 99, background: '#EDE6DA' }}>
              <div style={{ height: '100%', width: `${a.val}%`, borderRadius: 99, background: a.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Trophy room */}
    <div style={{ padding: '11px 12px 12px', flex: 1 }}>
      <div style={{ fontWeight: 800, fontSize: 11, color: '#1C1917', marginBottom: 8, fontFamily: 'var(--font-baloo2, sans-serif)' }}>
        Trophy room{' '}
        <span style={{ fontWeight: 700, fontSize: 9, color: '#A8A29E' }}>3/6</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
        {[
          { emoji: '🌅', got: true, bg: 'linear-gradient(150deg, #F08A4C, #E0742F)', name: 'Early Riser' },
          { emoji: '🎯', got: true, bg: 'linear-gradient(150deg, #A78BFA, #7C3AED)', name: 'Perfect Week' },
          { emoji: '🔥', got: true, bg: 'linear-gradient(150deg, #FB923C, #DC2626)', name: '30-Day Streak' },
          { emoji: null, got: false, bg: '#F4EEE4', name: 'Iron Will' },
          { emoji: null, got: false, bg: '#F4EEE4', name: 'Summit' },
          { emoji: null, got: false, bg: '#F4EEE4', name: 'Unstoppable' },
        ].map((b, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{
              aspectRatio: '1', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: b.bg,
              border: b.got ? 'none' : '1.5px dashed #EDE6DA',
              opacity: b.got ? 1 : 0.5,
              fontSize: b.got ? 20 : 13,
            }}>
              {b.got ? b.emoji : '🔒'}
            </div>
            <div style={{ fontWeight: 700, fontSize: 8, color: b.got ? '#1C1917' : '#A8A29E', marginTop: 3, lineHeight: 1.2 }}>{b.name}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Screen definitions                                                   */
/* ------------------------------------------------------------------ */

const SCREENS = [
  {
    id: 'home',
    label: 'Your daily home',
    description: 'Active batch, streak, and fresh challenges to discover.',
    dark: false,
    Component: HomeScreen,
  },
  {
    id: 'proof',
    label: 'Snap your proof',
    description: 'Point and shoot. AI confirms you showed up in seconds.',
    dark: true,
    Component: ProofScreen,
  },
  {
    id: 'journey',
    label: 'Level up for real',
    description: 'Track attributes, collect badges, and watch yourself grow.',
    dark: false,
    Component: JourneyScreen,
  },
] as const;

/* ------------------------------------------------------------------ */
/* Section                                                              */
/* ------------------------------------------------------------------ */

const AppSection: React.FC = () => {
  return (
    <section
      id="app"
      aria-labelledby="app-heading"
      className="relative w-full"
      style={{
        paddingTop: 'clamp(80px, 10vw, 120px)',
        paddingBottom: 'clamp(80px, 10vw, 120px)',
        background: 'var(--color-background-alt, #F4EEE4)',
      }}
    >
      <div className="max-w-[1180px] mx-auto px-6 md:px-10">
        {/* Header */}
        <FadeIn block className="text-center">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
            <span className="text-xs font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--color-primary)' }}>
              The App
            </span>
            <span className="h-px w-6 inline-block" style={{ background: 'var(--color-primary)' }} />
          </div>
          <h2
            id="app-heading"
            className="text-[clamp(34px,5vw,52px)] tracking-[-0.02em] max-w-[700px] mx-auto"
            style={{ fontFamily: 'var(--font-baloo2, inherit)' }}
          >
            Built to keep you going
          </h2>
          <p
            className="mt-4 max-w-[560px] mx-auto font-semibold leading-relaxed"
            style={{ fontSize: 'clamp(16px,2vw,18px)', color: 'var(--color-muted)' }}
          >
            Three screens. One honest answer a day. Progress that actually feels like progress.
          </p>
        </FadeIn>

        {/* Phone mockups */}
        <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-8 items-start">
          {SCREENS.map(({ id, label, description, dark, Component }, i) => (
            <FadeIn key={id} delay={i * 80} block className="flex flex-col items-center">
              {/* Phone frame */}
              <div
                style={{
                  width: '100%',
                  maxWidth: 220,
                  aspectRatio: '9/19',
                  borderRadius: 40,
                  background: '#1C1917',
                  padding: '11px 5px',
                  boxShadow: '0 36px 72px -20px rgba(100,60,20,0.45), 0 0 0 2px rgba(255,255,255,0.07) inset',
                  position: 'relative',
                  margin: '0 auto',
                }}
                aria-hidden="true"
              >
                {/* Dynamic island */}
                <div style={{
                  position: 'absolute', top: 13, left: '50%', transform: 'translateX(-50%)',
                  width: 70, height: 20, borderRadius: 10,
                  background: '#0E0C0B', zIndex: 10,
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.06)',
                }} />
                {/* Side buttons */}
                <div style={{ position: 'absolute', right: -3, top: '26%', width: 3, height: 46, borderRadius: 3, background: '#333' }} />
                <div style={{ position: 'absolute', left: -3, top: '22%', width: 3, height: 28, borderRadius: 3, background: '#333' }} />
                <div style={{ position: 'absolute', left: -3, top: '31%', width: 3, height: 48, borderRadius: 3, background: '#333' }} />
                {/* Screen */}
                <div style={{ borderRadius: 30, overflow: 'hidden', height: '100%', position: 'relative' }}>
                  {/* Status bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 34,
                    zIndex: 5, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
                    padding: '0 14px 3px',
                  }}>
                    <span style={{ fontSize: 8, fontWeight: 800, color: dark ? 'rgba(255,255,255,0.7)' : 'rgba(28,25,23,0.6)' }}>9:41</span>
                    <div style={{ width: 12, height: 5.5, borderRadius: 1.5, border: `1px solid ${dark ? 'rgba(255,255,255,0.5)' : 'rgba(28,25,23,0.4)'}`, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 1, right: 2.5, borderRadius: 0.5, background: dark ? 'rgba(255,255,255,0.5)' : 'rgba(28,25,23,0.4)' }} />
                    </div>
                  </div>
                  {/* Content */}
                  <div style={{ position: 'absolute', inset: 0, paddingTop: 34, background: dark ? '#1C1917' : '#FDFBF7' }}>
                    <div style={{ height: '100%' }}>
                      <Component />
                    </div>
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div className="mt-6 text-center" style={{ maxWidth: 220 }}>
                <div style={{ fontFamily: 'var(--font-baloo2, inherit)', fontWeight: 800, fontSize: 17, color: 'var(--color-foreground)' }}>
                  {label}
                </div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-muted)', marginTop: 4, lineHeight: 1.45 }}>
                  {description}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* Try the live app */}
        <FadeIn delay={280} block className="mt-12 text-center">
          <a
            href="/app"
            className="inline-flex items-center gap-2.5 h-14 px-8 rounded-[18px] font-bold text-base transition-all duration-150 hover:-translate-y-px"
            style={{
              background: 'linear-gradient(140deg, #F08A4C, #E0742F)',
              color: '#fff',
              boxShadow: '0 14px 30px -12px rgba(224,116,47,0.65)',
              fontFamily: 'var(--font-baloo2, inherit)',
            }}
          >
            <span aria-hidden="true">&#x1F4F1;</span>
            Try the live app
            <span aria-hidden="true">&rarr;</span>
          </a>
          <div className="mt-4">
            <span
              className="text-xs font-bold uppercase tracking-[0.14em]"
              style={{ color: 'var(--color-muted-foreground, #A8A29E)' }}
            >
              Works in your browser &middot; installs as an app &middot; iOS + Android coming soon
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default AppSection;
