'use client';

import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useListPoolResults } from '@/src/uplift/api-client';
import { TopBar, Icon, Card, Pill } from '@/src/uplift/system';

export default function Pool() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { data: pools, isLoading } = useListPoolResults();

  if (isLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!pools || pools.length === 0) return <div className="p-8">No pool result found</div>;

  const selectedId = params.id ? Number(params.id) : undefined;
  const pool = (selectedId !== undefined ? pools.find(p => p.id === selectedId) : pools[0]) ?? pools[0];
  const others = pools.filter(p => p.id !== pool.id);

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col bg-[var(--bg)]">
      <TopBar title="Pool Settled" onBack={() => setLocation('/app/vault')} />
      
      <div style={{ textAlign: 'center', padding: '10px 22px 24px' }}>
        <div style={{ fontSize: 72, animation: 'ou_pop 0.6s cubic-bezier(0.34,1.7,0.5,1) both' }}>{pool.emoji}</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 28, color: 'var(--text)', marginTop: 8 }}>{pool.batchTitle}</div>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 15, color: 'var(--text3)' }}>{pool.days} Days Complete</div>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>
          Settled {new Date(pool.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div style={{ padding: '0 22px 24px' }}>
        <Card pad={20} radius={26} style={{ background: `linear-gradient(155deg, var(--mint), var(--mint-d))`, color: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.9)' }}>Your Share</div>
            <Pill color="var(--mint-d)" style={{ background: '#fff' }} icon={<Icon name="check" size={14} color="var(--mint-d)"/>}>Paid Out</Pill>
          </div>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 48, marginTop: 4, lineHeight: 1 }}>${pool.me.total.toFixed(2)}</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.95)' }}>
              <span>Stake returned</span><span>${pool.me.stakeBack.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.95)' }}>
              <span>Finisher bonus</span><span>+${pool.me.bonus.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.95)' }}>
              <span>Interest earned</span><span>+${pool.me.interest.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '0 22px 14px', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>The Numbers</div>
      
      <div style={{ padding: '0 22px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Card pad={16} radius={20} alt flat>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="users" size={18} color="var(--text2)"/>
            <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>Started</span>
          </div>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>{pool.members.toLocaleString()}</div>
        </Card>
        <Card pad={16} radius={20} alt flat>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name="medal" size={18} color="var(--mint)"/>
            <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>Finished</span>
          </div>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>{pool.finishers.toLocaleString()}</div>
        </Card>
        <Card pad={16} radius={20} alt flat style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Icon name="x" size={18} color="var(--coral)"/>
                <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>Dropped out</span>
              </div>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 22, color: 'var(--text)' }}>{pool.dropouts.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Forfeited</div>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 22, color: 'var(--coral)' }}>${pool.forfeited.toFixed(2)}</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '0 22px 24px' }}>
        <div style={{ background: 'color-mix(in srgb, var(--orange) 12%, transparent)', borderRadius: 20, padding: '20px', border: `1.5px solid color-mix(in srgb, var(--orange) 25%, transparent)` }}>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 18, color: 'var(--orange-dk)' }}>Bonus Pool</div>
          <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13.5, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>
            {pool.dropouts.toLocaleString()} people quit, leaving ${pool.forfeited.toFixed(2)} behind. After the 1% protocol cut, ${pool.bonusPool.toFixed(2)} went straight into the pockets of the {pool.finishers.toLocaleString()} who showed up.
          </div>
        </div>
      </div>

      {others.length > 0 && (
        <>
          <div style={{ padding: '0 22px 12px', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>Past Settlements</div>
          <div style={{ padding: '0 22px 30px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {others.map(p => (
              <Card key={p.id} pad={14} radius={18} alt flat onClick={() => setLocation(`/app/pool/${p.id}`)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <div style={{ fontSize: 30, flexShrink: 0 }}>{p.emoji}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{p.batchTitle}</div>
                  <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)' }}>
                    Settled {new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {p.finishers.toLocaleString()} finished
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--mint-d)' }}>${p.me.total.toFixed(2)}</div>
                  <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 11.5, color: 'var(--text3)' }}>your share</div>
                </div>
                <Icon name="chevron-r" size={18} color="var(--text3)"/>
              </Card>
            ))}
          </div>
        </>
      )}
      {others.length === 0 && <div style={{ height: 6 }}/>}
    </div>
  );
}