"use client";

import { useState } from 'react';
import { Brain, Search, Plus, FileText, Code, Globe, Link2, Tag, Clock, Trash2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';

interface MemoryNode {
    id: string;
    title: string;
    type: 'document' | 'code' | 'url' | 'note';
    source: string;
    tags: string[];
    vectors: number;
    lastIndexed: string;
    size: string;
}

const DEMO_NODES: MemoryNode[] = [
    { id: '1', title: 'Operator Uplift Architecture', type: 'document', source: 'architecture.md', tags: ['system', 'core'], vectors: 1240, lastIndexed: '1h ago', size: '48KB' },
    { id: '2', title: 'Agent Builder API Spec', type: 'code', source: 'api-reference.ts', tags: ['api', 'agents'], vectors: 890, lastIndexed: '3h ago', size: '32KB' },
    { id: '3', title: 'Security Whitepaper', type: 'document', source: 'security-model.pdf', tags: ['security', 'privacy'], vectors: 2100, lastIndexed: '1d ago', size: '156KB' },
    { id: '4', title: 'Competitor Analysis', type: 'url', source: 'notion.so/competitor-analysis', tags: ['research', 'market'], vectors: 560, lastIndexed: '2d ago', size: '24KB' },
    { id: '5', title: 'Solana Integration Notes', type: 'note', source: 'Manual entry', tags: ['blockchain', 'payments'], vectors: 340, lastIndexed: '5d ago', size: '8KB' },
    { id: '6', title: 'User Feedback Q1 2026', type: 'document', source: 'feedback-q1.csv', tags: ['users', 'feedback'], vectors: 1800, lastIndexed: '12h ago', size: '92KB' },
];

const typeConfig = {
    document: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    code: { icon: Code, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    url: { icon: Globe, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    note: { icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10' },
};

export default function MemoryPage() {
    const [nodes] = useState<MemoryNode[]>(DEMO_NODES);
    const [search, setSearch] = useState('');

    const totalVectors = nodes.reduce((sum, n) => sum + n.vectors, 0);
    const filtered = search ? nodes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.tags.some(t => t.includes(search.toLowerCase()))) : nodes;

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-[1400px] mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fadeInUp">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Brain size={16} className="text-[#E77630]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Knowledge Base</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-white">Memory Bank</h1>
                            <p className="text-sm text-gray-400 mt-1">Your agents&apos; shared knowledge — indexed and searchable</p>
                        </div>
                        <GlowButton className="h-11 px-5">
                            <Plus size={16} className="mr-2" /> Add Knowledge
                        </GlowButton>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Memory Nodes', value: nodes.length, icon: Brain, color: 'text-[#E77630]' },
                            { label: 'Vector Embeddings', value: totalVectors.toLocaleString(), icon: Sparkles, color: 'text-[#E77630]' },
                            { label: 'Sources Indexed', value: nodes.length, icon: Link2, color: 'text-[#F59E0B]' },
                            { label: 'Tags', value: [...new Set(nodes.flatMap(n => n.tags))].length, icon: Tag, color: 'text-emerald-400' },
                        ].map(stat => {
                            const Icon = stat.icon;
                            return (
                                <Card key={stat.label} variant="glass">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center"><Icon size={16} className={stat.color} /></div>
                                        <div><div className="text-xl font-bold text-white">{stat.value}</div><div className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</div></div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search memory nodes, tags..." aria-label="Search memory nodes"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="space-y-3">
                        {filtered.map((node, i) => {
                            const config = typeConfig[node.type];
                            const Icon = config.icon;
                            return (
                                <Card key={node.id} variant="glass" className="card-animate group hover:border-white/10 transition-all" style={{ animationDelay: `${i * 60}ms` }}>
                                    <CardContent className="p-5">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl ${config.bg} border border-white/5 flex items-center justify-center flex-shrink-0`}>
                                                    <Icon size={18} className={config.color} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-white font-semibold truncate mb-1">{node.title}</h3>
                                                    <div className="text-xs text-gray-500 font-mono mb-2">{node.source} · {node.size}</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {node.tags.map(tag => (
                                                            <Badge key={tag} variant="default" className="text-[9px] bg-white/5 border border-white/10 text-gray-400">{tag}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 flex-shrink-0">
                                                <div className="text-right">
                                                    <div className="text-sm font-mono text-white">{node.vectors.toLocaleString()}</div>
                                                    <div className="text-[10px] text-gray-500">vectors</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-500"><Clock size={10} />{node.lastIndexed}</div>
                                                </div>
                                                <button className="p-2 rounded-lg bg-white/5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={14} /></button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </MobilePageWrapper>
    );
}
