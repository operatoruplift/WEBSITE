import React from 'react';

// Anthropic, A mark
export const AnthropicLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.476-3.914H5.036l-1.46 3.914H0L6.569 3.52zm.637 10.283h4.556L9.522 6.3l-2.316 7.503z"/>
  </svg>
);

// OpenAI, knot mark
export const OpenAILogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

// Google, G mark
export const GoogleLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
  </svg>
);

// Meta, infinity mark
export const MetaLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 12c-2-3-4-5-6-5s-4 2-4 5 2 5 4 5 4-2 6-5zm0 0c2 3 4 5 6 5s4-2 4-5-2-5-4-5-4 2-6 5z"/>
  </svg>
);

// Mistral, pixel grid
export const MistralLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="2" width="4" height="4"/><rect x="18" y="2" width="4" height="4"/>
    <rect x="2" y="6" width="4" height="4"/><rect x="6" y="6" width="4" height="4"/><rect x="14" y="6" width="4" height="4"/><rect x="18" y="6" width="4" height="4"/>
    <rect x="2" y="10" width="4" height="4"/><rect x="6" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="14" y="10" width="4" height="4"/><rect x="18" y="10" width="4" height="4"/>
    <rect x="2" y="14" width="4" height="4"/><rect x="10" y="14" width="4" height="4"/><rect x="18" y="14" width="4" height="4"/>
    <rect x="2" y="18" width="4" height="4"/><rect x="6" y="18" width="4" height="4"/><rect x="10" y="18" width="4" height="4"/><rect x="14" y="18" width="4" height="4"/><rect x="18" y="18" width="4" height="4"/>
  </svg>
);

// Cohere, C arc
export const CohereLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
    <path d="M17 7A7 7 0 1 0 17 17"/>
  </svg>
);

// xAI, stylized x letterform
export const XAILogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4h3.5l4.5 7.2L16.5 4H20l-6.3 9.8L20 20h-3.5L12 13l-4.5 7H4l6.3-6.2L4 4z"/>
  </svg>
);

// DeepSeek, whale/dolphin silhouette simplified
export const DeepSeekLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12c0-4 3-7 7-7 2 0 3.5.8 4.5 2l4.5-2v4c1 1.5 1 3.5 0 5v4l-4.5-2c-1 1.2-2.5 2-4.5 2-4 0-7-3-7-7z"/>
    <circle cx="9" cy="11" r="1" fill="currentColor"/>
  </svg>
);

// Microsoft, 4 squares
export const MicrosoftLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="1" y="1" width="10" height="10"/><rect x="13" y="1" width="10" height="10"/>
    <rect x="1" y="13" width="10" height="10"/><rect x="13" y="13" width="10" height="10"/>
  </svg>
);

// Qwen, stylized Q
export const QwenLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="11" r="8"/>
    <line x1="15" y1="15" x2="20" y2="21"/>
  </svg>
);

// Ollama, simple llama head profile
export const OllamaLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 20v-4c0-2 1-3.5 2.5-4.5C9 10.5 8 9 8 7c0-3 2-5 4-5s4 2 4 5c0 2-1 3.5-2.5 4.5C15 12.5 16 14 16 16v4"/>
    <circle cx="10.5" cy="7" r="0.8" fill="currentColor"/>
    <circle cx="13.5" cy="7" r="0.8" fill="currentColor"/>
  </svg>
);

// LM Studio, monitor with cursor
export const LMStudioLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
    <path d="M8 8h4M8 11h6" strokeWidth="1.5"/>
  </svg>
);

// Map provider name to component
export const providerLogos: Record<string, React.FC<{ className?: string }>> = {
  'Anthropic': AnthropicLogo,
  'OpenAI': OpenAILogo,
  'Google': GoogleLogo,
  'Meta': MetaLogo,
  'Mistral AI': MistralLogo,
  'Cohere': CohereLogo,
  'xAI': XAILogo,
  'DeepSeek': DeepSeekLogo,
  'Microsoft': MicrosoftLogo,
  'Alibaba': QwenLogo,
  'Ollama': OllamaLogo,
  'LM Studio': LMStudioLogo,
};
