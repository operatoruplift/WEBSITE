"use client";

import { useState } from 'react';
import { Brain, Search, Plus, FileText, Code, Globe, Link2, Tag, Clock, Trash2, Sparkles, X, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/src/components/ui/Card';
import { Badge } from '@/src/components/ui/Badge';
import { GlowButton } from '@/src/components/ui/GlowButton';
import { MobilePageWrapper } from '@/src/components/mobile';
import { useToast } from '@/src/components/ui/Toast';

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

// Empty by default. Memory backend wiring (Supabase + embeddings) is
// tracked in lib/memoryEngine.ts but the dashboard page hasn't been
// connected yet. Keeping fresh users on an empty state instead of
// pre-seeded fakes. See #164 for the same cleanup on /app + /agents.
const DEFAULT_NODES: MemoryNode[] = [];

const typeConfig = {
    document: { icon: FileText, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    code: { icon: Code, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    url: { icon: Globe, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    note: { icon: FileText, color: 'text-amber-400', bg: 'bg-amber-400/10' },
};

export default function MemoryPage() {
    const [nodes, setNodes] = useState<MemoryNode[]>(DEFAULT_NODES);
    const [search, setSearch] = useState('');
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newSource, setNewSource] = useState('');
    const [newType, setNewType] = useState<MemoryNode['type']>('document');
    const [newTags, setNewTags] = useState('');
    const { showToast } = useToast();

    const totalVectors = nodes.reduce((sum, n) => sum + n.vectors, 0);
    const filtered = search ? nodes.filter(n => n.title.toLowerCase().includes(search.toLowerCase()) || n.tags.some(t => t.includes(search.toLowerCase()))) : nodes;

    const deleteNode = (id: string) => {
        const node = nodes.find(n => n.id === id);
        setNodes(prev => prev.filter(n => n.id !== id));
        showToast(`${node?.title || 'Node'} removed from memory`, 'info');
    };

    const addNode = () => {
        if (!newTitle.trim()) return;
        // Vectors + size are 0 until the embedding backend is wired up
        // (lib/memoryEngine.ts has the contract; the page just doesn't
        // call it yet). Better to show a real zero than to fake a
        // random count and lie to the user about indexing.
        const node: MemoryNode = {
            id: Date.now().toString(),
            title: newTitle.trim(),
            type: newType,
            source: newSource.trim() || 'Manual entry',
            tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
            vectors: 0,
            lastIndexed: 'Pending',
            size: 'Unknown',
        };
        setNodes(prev => [node, ...prev]);
        setNewTitle(''); setNewSource(''); setNewTags(''); setNewType('document');
        setShowAdd(false);
        showToast(`${node.title} added. Embeddings will be computed once the indexer is connected.`, 'info');
    };

    return (
        <MobilePageWrapper>
            <div className="min-h-screen p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Brain size={16} className="text-[#F97316]" />
                                <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Knowledge Base</span>
                                <span className="text-[8px] font-mono font-bold tracking-widest uppercase px-1.5 py-0.5 rounded border bg-amber-400/10 text-amber-400 border-amber-400/20">DEMO</span>
                            </div>
                            <h1 className="text-3xl lg:text-4xl font-medium tracking-tight text-white">Memory</h1>
                            <p className="text-sm text-gray-400 mt-1">Add knowledge sources here. Embedding + search will activate once the indexer is connected.</p>
                        </div>
                        <div className="flex gap-2">
                            <GlowButton variant="outline" className="h-11 px-4" onClick={() => {
                                import('@/lib/memoryEngine').then(({ consolidateMemory }) => {
                                    const result = consolidateMemory();
                                    showToast(`Memory consolidated: ${result.merged} merged, ${result.removed} stale removed`, 'success');
                                });
                            }}>
                                <RefreshCw size={14} className="mr-2" /> Consolidate
                            </GlowButton>
                            <GlowButton className="h-11 px-5" onClick={() => setShowAdd(true)}>
                                <Plus size={16} className="mr-2" /> Add Knowledge
                            </GlowButton>
                        </div>
                    </div>

                    {showAdd && (
                        <Card variant="glass" className="border-primary/20">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-white font-semibold">Add Knowledge Source</h3>
                                    <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white"><X size={16} /></button>
                                </div>
                                <div className="space-y-4">
                                    <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Title" aria-label="Knowledge title"
                                        className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none" />
                                    <input value={newSource} onChange={e => setNewSource(e.target.value)} placeholder="Source (URL, file path, or manual)" aria-label="Source"
                                        className="w-full bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <select value={newType} onChange={e => setNewType(e.target.value as MemoryNode['type'])} aria-label="Type"
                                            className="bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none">
                                            <option value="document">Document</option>
                                            <option value="code">Code</option>
                                            <option value="url">URL</option>
                                            <option value="note">Note</option>
                                        </select>
                                        <input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="Tags (comma separated)" aria-label="Tags"
                                            className="bg-foreground/[0.04] border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-primary/50 focus:outline-none" />
                                    </div>
                                    <GlowButton onClick={addNode} className="w-full">Index Knowledge</GlowButton>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Memory Nodes', value: nodes.length, icon: Brain, color: 'text-[#F97316]' },
                            { label: 'Vector Embeddings', value: totalVectors.toLocaleString(), icon: Sparkles, color: 'text-[#F97316]' },
                            { label: 'Sources Indexed', value: nodes.length, icon: Link2, color: 'text-[#F97316]' },
                            { label: 'Tags', value: [...new Set(nodes.flatMap(n => n.tags))].length, icon: Tag, color: 'text-emerald-400' },
                        ].map(stat => {
                            const Icon = stat.icon;
                            return (
                                <Card key={stat.label} variant="glass">
                                    <CardContent className="p-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-foreground/[0.04] border border-white/10 flex items-center justify-center"><Icon size={16} className={stat.color} /></div>
                                        <div><div className="text-xl font-bold text-white">{stat.value}</div><div className="text-[10px] text-gray-500 uppercase tracking-wider">{stat.label}</div></div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="relative">
                        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search memory nodes, tags..." aria-label="Search memory nodes"
                            className="w-full bg-foreground/[0.04] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:border-primary/50 focus:outline-none transition-colors" />
                    </div>

                    <div className="space-y-3">
                        {filtered.length === 0 ? (
                            <div className="text-center py-20"><Brain size={48} className="text-gray-700 mx-auto mb-4" /><p className="text-gray-500">{search ? 'No matching nodes' : 'No knowledge indexed yet'}</p></div>
                        ) : filtered.map((node, i) => {
                            const config = typeConfig[node.type];
                            const Icon = config.icon;
                            return (
                                <Card key={node.id} variant="glass" className="group hover:border-primary/30 transition-all" style={{ animationDelay: `${i * 60}ms` }}>
                                    <CardContent className="p-5">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-start gap-4 flex-1 min-w-0">
                                                <div className={`w-10 h-10 rounded-xl ${config.bg} border border-foreground/10 flex items-center justify-center flex-shrink-0`}>
                                                    <Icon size={18} className={config.color} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-white font-semibold truncate mb-1">{node.title}</h3>
                                                    <div className="text-xs text-gray-500 font-mono mb-2">{node.source} · {node.size}</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {node.tags.map(tag => (
                                                            <Badge key={tag} variant="default" className="text-[9px] bg-foreground/[0.04] border border-white/10 text-gray-400">{tag}</Badge>
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
                                                <button onClick={() => deleteNode(node.id)} className="p-2 rounded-lg bg-foreground/[0.04] text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={14} /></button>
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
