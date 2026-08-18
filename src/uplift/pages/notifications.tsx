'use client';

import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useListNotifications, useMarkNotificationsRead, getGetSummaryQueryKey, getListNotificationsQueryKey } from '@/src/uplift/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { TopBar, Icon, Card } from '@/src/uplift/system';

export default function Notifications() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useListNotifications();
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    // Fire mark read if there are any unread ones
    if (notifications.some(n => !n.read)) {
      markRead.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
        }
      });
    }
  }, [notifications, markRead, queryClient]);

  const k = {
    'friend_proof': { icon: 'camera', color: 'var(--sky)' },
    'friend_join': { icon: 'users', color: 'var(--orange)' },
    'pool_payout': { icon: 'gift', color: 'var(--mint-d)' },
    'streak': { icon: 'flame', color: 'var(--coral)' },
    'warning': { icon: 'bell', color: 'var(--text)' },
  } as Record<string, { icon: string, color: string }>;

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title="Notifications" onBack={() => setLocation('/app')} />
      
      <div style={{ padding: '8px 18px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading && <div className="text-center p-8 opacity-60">Loading...</div>}
        
        {notifications.map(n => {
          const c = k[n.kind] || k['warning'];
          return (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px', background: n.read ? 'var(--card)' : 'color-mix(in srgb, var(--orange) 6%, var(--card))', borderRadius: 22, border: `1.5px solid ${n.read ? 'var(--border)' : 'var(--orange)'}`, boxShadow: n.read ? 'none' : '0 6px 16px -8px rgba(240,138,76,0.3)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: `color-mix(in srgb, ${c.color} 15%, transparent)`, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon name={c.icon} size={22} color={c.color}/></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--text)' }}>{n.title}</div>
                <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)', marginTop: 2, lineHeight: 1.4 }}>{n.sub}</div>
              </div>
              {!n.read && <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--orange)' }}/>}
            </div>
          );
        })}

        {!isLoading && notifications.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', fontFamily: 'var(--font-app-body)', fontWeight: 700, color: 'var(--text3)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
            No notifications yet. You're all caught up!
          </div>
        )}
      </div>
    </div>
  );
}