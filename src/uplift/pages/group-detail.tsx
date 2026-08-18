'use client';

import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useGetGroup } from '@/src/uplift/api-client';
import { TopBar, Card, Icon, Pill, Progress } from '@/src/uplift/system';

export default function GroupDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: group, isLoading } = useGetGroup(parseInt(id || '0', 10));

  if (isLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!group) return <div className="p-8">Group not found</div>;

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title={group.name} onBack={() => setLocation('/app/social')} />
      
      <div style={{ padding: '10px 22px 24px', textAlign: 'center' }}>
        <div style={{ width: 84, height: 84, borderRadius: 24, background: `color-mix(in srgb, var(--orange) 20%, transparent)`, display: 'grid', placeItems: 'center', fontSize: 44, margin: '0 auto' }}>{group.emoji}</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 26, color: 'var(--text)', marginTop: 14 }}>{group.name}</div>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14.5, color: 'var(--text2)', marginTop: 4, maxWidth: 300, marginInline: 'auto' }}>{group.description}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 22px' }}>
        <Card pad={14} radius={20} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 24, color: 'var(--text)' }}>{group.members}</div>
          <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Members</div>
        </Card>
        <Card pad={14} radius={20} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 24, color: 'var(--orange)' }}>{group.streakAvg}</div>
          <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Avg Streak</div>
        </Card>
      </div>

      <div style={{ padding: '24px 22px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 19, color: 'var(--text)' }}>Leaderboard</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '0 22px 24px' }}>
        {group.memberList.map((f, i) => (
          <div key={f.id} onClick={() => setLocation(`/app/friends/${f.id}`)} className="ou-squish" style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'var(--card)', borderRadius: 18, padding: '13px 15px', border: `1.5px solid var(--border)`, cursor: 'pointer' }}>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15, color: 'var(--text3)', width: 22 }}>{i + 1}</div>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--card-alt)', display: 'grid', placeItems: 'center', fontSize: 20 }}>{f.emoji}</div>
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 999, background: f.status === 'proven' ? 'var(--mint)' : 'var(--text3)', border: `2.5px solid var(--card)` }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--text)' }}>{f.name}</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)' }}>{f.batchTitle || 'No active challenge'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15, color: 'var(--coral)' }}>
              <Icon name="flame" size={14} color="var(--coral)"/>
              {f.streak}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}