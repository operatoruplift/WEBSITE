import React from 'react';
import { Logo } from './Icons';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from './Animators';

interface FooterProps {
  onNavigate: (page: any) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const data = APP_CONTENT.footer;

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, action: string | undefined, url: string | undefined) => {
    if (action) {
        e.preventDefault();
        if (action.startsWith('scroll:')) {
            onNavigate('home');
            setTimeout(() => {
                const element = document.getElementById(action.split(':')[1]);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            onNavigate(action);
        }
    }
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
                    <Logo className="w-16 h-16 md:w-20 md:h-20 text-white cursor-pointer hover:text-primary transition-colors duration-300" />
                </div>
                </div>

                <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12">
                
                <div className="flex flex-col space-y-4">
                    <h4 className="text-white font-medium text-xl mb-2">{data.sections.resources.title}</h4>
                    {data.sections.resources.links.map((link, i) => (
                        <a key={i} href={link.url || '#'} onClick={(e) => handleLinkClick(e, link.action, link.url)} className="text-gray-500 hover:text-white transition-colors text-lg">{link.label}</a>
                    ))}
                </div>

                <div className="flex flex-col space-y-4">
                    <h4 className="text-white font-medium text-xl mb-2">{data.sections.company.title}</h4>
                    {data.sections.company.links.map((link, i) => (
                        <a key={i} href={link.url || '#'} onClick={(e) => handleLinkClick(e, link.action, link.url)} className="text-gray-500 hover:text-white transition-colors text-lg">{link.label}</a>
                    ))}
                </div>

                <div className="flex flex-col space-y-4">
                    <h4 className="text-white font-medium text-xl mb-2">{data.sections.legal.title}</h4>
                    {data.sections.legal.links.map((link, i) => (
                        <a key={i} href={link.url || '#'} onClick={(e) => handleLinkClick(e, link.action, link.url)} className="text-gray-500 hover:text-white transition-colors text-lg">{link.label}</a>
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