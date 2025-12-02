
import React from 'react';

const TrustedBy: React.FC = () => {
  const models = [
    { name: "GPT-4o", provider: "OpenAI" },
    { name: "Claude 3.5 Sonnet", provider: "Anthropic" },
    { name: "Gemini 1.5 Pro", provider: "Google" },
    { name: "Llama 3.1", provider: "Meta" },
    { name: "Mistral Large", provider: "Mistral AI" },
    { name: "Command R+", provider: "Cohere" },
    { name: "Grok-1", provider: "xAI" },
    { name: "DeepSeek-V2", provider: "DeepSeek" },
  ];

  // Duplicate the array to ensure seamless scrolling
  const marqueeItems = [...models, ...models];

  return (
    <div className="mt-16 md:mt-16 border-t border-white/5 pt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
      <div className="flex items-center mb-6">
        <span className="w-2 h-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(255,85,0,0.4)]"></span>
        <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Powered By</span>
      </div>
      
      {/* Container with fade-in masks on sides */}
      <div className="relative w-full overflow-hidden mask-gradient">
        {/* Gradient overlays for fade effect */}
        <div className="absolute top-0 left-0 w-12 md:w-24 h-full bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="absolute top-0 right-0 w-12 md:w-24 h-full bg-gradient-to-l from-background to-transparent z-10"></div>

        {/* Marquee Track */}
        <div className="flex w-fit animate-marquee whitespace-nowrap">
          {marqueeItems.map((model, index) => (
            <div 
              key={`${model.name}-${index}`} 
              className="flex items-center space-x-3 mx-8 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 cursor-default group"
            >
              <div className="flex flex-col">
                <span className="text-lg md:text-xl text-white font-mono tracking-tight group-hover:text-primary transition-colors">
                  {model.name}
                </span>
                <span className="text-[10px] text-muted font-bold tracking-wider uppercase">
                  {model.provider}
                </span>
              </div>
              {/* Separator dot */}
              <div className="w-1 h-1 bg-white/20 rounded-full ml-8"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
