"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { Logo } from '@/src/components/Icons';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || 'Signup failed'); setIsLoading(false); return; }
            if (data.session?.access_token) {
                localStorage.setItem('token', data.session.access_token);
                localStorage.setItem('user', JSON.stringify({ name: name || 'Commander', email, plan: 'Pro' }));
                router.push('/app');
            } else {
                // Email confirmation required
                setError('Check your email to confirm your account, then sign in.');
            }
        } catch {
            setError('Connection error. Please try again.');
        }
        setIsLoading(false);
    };

    const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500'];
    const strengthLabels = ['', 'Weak', 'Good', 'Strong'];

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

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white">Create your account</h1>
                    <p className="text-gray-400 mt-2">Start building with Operator Uplift</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                )}

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label htmlFor="signup-name" className="text-sm text-gray-400 block mb-2">Full Name</label>
                        <div className="relative">
                            <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input id="signup-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" aria-label="Full name" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="signup-email" className="text-sm text-gray-400 block mb-2">Email</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="signup-password" className="text-sm text-gray-400 block mb-2">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input id="signup-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" aria-label="Password" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-12 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required minLength={6} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label="Toggle password visibility">
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {password.length > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                                <div className="flex gap-1 flex-1">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`} />
                                    ))}
                                </div>
                                <span className="text-[10px] text-gray-500 font-mono">{strengthLabels[strength]}</span>
                            </div>
                        )}
                    </div>
                    <GlowButton type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? 'Creating account...' : 'Create Account'} <ArrowRight size={18} className="ml-2" />
                    </GlowButton>
                </form>

                <div className="mt-6 pt-6 border-t border-white/5 text-center">
                    <Link href="/login" className="text-sm text-gray-500 hover:text-primary transition-colors">
                        Already have an account? <span className="text-primary">Sign in</span>
                    </Link>
                </div>

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
