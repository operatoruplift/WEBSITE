'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag, ArrowRight } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { FadeIn } from '@/src/components/Animators';

interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    category: 'update' | 'engineering' | 'announcement' | 'guide';
    featured?: boolean;
}

const categoryColors: Record<string, string> = {
    update: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    engineering: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
    announcement: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
    guide: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
};

export const posts: BlogPost[] = [
    {
        id: 'balaji-pivot-advice',
        title: 'Balaji told me to pivot. I didn\u2019t. Here\u2019s why.',
        excerpt: 'He looked at what I was building and said walk away. I disagreed on the diagnosis, agreed on the wedge critique, and changed three things because of him. What I actually kept and what I actually cut.',
        date: 'April 17, 2026',
        readTime: '4 min read',
        category: 'announcement',
        featured: true,
    },
    {
        id: 'governed-approvals',
        title: 'Governed Approvals: Why Every Agent Action Needs a Human',
        excerpt: 'The single biggest difference between a helpful agent and a dangerous one is a human in the loop at the right moment. Here is how we designed the approval flow.',
        date: 'April 16, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'audit-trail',
        title: 'How the On-Chain Audit Trail Works',
        excerpt: 'Every agent action is SHA-256 hashed and the Merkle root is published to a Solana devnet program every N actions. Here is the exact pipeline.',
        date: 'April 16, 2026',
        readTime: '5 min read',
        category: 'engineering',
    },
    {
        id: 'local-first-threat-model',
        title: 'Our Threat Model for Local-First AI',
        excerpt: 'What we protect against, what we do not, and why we made each trade-off. The honest version.',
        date: 'April 15, 2026',
        readTime: '5 min read',
        category: 'engineering',
    },
    {
        id: 'wedge-lawyer-accountant-therapist',
        title: 'The Three Professions Who Can Not Afford a Data Leak',
        excerpt: 'Lawyers, accountants, therapists. Every one of them has a confidentiality obligation that cloud AI breaks by default. This is our wedge.',
        date: 'April 15, 2026',
        readTime: '4 min read',
        category: 'guide',
    },
    {
        id: 'why-solana-for-audit-roots',
        title: 'Why Solana for Audit Roots',
        excerpt: 'Not every blockchain is a good audit layer. Solana happens to fit the three constraints: fast finality, cheap writes, verifiable publicly. Here is the math.',
        date: 'April 14, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'why-i-built-an-ai-os',
        title: 'Why I Built an AI OS Instead of Pivoting',
        excerpt: 'The earlier version of the Balaji post — on why the OS-layer framing won over the "build a better ChatGPT" critique. See the April 17 post for the specific breakdown.',
        date: 'April 6, 2026',
        readTime: '5 min read',
        category: 'announcement',
    },
    {
        id: 'what-93-percent-retention-looks-like',
        title: 'What 93% Retention Actually Looks Like at 300 Users',
        excerpt: 'Everyone talks about retention like it\'s a number. It\'s not. It\'s a behavior. 93% retention means 93 out of 100 people came back. Not because of push notifications. Because the thing worked.',
        date: 'April 5, 2026',
        readTime: '4 min read',
        category: 'announcement',
    },
    {
        id: 'local-ai-vs-cloud-ai',
        title: 'Local AI vs Cloud AI: The Privacy Case Nobody\'s Making',
        excerpt: 'The privacy argument for local AI is usually made wrong. It\'s not about surveillance. It\'s about control. When your AI runs locally, you make the decisions. The AI serves you because it literally cannot serve anyone else.',
        date: 'April 4, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'how-solana-changes-agent-economy',
        title: 'How Solana Changes the Agent Economy',
        excerpt: 'We\'re building on Solana because it collapses payment, publishing, and trust into one layer. A developer in Lagos can publish an agent tonight. A user in Tokyo deploys it tomorrow. 400ms settlement.',
        date: 'April 3, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'building-solo',
        title: 'Building Solo: What Bootstrapping Velocity Esports Taught Me About AI',
        excerpt: 'I built Velocity Esports alone. Got partnerships with Epic Games and Quest Nutrition not because I had leverage, but because I showed up prepared. Three lessons that carry directly into Operator Uplift.',
        date: 'April 2, 2026',
        readTime: '5 min read',
        category: 'announcement',
    },
    {
        id: 'tool-registry',
        title: 'Agent Builder: 20 Tools Across 5 Categories',
        excerpt: 'The agent builder now supports 20 tools organized by Core, Developer, Communication, Blockchain, and Creative categories. Build agents with Solana, Oro GRAIL, DD.xyz, and x402 payment capabilities.',
        date: 'April 1, 2026',
        readTime: '4 min read',
        category: 'update',
    },
    {
        id: 'gold-agent',
        title: 'Meet the Gold Agent: Savings Powered by Oro GRAIL',
        excerpt: 'The new Gold Agent widget on your dashboard shows real-time gold prices, weekly DCA savings, round-ups, and cashback. All powered by Oro GRAIL API for tokenized gold transactions.',
        date: 'April 1, 2026',
        readTime: '3 min read',
        category: 'announcement',
    },
    {
        id: 'hackathon-prep',
        title: 'Building for Colosseum, Superteam, and Solana dApp Store',
        excerpt: 'Our roadmap for the Solana ecosystem: multi-agent swarms, on-chain agent registry, A2A protocol support, and Seeker phone compatibility. Targeting Colosseum Frontier hackathon and Superteam grants.',
        date: 'March 31, 2026',
        readTime: '6 min read',
        category: 'engineering',
    },
    {
        id: 'blockchain-integrations',
        title: 'Zcash, Prime Intellect, Oro GRAIL, and DD.xyz',
        excerpt: 'New blockchain integrations bring privacy-preserving payments (Zcash), decentralized compute (Prime Intellect), gold-backed assets (Oro GRAIL), and real-time risk data (DD.xyz) to your agents.',
        date: 'March 31, 2026',
        readTime: '5 min read',
        category: 'announcement',
    },
    {
        id: 'consumer-rewrite',
        title: 'Rewriting for Everyone, Not Just Developers',
        excerpt: 'Based on user feedback, we rewrote all landing page copy to be consumer-friendly. No more jargon. Just clear explanations of what Operator Uplift does and why it matters.',
        date: 'March 29, 2026',
        readTime: '3 min read',
        category: 'update',
    },
    {
        id: 'comparison-faq',
        title: 'New: Comparison Table and FAQ',
        excerpt: 'See how Operator Uplift compares to ChatGPT, Claude, Gemini, and Grok across 11 features. Plus 8 common questions answered.',
        date: 'March 28, 2026',
        readTime: '4 min read',
        category: 'update',
    },
    {
        id: 'swarm-orchestration',
        title: 'Introducing Swarm Orchestration',
        excerpt: 'Run multi-agent teams with sequential, parallel, hierarchical, and debate topologies. Design swarms that collaborate on complex tasks.',
        date: 'March 27, 2026',
        readTime: '4 min read',
        category: 'announcement',
    },
    {
        id: 'aes-256-encryption',
        title: 'AES-256 Encryption for Local Data',
        excerpt: 'Your agent configs, chat sessions, and memory are now encrypted with AES-256-GCM using the Web Crypto API. No dependencies, no cloud, just browser-native cryptography.',
        date: 'March 25, 2026',
        readTime: '3 min read',
        category: 'engineering',
    },
    {
        id: 'marketplace-launch',
        title: '20 Agents Now Available in the Marketplace',
        excerpt: 'From code review to email triage to compliance monitoring. Install pre-built agents with one click and start automating your workflow.',
        date: 'March 24, 2026',
        readTime: '5 min read',
        category: 'update',
    },
    {
        id: 'supabase-backend',
        title: 'Real Backend: Supabase Auth + Chat API',
        excerpt: 'We shipped a real backend with Supabase authentication, streaming LLM chat via Claude and GPT, and persistent agent storage.',
        date: 'March 23, 2026',
        readTime: '6 min read',
        category: 'engineering',
    },
    {
        id: 'security-hardening',
        title: 'Security Hardening: Headers, GDPR, Audit',
        excerpt: 'Five security headers on every response, GDPR cookie consent, robots.txt blocking dashboard routes, and a full code audit with zero vulnerabilities.',
        date: 'March 21, 2026',
        readTime: '4 min read',
        category: 'update',
    },
    {
        id: 'getting-started',
        title: 'Getting Started with Operator Uplift',
        excerpt: 'A step-by-step guide to signing up, installing your first agent, and running your first workflow. From zero to automated in 5 minutes.',
        date: 'March 20, 2026',
        readTime: '8 min read',
        category: 'guide',
    },
    {
        id: 'why-local-first',
        title: 'Why Local-First AI Matters',
        excerpt: 'Every other AI platform runs on their servers and trains on your data. We believe the future of AI is private, local, and user-controlled.',
        date: 'March 18, 2026',
        readTime: '7 min read',
        category: 'announcement',
    },
];

export default function BlogPage() {
    const featured = posts.find(p => p.featured);
    const rest = posts.filter(p => !p.featured);

    return (
        <div className="w-full bg-background min-h-screen">
            <Navbar currentPage="blog" />

            <div className="pt-32 pb-24 px-6 md:px-12 max-w-[1200px] mx-auto">
                {/* Header */}
                <FadeIn>
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8">
                        <ArrowLeft size={14} /> Back to home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-medium text-white tracking-tight mb-4">Blog & Changelog</h1>
                    <p className="text-gray-400 text-lg mb-16 max-w-xl">Product updates, engineering deep-dives, and guides for building with Operator Uplift.</p>
                </FadeIn>

                {/* Featured post */}
                {featured && (
                    <FadeIn delay={100}>
                        <Link href={`/blog/${featured.id}`} className="block mb-16 p-8 md:p-12 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-primary/30 transition-all group cursor-pointer relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent blur-3xl pointer-events-none" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${categoryColors[featured.category]}`}>
                                        {featured.category}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-1 rounded border border-primary/20 bg-primary/10">Featured</span>
                                </div>
                                <h2 className="text-2xl md:text-3xl font-medium text-white mb-4 group-hover:text-primary transition-colors">{featured.title}</h2>
                                <p className="text-gray-400 text-base leading-relaxed mb-6 max-w-2xl">{featured.excerpt}</p>
                                <div className="flex items-center gap-4 text-xs text-gray-500 font-mono">
                                    <span className="flex items-center gap-1"><Calendar size={12} /> {featured.date}</span>
                                    <span className="flex items-center gap-1"><Clock size={12} /> {featured.readTime}</span>
                                </div>
                            </div>
                        </Link>
                    </FadeIn>
                )}

                {/* Post grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {rest.map((post, i) => (
                        <FadeIn key={post.id} delay={150 + i * 50}>
                            <Link href={`/blog/${post.id}`} className="p-6 rounded-2xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition-all cursor-pointer group h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${categoryColors[post.category]}`}>
                                        {post.category}
                                    </span>
                                </div>
                                <h3 className="text-lg font-medium text-white mb-3 group-hover:text-primary transition-colors">{post.title}</h3>
                                <p className="text-sm text-gray-400 leading-relaxed mb-4 flex-1">{post.excerpt}</p>
                                <div className="flex items-center justify-between text-xs text-gray-500 font-mono mt-auto pt-4 border-t border-white/5">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1"><Calendar size={10} /> {post.date}</span>
                                        <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime}</span>
                                    </div>
                                    <ArrowRight size={14} className="text-gray-600 group-hover:text-primary transition-colors" />
                                </div>
                            </Link>
                        </FadeIn>
                    ))}
                </div>
            </div>

            <Footer />
        </div>
    );
}
