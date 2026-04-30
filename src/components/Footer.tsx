import React from 'react';
import Link from 'next/link';
import { Logo } from './Icons';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from './Animators';

const Footer: React.FC = () => {
  const data = APP_CONTENT.footer;

  const getLinkHref = (link: { url?: string; action?: string; label: string }): string => {
    if (link.url) return link.url;
    if (link.action === 'contact') return '/contact';
    if (link.action === 'terms') return '/terms';
    if (link.action === 'privacy') return '/privacy';
    // 'product' link used to point at the standalone /product page,
    // retired in #308. Bring users back to the homepage hero, which
    // is the single source of truth for "what does this do?"
    if (link.action === 'product') return '/';
    return '/';
  };

  return (
    <footer className="w-full bg-background pb-12 px-6 md:px-12 flex flex-col items-center">
      
      <div className="w-full max-w-[1600px] py-12 flex items-center justify-center opacity-30">
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      </div>

      <FadeIn className="w-full max-w-[1600px]" delay={100} threshold={0.05}>
        <div className="relative w-full p-2 rounded-[32px] border border-dashed border-white/10 bg-white/[0.01]">
         
            <div className="absolute -top-[1px] -left-[1px] w-6 h-6 border-t border-l border-white/20 rounded-tl-2xl"></div>
            <div className="absolute -top-[1px] -right-[1px] w-6 h-6 border-t border-r border-white/20 rounded-tr-2xl"></div>
            <div className="absolute -bottom-[1px] -left-[1px] w-6 h-6 border-b border-l border-white/20 rounded-bl-2xl"></div>
            <div className="absolute -bottom-[1px] -right-[1px] w-6 h-6 border-b border-r border-white/20 rounded-br-2xl"></div>

            <div className="w-full bg-[#0c0c0c] rounded-[24px] border border-white/5 p-8 md:p-12 lg:p-16 relative overflow-hidden flex flex-col min-h-[400px]">
            
            <div className="flex items-center mb-12">
                <span className="w-3 h-3 rounded-full bg-primary mr-4 shadow-[0_0_8px_rgba(255,85,0,0.6)] animate-pulse-slow"></span>
                <span className="text-lg font-bold tracking-[0.2em] text-gray-400 uppercase">{data.tag}</span>
            </div>

            <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-0">
                
                <div className="lg:col-span-6 flex flex-col justify-end">
                <div className="mt-auto">
                    <Link href="/" className="inline-block hover:opacity-80 transition-opacity">
                      <Logo className="w-16 h-16 md:w-20 md:h-20" />
                    </Link>
                </div>
                </div>

                <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
                
                <div className="flex flex-col space-y-4">
                    <h4 className="text-white font-medium text-xl mb-2">{data.sections.resources.title}</h4>
                    {data.sections.resources.links.map((link, i) => (
                        <Link key={i} href={getLinkHref(link)} target={link.url ? "_blank" : undefined} className="text-gray-500 hover:text-white transition-colors text-lg">{link.label}</Link>
                    ))}
                </div>

                <div className="flex flex-col space-y-4">
                    <h4 className="text-white font-medium text-xl mb-2">{data.sections.company.title}</h4>
                    {data.sections.company.links.map((link, i) => (
                        <Link key={i} href={getLinkHref(link)} target={link.url ? "_blank" : undefined} className="text-gray-500 hover:text-white transition-colors text-lg">{link.label}</Link>
                    ))}
                </div>

                <div className="flex flex-col space-y-4">
                    <h4 className="text-white font-medium text-xl mb-2">{data.sections.legal.title}</h4>
                    {data.sections.legal.links.map((link, i) => (
                        <Link key={i} href={getLinkHref(link)} target={link.url ? "_blank" : undefined} className="text-gray-500 hover:text-white transition-colors text-lg">{link.label}</Link>
                    ))}
                </div>

                <div className="col-span-2 md:col-span-3 mt-12 flex flex-col md:flex-row md:items-end justify-end gap-8 border-t border-white/5 pt-8">
                    <div className="flex flex-col md:items-end space-y-4">
                    <div className="flex items-center space-x-8">
                        <a href={data.socials.twitter} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"><span className="text-lg font-bold">X (Twitter)</span></a>
                        <a href={data.socials.linkedin} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"><span className="text-lg font-bold">LinkedIn</span></a>
                        <a href={data.socials.github} target="_blank" rel="noreferrer" className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group"><span className="text-lg font-bold">GitHub</span></a>
                    </div>
                    <p className="text-gray-600 text-lg font-mono">
                        {data.copyright}
                    </p>
                    <a href="https://solana.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-400 transition-colors mt-2 text-sm font-mono">
                        Powered by
                        <svg className="w-16 h-3" viewBox="0 0 508 78" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M87.5 60.8c-4 0-7.1-1.1-9.5-3.2s-3.5-5.3-3.5-9.4V30.7h-6.3v-9h6.3V10.4h11.3v11.3h10.5v9H85.8v16.8c0 1.8.5 3.2 1.4 4.1.9.9 2.3 1.4 4 1.4 1.6 0 3.3-.5 5.1-1.4v9.2c-2.6 1.3-5.4 2-8.3 2zm-48.8-.8V.5h11.3v60.5H38.7zM120.7 61c-9.5 0-17.1-7.4-17.1-20.1 0-12.6 7.6-20.1 17.1-20.1 9.5 0 17.1 7.5 17.1 20.1 0 12.7-7.6 20.1-17.1 20.1zm0-9.5c4 0 5.8-4.2 5.8-10.6 0-6.5-1.8-10.6-5.8-10.6s-5.8 4.1-5.8 10.6c0 6.4 1.8 10.6 5.8 10.6zM158.1 61c-9.5 0-17.1-7.4-17.1-20.1 0-12.6 7.6-20.1 17.1-20.1 9.5 0 17.1 7.5 17.1 20.1 0 12.7-7.6 20.1-17.1 20.1zm0-9.5c4 0 5.8-4.2 5.8-10.6 0-6.5-1.8-10.6-5.8-10.6s-5.8 4.1-5.8 10.6c0 6.4 1.8 10.6 5.8 10.6z"/>
                            <path d="M207.2 60V38.7c0-5.5-2.7-8.2-7.3-8.2-4.7 0-7.5 3-7.5 8.2V60h-11.3V21.7h10.5v5.2c2.7-3.7 6.8-5.9 12-5.9 8.6 0 14.9 5.7 14.9 15.6V60h-11.3zM246 61c-9.5 0-17.1-7.4-17.1-20.1 0-12.6 7.6-20.1 17.1-20.1 9.5 0 17.1 7.5 17.1 20.1 0 12.7-7.6 20.1-17.1 20.1zm0-9.5c4 0 5.8-4.2 5.8-10.6 0-6.5-1.8-10.6-5.8-10.6s-5.8 4.1-5.8 10.6c0 6.4 1.8 10.6 5.8 10.6z"/>
                        </svg>
                    </a>
                    </div>
                </div>

                </div>
            </div>
            </div>
        </div>
      </FadeIn>
    </footer>
  );
};

export default Footer;