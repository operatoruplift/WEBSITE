"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Bot, Github, Chrome, ArrowRight, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { GlowButton } from '@/src/components/ui/GlowButton';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password) ? 4 : 3;
    const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify({ email, name }));
        window.location.href = '/app';
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#050508' }}>
            <div className="absolute inset-0 opacity-40" style={{
                background: `radial-gradient(ellipse 80% 50% at 50% 30%, rgba(153, 69, 255, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse 60% 40% at 20% 70%, rgba(231, 118, 48, 0.1) 0%, transparent 40%)`
            }} />
            <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center"><Bot size={28} className="text-black" /></div>
                        <span className="text-2xl font-bold text-white">Operator<span className="text-primary">Uplift</span></span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white mt-6">Create your account</h1>
                    <p className="text-gray-400 mt-2">Start building with AI agents today</p>
                </div>

                <div className="space-y-3 mb-6">
                    <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><Chrome size={20} className="text-white" /><span className="text-white font-medium">Continue with Google</span></button>
                    <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><Github size={20} className="text-white" /><span className="text-white font-medium">Continue with GitHub</span></button>
                </div>

                <div className="flex items-center space-x-4 mb-6"><div className="flex-1 h-px bg-white/10" /><span className="text-sm text-gray-500">or sign up with email</span><div className="flex-1 h-px bg-white/10" /></div>

                <form onSubmit={handleSignup} className="space-y-4">
                    <div>
                        <label htmlFor="signup-name" className="text-sm text-gray-400 block mb-2">Full Name</label>
                        <div className="relative"><User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input id="signup-name" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" aria-label="Full name" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required /></div>
                    </div>
                    <div>
                        <label htmlFor="signup-email" className="text-sm text-gray-400 block mb-2">Email</label>
                        <div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input id="signup-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email address" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required /></div>
                    </div>
                    <div>
                        <label htmlFor="signup-password" className="text-sm text-gray-400 block mb-2">Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input id="signup-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password" aria-label="Password" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-12 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required minLength={6} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white" aria-label="Toggle password visibility">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                        </div>
                        {password.length > 0 && (
                            <div className="mt-2">
                                <div className="flex gap-1 mb-1">{[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= strength ? strengthColors[strength] : 'bg-white/10'}`} />)}</div>
                                <p className={`text-[10px] font-mono ${strength <= 1 ? 'text-red-400' : strength === 2 ? 'text-yellow-400' : strength === 3 ? 'text-blue-400' : 'text-emerald-400'}`}>{strengthLabels[strength]}</p>
                            </div>
                        )}
                    </div>
                    <GlowButton type="submit" className="w-full" disabled={isLoading || password.length < 6}>{isLoading ? 'Creating account...' : 'Create Account'} <ArrowRight size={18} className="ml-2" /></GlowButton>
                </form>

                <p className="text-center text-gray-400 mt-6 text-sm">Already have an account? <Link href="/login" className="text-primary hover:underline">Sign in</Link></p>
                <p className="text-center text-gray-600 mt-4 text-[10px]">By signing up, you agree to our <Link href="/terms" className="text-gray-500 hover:text-white">Terms</Link> and <Link href="/privacy" className="text-gray-500 hover:text-white">Privacy Policy</Link></p>
            </div>
        </div>
    );
}
