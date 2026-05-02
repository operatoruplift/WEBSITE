import React, { useEffect, useState } from 'react';
import { 
  WhatsAppIcon, MailIcon, CalendarIcon, TwitterIcon, DiscordIcon, LinkedInIcon, ArrowUpRightIcon
} from '@/src/components/Icons';
import { APP_CONTENT } from '@/src/services/dataService';

const Contact: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const data = APP_CONTENT.contact;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getIcon = (type: string) => {
    switch(type) {
        case 'whatsapp': return <WhatsAppIcon className="w-6 h-6" />;
        case 'email': return <MailIcon className="w-6 h-6" />;
        case 'calendar': return <CalendarIcon className="w-6 h-6" />;
        case 'twitter': return <TwitterIcon className="w-6 h-6" />;
        case 'discord': return <DiscordIcon className="w-6 h-6" />;
        case 'linkedin': return <LinkedInIcon className="w-6 h-6" />;
        default: return <MailIcon className="w-6 h-6" />;
    }
  };

  // Corner-bracket "tech terminal" framing. The outer wrapper keeps
  // the dashed `border-white/10` (theme-light overrides this token to
  // a faint dark line, so it stays visible). The corner accents
  // previously used `border-white/30`, which is NOT in the theme-light
  // override list and rendered as 30%-white-on-near-white = invisible
  // on /contact's light surface; switched to `border-foreground/30`,
  // which follows the theme token.
  //
  // The inner card was `bg-[#0c0c0c]` (hardcoded near-black) which
  // turned the entire /contact page into a dark slab on the light
  // marketing theme — visually inconsistent with Pricing, UseCases,
  // and LocalFirst, all of which use `bg-card`. Switching to `bg-card`
  // pulls /contact in line with the rest of the site and lets the
  // corner brackets read on both themes.
  const TechContact = ({ option, children }: { option: { id: string; title: string; description: string; iconType: string; url: string }; children: React.ReactNode }) => (
    <div className="relative p-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.01] flex flex-col group h-full">
         <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-foreground/30 rounded-tl-lg transition-colors group-hover:border-primary/50"></div>
         <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-foreground/30 rounded-tr-lg transition-colors group-hover:border-primary/50"></div>
         <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-foreground/30 rounded-bl-lg transition-colors group-hover:border-primary/50"></div>
         <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-foreground/30 rounded-br-lg transition-colors group-hover:border-primary/50"></div>

         <a
              href={option.url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 w-full bg-card rounded-xl border border-border overflow-hidden flex items-start p-6 relative hover:bg-foreground/[0.04] transition-all duration-300"
            >
             {children}
        </a>
    </div>
  );

  return (
    <section className="w-full min-h-screen bg-background pt-32 pb-24 px-6 md:px-12 flex flex-col items-center selection:bg-primary/30 selection:text-white overflow-hidden">
      
      <div 
        className={`w-full max-w-[1200px] flex flex-col items-center transition-all duration-1000 delay-100 transform
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
      >
        
        <div className="text-center mb-20 max-w-2xl">
          <div className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-6">
            {data.tag}
          </div>
          
          <h1 className="text-5xl md:text-7xl text-white font-medium tracking-tight mb-8">
            {data.headline}
          </h1>
          
          <p className="text-lg text-gray-400 leading-relaxed">
            {data.subhead}{' '}
            <a 
              href={data.subheadLinkUrl}
              target="_blank" 
              rel="noreferrer"
              className="text-primary hover:underline underline-offset-4 decoration-primary/50 transition-colors hover:text-white"
            >
              {data.subheadLinkText}
            </a>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
          {data.options.map((option) => (
            <TechContact key={option.id} option={option}>
              <div className="mt-1 mr-5 text-gray-300 group-hover:text-primary transition-colors duration-300">
                {getIcon(option.iconType)}
              </div>
              
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-lg font-medium text-white group-hover:text-primary transition-colors duration-300">
                    {option.title}
                  </h3>
                  <ArrowUpRightIcon className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 duration-300" />
                </div>
                <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors font-mono">
                  {option.description}
                </p>
              </div>
            </TechContact>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Contact;
