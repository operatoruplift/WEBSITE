'use client';

import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useGetEarnings } from '@/src/uplift/api-client';
import { TopBar, Icon, Card } from '@/src/uplift/system';

export default function Earnings() {
  const [, setLocation] = useLocation();
  const { data: earnings, isLoading } = useGetEarnings();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!earnings) return;
    const dur = 1000;
    const end = earnings.totalEarned;
    const startTime = Date.now();
    
    const step = () => {
      const now = Date.now();
      const p = Math.min((now - startTime) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 4);
      setVal(end * ease);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [earnings]);

  if (isLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!earnings) return null;

  const rows = [
    { label: 'Bonuses from dropouts', val: earnings.bonuses, icon: 'gift', color: 'var(--mint)' },
    { label: 'Interest on vault', val: earnings.interest, icon: 'sparkle', color: 'var(--gold)' },
    { label: 'Referrals', val: earnings.referrals, icon: 'users', color: 'var(--sky)' },
    { label: 'Stakes Returned', val: earnings.stakesReturned, icon: 'shield', color: 'var(--orange)' },
  ];

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title="Total Earnings" onBack={() => setLocation('/app/vault')} />
      
      <div style={{ padding: '30px 22px', textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 15, color: 'var(--text3)' }}>Total Profit & Rewards</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 62, color: 'var(--text)', lineHeight: 1, marginTop: 4 }}>
          ${val.toFixed(2)}
        </div>
      </div>

      <div style={{ padding: '0 22px' }}>
        <Card pad={0} radius={24} style={{ overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
          {rows.map((r, i) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: i < rows.length - 1 ? `1.5px solid var(--border)` : 'none' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `color-mix(in srgb, ${r.color} 15%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name={r.icon} size={22} color={r.color}/></div>
              <div style={{ flex: 1, fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{r.label}</div>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 17, color: 'var(--text)' }}>${r.val.toFixed(2)}</div>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ textAlign: 'center', padding: '24px 30px', fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14, color: 'var(--text3)' }}>
        Your "Stakes Returned" is money you locked in and safely got back. Everything else is pure profit for showing up.
      </div>
    </div>
  );
}