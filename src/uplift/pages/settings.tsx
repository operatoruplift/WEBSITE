'use client';

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useGetProfile, useUpdateProfile, getGetProfileQueryKey, getGetSummaryQueryKey } from '@/src/uplift/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { TopBar, Icon, Card, Btn } from '@/src/uplift/system';
import { useTheme } from '@/src/uplift/use-theme';
import { toast } from 'sonner';

export default function Settings() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: profile } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const { isDark, toggleTheme } = useTheme();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmoji(profile.avatarEmoji || profile.name[0]);
    }
  }, [profile]);

  if (!profile) return null;

  const handleSave = () => {
    updateProfile.mutate({ data: { name, avatarEmoji: emoji } }, {
      onSuccess: () => {
        toast.success("Profile updated");
        queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
      }
    });
  };

  const replayOnboarding = () => {
    localStorage.removeItem('uplift_onboarding_seen');
    window.location.reload();
  };

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title="Settings" onBack={() => setLocation('/app/journey')} />
      
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 12 }}>Profile</div>
        <Card pad={18}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--card-alt)', border: `2px solid var(--border-s)`, display: 'grid', placeItems: 'center', fontSize: 32 }}>{emoji}</div>
              <input type="text" value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} title="Change Emoji"/>
              <div style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 999, background: 'var(--bg)', border: `2px solid var(--border)`, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}><Icon name="settings" size={12} color="var(--text2)"/></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)', marginBottom: 4 }}>Display Name</div>
              <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', background: 'var(--card-alt)', border: `1.5px solid var(--border-s)`, borderRadius: 12, padding: '10px 14px', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)', outline: 'none' }}/>
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <Btn size="md" onClick={handleSave} disabled={updateProfile.isPending || (name === profile.name && emoji === profile.avatarEmoji)}>Save Changes</Btn>
          </div>
        </Card>
      </div>

      <div style={{ padding: '24px 22px 0' }}>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 12 }}>App Experience</div>
        <Card pad={0} radius={22} style={{ overflow: 'hidden' }}>
          <div onClick={toggleTheme} className="ou-squish" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer', borderBottom: `1.5px solid var(--border)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--card-alt)', display: 'grid', placeItems: 'center' }}><Icon name={isDark ? 'moon' : 'sun'} size={20} color="var(--text)"/></div>
              <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Dark Mode</span>
            </div>
            <div style={{ width: 44, height: 26, borderRadius: 999, background: isDark ? 'var(--mint)' : 'var(--border-s)', position: 'relative', transition: 'all 0.2s' }}>
              <div style={{ position: 'absolute', top: 3, left: isDark ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}/>
            </div>
          </div>
          <div onClick={replayOnboarding} className="ou-squish" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: 'var(--card-alt)', display: 'grid', placeItems: 'center' }}><Icon name="play" size={20} color="var(--text)"/></div>
              <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>Replay Intro</span>
            </div>
            <Icon name="chevron-r" size={20} color="var(--text3)"/>
          </div>
        </Card>
      </div>

      <div style={{ padding: '24px 22px 30px' }}>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)', marginBottom: 12 }}>About</div>
        <Card pad={20} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 24, letterSpacing: '-0.04em', color: 'var(--text)' }}>OPERATOR</div>
          <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Version 1.0.0</div>
          <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text3)', marginTop: 12 }}>"Action is finite."</div>
        </Card>
        
        <div style={{ marginTop: 24 }}>
          <Btn variant="ghost" size="md" onClick={() => window.location.assign('/')} icon={<Icon name="logout" size={18} color="var(--text)"/>}>Back to site</Btn>
        </div>
      </div>
    </div>
  );
}