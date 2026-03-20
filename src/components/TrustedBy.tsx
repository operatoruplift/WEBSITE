
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
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M6.915 4.03c-1.968 0-3.683 1.28-4.871 3.113C.704 9.208 0 11.883 0 14.449c0 .706.07 1.369.21 1.973a4.118 4.118 0 0 0 1.756 2.563c.803.521 1.727.738 2.687.57.963-.17 1.942-.682 2.924-1.555 1.248-1.11 2.527-2.828 3.819-5.136-.898-1.594-1.775-2.903-2.626-3.782C7.861 7.997 6.917 7.381 6 7.381c-.918 0-1.43.563-1.43 1.405 0 .58.23 1.378.63 2.27l.158.356c.06.134.066.14.108.218l.05-.098c.507-1.003 1.066-1.91 1.664-2.625.43-.514.872-.902 1.312-1.125.109-.055.182-.083.268-.113l-.113.039a4.89 4.89 0 0 0-.252.084c-.354.13-.707.357-1.066.685-.68.62-1.39 1.578-2.062 2.87 1.454 2.393 2.882 4.158 4.144 5.203 1.26 1.044 2.452 1.524 3.457 1.524 1.004 0 1.75-.387 2.28-1.07a4.478 4.478 0 0 0 .826-2.02c.112-.636.166-1.353.166-2.14 0-2.451-.67-5.012-1.874-7.08C14.997 5.2 13.36 4.03 11.543 4.03c-1.17 0-2.24.578-3.2 1.626-.86.938-1.709 2.3-2.515 3.949l.103-.194c.538-1.009 1.095-1.793 1.66-2.33.468-.447.93-.713 1.376-.813a2.163 2.163 0 0 1 .48-.054c.455 0 .938.198 1.455.603.812.633 1.662 1.727 2.523 3.228a26.327 26.327 0 0 1-.085.153c-1.263 2.278-2.501 3.966-3.678 5.04-.938.856-1.79 1.278-2.49 1.303h-.076c-.451 0-.8-.145-1.078-.438-.32-.336-.544-.856-.648-1.498a8.91 8.91 0 0 1-.095-1.307c0-2.346.638-4.79 1.695-6.576.923-1.558 2.075-2.524 3.375-2.524z"/></svg>;
    case 'Mistral AI':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M3.428 0h4.229v4.229H3.428zM16.343 0h4.229v4.229h-4.229zM3.428 4.229h4.229v4.229H3.428zm4.229 0h4.228v4.229H7.657zm8.686 0h4.229v4.229h-4.229zM3.428 8.457h4.229v4.229H3.428zm4.229 0h4.228v4.229H7.657zm4.229 0h4.228v4.229h-4.228zm4.228 0h4.229v4.229h-4.229zM3.428 12.686h4.229v4.228H3.428zm8.458 0h4.228v4.228h-4.228zm8.686 0H24v4.228h-3.428zM3.428 16.914h4.229v4.229H3.428zm4.229 0h4.228v4.229H7.657zm4.229 0h4.228v4.229h-4.228zm4.228 0h4.229v4.229h-4.229z"/></svg>;
    case 'Cohere':
      return <svg className={cls} viewBox="0 0 24 24" fill="currentColor"><path d="M8.654 0C3.9 0 0 3.9 0 8.654c0 4.753 3.9 8.653 8.654 8.653a8.59 8.59 0 0 0 5.186-1.736c.063-.047.065-.14.005-.192l-3.078-2.605a.134.134 0 0 0-.153-.014A5.02 5.02 0 0 1 8.654 13.5a4.846 4.846 0 1 1 0-9.692A4.846 4.846 0 0 1 13.5 8.654c0 .72-.16 1.403-.443 2.017a.134.134 0 0 0 .015.144l2.67 3.147a.134.134 0 0 0 .196.013A8.595 8.595 0 0 0 17.307 8.654C17.307 3.9 13.408 0 8.654 0zm6.292 14.238a.134.134 0 0 0-.197-.01c-.5.474-1.06.887-1.669 1.225a.134.134 0 0 0-.03.213l3.078 2.605a.134.134 0 0 0 .2-.01A12.03 12.03 0 0 0 24 8.654C24 3.9 20.1 0 15.346 0h-.153a.134.134 0 0 0-.134.134v3.674c0 .074.06.134.134.134h.153a4.846 4.846 0 0 1 4.846 4.712c.006 2.118-1.349 4.213-3.43 5.31a.134.134 0 0 0-.034.21l1.218 1.064z"/></svg>;
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
