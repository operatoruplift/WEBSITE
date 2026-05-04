
import React from 'react';
import { providerLogos } from './ProviderLogos';

const TrustedBy: React.FC = () => {
  // Marquee entries mirror the frontier models that shipped to
  // consumer/API surfaces by May 2026. lib/llm.ts::mapModelId
  // accepts any of these; a user picking "Gemini 3.1 Pro" in /chat
  // gets routed to that exact model. Refresh notes:
  //   - GPT-5.5 / GPT-5.5 Pro shipped 2026-04-23
  //     (openai.com/index/introducing-gpt-5-5)
  //   - Claude Opus 4.7 shipped 2026-04-16
  //   - Gemini 3.1 Pro + Gemini 3 Flash shipped 2026-04-22
  //     (blog.google: gemini-3-flash)
  //   - Grok 4.3 API GA 2026-04-30 (docs.x.ai/release-notes)
  //   - DeepSeek V4 Pro + V4 Flash shipped 2026-04-24
  //     (huggingface.co/deepseek-ai/DeepSeek-V4-Pro)
  //   - Llama 4 stays current (no Llama 5 as of May 2026)
  //   - Mistral Large stays current
  const models = [
    { name: "Claude Opus 4.7", provider: "Anthropic" },
    { name: "Claude Sonnet 4.6", provider: "Anthropic" },
    { name: "Claude Haiku 4.5", provider: "Anthropic" },
    { name: "GPT-5.5", provider: "OpenAI" },
    { name: "GPT-5.5 Pro", provider: "OpenAI" },
    { name: "Gemini 3.1 Pro", provider: "Google" },
    { name: "Gemini 3 Flash", provider: "Google" },
    { name: "Grok 4.3", provider: "xAI" },
    { name: "DeepSeek V4 Pro", provider: "DeepSeek" },
    { name: "DeepSeek V4 Flash", provider: "DeepSeek" },
    { name: "Llama 4 Maverick", provider: "Meta" },
    { name: "Mistral Large", provider: "Mistral AI" },
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

      <div
        className="relative w-full overflow-hidden mask-gradient"
        role="region"
        aria-label="Supported AI models"
      >
        <div className="absolute top-0 left-0 w-12 md:w-24 h-full bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="absolute top-0 right-0 w-12 md:w-24 h-full bg-gradient-to-l from-background to-transparent z-10"></div>

        <div className="flex w-fit animate-marquee whitespace-nowrap">
          {marqueeItems.map((model, index) => {
            const LogoComponent = providerLogos[model.provider];
            // The marquee duplicates the model list to make the scroll
            // animation seamless. Hide the second half from assistive
            // tech so screen readers don't announce "Claude Opus 4.7"
            // (etc.) twice.
            const isDuplicate = index >= models.length;
            return (
              <div
                key={`${model.name}-${index}`}
                className="flex items-center space-x-3 mx-8 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 cursor-default group"
                aria-hidden={isDuplicate ? 'true' : undefined}
              >
                {LogoComponent && (
                  <div className="text-gray-500 group-hover:text-primary transition-colors">
                    {/* Decorative logo paired with the visible model
                        name span below; mark aria-hidden so screen
                        readers announce just "Claude Opus 4.7,
                        Anthropic" rather than "image, Claude Opus 4.7,
                        Anthropic". The marquee region itself already
                        has role="region" + aria-label="Supported AI
                        models". */}
                    <LogoComponent aria-hidden className="w-5 h-5" />
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
                {/* Decorative bullet between marquee items; aria-hidden
                    so screen readers don't announce it as a separator
                    between every model entry. */}
                <div aria-hidden="true" className="w-1 h-1 bg-white/20 rounded-full ml-8"></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
