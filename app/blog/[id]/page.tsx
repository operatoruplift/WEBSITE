'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { posts } from '../page';

const categoryColors: Record<string, string> = {
    update: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    engineering: 'text-[#E77630] bg-[#E77630]/10 border-[#E77630]/20',
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

                <div className="prose-invert max-w-none">
                    <p className="text-lg text-gray-300 leading-relaxed mb-8">
                        {post.excerpt}
                    </p>

                    <div className="text-gray-400 leading-relaxed space-y-6">
                        <p>
                            This is part of our ongoing development of Operator Uplift, the local-first AI agent platform.
                            We ship updates constantly and share our progress transparently.
                        </p>

                        <h2 className="text-xl font-medium text-white mt-8 mb-4">What changed</h2>
                        <p>
                            {post.category === 'update' && 'This update improves the platform experience based on user feedback and internal testing. Every change is verified with a full production build and deployed automatically via Vercel.'}
                            {post.category === 'engineering' && 'This engineering update dives into the technical architecture behind the feature. All code is open source and available on GitHub.'}
                            {post.category === 'announcement' && 'We are excited to share this new capability with our early access community. Join the waitlist to try it yourself.'}
                            {post.category === 'guide' && 'Follow along step by step. Each section builds on the previous one, and you can jump to any section that interests you most.'}
                        </p>

                        <h2 className="text-xl font-medium text-white mt-8 mb-4">What is next</h2>
                        <p>
                            We are continuously building and improving Operator Uplift. Follow us on{' '}
                            <a href="https://x.com/OperatorUplift" target="_blank" rel="noreferrer" className="text-primary hover:underline">X (Twitter)</a>{' '}
                            and join our{' '}
                            <a href="https://discord.gg/eka7hqJcAY" target="_blank" rel="noreferrer" className="text-primary hover:underline">Discord</a>{' '}
                            for the latest updates.
                        </p>
                    </div>
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
