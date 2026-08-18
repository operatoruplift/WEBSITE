'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useGetSummary, useSubmitProof, useDisputeProof, useForfeitEnrollment, getGetSummaryQueryKey, getListEnrollmentsQueryKey, getGetVaultQueryKey, getListTransactionsQueryKey, getGetProfileQueryKey, getListBatchesQueryKey, getListNotificationsQueryKey, type ProofResult } from '@/src/uplift/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { Icon, Pill, Confetti, Card, Btn, Progress } from '@/src/uplift/system';
import { toast } from 'sonner';

export default function Proof() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: summary } = useGetSummary();
  const submitProof = useSubmitProof();
  const disputeProof = useDisputeProof();

  const [phase, setPhase] = useState<'camera' | 'verifying' | 'verdict'>('camera');
  const [captured, setCaptured] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [result, setResult] = useState<ProofResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const enrollment = summary?.activeEnrollment;

  if (!enrollment) {
    return <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#100D0B] text-white">
      <div>No active challenge.</div>
      <Btn onClick={() => setLocation('/app')} style={{ marginTop: 16 }}>Back Home</Btn>
    </div>;
  }

  const onAccepted = (res: ProofResult) => {
    queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetProfileQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    if (res.completed) {
      queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      setLocation('/app/proof/victory-completed');
    } else {
      setLocation('/app/proof/victory');
    }
  };

  const submit = (photoDataUrl: string | null, capturedAt: string | null) => {
    setCaptured(true);
    setTimeout(() => {
      setPhase('verifying');
      submitProof.mutate({ id: enrollment.id, data: { ...(photoDataUrl ? { photo: photoDataUrl } : {}), ...(capturedAt ? { capturedAt } : {}) } }, {
        onSuccess: (res) => {
          setResult(res);
          setPhase('verdict');
        },
        onError: (err) => {
          toast.error(err.data?.error || "Failed to submit proof");
          setLocation('/app/batches/' + enrollment.batchId);
        }
      });
    }, 450);
  };

  const retry = () => {
    setResult(null);
    setPhoto(null);
    setCaptured(false);
    setPhase('camera');
    if (fileRef.current) fileRef.current.value = '';
  };

  const dispute = () => {
    if (!result) return;
    disputeProof.mutate({ id: result.proofId }, {
      onSuccess: (res) => onAccepted(res),
      onError: (err) => toast.error(err.data?.error || "Couldn't open a dispute"),
    });
  };

  // Downscale an uploaded photo to a ≤800px JPEG data URL before submitting.
  const onFile = (file: File | undefined) => {
    if (!file) return;
    const capturedAt = new Date(file.lastModified).toISOString();
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, 800 / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      setPhoto(dataUrl);
      submit(dataUrl, capturedAt);
    };
    img.onerror = () => { URL.revokeObjectURL(url); toast.error("Couldn't read that photo"); };
    img.src = url;
  };

  return (
    <div style={{ flex: 1, position: 'relative', background: '#100D0B', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', inset: 0, background: captured ? 'linear-gradient(160deg, #3a2f26, #1a1512)' : 'radial-gradient(circle at 50% 46%, #2c2620, #14100d 80%)' }}/>

      <div style={{ position: 'absolute', top: 158, left: 26, right: 26, bottom: 172, borderRadius: 26, overflow: 'hidden' }}>
        {!captured && (
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)', backgroundSize: '33.33% 33.33%' }}/>
        )}
        {photo ? (
          <img src={photo} alt="Your proof" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}/>
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
            <div style={{ fontSize: 70, lineHeight: 1, opacity: captured ? 1 : 0.42, filter: captured ? 'none' : 'blur(0.5px)' }}>{enrollment.batch.emoji}</div>
          </div>
        )}
        {[
          { pos: { top: 0, left: 0 }, sides: ['Top', 'Left'], radius: '7px 0 0 0' },
          { pos: { top: 0, right: 0 }, sides: ['Top', 'Right'], radius: '0 7px 0 0' },
          { pos: { bottom: 0, right: 0 }, sides: ['Bottom', 'Right'], radius: '0 0 7px 0' },
          { pos: { bottom: 0, left: 0 }, sides: ['Bottom', 'Left'], radius: '0 0 0 7px' },
        ].map((c, i) => {
          const st: any = { position: 'absolute', width: 28, height: 28, borderRadius: c.radius, ...c.pos };
          c.sides.forEach(s => { st['border' + s] = '3px solid rgba(255,255,255,0.65)'; });
          return <div key={i} style={st}/>;
        })}
      </div>

      {phase === 'camera' && (
        <React.Fragment>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
            <button onClick={() => setLocation('/app')} className="ou-squish" style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer' }}><Icon name="x" size={22} color="#fff"/></button>
            <Pill color="#fff" style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', fontWeight: 800 }} icon={<Icon name="flame" size={13} color="var(--orange)"/>}>{enrollment.batch.title}</Pill>
            <div style={{ width: 42 }}/>
          </div>

          <div className="ou-fadein" style={{ position: 'absolute', top: 80, left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
            <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 24, color: '#fff', textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>Snap your proof!</div>
            <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{enrollment.batch.proofHint}</div>
          </div>

          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 0 38px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, zIndex: 10 }}>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={(e) => onFile(e.target.files?.[0])}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
              <button onClick={() => fileRef.current?.click()} className="ou-squish" style={{ background: 'rgba(255,255,255,0.14)', border: 'none', width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', cursor: 'pointer' }} aria-label="Upload a photo"><Icon name="download" size={22} color="#fff"/></button>
              <button onClick={() => fileRef.current?.click()} className="ou-squish" style={{ width: 84, height: 84, borderRadius: '50%', background: '#fff', border: '5px solid rgba(255,255,255,0.4)', cursor: 'pointer', boxShadow: '0 0 30px rgba(255,255,255,0.4)' }} aria-label="Take a photo"/>
              <button onClick={() => submit(null, null)} className="ou-squish" style={{ background: 'rgba(255,255,255,0.14)', border: 'none', width: 48, height: 48, borderRadius: 16, display: 'grid', placeItems: 'center', cursor: 'pointer' }} aria-label="Submit without a photo"><Icon name="camera" size={22} color="#fff"/></button>
            </div>
            <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Snap or upload a photo · AI checks every proof</span>
          </div>
        </React.Fragment>
      )}

      {phase === 'verifying' && <Verifying />}
      {phase === 'verdict' && result && (
        <VerdictScreen result={result} onAccepted={() => onAccepted(result)} onRetry={retry} onDispute={dispute} disputing={disputeProof.isPending} />
      )}
    </div>
  );
}

function VerdictScreen({ result, onAccepted, onRetry, onDispute, disputing }: {
  result: ProofResult;
  onAccepted: () => void;
  onRetry: () => void;
  onDispute: () => void;
  disputing: boolean;
}) {
  const signals = result.verdict.signals;
  const [shown, setShown] = useState(0);
  const allShown = shown >= signals.length;

  // Reveal signals one by one, then auto-advance on pass.
  useEffect(() => {
    if (shown >= signals.length) return;
    const t = setTimeout(() => setShown(s => s + 1), 380);
    return () => clearTimeout(t);
  }, [shown, signals.length]);

  useEffect(() => {
    if (!allShown || !result.accepted) return;
    const t = setTimeout(onAccepted, 900);
    return () => clearTimeout(t);
  }, [allShown, result.accepted]);

  const failed = allShown && !result.accepted;

  return (
    <div className="ou-fadein" style={{ position: 'absolute', inset: 0, background: 'rgba(16,13,11,0.92)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 20, padding: '28px 24px' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 54, lineHeight: 1 }}>{!allShown ? '🔬' : result.accepted ? '✅' : '🚫'}</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 23, color: '#fff', marginTop: 10 }}>
          {!allShown ? 'AI is verifying your proof' : result.accepted ? 'Proof verified!' : 'Proof rejected'}
        </div>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.72)', marginTop: 5, maxWidth: 300 }}>
          {allShown ? result.verdict.summary : 'EXIF · GPS · timestamp → classifier → LLM'}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 340, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {signals.map((s, i) => (
          <div key={s.id} className={i < shown ? 'ou-fadein' : ''} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, opacity: i < shown ? 1 : 0.18, transition: 'opacity 0.25s' }}>
            <div style={{ width: 22, height: 22, borderRadius: 8, flexShrink: 0, marginTop: 1, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 900, background: i < shown ? (s.pass ? 'color-mix(in srgb, var(--mint) 25%, transparent)' : 'color-mix(in srgb, var(--coral) 28%, transparent)') : 'rgba(255,255,255,0.1)', color: i < shown ? (s.pass ? 'var(--mint)' : 'var(--coral)') : 'rgba(255,255,255,0.4)' }}>
              {i < shown ? (s.pass ? '✓' : '✗') : '·'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 14, color: '#fff' }}>{s.label}</div>
              {i < shown && <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: s.pass ? 'rgba(255,255,255,0.55)' : 'color-mix(in srgb, var(--coral) 80%, #fff)' }}>{s.detail}</div>}
            </div>
          </div>
        ))}
      </div>

      {failed && (
        <div className="ou-fadein" style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn size="xl" onClick={onRetry} icon={<Icon name="camera" size={20} color="#fff"/>}>Retry with a new photo</Btn>
          <Btn variant="ghost" size="xl" onClick={onDispute} disabled={disputing} style={{ color: '#fff', background: 'rgba(255,255,255,0.1)' }}>
            {disputing ? 'Sending to human review...' : 'Dispute: request human review'}
          </Btn>
          <span style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>Disputes go to a human reviewer. False rejections always get fixed.</span>
        </div>
      )}
    </div>
  );
}

function Verifying() {
  const lines = ['Looking at your photo...', 'Checking the time...', 'Almost there...'];
  const [li, setLi] = useState(0);
  useEffect(() => { const t = setInterval(() => setLi(v => Math.min(v + 1, lines.length - 1)), 800); return () => clearInterval(t); }, []);
  return (
    <div className="ou-fadein" style={{ position: 'absolute', inset: 0, background: 'rgba(16,13,11,0.82)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 26, zIndex: 20 }}>
      <div style={{ position: 'relative', width: 130, height: 130 }}>
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `4px solid color-mix(in srgb, var(--orange) 20%, transparent)`, borderTopColor: 'var(--orange)', animation: 'ou_spin 1s linear infinite' }}/>
        <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', border: `4px solid color-mix(in srgb, var(--sky) 20%, transparent)`, borderBottomColor: 'var(--sky)', animation: 'ou_spin 1.5s linear infinite reverse' }}/>
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 52, animation: 'ou_bounce 1.4s ease-in-out infinite' }}>🔍</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 23, color: '#fff' }}>Checking your proof...</div>
        <div key={li} className="ou-fadein" style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>{lines[li]}</div>
      </div>
    </div>
  );
}

export function Victory({ completed = false }: { completed?: boolean }) {
  const [, setLocation] = useLocation();
  const { data: summary } = useGetSummary();
  const enrollment = summary?.activeEnrollment;
  const activeLevel = summary?.level || 1;
  const activeXp = summary?.xp || 0;
  const xpMax = summary?.xpMax || 1000;

  useEffect(() => { if (navigator.vibrate) navigator.vibrate([0, 40, 30, 60]); }, []);
  
  if (!enrollment && !completed) {
    return null; 
  }

  return (
    <div className="ou-fadein" style={{ flex: 1, position: 'relative', background: `linear-gradient(170deg, var(--mint), var(--mint-d))`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '58px 28px 30px', overflow: 'hidden' }}>
      <Confetti count={70}/>
      <div style={{ textAlign: 'center', zIndex: 10 }}>
        <div style={{ fontSize: 96, animation: 'ou_pop 0.6s cubic-bezier(0.34,1.7,0.5,1) both' }}>{completed ? '🏆' : '🎯'}</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 42, color: '#fff', marginTop: 8, textShadow: '0 3px 10px rgba(5,61,44,0.3)', animation: 'ou_pop 0.6s 0.1s cubic-bezier(0.34,1.7,0.5,1) both' }}>
          {completed ? 'Challenge Won!' : 'Nailed It!'}
        </div>
        {enrollment && <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 800, fontSize: 17, color: 'rgba(255,255,255,0.95)', marginTop: 4 }}>Day {enrollment.dayNum} of {enrollment.daysTotal} complete 🙌</div>}
      </div>

      <div style={{ width: '100%', marginTop: 30, zIndex: 10, animation: 'ou_fadein 0.5s 0.3s both' }}>
        <Card pad={20} radius={26} style={{ boxShadow: '0 18px 40px -14px rgba(5,61,44,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 15, background: `color-mix(in srgb, var(--violet) 20%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name="brain" size={26} color="var(--violet)"/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13.5, color: 'var(--text3)' }}>You gained</div>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 20, color: 'var(--text)' }}>+50 XP</div>
            </div>
            <Pill color="var(--violet)" icon={<Icon name="sparkle" size={13} color="var(--violet)"/>}>Level {activeLevel}</Pill>
          </div>
          <div style={{ marginTop: 14 }}><Progress value={activeXp} max={xpMax} color="var(--violet)" height={12}/></div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: 'color-mix(in srgb, var(--mint) 15%, transparent)', borderRadius: 16, padding: '13px 15px', marginTop: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: `color-mix(in srgb, var(--mint) 25%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name="shield" size={22} color="var(--mint-d)"/></div>
            <div>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 16, color: 'var(--text)' }}>
                {completed ? 'Stake unlocked!' : 'Your daily stake is safe.'}
              </div>
              {enrollment && <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 13, color: 'var(--text2)' }}>${enrollment.stake} total protected.</div>}
            </div>
          </div>
        </Card>
      </div>

      <div style={{ width: '100%', marginTop: 'auto', paddingTop: 24, zIndex: 10 }}>
        <Btn variant="dark" size="xl" onClick={() => setLocation('/app')} style={{ background: '#fff', color: 'var(--mint-d)' }}>Awesome!</Btn>
      </div>
    </div>
  );
}

export function Forfeit() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: summary } = useGetSummary();
  const forfeit = useForfeitEnrollment();

  const enrollment = summary?.activeEnrollment;
  
  if (!enrollment) {
    return <div className="flex-1 p-8 text-center"><p>No active challenge.</p><Btn onClick={() => setLocation('/app')}>Home</Btn></div>;
  }
  
  // Note: the forfeit action can be implemented directly on the forfeit page as an action they confirm.
  // The actual ForfeitScreen from system.jsx was just the result of a forfeit. 
  // We'll show the Forfeit confirm UI.
  // ... Wait, the prompt says "confirm forfeit screen -> calls forfeit, shows result".

  const [done, setDone] = useState(false);

  // We actually need the useForfeitEnrollment hook, let's fetch it via direct API usage 
  // since I misimported it above.
  
  // the mock system uses this screen as the result of a missing proof, but since 
  // we added a manual forfeit button in the detail view, this acts as both confirm and result.

  const forfeitReq = () => {
    forfeit.mutate({ id: enrollment.id }, {
      onSuccess: () => {
        setDone(true);
        queryClient.invalidateQueries({ queryKey: getGetSummaryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListEnrollmentsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetVaultQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      },
      onError: (err) => toast.error(err.data?.error || "Failed to forfeit"),
    });
  };

  if (!done) {
    return (
      <div className="ou-fadein flex-1 flex flex-col items-center justify-center p-8 bg-[var(--bg)]">
        <div style={{ fontSize: 92 }}>🙈</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 32, color: 'var(--text)', marginTop: 10 }}>Give up?</div>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 16, color: 'var(--text2)', marginTop: 8, textAlign: 'center' }}>
          If you forfeit now, your ${enrollment.stake} locked stake goes to the finishers' bonus pool.
        </div>
        <div className="w-full space-y-4 mt-8">
          <Btn variant="coral" size="xl" onClick={forfeitReq}>Yes, forfeit ${enrollment.stake}</Btn>
          <Btn variant="ghost" size="xl" onClick={() => setLocation('/app')}>Wait, take me back</Btn>
        </div>
      </div>
    );
  }

  return (
    <div className="ou-fadein flex-1 flex flex-col items-center justify-start py-14 px-7 bg-[var(--bg)]">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 92, animation: 'ou_shake 0.7s ease-in-out' }}>🙈</div>
        <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 32, color: 'var(--text)', marginTop: 10 }}>Oops! Missed this one</div>
        <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 16, color: 'var(--text2)', marginTop: 8, maxWidth: 310 }}>Your stake went to fuel the bonus pool. It happens to everyone!</div>
      </div>

      <div style={{ width: '100%', marginTop: 26 }}>
        <Card pad={20} radius={26} style={{ background: 'color-mix(in srgb, var(--coral) 10%, transparent)', border: `1.5px solid color-mix(in srgb, var(--coral) 44%, transparent)` }} flat>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 50, height: 50, borderRadius: 15, background: `color-mix(in srgb, var(--coral) 20%, transparent)`, display: 'grid', placeItems: 'center' }}><Icon name="heart" size={26} color="var(--coral)"/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-app-display)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>Keep your chin up!</div>
              <div style={{ fontFamily: 'var(--font-app-body)', fontWeight: 700, fontSize: 14, color: 'var(--text2)' }}>Start another challenge when you're ready.</div>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ width: '100%', marginTop: 'auto', paddingTop: 24 }}>
        <Btn variant="coral" size="xl" onClick={() => setLocation('/app')} icon={<Icon name="flame" size={20} color="#fff"/>}>I'll crush it next time!</Btn>
      </div>
    </div>
  );
}