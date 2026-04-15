'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { posts } from '../page';

function getArticleContent(id: string) {
    const content: Record<string, React.ReactNode> = {
        'why-i-built-an-ai-os': (
            <div className="space-y-6">
                <p className="text-lg">Balaji told me to pivot.</p>
                <p>He is one of the smartest people in tech. He looked at what I was building, a local-first AI operating system, and said: you are competing with Perplexity, OpenAI, Anthropic, and Google. Solo founder. No funding. Walk away.</p>
                <p>I didn't.</p>
                <p>Not because I think I am smarter than Balaji. I don't. But because the thing he was describing, competing on model quality, on inference speed, on benchmark scores, isn't what I am building.</p>
                <p>I am not building a better ChatGPT. I am building the OS layer that runs underneath all of them.</p>
                <p>Here is the distinction that matters: every AI assistant you use today is a tenant. It lives on someone else's server. It reads your data, stores your context, and makes decisions about what to remember and what to forget, on their terms, not yours. You don't own any of it.</p>
                <p>Operator Uplift is the landlord. It runs on your device. Your agents, your memory, your context, encrypted, local, yours. The model underneath can be Claude, Llama, GPT, anything. We don't compete with the models. We are the environment they run in.</p>
                <p>The pivot Balaji suggested would have made me a better-funded version of something that already exists. Staying the course means building something that doesn't.</p>
                <p>I have been homeless. I have built from nothing before. The only thing that has ever worked for me is building something I actually believe in, not something that is easier to explain to investors.</p>
                <p>So I didn't pivot. And I am still building.</p>
            </div>
        ),
        'what-93-percent-retention-looks-like': (
            <div className="space-y-6">
                <p className="text-lg">Everyone talks about retention like it is a number. It is not. It is a behavior.</p>
                <p>93% retention at 300 users means that out of every 100 people who tried Operator Uplift, 93 came back. Not because we sent them a push notification. Not because we ran a re-engagement campaign. Because the thing worked and they needed it again.</p>
                <p>Here is what that actually looks like day to day:</p>
                <p>It looks like a message at 11pm from a beta user saying "I have been using the task agent every morning for 6 weeks, it is the first thing I open." It looks like someone in our Discord asking when the calendar agent ships because they have already restructured their workflow around the assumption that it will. It looks like 2,500 community members who joined before we had a public product.</p>
                <p>High retention at small scale is the only signal that matters early. It tells you the core loop works. It tells you the people who found you are not leaving. Everything else, growth, revenue, press, is just amplification of that signal.</p>
                <p>What drives our retention isn't features. It is ownership. When your data lives on your device, when your agents remember what you told them last week without phoning home to a server, the product becomes part of your environment. You don't churn from your environment.</p>
                <p>We are not optimizing for DAU. We are optimizing for dependency. The kind that feels good because you chose it.</p>
                <p>93% is the proof that we are on the right track. The next phase is finding out what happens when 3,000 people feel that way instead of 300.</p>
            </div>
        ),
        'local-ai-vs-cloud-ai': (
            <div className="space-y-6">
                <p className="text-lg">The privacy argument for local AI is usually made wrong.</p>
                <p>Most people frame it as: "cloud AI is spying on you." That is technically true but emotionally unconvincing. Nobody thinks Google is personally reading their queries. The threat feels abstract, so the argument doesn't land.</p>
                <p>Here is the privacy case that actually matters: it is not about surveillance. It is about control.</p>
                <p>When your AI runs in the cloud, the company decides what it remembers, what it forgets, what it shares with advertisers, what it hands over to governments, and when it shuts down. You have no say. You are not a user. You are a data source.</p>
                <p>When your AI runs locally, you make those decisions. The AI serves you because it literally cannot serve anyone else.</p>
                <p>This isn't a niche concern. It is the fundamental question of who owns your cognitive infrastructure. We are at the beginning of a world where AI handles your calendar, finances, health data, relationships, work. Where that runs, on your device or someone else's server, is the most important infrastructure decision of the next decade.</p>
                <p>Local AI isn't the privacy choice. It is the ownership choice. Privacy is just what ownership feels like.</p>
            </div>
        ),
        'how-solana-changes-agent-economy': (
            <div className="space-y-6">
                <p className="text-lg">Most people think about Solana as a place to trade tokens. That is not what we are building on it for.</p>
                <p>We are building the Operator Uplift Agent Store on Solana because it is the only infrastructure that makes a permissionless agent marketplace economically viable.</p>
                <p>Here is the problem with Web2: you need a payment layer, a publishing layer, and a trust layer. Those are three separate systems, Stripe, GitHub, and your reputation. They don't talk to each other. They are all controlled by someone else. They all take a cut.</p>
                <p>On Solana, those three things collapse into one. An agent is published as a program. Payment is a transaction. Trust is the on-chain record of every interaction that agent has ever had. Permissionless, anyone can publish, anyone can pay, the history is public and auditable.</p>
                <p>What that means in practice: a developer in Lagos can publish a Yoruba language tutor agent to the store tonight. A user in Tokyo can deploy it tomorrow morning. Transaction settles in 400 milliseconds. No app store approval. No payment processor. No middleman.</p>
                <p>That is not a crypto pitch. That is a distribution model.</p>
            </div>
        ),
        'building-solo': (
            <div className="space-y-6">
                <p className="text-lg">I built Velocity Esports alone. No co-founder, no funding, no connections. Just a belief that competitive gaming was going to be bigger than anyone thought, and a willingness to do the unglamorous work.</p>
                <p>I got partnerships with Epic Games and Quest Nutrition not because I had leverage, but because I showed up prepared and didn't waste their time.</p>
                <p>Three things that carry directly into Operator Uplift:</p>
                <p><strong className="text-white">Distribution is the product.</strong> In esports, the game is the platform. I learned to think about what I was building in terms of who it moves through. The Solana Agent Store is how Operator Uplift moves.</p>
                <p><strong className="text-white">Retention beats acquisition every time.</strong> A player who plays 500 hours is worth more than 50 who play 10. 93% retention at 300 users is more valuable than 30% retention at 3,000. We build for the people who will never leave.</p>
                <p><strong className="text-white">Solo doesn't mean alone.</strong> I had no co-founder at Velocity. But I had a community. 2,500 community members before a public product isn't a vanity metric. That is the company.</p>
                <p>The hardest part of building solo isn't the workload. It is the silence. No one to tell you you are right when you are scared you are wrong. You build the conviction yourself, every day, from scratch.</p>
                <p>I have done it before. I know what it costs. And I know what it is worth.</p>
            </div>
        ),
    };

    return content[id] || (
        <div className="space-y-6">
            <p className="text-lg">{posts.find(p => p.id === id)?.excerpt}</p>
            <p>This is part of our ongoing development of Operator Uplift, the local-first AI agent platform. We ship updates constantly and share our progress transparently.</p>
            <p>Follow us on <a href="https://x.com/OperatorUplift" target="_blank" rel="noreferrer" className="text-primary hover:underline">X</a> and join our <a href="https://discord.gg/eka7hqJcAY" target="_blank" rel="noreferrer" className="text-primary hover:underline">Discord</a> for the latest updates.</p>
        </div>
    );
}

const categoryColors: Record<string, string> = {
    update: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    engineering: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
    announcement: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
    guide: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
};

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const post = posts.find(p => p.id === id);

    if (!post) {
        return (
            <div className="w-full bg-background min-h-screen">
                <Navbar currentPage="blog" />
                <div className="pt-32 pb-24 px-6 md:px-12 max-w-[800px] mx-auto text-center">
                    <h1 className="text-3xl font-medium text-white mb-4">Post not found</h1>
                    <Link href="/blog" className="text-primary hover:underline">Back to blog</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="w-full bg-background min-h-screen">
            <Navbar currentPage="blog" />

            <article className="pt-32 pb-24 px-6 md:px-12 max-w-[800px] mx-auto">
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8">
                    <ArrowLeft size={14} /> Back to blog
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${categoryColors[post.category]}`}>
                        {post.category}
                    </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-medium text-white mb-6 tracking-tight leading-tight">
                    {post.title}
                </h1>

                <div className="flex items-center gap-4 text-xs text-gray-500 font-mono mb-12 pb-8 border-b border-white/10">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                    <span className="flex items-center gap-1"><Tag size={12} /> {post.category}</span>
                </div>

                <div className="prose-invert max-w-none text-gray-300 leading-relaxed">
                    {getArticleContent(id)}
                </div>

                {/* CTA */}
                <div className="mt-16 p-8 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
                    <h3 className="text-xl font-medium text-white mb-3">Want to try it?</h3>
                    <p className="text-gray-400 text-sm mb-6">Operator Uplift is in private beta. Join the waitlist for early access.</p>
                    <Link href="/login" className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-primary/80 transition-colors">
                        Get Early Access
                    </Link>
                </div>
            </article>

            <Footer />
        </div>
    );
}
