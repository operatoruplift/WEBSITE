import React from 'react';
import {
  TerminalIcon,
  GlobeIcon,
  KanbanIcon,
} from '@/src/components/Icons';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn, GlideText } from '@/src/components/Animators';

const Store: React.FC = () => {
  const data = APP_CONTENT.store;

  // Map icon types to the website's existing Icon set. Everything falls
  // back to TerminalIcon so unknown types don't render as blanks.
  const getIcon = (type?: string) => {
    switch (type) {
      case 'terminal':
        return <TerminalIcon className="w-6 h-6" />;
      case 'kanban':
      case 'brain':
        return <KanbanIcon className="w-6 h-6" />;
      case 'globe':
      case 'message':
      case 'calendar':
      case 'shield':
      case 'key':
      case 'cpu':
      default:
        return <GlobeIcon className="w-6 h-6" />;
    }
  };

  return (
    <section
      id="store"
      className="w-full bg-background pb-24 px-6 md:px-12 flex justify-center flex-col items-center"
    >
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
            <GlideText text={data.headline} />
          </h2>

          <FadeIn delay={200}>
            <p className="text-lg text-gray-400 leading-relaxed max-w-xl mx-auto">
              {data.subhead}
            </p>
          </FadeIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {data.agents.map((agent, index) => (
            <FadeIn key={agent.id} delay={300 + index * 80} className="h-full">
              <div className="relative p-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col group h-full">
                <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30 rounded-tl-lg transition-colors group-hover:border-primary/50"></div>
                <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30 rounded-tr-lg transition-colors group-hover:border-primary/50"></div>
                <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30 rounded-bl-lg transition-colors group-hover:border-primary/50"></div>
                <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30 rounded-br-lg transition-colors group-hover:border-primary/50"></div>

                <div className="flex-1 w-full bg-[#0c0c0c] rounded-xl border border-white/5 overflow-hidden flex flex-col p-6 relative hover:bg-white/[0.02] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(231,118,48,0.15)]">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      {getIcon(agent.iconType)}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/25 rounded px-1.5 py-0.5">
                        {agent.category}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        by {agent.author}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">
                    {agent.name}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed flex-1">
                    {agent.description}
                  </p>
                  <div className="mt-5 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      className="w-full h-9 rounded-lg bg-gradient-to-r from-primary to-primary/80 text-white text-xs font-semibold uppercase tracking-wider hover:shadow-lg hover:shadow-primary/25 transition-all"
                    >
                      {agent.cta}
                    </button>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Store;
