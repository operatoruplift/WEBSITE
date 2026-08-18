'use client';

import React from 'react';
import { useLocation, useParams } from 'wouter';
import { useGetFriend } from '@/src/uplift/api-client';
import { TopBar, Card, Icon, Pill } from '@/src/uplift/system';

export default function FriendDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: friend, isLoading } = useGetFriend(parseInt(id || '0', 10));

  if (isLoading) return <div className="flex-1 flex items-center justify-center">Loading...</div>;
  if (!friend) return <div className="p-8">Friend not found</div>;

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title={friend.name} onBack={() => setLocation('/app/social')} />
      
      <div style={{ padding: '16px 22px 0' }}>
        <Card pad={0} radius={26} style={{ overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
          <div style={{ background: `linear-gradient(150deg, var(--sky), color-mix(in srgb, var(--sky) 60%, black))`, padding: '30px 24px', textAlign: 'center', position: 'relative' }}>
            <div style={{ width: 84, height: 84, borderRadius: 24, background: '#fff', display: 'grid', placeItems: 'center', fontSize: 44, margin: '0 auto', boxShadow: '0 12px 24px -8px rgba(0,0,0,0.3)' }}>{friend.emoji}</div>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 26, color: '#fff', marginTop: 14 }}>{friend.name}</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 15, color: 'rgba(255,255,255,0.9)', marginTop: 2 }}>Level {friend.level}</div>
          </div>
          
          <div style={{ padding: '16px 20px', background: 'var(--card)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `color-mix(in srgb, var(--coral) 15%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name="flame" size={20} color="var(--coral)"/></div>
                <div>
                  <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>{friend.streak}</div>
                  <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'var(--text3)' }}>Day Streak</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `color-mix(in srgb, var(--mint) 15%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name="check-circle" size={20} color="var(--mint-d)"/></div>
                <div>
                  <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>{friend.status === 'proven' ? 'Done' : 'Waiting'}</div>
                  <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'var(--text3)' }}>Today's Proof</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ padding: '24px 22px 0' }}>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 19, color: 'var(--text)', marginBottom: 12 }}>Current Challenge</div>
        {friend.batchTitle ? (
          <Card pad={18} radius={22} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--card-alt)', display: 'grid', placeItems: 'center' }}><Icon name="target" size={24} color="var(--text2)"/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>{friend.batchTitle}</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)' }}>{friend.status === 'proven' ? 'Proven today' : 'Needs to prove today'}</div>
            </div>
          </Card>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px', background: 'var(--card-alt)', borderRadius: 22, fontFamily: 'var(--font-app-body)', fontWeight: 700, color: 'var(--text3)' }}>
            No active challenge.
          </div>
        )}
      </div>
    </div>
  );
}