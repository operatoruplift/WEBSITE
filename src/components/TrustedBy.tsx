
import React from 'react';

// Minimal recognizable provider logos as inline SVGs
const ProviderLogo = ({ provider }: { provider: string }) => {
  const cls = "w-5 h-5 flex-shrink-0";
  switch (provider) {
    case 'Anthropic':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.476-3.914H5.036l-1.46 3.914H0L6.569 3.52zm.637 10.283h4.556L9.522 6.3l-2.316 7.503z"/></svg>;
    case 'OpenAI':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/></svg>;
    case 'Google':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>;
    case 'Meta':
      return <span className={`${cls} font-bold text-[11px] flex items-center justify-center`} style={{ fontFamily: 'system-ui' }}>M</span>;
    case 'Mistral AI':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M3.428 0h4.229v4.229H3.428zM16.343 0h4.229v4.229h-4.229zM3.428 4.229h4.229v4.229H3.428zm4.229 0h4.228v4.229H7.657zm8.686 0h4.229v4.229h-4.229zM3.428 8.457h4.229v4.229H3.428zm4.229 0h4.228v4.229H7.657zm4.229 0h4.228v4.229h-4.228zm4.228 0h4.229v4.229h-4.229zM3.428 12.686h4.229v4.228H3.428zm8.458 0h4.228v4.228h-4.228zm8.686 0H24v4.228h-3.428zM3.428 16.914h4.229v4.229H3.428zm4.229 0h4.228v4.229H7.657zm4.229 0h4.228v4.229h-4.228zm4.228 0h4.229v4.229h-4.229z"/></svg>;
    case 'Cohere':
      return <span className={`${cls} font-bold text-[10px] flex items-center justify-center`}>Co</span>;
    case 'xAI':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M15.53 1.564 9.137 11.14l8.768 11.3h-3.51l-7.01-9.028L.893 22.44H0l6.92-10.14L.38 1.564h3.51l6.482 8.355 6.275-8.355h.883zM17.66 1.564h3.87L12.39 14.23l5.14 8.21h-3.87L8.73 14.23l8.93-12.666z"/></svg>;
    case 'DeepSeek':
      return <span className={`${cls} font-bold text-[10px] flex items-center justify-center`}>DS</span>;
    case 'Alibaba':
      return <span className={`${cls} font-bold text-[10px] flex items-center justify-center`}>QW</span>;
    case 'Microsoft':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z"/></svg>;
    case 'Local':
      return <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>;
    default:
      return null;
  }
};

const TrustedBy: React.FC = () => {
  const models = [
    { name: "Claude Opus 4.6", provider: "Anthropic" },
    { name: "GPT-4.1", provider: "OpenAI" },
    { name: "Gemini 2.5 Pro", provider: "Google" },
    { name: "Llama 4 Maverick", provider: "Meta" },
    { name: "Mistral Large 25.03", provider: "Mistral AI" },
    { name: "Command A", provider: "Cohere" },
    { name: "Grok 3", provider: "xAI" },
    { name: "DeepSeek-R1", provider: "DeepSeek" },
    { name: "Qwen 3", provider: "Alibaba" },
    { name: "Phi-4", provider: "Microsoft" },
    { name: "Ollama", provider: "Local" },
    { name: "LM Studio", provider: "Local" },
  ];

  const marqueeItems = [...models, ...models];

  return (
    <div className="mt-16 md:mt-16 border-t border-white/5 pt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
      <div className="flex items-center mb-6">
        <span className="w-2 h-2 rounded-full bg-primary mr-2 shadow-[0_0_8px_rgba(231,118,48,0.4)]"></span>
        <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase">Powered By</span>
      </div>

      <div className="relative w-full overflow-hidden mask-gradient">
        <div className="absolute top-0 left-0 w-12 md:w-24 h-full bg-gradient-to-r from-background to-transparent z-10"></div>
        <div className="absolute top-0 right-0 w-12 md:w-24 h-full bg-gradient-to-l from-background to-transparent z-10"></div>

        <div className="flex w-fit animate-marquee whitespace-nowrap">
          {marqueeItems.map((model, index) => (
            <div
              key={`${model.name}-${index}`}
              className="flex items-center space-x-3 mx-8 opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 cursor-default group"
            >
              <div className="text-gray-500 group-hover:text-primary transition-colors">
                <ProviderLogo provider={model.provider} />
              </div>
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
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrustedBy;
