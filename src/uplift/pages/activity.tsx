'use client';

import React from 'react';
import { useLocation } from 'wouter';
import { useListTransactions } from '@/src/uplift/api-client';
import { TopBar, Icon, Card } from '@/src/uplift/system';

export default function Activity() {
  const [, setLocation] = useLocation();
  const { data: transactions = [], isLoading } = useListTransactions();

  if (isLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;

  // Group by date (YYYY-MM-DD)
  const grouped = transactions.reduce((acc, tx) => {
    const d = new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (!acc[d]) acc[d] = [];
    acc[d].push(tx);
    return acc;
  }, {} as Record<string, typeof transactions>);

  const types = {
    topup: { icon: 'plus-circle', color: 'var(--mint)' },
    cashout: { icon: 'download', color: 'var(--text)' },
    stake: { icon: 'lock', color: 'var(--orange)' },
    fee: { icon: 'x', color: 'var(--coral)' },
    return: { icon: 'shield', color: 'var(--mint)' },
    bonus: { icon: 'gift', color: 'var(--mint-d)' },
    interest: { icon: 'sparkle', color: 'var(--gold)' },
    referral: { icon: 'users', color: 'var(--sky)' },
    forfeit: { icon: 'x', color: 'var(--coral)' },
  } as Record<string, { icon: string, color: string }>;

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title="Activity" onBack={() => setLocation('/app/vault')} />
      
      <div style={{ padding: '4px 18px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)', marginBottom: 12 }}>{date}</div>
            <Card pad={0} radius={22} style={{ overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
              {txs.map((tx, i) => {
                const conf = types[tx.type.toLowerCase()] || { icon: 'circle', color: 'var(--text3)' };
                const isPos = tx.amount > 0;
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', borderBottom: i < txs.length - 1 ? `1px solid var(--border)` : 'none' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: `color-mix(in srgb, ${conf.color} 15%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name={conf.icon} size={22} color={conf.color}/></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{tx.label}</div>
                      <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)' }}>{tx.sub}</div>
                    </div>
                    <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: isPos ? 'var(--mint-d)' : 'var(--text)' }}>
                      {isPos ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </Card>
          </div>
        ))}
        {transactions.length === 0 && <div className="text-center p-8 text-stone-500 font-bold">No activity yet.</div>}
      </div>
    </div>
  );
}