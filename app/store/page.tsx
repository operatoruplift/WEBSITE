'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { FadeIn } from '@/src/components/Animators';
import { Check, X, Sparkles } from 'lucide-react';

interface StoreAgent {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
}

const AGENTS: StoreAgent[] = [
  { id: 'task-manager', name: 'Task Manager', category: 'Productivity', description: 'Organize tasks, set reminders, track deadlines automatically', price: 0.01 },
  { id: 'calendar-agent', name: 'Calendar Agent', category: 'Scheduling', description: 'Manage your calendar, schedule meetings, send invites', price: 0.01 },
  { id: 'research-agent', name: 'Research Agent', category: 'Knowledge', description: 'Deep research on any topic, summarized and saved to memory', price: 0.02 },
  { id: 'finance-tracker', name: 'Finance Tracker', category: 'Finance', description: 'Track spending, categorize transactions, generate reports', price: 0.02 },
  { id: 'code-assistant', name: 'Code Assistant', category: 'Developer', description: 'Review code, suggest fixes, write tests', price: 0.03 },
];

const categoryColors: Record<string, string> = {
  Productivity: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Scheduling: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  Knowledge: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Finance: 'text-green-400 bg-green-400/10 border-green-400/20',
  Developer: 'text-primary bg-primary/10 border-primary/20',
};

export default function StorePage() {
  const [installed, setInstalled] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try { return new Set(JSON.parse(localStorage.getItem('store-installed') || '[]')); } catch { return new Set(); }
  });
  const [showPhantom, setShowPhantom] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const handleDeploy = (agentId: string) => {
    setShowPhantom(agentId);
  };

  const handleApprove = async (agentId: string) => {
    setProcessing(true);
    // Simulate Solana devnet transaction
    await new Promise(r => setTimeout(r, 2000));
    const fakeSig = Array.from({ length: 64 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
    setInstalled(prev => {
      const next = new Set(prev);
      next.add(agentId);
      localStorage.setItem('store-installed', JSON.stringify([...next]));
      return next;
    });
    setShowPhantom(null);
    setProcessing(false);
    setToast(`Agent deployed. Transaction: ${fakeSig.slice(0, 12)}...`);
    setTimeout(() => setToast(null), 5000);
  };

  return (
    <div className="w-full bg-background min-h-screen">
      <Navbar currentPage="store" />

      {/* Hero */}
      <div className="pt-32 pb-16 px-6 md:px-12 text-center">
        <FadeIn>
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-widest mb-6">
            <Sparkles size={12} /> Solana Powered
          </div>
        </FadeIn>
        <h1 className="text-4xl md:text-6xl font-medium text-white tracking-tight mb-4">The Agent Store</h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          Discover, install, and deploy AI agents on-chain. Powered by Solana.
        </p>
      </div>

      {/* Agent Grid */}
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AGENTS.map((agent, i) => (
            <FadeIn key={agent.id} delay={i * 100}>
              <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white">{agent.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${categoryColors[agent.category] || 'text-gray-400 bg-white/5 border-white/10'}`}>
                    {agent.category}
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-6 flex-1">{agent.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono text-white">{agent.price} SOL</span>
                  {installed.has(agent.id) ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                      <Check size={16} /> Installed
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDeploy(agent.id)}
                      className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/20 transition-colors"
                    >
                      Deploy with SOL
                    </button>
                  )}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-xs text-gray-600 font-mono">All transactions on Solana devnet. No real funds required during beta.</p>
        </div>
      </div>

      {/* Phantom Modal Mockup */}
      {showPhantom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md" onClick={() => !processing && setShowPhantom(null)}>
          <div className="bg-[#1a1a2e] rounded-2xl p-6 w-[340px] shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#AB9FF2] to-[#5B4DCA] flex items-center justify-center">
                  <span className="text-white text-xs font-bold">P</span>
                </div>
                <span className="text-white font-medium">Phantom</span>
              </div>
              <button onClick={() => !processing && setShowPhantom(null)} className="text-gray-500 hover:text-white"><X size={18} /></button>
            </div>
            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm mb-2">Approve Transaction</p>
              <p className="text-2xl font-bold text-white font-mono">{AGENTS.find(a => a.id === showPhantom)?.price} SOL</p>
              <p className="text-xs text-gray-500 mt-1">Solana Devnet</p>
            </div>
            <div className="space-y-2 mb-6 text-xs font-mono">
              <div className="flex justify-between text-gray-400"><span>To</span><span className="text-white">Operator Uplift Agent Store</span></div>
              <div className="flex justify-between text-gray-400"><span>Network</span><span className="text-white">Devnet</span></div>
              <div className="flex justify-between text-gray-400"><span>Fee</span><span className="text-white">~0.000005 SOL</span></div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowPhantom(null)}
                disabled={processing}
                className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 text-sm font-medium hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(showPhantom)}
                disabled={processing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#AB9FF2] to-[#5B4DCA] text-white text-sm font-bold hover:opacity-90 transition-opacity"
              >
                {processing ? 'Confirming...' : 'Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm font-mono backdrop-blur-xl shadow-2xl animate-slideInRight">
          <Check size={14} className="inline mr-2" />{toast}
        </div>
      )}

      <Footer />
    </div>
  );
}
