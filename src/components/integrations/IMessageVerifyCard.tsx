'use client';

import { useEffect, useState } from 'react';
import { Phone, Check, Loader2, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { useToast } from '@/src/components/ui/Toast';

/**
 * iMessage phone-verification card for the dashboard /integrations page.
 *
 * Flow:
 *   1. enter_phone -> POST /api/integrations/imessage/start (issues a
 *      6-digit code, sends it to the phone via Photon Spectrum).
 *   2. enter_code  -> POST /api/integrations/imessage/confirm (verifies
 *      the code, upserts the imessage_users row linking phone -> Privy
 *      account).
 *   3. verified    -> read-only success card.
 *
 * Honest-status: when the bot replies "Open operatoruplift.com/integrations
 * to authorize" (after a YES on a pending Gmail/Calendar action), this
 * is the card the user sees. Failure modes surface the route's typed
 * `nextAction` field instead of a generic toast so the user knows what
 * to do next (try a different code, request a fresh one, sign in, etc).
 */

const E164_RE = /^\+[1-9]\d{6,14}$/;
const CODE_RE = /^\d{6}$/;

type Stage = 'enter_phone' | 'enter_code' | 'verified';

interface ApiError {
    error?: string;
    nextAction?: string;
    reason?: string;
}

function authHeader(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const token = window.localStorage.getItem('token');
    return token && token !== 'demo-token' ? { Authorization: `Bearer ${token}` } : {};
}

export function IMessageVerifyCard() {
    const [stage, setStage] = useState<Stage>('enter_phone');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { showToast } = useToast();

    // Seed verified state from /api/integrations/imessage/status on mount.
    // Best-effort: any failure (route missing, 401, table missing, network)
    // silently leaves the user at enter_phone — the verify flow still works.
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch('/api/integrations/imessage/status', {
                    headers: { ...authHeader() },
                });
                if (!res.ok) return;
                const data = (await res.json().catch(() => null)) as { verified?: boolean; phones?: Array<{ phone: string }> } | null;
                if (cancelled || !data?.verified || !data.phones?.length) return;
                setPhone(data.phones[0].phone);
                setStage('verified');
            } catch {
                // network/route missing — silent fallback to enter_phone
            }
        })();
        return () => { cancelled = true; };
    }, []);

    async function startVerification() {
        setError(null);
        const trimmed = phone.trim();
        if (!E164_RE.test(trimmed)) {
            setError('Phone must be in E.164 format, like +15551234567.');
            return;
        }
        setBusy(true);
        try {
            const res = await fetch('/api/integrations/imessage/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ phone: trimmed }),
            });
            const data = (await res.json().catch(() => ({}))) as ApiError;
            if (!res.ok) {
                setError(data.nextAction || data.error || 'Could not send code.');
                return;
            }
            setStage('enter_code');
            showToast('Code sent. Check your iMessages.', 'success');
        } catch {
            setError('Network error. Try again in a minute.');
        } finally {
            setBusy(false);
        }
    }

    async function confirmVerification() {
        setError(null);
        if (!CODE_RE.test(code)) {
            setError('Enter the 6-digit code from iMessage.');
            return;
        }
        setBusy(true);
        try {
            const res = await fetch('/api/integrations/imessage/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...authHeader() },
                body: JSON.stringify({ phone: phone.trim(), code }),
            });
            const data = (await res.json().catch(() => ({}))) as ApiError;
            if (!res.ok) {
                setError(data.nextAction || data.error || 'Verification failed.');
                return;
            }
            setStage('verified');
            showToast('Phone verified. Text the bot to try it.', 'success');
        } catch {
            setError('Network error. Try again in a minute.');
        } finally {
            setBusy(false);
        }
    }

    function reset() {
        setStage('enter_phone');
        setCode('');
        setError(null);
    }

    if (stage === 'verified') {
        return (
            <Card variant="glass" className="border-emerald-400/20">
                <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-400/10 flex items-center justify-center">
                            <Check size={18} className="text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-white">iMessage verified</h3>
                            <span className="text-[10px] font-mono text-gray-500">Phone {phone}</span>
                        </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed mb-3">
                        Text the bot from this phone. Send STOP to opt out any time. Try lines like &quot;I&apos;m a leo&quot;, &quot;I&apos;m in San Francisco&quot;, or &quot;what&apos;s the weather in Austin&quot;.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 font-mono">
                        <MessageSquare size={12} className="text-primary" />
                        Watch /dev/photon for live inbound rows.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card variant="glass" className="border-primary/20">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Phone size={18} className="text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-white">Text the bot from your iPhone</h3>
                        <span className="text-[10px] font-mono text-gray-500">Photon Spectrum / iMessage</span>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                    Verify your phone once so the bot can match incoming texts to your account. Then you can save preferences (zodiac, location, model) or ask for weather and Gmail drafts from iMessage.
                </p>
                {stage === 'enter_phone' && (
                    <div className="space-y-3">
                        <label className="block">
                            <span className="sr-only">Phone in E.164 format</span>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\s/g, ''))}
                                placeholder="+15551234567"
                                aria-label="Phone in E.164 format"
                                autoComplete="tel"
                                className="w-full px-3 py-2.5 rounded-lg bg-foreground/[0.04] border border-white/10 text-sm text-white placeholder-gray-600 focus:border-primary/50 focus:outline-none"
                                disabled={busy}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={startVerification}
                            disabled={busy}
                            className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wide bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                            Send verification code
                        </button>
                    </div>
                )}
                {stage === 'enter_code' && (
                    <div className="space-y-3">
                        <p className="text-[11px] text-gray-500">
                            Code sent to {phone}. Check iMessage and enter it below. Code expires in 10 minutes.
                        </p>
                        <label className="block">
                            <span className="sr-only">6-digit verification code</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={code}
                                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                aria-label="6-digit verification code"
                                maxLength={6}
                                autoComplete="one-time-code"
                                className="w-full px-3 py-2.5 rounded-lg bg-foreground/[0.04] border border-white/10 text-sm text-white placeholder-gray-600 font-mono tracking-widest focus:border-primary/50 focus:outline-none"
                                disabled={busy}
                            />
                        </label>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={reset}
                                disabled={busy}
                                className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide bg-foreground/[0.04] text-gray-400 hover:text-white transition-all disabled:opacity-50"
                            >
                                Different phone
                            </button>
                            <button
                                type="button"
                                onClick={confirmVerification}
                                disabled={busy}
                                className="flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wide bg-primary/10 text-primary hover:bg-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {busy && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                                Verify
                            </button>
                        </div>
                    </div>
                )}
                {error && (
                    <p role="alert" className="mt-3 text-xs text-red-400 leading-relaxed">{error}</p>
                )}
            </CardContent>
        </Card>
    );
}
