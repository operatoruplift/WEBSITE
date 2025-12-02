import React from 'react';
import { TerminalIcon, ArrowUpRightIcon, GlobeIcon, KanbanIcon } from '@/src/components/Icons';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn, ScrambleText } from '@/src/components/Animators';

const DeveloperDocs: React.FC = () => {
  const data = APP_CONTENT.developerDocs;

  const getIcon = (type: string) => {
    switch(type) {
      case 'terminal': return <TerminalIcon className="w-6 h-6" />;
      case 'kanban': return <KanbanIcon className="w-6 h-6" />;
      case 'globe': return <GlobeIcon className="w-6 h-6" />;
      default: return <TerminalIcon className="w-6 h-6" />;
    }
  };

  const TechLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <div className="relative p-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col group h-full">
        <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30 rounded-tl-lg transition-colors group-hover:border-primary/50"></div>
        <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30 rounded-tr-lg transition-colors group-hover:border-primary/50"></div>
        <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30 rounded-bl-lg transition-colors group-hover:border-primary/50"></div>
        <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30 rounded-br-lg transition-colors group-hover:border-primary/50"></div>
        
        <a 
          href={href} 
          target="_blank" 
          rel="noreferrer"
          className="flex-1 w-full bg-[#0c0c0c] rounded-xl border border-white/5 overflow-hidden flex flex-col p-8 relative hover:bg-white/[0.02] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,85,0,0.1)]"
        >
            {children}
        </a>
    </div>
  );

  return (
    <section className="w-full bg-background pb-24 px-6 md:px-12 flex justify-center flex-col items-center">
      
      <div className="w-full max-w-[1600px] py-24 flex items-center justify-center">
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-white/15 to-transparent relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-1 bg-background flex items-center justify-center">
                 <div className="w-1.5 h-1.5 rounded-full bg-white/30 shadow-[0_0_8px_rgba(255,255,255,0.4)] animate-pulse"></div>
            </div>
        </div>
      </div>

      <div className="w-full max-w-[1200px] flex flex-col items-center">
        
        <div className="text-center mb-16 max-w-2xl">
          <FadeIn>
            <div className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-6">
                {data.tag}
            </div>
          </FadeIn>
          
          <h2 className="text-4xl md:text-6xl text-white font-medium tracking-tight mb-6 min-h-[1.2em]">
            <ScrambleText text={data.headline} />
          </h2>
          
          <FadeIn delay={200}>
            <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
                {data.description}
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {data.links.map((option, index) => (
            <FadeIn key={index} delay={300 + (index * 100)} className="h-full">
                <TechLink href={option.url}>
                <div className="mb-6 w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-gray-300 group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                    {getIcon(option.iconType)}
                </div>
                
                <div className="flex-grow">
                    <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-medium text-white group-hover:text-primary transition-colors">
                        {option.title}
                    </h3>
                    <ArrowUpRightIcon className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300" />
                    </div>
                    <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors font-mono leading-relaxed">
                    {option.description}
                    </p>
                </div>
                </TechLink>
            </FadeIn>
          ))}
        </div>

      </div>
    </section>
  );
};

export default DeveloperDocs;