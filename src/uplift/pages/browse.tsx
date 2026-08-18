'use client';

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useListBatches } from '@/src/uplift/api-client';
import { TopBar, Card, Pill, Icon } from '@/src/uplift/system';

const BROWSE_FILTERS = [
  { id: 'all', label: 'All' }, { id: 'short', label: '2 weeks' }, { id: 'mid', label: 'A month' },
  { id: 'long', label: 'Marathon' }, { id: 'free', label: '100% back' },
];

export default function Browse() {
  const [, setLocation] = useLocation();
  const { data: batches = [], isLoading } = useListBatches();
  const [f, setF] = useState('all');

  const list = batches.filter(b => {
    if (f === 'all') return true;
    if (f === 'short') return b.days <= 14;
    if (f === 'mid') return b.days > 14 && b.days <= 30;
    if (f === 'long') return b.days > 30;
    if (f === 'free') return b.feeFree;
    return true;
  });

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title="All challenges" onBack={() => setLocation('/app')} />
      
      <div className="ou-hscroll" style={{ display: 'flex', gap: 9, padding: '2px 18px 14px', overflowX: 'auto' }}>
        {BROWSE_FILTERS.map(ff => {
          const on = f === ff.id;
          return (
            <button key={ff.id} onClick={() => setF(ff.id)} className="ou-squish whitespace-nowrap" style={{
              flexShrink: 0, border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: 999,
              fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 14,
              background: on ? 'var(--orange)' : 'var(--card-alt)', color: on ? '#fff' : 'var(--text2)',
              boxShadow: on ? `0 6px 14px -6px var(--orange)` : 'none',
            }}>{ff.label}</button>
          );
        })}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 18px 24px' }}>
        {isLoading && <div className="text-center py-10 opacity-60">Loading...</div>}
        {list.map(b => {
          const total = b.perDay * b.days;
          return (
            <Card key={b.id} pad={0} radius={24} onClick={() => setLocation(`/app/batches/${b.id}`)} style={{ overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'stretch' }}>
                <div style={{ width: 96, flexShrink: 0, background: `linear-gradient(150deg, ${b.color}, color-mix(in srgb, ${b.color} 80%, black))`, display: 'grid', placeItems: 'center', fontSize: 44, position: 'relative' }}>{b.emoji}</div>
                <div style={{ flex: 1, padding: '14px 16px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <Pill color={b.color}>{b.days} DAYS</Pill>
                    {b.feeFree && <Pill color="var(--mint)" icon={<Icon name="sparkle" size={11} color="var(--mint)"/>}>100% BACK</Pill>}
                  </div>
                  <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginTop: 8 }}>{b.title}</div>
                  <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 600, fontSize: 13, color: 'var(--text2)', marginTop: 2, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.description}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                    <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="heart" size={13} color="var(--coral)"/>{(b.members / 1000).toFixed(1)}k joined</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="gift" size={13} color="var(--mint)"/>${b.poolBalance.toLocaleString()} pool</span>
                    </span>
                    <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: b.color }}>${total}</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {!isLoading && list.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', fontFamily: 'var(--font-app-body)', fontWeight: 700, color: 'var(--text3)' }}>No challenges match that filter yet.</div>
        )}
      </div>
    </div>
  );
}