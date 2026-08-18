'use client';

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useGetVault, useGetProfile, useTopUp, useCashOut, useListPoolResults, getGetVaultQueryKey, getListTransactionsQueryKey } from '@/src/uplift/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { TopBar, Icon, Card, Pill, Btn, Sheet } from '@/src/uplift/system';
import { toast } from 'sonner';

export default function Vault() {
  const [, setLocation] = useLocation();
  const { data: vault } = useGetVault();
  const { data: profile } = useGetProfile();
  const { data: pools } = useListPoolResults();
  const [sheet, setSheet] = useState<'feeInfo' | null>(null);
  const lastPool = pools?.[0];

  if (!vault) return null;

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <div style={{ padding: '8px 22px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 24, color: 'var(--text)' }}>Your Vault</span>
        <button onClick={() => setLocation('/app/activity')} className="ou-squish" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 13px', borderRadius: 999, border: 'none', cursor: 'pointer', background: 'var(--card-alt)' }}>
          <Icon name="calendar" size={15} color="var(--text2)"/>
          <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 12.5, color: 'var(--text2)' }}>Activity</span>
        </button>
      </div>

      <div style={{ padding: '18px 22px 0' }}>
        <Card pad={0} radius={30} style={{ overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ background: `linear-gradient(155deg, var(--mint), var(--mint-d))`, padding: '26px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -16, top: -10, opacity: 0.25 }}><Icon name="vault" size={150} color="#fff" filled/></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon name="lock" size={17} color="rgba(255,255,255,0.95)"/>
              <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 14, color: 'rgba(255,255,255,0.95)' }}>Protected in active challenges</span>
            </div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 52, color: '#fff', marginTop: 6, lineHeight: 1, textShadow: '0 3px 10px rgba(5,61,44,0.25)' }}>${vault.protected.toFixed(2)}</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>Comes back to you as you prove each day.</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13.5, color: 'var(--text3)' }}>Available to cash out</div>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 28, color: 'var(--text)' }}>${vault.available.toFixed(2)}</div>
            </div>
            <Pill color="var(--mint)" icon={<Icon name="check" size={13} color="var(--mint)"/>}>Unlocked</Pill>
          </div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '18px 22px 0' }}>
        <Btn size="lg" onClick={() => setLocation('/app/vault/topup')} icon={<Icon name="plus-circle" size={22} color="#fff"/>}>Top Up</Btn>
        <Btn variant="ghost" size="lg" onClick={() => setLocation('/app/vault/cashout')} icon={<Icon name="download" size={20} color="var(--text)"/>}>Cash Out</Btn>
      </div>

      <div style={{ display: 'flex', gap: 12, padding: '12px 22px 0' }}>
        <Card pad={14} radius={18} onClick={() => setLocation('/app/earnings')} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `color-mix(in srgb, var(--gold) 15%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name="sparkle" size={21} color="var(--gold)"/></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 11.5, color: 'var(--text3)' }}>Interest earned</div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>+$0.00</div>
          </div>
        </Card>
        <Card pad={14} radius={18} onClick={() => setLocation('/app/pool')} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `color-mix(in srgb, var(--mint) 15%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name="trophy" size={21} color="var(--mint-d)"/></div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 11.5, color: 'var(--text3)' }}>{pools && pools.length > 1 ? `Payouts (${pools.length})` : 'Last payout'}</div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>${(lastPool?.me.total ?? 0).toFixed(2)}</div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '20px 22px 0' }}>
        <Card pad={16} alt flat onClick={() => setSheet('feeInfo')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="shield" size={16} color="var(--mint-d)"/>
              <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 14, color: 'var(--text)' }}>Insured &amp; safe</span>
            </div>
            <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 12.5, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 2 }}>Where money goes<Icon name="chevron-r" size={14} color="var(--orange)"/></span>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[
              { icon: 'shield', t: 'Bank-grade security' }, { icon: 'lock', t: 'Only you can withdraw' }, { icon: 'heart', t: 'Money never leaves you' },
            ].map(x => (
              <div key={x.t} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ width: 42, height: 42, borderRadius: 13, background: `color-mix(in srgb, var(--mint) 15%, transparent)`, display: 'grid', placeItems: 'center', margin: '0 auto' }}><Icon name={x.icon} size={21} color="var(--mint-d)"/></div>
                <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 11.5, color: 'var(--text2)', marginTop: 7, lineHeight: 1.2 }}>{x.t}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ height: 24 }}/>
      
      {sheet === 'feeInfo' && <FeeSheet onClose={() => setSheet(null)} />}
    </div>
  );
}

function Keypad({ onKey, accent }: { onKey: (k: string) => void, accent: string }) {
  const keys = ['1','2','3','4','5','6','7','8','9','.','0','del'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
      {keys.map(k => (
        <button key={k} onClick={() => onKey(k)} className="ou-squish" style={{
          height: 58, border: 'none', background: 'transparent', cursor: 'pointer',
          fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: k === 'del' ? 20 : 26, color: accent,
          display: 'grid', placeItems: 'center', borderRadius: 16,
        }}>{k === 'del' ? '⌫' : k}</button>
      ))}
    </div>
  );
}

export function TopUp() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [amt, setAmt] = useState('50');
  const presets = [25, 50, 100, 200];
  const topUp = useTopUp();
  
  const push = (k: string) => {
    setAmt(prev => {
      if (k === 'del') return prev.length <= 1 ? '0' : prev.slice(0, -1);
      if (k === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0') return k;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      return (prev + k).slice(0, 6);
    });
  };
  const val = parseFloat(amt) || 0;

  const handleTopUp = () => {
    if (val <= 0) return;
    topUp.mutate({ data: { amount: val } }, {
      onSuccess: () => {
        toast.success(`Topped up $${val.toFixed(2)}`);
        queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        setLocation('/app/vault');
      }
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Add money" onBack={() => setLocation('/app/vault')}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14, color: 'var(--text3)' }}>Amount to add</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 34, color: 'var(--text2)', marginTop: 8 }}>$</span>
          <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 68, color: 'var(--text)', lineHeight: 1 }}>{amt}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '7px 14px', borderRadius: 999, background: 'var(--card-alt)' }}>
          <Icon name="shield" size={15} color="var(--mint-d)"/>
          <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>No fee to add: you only stake what you choose</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '0 22px 8px' }}>
        {presets.map(p => (
          <button key={p} onClick={() => setAmt(String(p))} className="ou-squish" style={{
            flex: 1, padding: '12px 0', borderRadius: 14, cursor: 'pointer', border: `2px solid ${val === p ? 'var(--orange)' : 'transparent'}`,
            background: val === p ? `color-mix(in srgb, var(--orange) 10%, transparent)` : 'var(--card-alt)', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)',
          }}>${p}</button>
        ))}
      </div>
      <div style={{ padding: '0 14px' }}><Keypad onKey={push} accent="var(--text)"/></div>
      <div style={{ padding: '6px 22px 24px' }}>
        <Btn size="xl" onClick={handleTopUp} disabled={topUp.isPending} icon={<Icon name="apple" size={20} color="#fff"/>}>
          {topUp.isPending ? "Adding..." : `Add $${val.toFixed(2)} with Apple Pay`}
        </Btn>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
          <Icon name="lock" size={13} color="var(--text3)"/>
          <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)' }}>Encrypted · powered by Apple Pay & Stripe</span>
        </div>
      </div>
    </div>
  );
}

export function CashOut() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: vault } = useGetVault();
  const cashOut = useCashOut();
  
  const max = vault?.available || 0;
  const [amt, setAmt] = useState(max.toFixed(2));
  
  const push = (k: string) => {
    setAmt(prev => {
      if (k === 'del') return prev.length <= 1 ? '0' : prev.slice(0, -1);
      if (k === '.') return prev.includes('.') ? prev : prev + '.';
      if (prev === '0') return k;
      if (prev.includes('.') && prev.split('.')[1].length >= 2) return prev;
      return (prev + k).slice(0, 6);
    });
  };
  
  const val = parseFloat(amt) || 0;
  const over = val > max;

  const handleCashOut = () => {
    if (val <= 0 || over) return;
    cashOut.mutate({ data: { amount: val } }, {
      onSuccess: () => {
        toast.success(`Cashed out $${val.toFixed(2)}`);
        queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        setLocation('/app/vault');
      },
      onError: () => toast.error("Failed to cash out.")
    });
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <TopBar title="Cash out" onBack={() => setLocation('/app/vault')}/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 24px' }}>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14, color: 'var(--text3)' }}>Available: ${max.toFixed(2)}</div>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 2, marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 34, color: over ? 'var(--coral)' : 'var(--text2)', marginTop: 8 }}>$</span>
          <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 68, color: over ? 'var(--coral)' : 'var(--text)', lineHeight: 1 }}>{amt}</span>
        </div>
        <button onClick={() => setAmt(max.toFixed(2))} className="ou-squish" style={{ marginTop: 12, padding: '8px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', background: `color-mix(in srgb, var(--mint) 15%, transparent)`, fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--mint-d)' }}>Cash out all ${max.toFixed(2)}</button>
        {over && <div style={{ marginTop: 12, fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 13.5, color: 'var(--coral)' }}>That's more than you have available.</div>}
      </div>
      <div style={{ padding: '0 22px 10px' }}>
        <Card pad={14} radius={18} style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#1A1F71', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 13, color: '#fff', fontStyle: 'italic' }}>VISA</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Visa •• 4291</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)' }}>Arrives in seconds · no fee</div>
          </div>
          <Icon name="chevron-r" size={20} color="var(--text3)"/>
        </Card>
      </div>
      <div style={{ padding: '0 14px' }}><Keypad onKey={push} accent="var(--text)"/></div>
      <div style={{ padding: '6px 22px 24px' }}>
        <Btn variant="success" size="xl" disabled={over || val <= 0 || cashOut.isPending} onClick={handleCashOut} icon={<Icon name="download" size={20} color="#053D2C"/>}>
          {cashOut.isPending ? "Processing..." : `Cash out $${val.toFixed(2)}`}
        </Btn>
      </div>
    </div>
  );
}

function FeeSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 46 }}>🔍</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 25, color: 'var(--text)', marginTop: 6 }}>Where your money goes</div>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 15, color: 'var(--text2)', marginTop: 5, maxWidth: 330, marginInline: 'auto' }}>No hidden fees, ever. Here's exactly how it works.</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        {[
          { icon: 'lock', color: 'var(--orange)', t: 'You stake it', d: `A tiny 1% keeps the app running. The other 99% is locked and protected: only you can touch it.` },
          { icon: 'sparkle', color: 'var(--gold)', t: 'It earns while it waits', d: `Locked funds quietly earn about 4.5% interest. That extra comes back to finishers, not us.` },
          { icon: 'gift', color: 'var(--mint)', t: 'You finish & cash in', d: 'Get every dollar back, plus a bonus from the people who dropped out. Showing up literally pays.' },
          { icon: 'heart', color: 'var(--coral)', t: 'If you slip', d: `Only 5% is kept: the rest goes straight to the finishers' bonus pool. No one profits off your bad day except your future crew.` },
        ].map(s => (
          <div key={s.t} style={{ display: 'flex', gap: 13, background: 'var(--card-alt)', borderRadius: 18, padding: '14px 15px' }}>
            <div style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 13, background: `color-mix(in srgb, ${s.color} 20%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name={s.icon} size={22} color={s.color}/></div>
            <div>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{s.t}</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 600, fontSize: 13.5, color: 'var(--text2)', marginTop: 2, lineHeight: 1.45 }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 16 }}>
        <Icon name="shield" size={16} color="var(--mint-d)"/>
        <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 13.5, color: 'var(--text2)' }}>Funds held in regulated, insured custody</span>
      </div>
      <div style={{ marginTop: 16 }}><Btn size="lg" onClick={onClose}>Got it</Btn></div>
    </Sheet>
  );
}