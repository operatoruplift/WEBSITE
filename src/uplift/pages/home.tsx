'use client';

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useGetSummary, useListBatches, useJoinBatch, getGetSummaryQueryKey, getListBatchesQueryKey, getListEnrollmentsQueryKey, getGetVaultQueryKey, getListTransactionsQueryKey, getListNotificationsQueryKey } from '@/src/uplift/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { Icon, Pill, Progress, Card, Btn, Sheet } from '@/src/uplift/system';
import { toast } from 'sonner';

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: summary, isLoading: loadingSummary } = useGetSummary();
  const { data: batches = [], isLoading: loadingBatches } = useListBatches();
  
  const [sheet, setSheet] = useState<{ type: 'streak' } | { type: 'join', batchId: number } | null>(null);

  if (loadingSummary || loadingBatches) {
    return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  }
  
  if (!summary) return null;

  const { activeEnrollment, name, avatarEmoji, level, streak, unreadNotifications } = summary;

  return (
    <div className="ou-scroll flex-1 overflow-y-auto relative flex flex-col">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 22px 0' }}>
        <button onClick={() => setLocation('/app/journey')} className="ou-squish" style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'none', border: 'none', cursor: 'pointer' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: `linear-gradient(140deg, var(--orange), var(--orange-d))`, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 22, color: '#fff', boxShadow: `0 8px 20px -8px var(--orange)` }}>
              {avatarEmoji || name[0]}
            </div>
            <div style={{ position: 'absolute', bottom: -5, right: -7, background: 'var(--gold)', color: '#5A3A00', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 11, padding: '1px 7px', borderRadius: 999, border: `2.5px solid var(--bg)` }}>{level}</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)' }}>Welcome back,</div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)', lineHeight: 1 }}>{name}</div>
          </div>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button data-tut="streak" onClick={() => setSheet({ type: 'streak' })} className="ou-squish" style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'color-mix(in srgb, var(--coral) 15%, transparent)', border: 'none', padding: '8px 13px', borderRadius: 999, cursor: 'pointer' }}>
            <Icon name="flame" size={20} color="var(--coral)"/>
            <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 17, color: 'var(--coral)' }}>{streak}</span>
          </button>
          <button onClick={() => setLocation('/app/notifications')} className="ou-squish" style={{ position: 'relative', width: 44, height: 44, borderRadius: 14, background: 'var(--card)', border: `1.5px solid var(--border)`, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
            <Icon name="bell" size={21} color="var(--text)"/>
            {unreadNotifications > 0 && <span style={{ position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: 999, background: 'var(--orange)', border: `2px solid var(--card)` }}/>}
          </button>
        </div>
      </div>

      {/* Active batch hero */}
      <div style={{ padding: '20px 22px 0' }}>
        <Card pad={0} radius={30} style={{ overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          {activeEnrollment ? (
            <>
              <div style={{ background: `linear-gradient(150deg, #FDBA74 0%, var(--orange) 55%, var(--orange-d) 100%)`, padding: '20px 22px 22px', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} className="ou-squish" data-tut="hero" onClick={() => setLocation(`/app/batches/${activeEnrollment.batchId}`)}>
                <div style={{ position: 'absolute', right: -20, top: -16, fontSize: 130, opacity: 0.32 }}>{activeEnrollment.batch.emoji}</div>
                <Pill color="#fff" style={{ background: 'rgba(255,255,255,0.28)', color: '#fff', fontWeight: 800 }}>ACTIVE · DAY {activeEnrollment.dayNum} OF {activeEnrollment.daysTotal}</Pill>
                <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 28, color: '#fff', marginTop: 12, textShadow: '0 2px 8px rgba(150,70,20,0.3)' }}>{activeEnrollment.batch.title}</div>
                <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.95)', marginTop: 2 }}>{activeEnrollment.batch.task}</div>
                <div style={{ marginTop: 16, marginBottom: 4 }}>
                  <Progress value={activeEnrollment.dayNum} max={activeEnrollment.daysTotal} color="#fff" height={12}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.95)' }}>{activeEnrollment.daysTotal - activeEnrollment.dayNum} days to go</span>
                  <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 13, color: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="shield" size={14} color="#fff"/>${activeEnrollment.stake} safe · View →</span>
                </div>
              </div>
              <div style={{ padding: 16 }} data-tut="prove">
                <Btn size="xl" pulse={!summary.todayProven} onClick={() => setLocation('/app/proof')} icon={<Icon name="camera" size={24} color="#fff"/>}>
                  {summary.todayProven ? "Proven Today ✓" : "Prove It"}
                </Btn>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                  <Icon name="bell" size={14} color="var(--text3)"/>
                  <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)' }}>
                    {summary.todayProven ? "Next proof unlocks tomorrow" : "Proof due by midnight"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '30px 22px', textAlign: 'center', background: 'var(--card-alt)' }}>
              <div style={{ fontSize: 60, marginBottom: 10 }}>🏖️</div>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 24, color: 'var(--text)' }}>No active challenge</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 15, color: 'var(--text3)', marginTop: 4, marginBottom: 16 }}>Ready to lock in? Pick a batch below to get started.</div>
            </div>
          )}
        </Card>
      </div>

      {/* Discovery */}
      <div data-tut="discover" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '26px 22px 12px' }}>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 21, color: 'var(--text)' }}>Find your next challenge</div>
        <button onClick={() => setLocation('/app/browse')} className="ou-squish" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 14, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 2 }}>See all<Icon name="chevron-r" size={16} color="var(--orange)"/></button>
      </div>
      <div className="ou-hscroll" style={{ display: 'flex', alignItems: 'flex-start', flexShrink: 0, gap: 14, padding: '0 22px 8px', overflowX: 'auto' }}>
        {batches.slice(0, 4).map(b => (
          <div key={b.id} onClick={() => setSheet({ type: 'join', batchId: b.id })} className="ou-squish" style={{ flexShrink: 0, width: 248, cursor: 'pointer' }}>
            <Card pad={0} radius={26} style={{ overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
              <div style={{ background: `linear-gradient(150deg, ${b.color}, color-mix(in srgb, ${b.color} 80%, black))`, padding: '18px 18px 16px', position: 'relative', minHeight: 116 }}>
                <div style={{ position: 'absolute', right: -8, bottom: -14, fontSize: 84, opacity: 0.35 }}>{b.emoji}</div>
                <Pill color="#fff" style={{ background: 'rgba(255,255,255,0.3)', color: '#fff', fontWeight: 800 }}>{b.days} DAYS</Pill>
                {b.feeFree && <div style={{ marginTop: 8 }}><Pill color="#fff" style={{ background: 'rgba(255,255,255,0.95)', color: b.color, fontWeight: 800 }} icon={<Icon name="sparkle" size={12} color={b.color}/>}>100% BACK</Pill></div>}
              </div>
              <div style={{ padding: '14px 16px 16px' }}>
                <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>{b.title}</div>
                <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13.5, color: 'var(--text3)', marginTop: 1 }}>{b.tagline}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: b.color }}>${b.perDay}<span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)' }}>/day</span></span>
                  <div style={{ width: 38, height: 38, borderRadius: 13, background: `color-mix(in srgb, ${b.color} 15%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name="plus" size={20} color={b.color}/></div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Categories quick row */}
      <div style={{ padding: '20px 22px 4px', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 21, color: 'var(--text)' }}>Browse by goal</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px 22px 0' }}>
        {[
          { emoji: '🧠', label: 'Focus', color: 'var(--violet)' }, { emoji: '💪', label: 'Fitness', color: 'var(--orange)' },
          { emoji: '🌅', label: 'Mornings', color: 'var(--gold)' }, { emoji: '🧘', label: 'Mindfulness', color: 'var(--mint)' },
          { emoji: '📚', label: 'Learning', color: 'var(--coral)' }, { emoji: '💰', label: 'Money', color: 'var(--mint-d)' },
        ].map(c => (
          <Card key={c.label} pad={16} onClick={() => setLocation('/app/browse')} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: `color-mix(in srgb, ${c.color} 15%, transparent)`, display: 'grid', placeItems: 'center', fontSize: 24 }}>{c.emoji}</div>
            <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{c.label}</span>
          </Card>
        ))}
      </div>
      <div style={{ height: 24 }}/>

      {sheet?.type === 'join' && <JoinSheet batchId={sheet.batchId} onClose={() => setSheet(null)} />}
      {sheet?.type === 'streak' && <StreakSheet streak={streak} onClose={() => setSheet(null)} />}
    </div>
  );
}

function JoinSheet({ batchId, onClose }: { batchId: number, onClose: () => void }) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: batches = [] } = useListBatches();
  const b = batches.find(x => x.id === batchId);
  const joinBatch = useJoinBatch();

  if (!b) return null;
  const total = b.perDay * b.days;

  const onJoin = () => {
    joinBatch.mutate({ id: b.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListBatchesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        toast.success(`Locked into ${b.title}!`);
        onClose();
      },
      onError: (err) => {
        toast.error(err.data?.error || "Failed to join. Check vault balance.");
      }
    });
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 96, height: 96, borderRadius: 30, margin: '0 auto', background: `linear-gradient(145deg, ${b.color}, color-mix(in srgb, ${b.color} 70%, black))`, display: 'grid', placeItems: 'center', fontSize: 50, boxShadow: `0 14px 36px -12px ${b.color}` }}>{b.emoji}</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 26, color: 'var(--text)', marginTop: 16 }}>Commit to {b.days} Days</div>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 16, color: 'var(--text2)', marginTop: 6, maxWidth: 320, marginInline: 'auto' }}>{b.description}</div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
        {[
          { icon: 'lock', label: 'Lock in', val: `$${total}`, color: 'var(--orange)' },
          { icon: 'camera', label: 'Prove daily', val: b.proofHint.split(' ').slice(0, 2).join(' '), color: 'var(--sky)' },
          { icon: 'gift', label: 'Get back', val: `$${total}`, color: 'var(--mint)' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', background: 'var(--card-alt)', borderRadius: 20, padding: '16px 8px' }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: `color-mix(in srgb, ${s.color} 15%, transparent)`, display: 'grid', placeItems: 'center', margin: '0 auto' }}><Icon name={s.icon} size={22} color={s.color}/></div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)', marginTop: 1 }}>{s.val}</div>
          </div>
        ))}
      </div>

      {b.feeFree && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'color-mix(in srgb, var(--mint) 15%, transparent)', borderRadius: 18, padding: '14px 16px', marginTop: 14 }}>
          <div style={{ fontSize: 26 }}>✨</div>
          <div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--mint-d)' }}>Finish &amp; get 100% back, fee-free!</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>Longer challenges cover their own costs. Every dollar comes home.</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 18, marginBottom: 4 }}>
        <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13.5, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="shield" size={15} color="var(--mint)"/> Fully protected</span>
        <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13.5, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 5 }}><Icon name="heart" size={15} color="var(--coral)"/> {b.members.toLocaleString()} joined</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <Btn size="xl" disabled={joinBatch.isPending} onClick={onJoin} icon={<Icon name="lock" size={20} color="#fff"/>}>
          {joinBatch.isPending ? "Locking..." : `Lock It In for $${total}`}
        </Btn>
      </div>
      <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)', textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>Only a 1% fee: the rest is locked &amp; 100% yours. Finish to get it all back plus a bonus from quitters. Cancel free in the first 24h.</div>
    </Sheet>
  );
}

function StreakSheet({ streak, onClose }: { streak: number, onClose: () => void }) {
  const rewards = [
    { d: 7, label: 'Bonus 50 XP', got: streak >= 7 }, { d: 14, label: 'Early Riser badge', got: streak >= 14 },
    { d: 30, label: '$2 cashback boost', got: streak >= 30 }, { d: 60, label: 'Exclusive avatar frame', got: streak >= 60 },
  ];
  return (
    <Sheet onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 56, animation: 'ou_bounce 1.6s ease-in-out infinite' }}>🔥</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 28, color: 'var(--text)', marginTop: 4 }}>{streak}-day streak!</div>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 15.5, color: 'var(--text2)', marginTop: 4 }}>Keep showing up to unlock these rewards.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>
        {rewards.map(r => (
          <div key={r.d} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--card-alt)', borderRadius: 18, padding: '14px 16px', opacity: r.got ? 1 : 0.75 }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: r.got ? `color-mix(in srgb, var(--mint) 20%, transparent)` : 'var(--border)', display: 'grid', placeItems: 'center' }}>
              {r.got ? <Icon name="check" size={24} color="var(--mint)"/> : <Icon name="lock" size={20} color="var(--text3)"/>}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Day {r.d}</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13.5, color: 'var(--text2)' }}>{r.label}</div>
            </div>
            {r.got && <Pill color="var(--mint)">Unlocked</Pill>}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18 }}><Btn size="lg" onClick={onClose}>Keep it going!</Btn></div>
    </Sheet>
  );
}