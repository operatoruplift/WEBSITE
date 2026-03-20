import React from 'react';

// All logos as proper SVG paths — no text fallbacks
export const AnthropicLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.827 3.52h3.603L24 20.48h-3.603l-6.57-16.96zm-7.258 0h3.767L16.906 20.48h-3.674l-1.476-3.914H5.036l-1.46 3.914H0L6.569 3.52zm.637 10.283h4.556L9.522 6.3l-2.316 7.503z"/>
  </svg>
);

export const OpenAILogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.998 5.998 0 0 0-3.998 2.9 6.042 6.042 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
  </svg>
);

export const GoogleLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
  </svg>
);

export const MetaLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M1.946 0C.87 0 0 .87 0 1.946v20.108C0 23.13.87 24 1.946 24H12.6v-9.293H9.517v-3.62H12.6V8.413c0-3.047 1.862-4.706 4.579-4.706 1.301 0 2.42.097 2.745.14v3.186h-1.884c-1.477 0-1.763.702-1.763 1.733v2.272h3.527l-.46 3.62h-3.067V24h6.015c1.076 0 1.946-.87 1.946-1.946V1.946C24.238.87 23.368 0 22.292 0H1.946z"/>
  </svg>
);

export const MistralLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.428 0h4.229v4.229H3.428zM16.343 0h4.229v4.229h-4.229zM3.428 4.229h4.229v4.229H3.428zm4.229 0h4.228v4.229H7.657zm8.686 0h4.229v4.229h-4.229zM3.428 8.457h4.229v4.229H3.428zm4.229 0h4.228v4.229H7.657zm4.229 0h4.228v4.229h-4.228zm4.228 0h4.229v4.229h-4.229zM3.428 12.686h4.229v4.228H3.428zm8.458 0h4.228v4.228h-4.228zm8.686 0H24v4.228h-3.428zM3.428 16.914h4.229v4.229H3.428zm4.229 0h4.228v4.229H7.657zm4.229 0h4.228v4.229h-4.228zm4.228 0h4.229v4.229h-4.229z"/>
  </svg>
);

export const CohereLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c2.252 0 4.33-.744 6.007-2H12c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8v1h2v-1C22 6.477 17.523 2 12 2z"/>
  </svg>
);

export const XAILogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.53 1.564 9.137 11.14l8.768 11.3h-3.51l-7.01-9.028L.893 22.44H0l6.92-10.14L.38 1.564h3.51l6.482 8.355 6.275-8.355h.883zM17.66 1.564h3.87L12.39 14.23l5.14 8.21h-3.87L8.73 14.23l8.93-12.666z"/>
  </svg>
);

export const DeepSeekLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5v-3.07c-1.17-.35-2-1.44-2-2.68 0-.83.36-1.58.93-2.1L7.5 7.22l1.41-1.41L11.34 8.24A2.97 2.97 0 0 1 13 7.75c.83 0 1.58.36 2.1.93l2.43-2.43 1.41 1.41-2.43 2.43c.37.52.57 1.16.57 1.84 0 1.24-.83 2.33-2 2.68v3.07h-2v-3.07c-.37-.11-.71-.29-1-.52v3.59h-2z"/>
  </svg>
);

export const MicrosoftLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M0 0h11.377v11.372H0zm12.623 0H24v11.372H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z"/>
  </svg>
);

export const QwenLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.88-11.71L12 12.17l-3.88-3.88a.996.996 0 1 0-1.41 1.41L10.59 13.58l-3.88 3.88a.996.996 0 1 0 1.41 1.41L12 14.99l3.88 3.88a.996.996 0 1 0 1.41-1.41l-3.88-3.88 3.88-3.88a.996.996 0 1 0-1.41-1.41z"/>
  </svg>
);

export const LocalLogo = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2"/>
    <line x1="8" x2="16" y1="21" y2="21"/>
    <line x1="12" x2="12" y1="17" y2="21"/>
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
  'Local': LocalLogo,
};
