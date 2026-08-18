'use client';

import React, { useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { useListFriends, useListGroups, useGetProfile, useGetSummary, useAddFriend, useCreateGroup, getListFriendsQueryKey, getListGroupsQueryKey } from '@/src/uplift/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { TopBar, Icon, Card, Pill, Progress, Btn, Sheet } from '@/src/uplift/system';
import { toast } from 'sonner';

export default function Social() {
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState('leaders');

  return (
    <div className="ou-scroll flex-1 overflow-y-auto flex flex-col">
      <TopBar title="Community" right={
        <button className="ou-squish" onClick={() => toast('Use the search to add friends')} style={{ width: 44, height: 44, borderRadius: 14, background: 'var(--orange)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: `0 6px 0 var(--orange-dk)` }}><Icon name="plus" size={22} color="#fff"/></button>
      }/>

      <div style={{ display: 'flex', gap: 6, padding: '4px 18px 14px' }}>
        {[['leaders', 'Leaderboard'], ['friends', 'Friends'], ['groups', 'Groups']].map(([id, lbl]) => (
          <button key={id} onClick={() => setTab(id)} className="ou-squish" style={{
            flex: 1, height: 42, borderRadius: 14, border: 'none', cursor: 'pointer',
            background: tab === id ? 'var(--text)' : 'var(--card)', color: tab === id ? 'var(--bg)' : 'var(--text2)',
            fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 13.5,
            boxShadow: tab === id ? 'none' : `1.5px solid var(--border)`,
          }}>{lbl}</button>
        ))}
      </div>

      {tab === 'leaders' && <Leaderboard />}
      {tab === 'friends' && <FriendsList nav={(path) => setLocation(path)} />}
      {tab === 'groups' && <GroupBatches nav={(path) => setLocation(path)} />}
      
      <div style={{ height: 20 }}/>
    </div>
  );
}

function Leaderboard() {
  const { data: friends = [] } = useListFriends();
  const { data: profile } = useGetProfile();
  
  // mock leaderboard assembly
  const all = [...friends.map(f => ({ rank: 0, name: f.name, emoji: f.emoji, xp: (f.level * 100) + f.streak * 10, streak: f.streak, you: false }))];
  if (profile) {
    all.push({ rank: 0, name: 'You', emoji: profile.avatarEmoji || profile.name[0], xp: profile.xp, streak: profile.streak, you: true });
  }
  
  all.sort((a, b) => b.xp - a.xp);
  all.forEach((p, i) => p.rank = i + 1);

  if (all.length < 3) {
    return <div className="p-8 text-center text-stone-500">Add more friends to see the leaderboard!</div>;
  }

  const top3 = all.slice(0, 3);
  const podium = [top3[1], top3[0], top3[2]]; // 2, 1, 3
  const heights = [78, 104, 64];

  return (
    <div style={{ padding: '0 18px' }}>
      <Card pad={18} radius={26} style={{ background: `linear-gradient(160deg, var(--card), var(--card-alt))` }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
          {podium.map((p, i) => {
            const place = [2, 1, 3][i];
            const medal = ['#C0C0C0', 'var(--gold)', '#CD7F32'][i];
            if (!p) return null;
            return (
              <div key={p.name} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ position: 'relative', width: i === 1 ? 64 : 52, height: i === 1 ? 64 : 52, margin: '0 auto 8px' }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: 18, background: 'var(--card-alt)', border: `3px solid ${medal}`, display: 'grid', placeItems: 'center', fontSize: i === 1 ? 30 : 24 }}>{p.emoji}</div>
                  <div style={{ position: 'absolute', bottom: -8, left: '50%', transform: 'translateX(-50%)', width: 22, height: 22, borderRadius: 999, background: medal, color: '#fff', fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 12, display: 'grid', placeItems: 'center', border: `2px solid var(--card)` }}>{place}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 13.5, color: 'var(--text)', marginTop: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 12.5, color: 'var(--orange)' }}>{p.xp.toLocaleString()} XP</div>
                <div style={{ height: heights[i], borderRadius: '12px 12px 0 0', marginTop: 8, background: i === 1 ? `linear-gradient(var(--orange), var(--orange-d))` : 'var(--card-alt)', border: `1.5px solid var(--border)`, borderBottom: 'none' }}/>
              </div>
            );
          })}
        </div>
      </Card>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
        {all.slice(3).map(p => (
          <div key={p.rank} style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'var(--card)', borderRadius: 18, padding: '12px 15px', border: `1.5px solid var(--border)` }}>
            <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15, color: 'var(--text3)', width: 22 }}>{p.rank}</span>
            <div style={{ width: 40, height: 40, borderRadius: 13, background: 'var(--card-alt)', display: 'grid', placeItems: 'center', fontSize: 20 }}>{p.emoji}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15, color: 'var(--text)' }}>{p.name}</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="flame" size={13} color="var(--coral)"/>{p.streak} days</div>
            </div>
            <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 14.5, color: 'var(--orange)' }}>{p.xp.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FriendsList({ nav }: { nav: (p: string) => void }) {
  const { data: friends = [] } = useListFriends();
  const [sheet, setSheet] = useState(false);
  
  return (
    <div style={{ padding: '0 18px' }}>
      <button onClick={() => setSheet(true)} className="ou-squish" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 13, background: 'color-mix(in srgb, var(--orange) 15%, transparent)', border: 'none', borderRadius: 18, padding: '14px 16px', cursor: 'pointer', marginBottom: 14 }}>
        <div style={{ width: 42, height: 42, borderRadius: 13, background: 'var(--orange)', display: 'grid', placeItems: 'center' }}><Icon name="plus" size={22} color="#fff"/></div>
        <div style={{ textAlign: 'left', flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--orange-d)' }}>Add a friend</div>
          <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text2)' }}>Cheer each other on. Stay accountable.</div>
        </div>
        <Icon name="chevron-r" size={20} color="var(--orange-d)"/>
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {friends.map(f => (
          <div key={f.id} onClick={() => nav(`/app/friends/${f.id}`)} className="ou-squish" style={{ display: 'flex', alignItems: 'center', gap: 13, background: 'var(--card)', borderRadius: 18, padding: '13px 15px', border: `1.5px solid var(--border)`, cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--card-alt)', display: 'grid', placeItems: 'center', fontSize: 23 }}>{f.emoji}</div>
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: 999, background: f.status === 'proven' ? 'var(--mint)' : 'var(--text3)', border: `2.5px solid var(--card)` }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15.5, color: 'var(--text)' }}>{f.name}</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: f.status === 'proven' ? 'var(--mint-d)' : 'var(--text3)' }}>{f.batchTitle || 'No active challenge'}</div>
            </div>
            <button onClick={(e) => { e.stopPropagation(); toast(`You cheered for ${f.name}! 👏`); }} className="ou-squish" style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--card-alt)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
              <span style={{ fontSize: 18 }}>👏</span>
            </button>
          </div>
        ))}
      </div>
      
      {sheet && <AddFriendSheet onClose={() => setSheet(false)} />}
    </div>
  );
}

function AddFriendSheet({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const queryClient = useQueryClient();
  const addFriend = useAddFriend();

  const handleAdd = () => {
    if (!q) return;
    addFriend.mutate({ data: { name: q, emoji: '👤' } }, {
      onSuccess: () => {
        toast.success(`Added ${q}`);
        queryClient.invalidateQueries({ queryKey: getListFriendsQueryKey() });
        setQ('');
        onClose();
      }
    });
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 24, color: 'var(--text)', textAlign: 'center' }}>Add friends</div>
      <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14.5, color: 'var(--text2)', textAlign: 'center', marginTop: 4 }}>Find people to keep you accountable.</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card-alt)', borderRadius: 16, padding: '0 16px', marginTop: 18, height: 54, border: `1.5px solid var(--border)` }}>
        <Icon name="eye" size={20} color="var(--text3)"/>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Type friend's name..." style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}/>
      </div>

      <div className="mt-4">
        <Btn onClick={handleAdd} disabled={!q || addFriend.isPending}>Add Friend</Btn>
      </div>

      <div style={{ height: 8 }}/>
    </Sheet>
  );
}

function GroupBatches({ nav }: { nav: (p: string) => void }) {
  const { data: groups = [] } = useListGroups();
  const [sheet, setSheet] = useState(false);

  return (
    <div style={{ padding: '0 18px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {groups.map(g => (
          <Card key={g.id} pad={0} radius={22} onClick={() => nav(`/app/groups/${g.id}`)} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 16px' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `color-mix(in srgb, var(--orange) 20%, transparent)`, display: 'grid', placeItems: 'center', fontSize: 26 }}>{g.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16.5, color: 'var(--text)' }}>{g.name}</div>
                <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12.5, color: 'var(--text3)' }}>{g.members} members</div>
              </div>
              <Pill color="var(--orange)">Avg Streak: {g.streakAvg}</Pill>
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              <Progress value={g.streakAvg} max={30} color="var(--orange)" height={10}/>
            </div>
          </Card>
        ))}
      </div>
      
      <button onClick={() => setSheet(true)} className="ou-squish" style={{ width: '100%', marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'var(--card)', border: `2px dashed var(--border-s)`, borderRadius: 18, padding: '16px', cursor: 'pointer' }}>
        <Icon name="plus" size={20} color="var(--text2)"/>
        <span style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 15, color: 'var(--text2)' }}>Start a group challenge</span>
      </button>
      
      {sheet && <CreateGroupSheet onClose={() => setSheet(false)} />}
    </div>
  );
}

function CreateGroupSheet({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState('');
  const queryClient = useQueryClient();
  const createGroup = useCreateGroup();

  const handleAdd = () => {
    if (!name) return;
    createGroup.mutate({ data: { name, emoji: '🔥', description: 'A new squad' } }, {
      onSuccess: () => {
        toast.success(`Group ${name} created!`);
        queryClient.invalidateQueries({ queryKey: getListGroupsQueryKey() });
        onClose();
      }
    });
  };

  return (
    <Sheet onClose={onClose}>
      <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 24, color: 'var(--text)', textAlign: 'center' }}>Create Group</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card-alt)', borderRadius: 16, padding: '0 16px', marginTop: 18, height: 54, border: `1.5px solid var(--border)` }}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Group name..." style={{ flex: 1, border: 'none', background: 'none', outline: 'none', fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}/>
      </div>

      <div className="mt-4">
        <Btn onClick={handleAdd} disabled={!name || createGroup.isPending}>Create Group</Btn>
      </div>

      <div style={{ height: 8 }}/>
    </Sheet>
  );
}