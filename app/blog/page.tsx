'use client';

import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { FadeIn } from '@/src/components/Animators';
import { posts } from './posts';

const categoryColors: Record<string, string> = {
    update: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    engineering: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
    announcement: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
    guide: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
};


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
