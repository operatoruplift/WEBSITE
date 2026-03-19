"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Bot, Github, Chrome, ArrowRight, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { GlowButton } from '@/src/components/ui/GlowButton';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Demo mode: just redirect to dashboard
        localStorage.setItem('token', 'demo-token');
        localStorage.setItem('user', JSON.stringify({ email, name: 'Commander' }));
        window.location.href = '/app';
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative" style={{ background: '#050508' }}>
            <div className="absolute inset-0 opacity-40" style={{
                background: `radial-gradient(ellipse 80% 50% at 50% 30%, rgba(231, 118, 48, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse 60% 40% at 80% 70%, rgba(153, 69, 255, 0.1) 0%, transparent 40%)`
            }} />
            <div className="w-full max-w-md p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl relative z-10 shadow-2xl">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center"><Bot size={28} className="text-black" /></div>
                        <span className="text-2xl font-bold text-white">Operator<span className="text-primary">Uplift</span></span>
                    </Link>
                    <h1 className="text-2xl font-bold text-white mt-6">Welcome back</h1>
                    <p className="text-gray-400 mt-2">Sign in to continue to your dashboard</p>
                </div>
                <div className="space-y-3 mb-6">
                    <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><Chrome size={20} className="text-white" /><span className="text-white font-medium">Continue with Google</span></button>
                    <button className="w-full flex items-center justify-center space-x-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"><Github size={20} className="text-white" /><span className="text-white font-medium">Continue with GitHub</span></button>
                </div>
                <div className="flex items-center space-x-4 mb-6"><div className="flex-1 h-px bg-white/10" /><span className="text-sm text-gray-500">or continue with email</span><div className="flex-1 h-px bg-white/10" /></div>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div><label className="text-sm text-gray-400 block mb-2">Email</label><div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-4 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required /></div></div>
                    <div><div className="flex items-center justify-between mb-2"><label className="text-sm text-gray-400">Password</label></div><div className="relative"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-lg pl-12 pr-12 py-3 text-white focus:border-primary/50 focus:outline-none transition-colors" required /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                    <GlowButton type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign In'} <ArrowRight size={18} className="ml-2" /></GlowButton>
                </form>
                <p className="text-center text-gray-400 mt-6">Don&apos;t have an account?{' '}<Link href="/signup" className="text-primary hover:underline">Sign up for free</Link></p>
            </div>
        </div>
    );
}
