"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, Sparkles, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { Logo } from '@/src/components/Icons';

export default function LoginPage() {
    const [mode, setMode] = useState<'waitlist' | 'login'>('waitlist');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (res.ok) setSubmitted(true);
        } catch {
            setSubmitted(true);
        }
        setIsLoading(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json();
            if (!res.ok) {
                if (data.error?.includes('Email not confirmed')) {
                    setError('Please check your email and click the confirmation link before signing in.');
                } else if (data.error?.includes('Invalid login')) {
                    setError('Invalid email or password. Please try again.');
                } else {
                    setError(data.error || 'Invalid credentials');
                }
                setIsLoading(false);
                return;
            }
            // Store session
            if (data.session?.access_token) {
                localStorage.setItem('token', data.session.access_token);
                localStorage.setItem('user', JSON.stringify({
                    name: data.user?.user_metadata?.display_name || 'Commander',
                    email: data.user?.email,
                    plan: 'Pro',
                }));
            }
            router.push('/app');
        } catch {
            setError('Connection error. Please try again.');
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#050508' }}>
            <div className="absolute inset-0 opacity-40" style={{
                background: `radial-gradient(ellipse 80% 50% at 50% 30%, rgba(231, 118, 48, 0.15) 0%, transparent 50%)`
            }} />
            <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-3">
                        <Logo className="w-12 h-12" />
                        <span className="text-2xl font-bold text-white">Operator<span className="text-primary">Uplift</span></span>
                    </Link>
                </div>

                {submitted ? (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} className="text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">You&apos;re on the list</h2>
                        <p className="text-gray-400 mb-2">We&apos;ll notify you at <span className="text-white">{email}</span> when early access opens.</p>
                        <p className="text-gray-500 text-sm mt-4">Follow us for updates:</p>
                        <div className="flex items-center justify-center gap-4 mt-3">
                            <a href="https://x.com/OperatorUplift" target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-primary transition-colors">X (Twitter)</a>
                            <a href="https://discord.gg/eka7hqJcAY" target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-primary transition-colors">Discord</a>
                            <a href="https://github.com/operatoruplift" target="_blank" rel="noreferrer" className="text-xs text-gray-400 hover:text-primary transition-colors">GitHub</a>
                        </div>
                        <Link href="/" className="inline-block mt-8 text-sm text-gray-500 hover:text-white transition-colors">&larr; Back to home</Link>
                    </div>
                ) : mode === 'waitlist' ? (
                    <>
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest mb-6">
                                <Sparkles size={12} /> Early Access
                            </div>
                            <h1 className="text-2xl font-bold text-white">Join the Waitlist</h1>
                            <p className="text-gray-400 mt-2">Operator Uplift is currently in private beta. Sign up to get early access.</p>
                        </div>
                        <form onSubmit={handleWaitlist} className="space-y-4">
                            <div>
                                <label htmlFor="waitlist-email" className="text-sm text-gray-400 block mb-2">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input id="waitlist-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required />
                                </div>
                            </div>
                            <GlowButton type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Submitting...' : 'Get Early Access'} <ArrowRight size={18} className="ml-2" />
                            </GlowButton>
                        </form>
                        <div className="mt-6 pt-6 border-t border-white/5 text-center">
                            <button onClick={() => setMode('login')} className="text-sm text-gray-500 hover:text-primary transition-colors">
                                Have an account? <span className="text-primary">Sign in</span>
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-white">Welcome back</h1>
                            <p className="text-gray-400 mt-2">Sign in to your Operator Uplift account</p>
                        </div>
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                        )}
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label htmlFor="login-email" className="text-sm text-gray-400 block mb-2">Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="login-password" className="text-sm text-gray-400 block mb-2">Password</label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" aria-label="Password" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-12 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label="Toggle password visibility">
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <GlowButton type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} className="ml-2" />
                            </GlowButton>
                        </form>
                        <div className="mt-6 pt-6 border-t border-white/5 text-center space-y-3">
                            <Link href="/signup" className="block text-sm text-gray-500 hover:text-primary transition-colors">
                                Need an account? <span className="text-primary">Sign up</span>
                            </Link>
                            <button onClick={() => setMode('waitlist')} className="text-sm text-gray-600 hover:text-white transition-colors">
                                &larr; Back to waitlist
                            </button>
                        </div>
                    </>
                )}

                <div className="mt-6 flex items-center justify-center gap-6 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                    <span>Local-first</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span>Privacy-first</span>
                    <span className="w-1 h-1 rounded-full bg-gray-700" />
                    <span>Open source</span>
                </div>
            </div>
        </div>
    );
}
