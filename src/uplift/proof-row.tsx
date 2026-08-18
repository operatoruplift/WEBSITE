'use client';

import React, { useState } from 'react';
import { useGetProof, getGetProofQueryKey } from '@/src/uplift/api-client';
import { Card, Icon } from '@/src/uplift/system';

export function formatCohortDate(d: string): string {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y!, m! - 1, day!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ProofRow({ proof }: { proof: any }) {
  const [open, setOpen] = useState(false);
  const status = proof.status || 'passed';
  const badge = {
    passed: { label: '✓ verified', bg: 'color-mix(in srgb, var(--mint) 18%, transparent)', fg: 'var(--mint-d)' },
    disputed: { label: '⚖ disputed', bg: 'color-mix(in srgb, var(--orange) 16%, transparent)', fg: 'var(--orange-d, var(--orange))' },
    failed: { label: '✗ failed', bg: 'color-mix(in srgb, var(--coral) 16%, transparent)', fg: 'var(--coral-d)' },
  }[status as 'passed' | 'disputed' | 'failed'] || { label: status, bg: 'var(--card-alt)', fg: 'var(--text2)' };

  const hasVerdict = !!proof.verdict?.signals?.length;
  const expandable = hasVerdict || !!proof.hasPhoto;

  // Photo is excluded from list responses; fetch it lazily once the row is opened.
  const { data: fullProof, isLoading: photoLoading } = useGetProof(proof.id, {
    query: {
      enabled: open && !!proof.hasPhoto,
      queryKey: getGetProofQueryKey(proof.id),
      staleTime: Infinity,
    },
  });

  return (
    <Card pad={0} radius={20} style={{ overflow: 'hidden' }}>
      <button
        onClick={() => expandable && setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'transparent', border: 'none', cursor: expandable ? 'pointer' : 'default', textAlign: 'left' }}
      >
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--card-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Icon name="camera" size={18} color="var(--text3)"/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>Day {proof.day}</div>
          <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)' }}>{formatCohortDate(proof.date)}{proof.note ? ` · ${proof.note}` : ''}</div>
        </div>
        <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 12.5, color: badge.fg, background: badge.bg, borderRadius: 999, padding: '5px 11px', whiteSpace: 'nowrap' }}>{badge.label}</span>
        {expandable && <span style={{ display: 'inline-flex', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}><Icon name="chevron-r" size={16} color="var(--text3)"/></span>}
      </button>
      {open && (
        <div style={{ padding: '2px 16px 14px', borderTop: '1.5px solid var(--border)' }}>
          {proof.hasPhoto && (
            <div style={{ marginTop: 12 }}>
              {photoLoading && (
                <div style={{ height: 180, borderRadius: 16, background: 'var(--card-alt)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)' }}>Loading photo...</div>
              )}
              {fullProof?.photo && (
                <img
                  src={fullProof.photo}
                  alt={`Day ${proof.day} proof photo`}
                  loading="lazy"
                  style={{ width: '100%', maxHeight: 260, objectFit: 'cover', borderRadius: 16, display: 'block' }}
                />
              )}
            </div>
          )}
          {hasVerdict && (
            <>
              {proof.verdict.summary && (
                <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)', padding: '10px 0 6px' }}>{proof.verdict.summary}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {proof.verdict.signals.map((sig: any) => (
                  <div key={sig.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 7, flexShrink: 0, marginTop: 1, background: sig.pass ? 'color-mix(in srgb, var(--mint) 20%, transparent)' : 'color-mix(in srgb, var(--coral) 18%, transparent)', display: 'grid', placeItems: 'center' }}>
                      <Icon name={sig.pass ? 'check' : 'x'} size={12} color={sig.pass ? 'var(--mint-d)' : 'var(--coral-d)'}/>
                    </div>
                    <div>
                      <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>{sig.label}</div>
                      <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)' }}>{sig.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}