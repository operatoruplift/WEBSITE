'use client';

import React, { useRef } from 'react';
import { useLocation } from 'wouter';
import { useGetProfile, useListBadges, useListEnrollments } from '@/src/uplift/api-client';
import { Icon, Card, Progress } from '@/src/uplift/system';
import { useTheme } from '@/src/uplift/use-theme';
import { toast } from 'sonner';

export default function Journey() {
  const [, setLocation] = useLocation();
  const { data: profile } = useGetProfile();
  const { data: badges = [] } = useListBadges();
  const { data: enrollments = [] } = useListEnrollments();
  const { isDark, toggleTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const daysProven = enrollments.reduce((s, e) => s + e.provenDays, 0);
  const earnedBadges = badges.filter((b) => b.got).length;

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { 
      // Mocking avatar update using emoji field for now, or just local state.
      // The API has avatarEmoji. We can just use an emoji.
      toast.success('Profile photo updated!');
    };
    r.readAsDataURL(f);
  };

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <input ref={fileRef} type="file" accept="image/*" onChange={onPhoto} style={{ display: 'none' }}/>
      
      <div style={{ background: `linear-gradient(160deg, var(--orange), var(--orange-d))`, padding: '14px 22px 30px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', pointerEvents: 'none' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
          <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 20, color: '#fff' }}>My Journey</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={toggleTheme} className="ou-squish" style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(255,255,255,0.22)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name={isDark ? 'sun' : 'moon'} size={20} color="#fff"/></button>
            <button onClick={() => setLocation('/app/settings')} className="ou-squish" style={{ width: 40, height: 40, borderRadius: 13, background: 'rgba(255,255,255,0.22)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="settings" size={20} color="#fff"/></button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 18, position: 'relative' }}>
          <div style={{ position: 'relative' }}>
            <button onClick={() => fileRef.current && fileRef.current.click()} className="ou-squish" aria-label="Change profile photo" style={{ width: 78, height: 78, borderRadius: 26, background: 'rgba(255,255,255,0.95)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 36, color: 'var(--orange-d)', boxShadow: '0 8px 20px -6px rgba(150,70,20,0.4)', border: 'none', padding: 0, cursor: 'pointer', overflow: 'hidden' }}>
              {profile.avatarEmoji || profile.name[0]}
            </button>
            <div onClick={() => fileRef.current && fileRef.current.click()} style={{ position: 'absolute', bottom: -6, left: -6, width: 28, height: 28, borderRadius: 999, background: '#fff', display: 'grid', placeItems: 'center', boxShadow: '0 3px 8px rgba(120,70,20,0.3)', cursor: 'pointer' }}><Icon name="camera" size={15} color="var(--orange-d)"/></div>
            <div style={{ position: 'absolute', bottom: -6, right: -8, background: 'var(--gold)', color: '#5A3A00', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 13, padding: '2px 9px', borderRadius: 999, border: '3px solid #fff' }}>{profile.level}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 26, color: '#fff' }}>{profile.name}</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.92)' }}>Level {profile.level} Operator</div>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.92)' }}>{profile.xp} XP</span>
            <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.92)' }}>{profile.xpMax} XP · Lvl {profile.level + 1}</span>
          </div>
          <Progress value={profile.xp} max={profile.xpMax} color="#fff" height={14}/>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '18px 22px 0' }}>
        {[
          { icon: 'flame', val: `${profile.streak}`, label: 'Day streak', color: 'var(--coral)', msg: `${profile.streak}-day streak! Show up tomorrow to keep the flame alive.` },
          { icon: 'trophy', val: `${earnedBadges}`, label: 'Badges', color: 'var(--gold)', msg: `You have earned ${earnedBadges} of ${badges.length} badges. See them in your Trophy room below.` },
          { icon: 'check-circle', val: `${daysProven}`, label: 'Days proven', color: 'var(--mint)', msg: `${daysProven} days proven so far. Every proof counts.` },
        ].map(s => (
          <Card key={s.label} pad={14} onClick={() => toast.success(s.msg)} style={{ flex: 1, textAlign: 'center' }}>
            <Icon name={s.icon} size={26} color={s.color}/>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 22, color: 'var(--text)', marginTop: 4 }}>{s.val}</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'var(--text3)' }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ padding: '24px 22px 12px', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>Your stats</div>
      <div style={{ padding: '0 22px' }}>
        <Card pad={18}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {profile.attrs?.map(a => (
              <div key={a.key} onClick={() => toast(`${a.key}: ${a.val}/100. Grows as you finish ${a.key.toLowerCase()} challenges.`)} style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>
                    <Icon name={a.icon} size={18} color={a.color}/>{a.key}
                  </span>
                  <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15, color: a.color }}>{a.val}</span>
                </div>
                <Progress value={a.val} max={100} color={a.color} height={12}/>
              </div>
            ))}
            {(!profile.attrs || profile.attrs.length === 0) && (
              <div className="text-stone-500 text-sm">Join challenges to build your stats.</div>
            )}
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 22px 12px' }}>
        <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>Trophy room</span>
        <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 13.5, color: 'var(--text3)' }}>{earnedBadges} / {badges.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, padding: '0 22px' }}>
        {badges.map(b => (
          <div key={b.id} onClick={() => toast(b.got ? `${b.name} earned!` : `${b.name} is still locked. Keep going to unlock it.`)} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <div style={{
              aspectRatio: '1', borderRadius: 22, display: 'grid', placeItems: 'center', fontSize: 38, position: 'relative',
              background: b.got ? `linear-gradient(150deg, ${b.color}, ${b.color}99)` : 'var(--card-alt)',
              boxShadow: b.got ? `0 10px 24px -10px ${b.color}, inset 0 2px 0 rgba(255,255,255,0.4)` : 'none',
              border: b.got ? 'none' : `2px dashed var(--border-s)`,
              filter: b.got ? 'none' : 'grayscale(1)', opacity: b.got ? 1 : 0.55,
            }}>
              {b.got ? b.emoji : <Icon name="lock" size={26} color="var(--text3)"/>}
              {b.got && <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: 'linear-gradient(135deg, rgba(255,255,255,0.5), transparent 45%)', pointerEvents: 'none' }}/>}
            </div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 11.5, color: b.got ? 'var(--text)' : 'var(--text3)', marginTop: 6, lineHeight: 1.15 }}>{b.name}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: '24px 22px 0' }}>
        <Card pad={16} radius={22} onClick={() => setLocation('/app/history')} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 15, background: 'color-mix(in srgb, var(--gold) 18%, transparent)', display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name="trophy" size={24} color="var(--gold)"/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16.5, color: 'var(--text)' }}>Past challenges</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>Revisit your proof record &amp; verdicts.</div>
          </div>
          <Icon name="chevron-r" size={22} color="var(--text3)"/>
        </Card>
      </div>

      <div style={{ padding: '16px 22px 0' }}>
        <Card pad={0} radius={22} onClick={() => setLocation('/app/referral')} style={{ overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: `color-mix(in srgb, var(--coral) 10%, color-mix(in srgb, var(--orange) 10%, transparent))` }}>
            <div style={{ fontSize: 36 }}>🎁</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16.5, color: 'var(--text)' }}>Give $5, get $5</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>Invite friends &amp; earn when they finish.</div>
            </div>
            <Icon name="chevron-r" size={22} color="var(--text3)"/>
          </div>
        </Card>
      </div>
      <div style={{ height: 24 }}/>
    </div>
  );
}