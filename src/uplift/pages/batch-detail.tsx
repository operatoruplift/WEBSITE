'use client';

import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useGetBatch, useGetSummary, useJoinBatch, useListProofs, getListProofsQueryKey, getGetSummaryQueryKey, getListEnrollmentsQueryKey, getGetVaultQueryKey, getListTransactionsQueryKey, getListBatchesQueryKey, getListNotificationsQueryKey } from '@/src/uplift/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { TopBar, Card, Icon, Btn, Pill } from '@/src/uplift/system';
import { toast } from 'sonner';
import { ProofRow, formatCohortDate } from '@/src/uplift/proof-row';

export default function BatchDetail() {
  const { id } = useParams();
  const batchId = parseInt(id || '0', 10);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: batch, isLoading: loadingBatch } = useGetBatch(batchId, { query: { enabled: !!batchId, queryKey: ['getBatch', batchId] } });
  const { data: summary, isLoading: loadingSummary } = useGetSummary();
  const joinBatch = useJoinBatch();

  if (loadingBatch || loadingSummary) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }
  
  if (!batch) return <div className="flex-1 p-8">Batch not found</div>;

  const isActive = summary?.activeEnrollment?.batchId === batchId;
  const enrollment = summary?.activeEnrollment;

  if (isActive && enrollment) {
    return <ActiveBatchDetail batch={batch} enrollment={enrollment} nav={(path) => setLocation(path)} />;
  }

  const total = batch.perDay * batch.days;

  const onJoin = () => {
    joinBatch.mutate({ id: batch.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListBatchesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast.success(`Locked into ${batch.title}!`);
      },
      onError: (err) => {
        toast.error(err.data?.error || "Failed to join. Check vault balance.");
      }
    });
  };

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title={batch.title} onBack={() => setLocation('/app')} />
      
      <div style={{ textAlign: 'center', padding: '20px 22px 0' }}>
        <div style={{ width: 96, height: 96, borderRadius: 30, margin: '0 auto', background: `linear-gradient(145deg, ${batch.color}, color-mix(in srgb, ${batch.color} 70%, black))`, display: 'grid', placeItems: 'center', fontSize: 50, boxShadow: `0 14px 36px -12px ${batch.color}` }}>{batch.emoji}</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 26, color: 'var(--text)', marginTop: 16 }}>Commit to {batch.days} Days</div>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 16, color: 'var(--text2)', marginTop: 6, maxWidth: 320, marginInline: 'auto' }}>{batch.description}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, padding: '22px 22px 0' }}>
        {[
          { icon: 'lock', label: 'Lock in', val: `$${total}`, color: 'var(--orange)' },
          { icon: 'camera', label: 'Prove daily', val: batch.proofHint.split(' ').slice(0, 2).join(' '), color: 'var(--sky)' },
          { icon: 'gift', label: 'Get back', val: `$${total}`, color: 'var(--mint)' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', background: 'var(--card-alt)', borderRadius: 20, padding: '16px 8px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: `color-mix(in srgb, ${s.color} 15%, transparent)`, display: 'grid', placeItems: 'center', margin: '0 auto' }}><Icon name={s.icon} size={22} color={s.color}/></div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)', marginTop: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {batch.feeFree && (
        <div style={{ padding: '0 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'color-mix(in srgb, var(--mint) 15%, transparent)', borderRadius: 18, padding: '14px 16px', marginTop: 14 }}>
            <div style={{ fontSize: 26 }}>✨</div>
            <div>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--mint-d)' }}>Finish &amp; get 100% back, fee-free!</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>Longer challenges cover their own costs. Every dollar comes home.</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '0 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'color-mix(in srgb, var(--mint) 12%, transparent)', borderRadius: 18, padding: '14px 16px', marginTop: 14 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'var(--text3)' }}>Live prize pool</div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 22, color: 'var(--mint-d)' }}>${batch.poolBalance.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'var(--text3)' }}>Cohort ends</div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--text)' }}>{formatCohortDate(batch.endDate)}</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 20, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13.5, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="shield" size={15} color="var(--mint)"/> Fully protected</span>
        <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13.5, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="heart" size={15} color="var(--coral)"/> {batch.members.toLocaleString()} joined</span>
      </div>

      <div style={{ padding: '14px 22px 24px' }}>
        <Btn size="xl" disabled={joinBatch.isPending || !!summary?.activeEnrollment || batch.settled} onClick={onJoin} icon={<Icon name="lock" size={20} color="#fff"/>}>
          {batch.settled ? "This cohort has ended" : summary?.activeEnrollment ? "You have an active challenge" : (joinBatch.isPending ? "Locking..." : `Lock It In for $${total}`)}
        </Btn>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Only a 1% fee: the rest is locked &amp; 100% yours. Finish to get it all back plus a bonus from quitters. Cancel free in the first 24h.</div>
      </div>
    </div>
  );
}

function ActiveBatchDetail({ batch, enrollment, nav }: { batch: any, enrollment: any, nav: (path: string) => void }) {
  const [h, m, s] = useCountdown();
  const { data: proofs } = useListProofs(enrollment.id, { query: { enabled: !!enrollment.id, queryKey: getListProofsQueryKey(enrollment.id) } });

  const passedDays = new Set(
    (proofs ?? [])
      .filter(p => (p.status || 'passed') !== 'failed')
      .map(p => p.day)
  );

  const days = Array.from({ length: batch.days }, (_, i) => {
    const n = i + 1;
    let st = 'upcoming';
    if (n < enrollment.dayNum) st = passedDays.has(n) ? 'done' : 'missed';
    else if (n === enrollment.dayNum) st = 'today';
    return { n, st };
  });

  const doneCount = enrollment.provenDays;

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title="Your Challenge" onBack={() => nav('/app')} right={
        <button onClick={() => nav('/app/forfeit')} className="ou-squish" style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--card)', border: `1.5px solid var(--border)`, display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="x" size={20} color="var(--text2)"/></button>
      }/>

      <div style={{ padding: '4px 18px 0' }}>
        <Card pad={0} radius={28} style={{ overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div style={{ background: `linear-gradient(150deg, #FDBA74, var(--orange) 55%, var(--orange-d))`, padding: '22px 22px 24px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -14, top: -20, fontSize: 120, opacity: 0.3 }}>{batch.emoji}</div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 26, color: '#fff', textShadow: '0 2px 8px rgba(150,70,20,0.3)' }}>{batch.title}</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14.5, color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>{batch.task}</div>

            <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
              {[['HRS', h], ['MIN', m], ['SEC', s]].map(([lbl, val]) => (
                <div key={lbl} style={{ flex: 1, background: 'rgba(255,255,255,0.22)', borderRadius: 16, padding: '10px 0', textAlign: 'center', backdropFilter: 'blur(4px)' }}>
                  <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 26, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{String(val).padStart(2, '0')}</div>
                  <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 10.5, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.08em', marginTop: 4 }}>{lbl}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'rgba(255,255,255,0.9)', marginTop: 10 }}>left to prove today</div>
          </div>
          <div style={{ padding: 16 }}>
            <Btn size="xl" pulse={!enrollment.todayProven} onClick={() => nav('/app/proof')} icon={<Icon name="camera" size={23} color="#fff"/>}>
              {enrollment.todayProven ? "Proven Today ✓" : "Prove It Now"}
            </Btn>
          </div>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, padding: '16px 18px 0' }}>
        {[
          { label: 'Day', val: `${enrollment.dayNum}/${enrollment.daysTotal}`, color: 'var(--orange)', icon: 'calendar' },
          { label: 'Protected', val: `$${enrollment.stake}`, color: 'var(--mint)', icon: 'shield' },
          { label: 'Proven', val: `${doneCount}`, color: 'var(--coral)', icon: 'check-circle' },
        ].map(s2 => (
          <Card key={s2.label} pad={13} radius={20} style={{ textAlign: 'center' }}>
            <Icon name={s2.icon} size={20} color={s2.color}/>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 19, color: 'var(--text)', marginTop: 6 }}>{s2.val}</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 11.5, color: 'var(--text3)', marginTop: 1 }}>{s2.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ padding: '22px 18px 8px', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 19, color: 'var(--text)' }}>Your progress</div>
      <div style={{ padding: '0 18px' }}>
        <Card pad={18} radius={24}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 9 }}>
            {days.map(d => {
              const styleMap = {
                done: { bg: 'var(--mint)', fg: '#053D2C', ring: 'none' },
                today: { bg: 'var(--orange)', fg: '#fff', ring: `0 0 0 3px color-mix(in srgb, var(--orange) 30%, transparent)` },
                missed: { bg: 'color-mix(in srgb, var(--coral) 15%, transparent)', fg: 'var(--coral-d)', ring: 'none' },
                upcoming: { bg: 'var(--card-alt)', fg: 'var(--text3)', ring: 'none' },
              }[d.st as 'done' | 'today' | 'missed' | 'upcoming'];
              
              return (
                <div key={d.n} style={{ aspectRatio: '1', borderRadius: 13, background: styleMap.bg, boxShadow: styleMap.ring === 'none' ? 'none' : styleMap.ring, display: 'grid', placeItems: 'center', position: 'relative' }}>
                  {d.st === 'done' ? <Icon name="check" size={16} color={styleMap.fg}/>
                    : d.st === 'missed' ? <Icon name="x" size={15} color={styleMap.fg}/>
                    : <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 13, color: styleMap.fg }}>{d.n}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 16 }}>
            {[['Done', 'var(--mint)'], ['Today', 'var(--orange)'], ['Missed', 'var(--coral)']].map(([l, c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 5, background: c }}/>
                <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text2)' }}>{l}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {proofs && proofs.length > 0 && (
        <>
          <div style={{ padding: '22px 18px 8px', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 19, color: 'var(--text)' }}>Proof history</div>
          <div style={{ padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...proofs].sort((a, b) => b.day - a.day).map(p => <ProofRow key={p.id} proof={p} />)}
          </div>
        </>
      )}

      <div style={{ padding: '22px 18px 8px', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 19, color: 'var(--text)' }}>You're not alone</div>
      <div style={{ padding: '0 18px 24px' }}>
        <Card pad={16} radius={22} onClick={() => nav('/app/social')} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex' }}>
            {['🦊', '🐼', '🐯'].map((e, i) => (
              <div key={i} style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--card-alt)', border: `2.5px solid var(--card)`, display: 'grid', placeItems: 'center', fontSize: 20, marginLeft: i ? -12 : 0 }}>{e}</div>
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--text)' }}>{batch.members.toLocaleString()} others today</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)' }}>are on this exact challenge</div>
          </div>
          <Icon name="chevron-r" size={20} color="var(--text3)"/>
        </Card>
      </div>
    </div>
  );
}

function useCountdown() {
  const [t, setT] = useState(() => {
    const d = new Date();
    const e = new Date(d);
    e.setHours(23,59,59,999);
    return Math.floor((e.getTime() - d.getTime()) / 1000);
  });
  
  useEffect(() => {
    const id = setInterval(() => setT(x => (x > 0 ? x - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  
  return [Math.floor(t / 3600), Math.floor((t % 3600) / 60), t % 60];
}