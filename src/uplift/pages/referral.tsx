'use client';

import React from 'react';
import { useLocation } from 'wouter';
import { useGetReferral } from '@/src/uplift/api-client';
import { TopBar, Icon, Card, Btn, Pill } from '@/src/uplift/system';
import { toast } from 'sonner';

export default function Referral() {
  const [, setLocation] = useLocation();
  const { data: ref, isLoading } = useGetReferral();

  if (isLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!ref) return null;

  const copyCode = () => {
    navigator.clipboard.writeText(ref.code);
    toast.success('Code copied! Send it to a friend.');
  };

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title="Invite Friends" onBack={() => setLocation('/app/journey')} />
      
      <div style={{ padding: '16px 22px 0' }}>
        <Card pad={0} radius={26} style={{ overflow: 'hidden', boxShadow: 'var(--shadow-soft)', background: `linear-gradient(150deg, var(--coral), var(--coral-d))` }}>
          <div style={{ padding: '24px', color: '#fff', textAlign: 'center' }}>
            <div style={{ fontSize: 52, animation: 'ou_float 3s ease-in-out infinite' }}>🎁</div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 28, marginTop: 8, textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Give ${ref.perFriend}, Get ${ref.perFriend}</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14.5, color: 'rgba(255,255,255,0.9)', marginTop: 4 }}>They get a ${ref.perFriend} bonus when they finish their first challenge. You get ${ref.perFriend} added to your vault.</div>
            
            <div onClick={copyCode} className="ou-squish" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.2)', padding: '12px 16px', borderRadius: 16, marginTop: 20, cursor: 'pointer', border: '2px dashed rgba(255,255,255,0.4)' }}>
              <span style={{ fontFamily: 'var(--font-landing-mono)', fontWeight: 700, fontSize: 20, letterSpacing: '0.1em' }}>{ref.code}</span>
              <Icon name="download" size={20} color="#fff"/>
            </div>
          </div>
          <div style={{ padding: '16px 24px', background: 'var(--card)' }}>
            <Btn size="lg" variant="coral" onClick={copyCode} icon={<Icon name="users" size={20} color="#fff"/>}>Share My Link</Btn>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '20px 22px 0' }}>
        {[
          { l: 'Invited', v: ref.invited, c: 'var(--sky)' },
          { l: 'Finished', v: ref.finished, c: 'var(--mint)' },
          { l: 'Earned', v: `$${ref.earned}`, c: 'var(--gold)' },
        ].map(s => (
          <Card key={s.l} pad={14} radius={20} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 22, color: s.c }}>{s.v}</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{s.l}</div>
          </Card>
        ))}
      </div>

      <div style={{ padding: '24px 22px 8px', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 19, color: 'var(--text)' }}>Your Referrals</div>
      <div style={{ padding: '0 22px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ref.friends.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--card)', borderRadius: 18, padding: '14px 16px', border: `1.5px solid var(--border)` }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--card-alt)', display: 'grid', placeItems: 'center', fontSize: 22 }}>{f.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--text)' }}>{f.name}</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)' }}>{f.note}</div>
            </div>
            {f.status === 'earned' && <Pill color="var(--mint)">+${ref.perFriend}</Pill>}
            {f.status === 'pending' && <Pill color="var(--orange)">Pending</Pill>}
          </div>
        ))}
        {ref.friends.length === 0 && (
          <div style={{ textAlign: 'center', padding: '30px 20px', fontFamily: 'var(--font-app-body)', fontWeight: 700, color: 'var(--text3)' }}>No friends invited yet. Get sharing!</div>
        )}
      </div>
    </div>
  );
}