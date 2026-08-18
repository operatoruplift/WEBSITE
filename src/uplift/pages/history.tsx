'use client';

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useListEnrollments, useListProofs, getListEnrollmentsQueryKey, getListProofsQueryKey } from '@/src/uplift/api-client';
import { TopBar, Card, Icon } from '@/src/uplift/system';
import { ProofRow, formatCohortDate } from '@/src/uplift/proof-row';

export default function History() {
  const [, setLocation] = useLocation();
  const { data: enrollments, isLoading } = useListEnrollments({ query: { queryKey: getListEnrollmentsQueryKey() } });

  const past = (enrollments ?? []).filter(e => e.status !== 'active');

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title="Past challenges" onBack={() => setLocation('/app/journey')} />

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">Loading...</div>
      ) : past.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 32px' }}>
          <div style={{ fontSize: 52 }}>🏅</div>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 20, color: 'var(--text)', marginTop: 12 }}>No finished challenges yet</div>
          <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14, color: 'var(--text3)', marginTop: 6 }}>When a challenge ends, your full proof record lives here.</div>
        </div>
      ) : (
        <div style={{ padding: '4px 18px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {past.map(e => <PastEnrollmentCard key={e.id} enrollment={e} />)}
        </div>
      )}
    </div>
  );
}

function PastEnrollmentCard({ enrollment }: { enrollment: any }) {
  const [open, setOpen] = useState(false);
  const batch = enrollment.batch;
  const { data: proofs, isLoading } = useListProofs(enrollment.id, {
    query: { enabled: open, queryKey: getListProofsQueryKey(enrollment.id) },
  });

  const outcome = enrollment.status === 'won'
    ? { label: '🏆 Completed', bg: 'color-mix(in srgb, var(--mint) 18%, transparent)', fg: 'var(--mint-d)' }
    : { label: 'Forfeited', bg: 'color-mix(in srgb, var(--coral) 16%, transparent)', fg: 'var(--coral-d)' };

  return (
    <Card pad={0} radius={22} style={{ overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}
      >
        <div style={{ width: 46, height: 46, borderRadius: 15, flexShrink: 0, background: `linear-gradient(145deg, ${batch?.color || 'var(--orange)'}, color-mix(in srgb, ${batch?.color || 'var(--orange)'} 70%, black))`, display: 'grid', placeItems: 'center', fontSize: 24 }}>{batch?.emoji || '🔥'}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{batch?.title || 'Challenge'}</div>
          <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)' }}>
            Started {formatCohortDate(enrollment.startDate)} · {enrollment.provenDays}/{enrollment.daysTotal} days proven · ${enrollment.stake} stake
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 12.5, color: outcome.fg, background: outcome.bg, borderRadius: 999, padding: '5px 11px', whiteSpace: 'nowrap' }}>{outcome.label}</span>
        <span style={{ display: 'inline-flex', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}><Icon name="chevron-r" size={16} color="var(--text3)"/></span>
      </button>
      {open && (
        <div style={{ padding: '4px 14px 14px', borderTop: '1.5px solid var(--border)' }}>
          {isLoading ? (
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)', padding: '12px 4px' }}>Loading proofs...</div>
          ) : !proofs || proofs.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)', padding: '12px 4px' }}>No proofs were submitted for this challenge.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {[...proofs].sort((a, b) => b.day - a.day).map(p => <ProofRow key={p.id} proof={p} />)}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}