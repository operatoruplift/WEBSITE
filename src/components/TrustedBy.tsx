
import React from 'react';
import { providerLogos } from './ProviderLogos';

const TrustedBy: React.FC = () => {
  // Pinned to the latest models live on each provider as of the
  // April 2026 marketing refresh. The chat router (lib/llm.ts +
  // ModelSelector) ships these specific IDs, so the marquee names
  // mirror what the user actually picks at runtime.
  const models = [
    { name: "Claude Opus 4.7", provider: "Anthropic" },
    { name: "Claude Sonnet 4.6", provider: "Anthropic" },
    { name: "GPT-4.1", provider: "OpenAI" },
    { name: "GPT-4o", provider: "OpenAI" },
    { name: "Gemini 2.5 Pro", provider: "Google" },
    { name: "Grok 3", provider: "xAI" },
    { name: "DeepSeek-R1", provider: "DeepSeek" },
    { name: "Llama 4 Maverick", provider: "Meta" },
    { name: "Mistral Large 25.03", provider: "Mistral AI" },
    { name: "Qwen 3", provider: "Alibaba" },
    { name: "Phi-4", provider: "Microsoft" },
    { name: "Ollama", provider: "Ollama" },
    { name: "LM Studio", provider: "LM Studio" },
  ];

  const marqueeItems = [...models, ...models];

  return (
    <div className="mt-16 md:mt-16 border-t border-white/5 pt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
      <div className="flex items-center mb-6">
        <span className="w-2 h-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(231,118,48,0.4)]"></span>
        <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Works With Any Model</span>
      </div>

      <div className="relative w-full overflow-hidden mask-gradient">
        <div className="absolute top-0 left-0 w-12 md:w-24 h-full bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="absolute top-0 right-0 w-12 md:w-24 h-full bg-gradient-to-l from-background to-transparent z-10"></div>

        <div className="flex w-fit animate-marquee whitespace-nowrap">
          {marqueeItems.map((model, index) => {
            const LogoComponent = providerLogos[model.provider];
            return (
              <div
                key={`${model.name}-${index}`}
                className="flex items-center space-x-3 mx-8 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 cursor-default group"
              >
                {LogoComponent && (
                  <div className="text-gray-500 group-hover:text-primary transition-colors">
                    <LogoComponent className="w-5 h-5" />
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-lg md:text-xl text-white font-mono tracking-tight group-hover:text-primary transition-colors">
                    {model.name}
                  </span>
                  <span className="text-[10px] text-muted font-bold tracking-wider uppercase">
                    {model.provider}
                  </span>
                </div>
                <div className="w-1 h-1 bg-white/20 rounded-full ml-8"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
