import React from 'react';
import { ChevronRight } from '@/src/components/Icons';
import { APP_CONTENT } from '@/src/services/dataService';
import { FadeIn } from '@/src/components/Animators';

const BuildWithUs: React.FC = () => {
  const data = APP_CONTENT.buildWithUs;

  return (
    <section className="w-full bg-background pb-24 px-6 md:px-12 flex justify-center">
      <FadeIn className="w-full max-w-[1200px]" delay={200}>
        <div className="w-full bg-[#f2f2f2] rounded-3xl p-8 md:p-16 relative overflow-hidden group hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-shadow duration-500">
            
            <div className="flex justify-between items-start mb-24 md:mb-48 relative z-10">
            <div className="flex items-center">
                <span className="w-2 h-2 rounded-full bg-primary mr-3"></span>
                <span className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase">{data.tag}</span>
            </div>
            
            <div className="text-xs font-bold tracking-[0.2em] text-gray-500 uppercase hidden md:block">
                {data.cta}
            </div>
            </div>

            <div className="relative z-10">
                <div className="mb-6">
                    <svg className="w-12 h-12 text-black mb-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                
                <h2 className="text-4xl md:text-6xl text-black font-medium tracking-tight mb-8 max-w-2xl leading-[1.1]">
                    {data.headline}
                </h2>

                <a 
                href={data.url} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center bg-[#1a1a1a] text-white px-6 py-3 rounded-sm text-xs font-bold tracking-widest uppercase hover:bg-primary transition-colors duration-300 group-hover:scale-105 transform"
                >
                    {data.buttonText} <ChevronRight className="ml-2 w-3 h-3" />
                </a>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-white via-transparent to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none"></div>
        </div>
      </FadeIn>
    </section>
  );
};

export default BuildWithUs;