import { AppData } from '@/lib/types';

export interface ProblemPillar {
  id: string;
  emoji: string;
  problem: string;
  solution: string;
  description: string;
  href: string;
}

export interface ProblemData {
  stat: string;
  subline: string;
  pillars: ProblemPillar[];
  solution: string;
}

export interface MarketStat {
  value: string;
  label: string;
}

export interface MarketData {
  headline: string;
  subhead: string;
  stats: MarketStat[];
}

export const APP_CONTENT: AppData & { problem: ProblemData; market: MarketData } = {
  problem: {
    stat: '40+',
    subline: 'Your team uses 40+ SaaS tools. Each one stores your data on their servers, trains on your inputs, and locks you into their ecosystem.',
    pillars: [
      { id: 'siloed-memory', emoji: '🧠', problem: 'Fragmented Stack', solution: 'Unified Platform', description: 'Your tools don\'t talk to each other. Data lives in silos. AI agents should unify your entire workflow with shared memory across every tool.', href: '#product' },
      { id: 'exposed-privacy', emoji: '🔓', problem: 'Data Leakage', solution: 'On-Premise', description: 'Every cloud AI tool ingests your proprietary data. Operator Uplift runs on your infrastructure. Nothing leaves your environment.', href: '#product' },
      { id: 'no-boundaries', emoji: '⚠️', problem: 'No Compliance', solution: 'Audit-Ready', description: 'Cloud AI tools can\'t meet HIPAA, SOC 2, or GDPR requirements. Our runtime is open-source, auditable, and deploys inside your firewall.', href: '#product' },
    ],
    solution: 'One platform that replaces fragmented SaaS with AI agents you actually control.',
  },
  market: {
    headline: 'Massive and Growing.',
    subhead: 'The AI agent market is accelerating. Operator Uplift is positioned at the intersection of AI infrastructure, privacy, and enterprise automation.',
    stats: [
      { value: '$103B', label: 'AI Market by 2028' },
      { value: '40+', label: 'SaaS Tools Replaced' },
      { value: '100M+', label: 'Enterprise Users' },
      { value: '#1', label: 'Privacy-First AI' },
    ],
  },
  hero: {
    visionTag: "PERSONAL AI OPERATOR",
    headline: "AI That Runs On Your Terms.",
    subhead: "One Platform. Every Agent. Your Infrastructure.",
    description: "Ask for a daily briefing, triage your inbox, schedule meetings, all through one chat. Nothing sends or books without your OK. Try the live demo before you sign in.",
    contractAddress: "",
    contractLabel: "",
    downloads: {
      windows: {
        id: "windows",
        label: "Download for Windows",
        url: "https://github.com/operatoruplift/releases",
        version: "v0.0.1-beta (x64)",
        type: "windows"
      }
    }
  },
  product: {
    tag: "HOW IT WORKS",
    headline: "Your AI, Your Rules.",
    subhead: "Five simple principles that keep you in control.",
    features: [
      {
        id: 'isolated',
        navTitle: 'YOUR DATA',
        cardTitle: '1. Your Data Stays Yours',
        description: 'Everything stays on your device. Your AI assistants use private, encrypted memory. Nothing gets sent to the cloud without your say-so.',
        iconType: 'kanban'
      },
      {
        id: 'store',
        navTitle: 'APP STORE',
        cardTitle: '2. Pick Your Agents',
        description: 'Browse and install AI assistants from our marketplace, like an app store for AI. One tap to add, one tap to remove.',
        iconType: 'globe'
      },
      {
        id: 'runtime',
        navTitle: 'CLEAN EXITS',
        cardTitle: '3. They Leave When Done',
        description: 'When an agent finishes a task, it loses access to your stuff. No background snooping, no lingering connections. Clean in, clean out.',
        iconType: 'terminal'
      },
      {
        id: 'tokens',
        navTitle: 'ACCESS',
        cardTitle: '4. Temporary Access Only',
        description: 'Agents only see what you allow, for as long as you allow it. Like giving someone a guest pass that expires automatically.',
        iconType: 'message'
      },
      {
        id: 'permissions',
        navTitle: 'APPROVAL',
        cardTitle: '5. You Approve Everything',
        description: 'Every action an agent wants to take, like reading a file, sending a message, or accessing the internet, needs your OK first.',
        iconType: 'check'
      }
    ]
  },
  security: {
    tag: "ENTERPRISE SECURITY",
    headline: "Enterprise-grade infrastructure, zero cloud dependency.",
    subhead: "AES-256 encrypted local storage. HIPAA, SOC 2, and GDPR ready. Open-source runtime anyone can audit. Deploys inside your firewall.",
    features: {
      security: {
        tag: "COMPLIANCE READY",
        title: "Your data never leaves your environment",
        description: "Everything is AES-256 encrypted and stored on your infrastructure. Agents operate in isolated sessions with time-limited access keys. Full audit trail for every action.",
        linkText: "Security documentation",
        linkUrl: "https://help.operatoruplift.com/"
      },
      enterprise: {
        tag: "MODEL AGNOSTIC",
        title: "Any model, any provider, your choice",
        description: "Operator Uplift works with Claude, GPT, Gemini, Llama, Grok, and local models via Ollama. Switch providers without changing a line of code. Zero vendor lock-in.",
        linkText: "See all integrations",
        linkUrl: "/integrations"
      }
    }
  },
  developerDocs: {
    tag: "LEARN MORE",
    headline: "Get Started",
    description: "Whether you're a developer building agents or a user exploring the platform, we've got you covered.",
    links: [
      {
        title: "Getting Started",
        description: "Set up Operator Uplift and start using AI agents in minutes.",
        iconType: 'terminal',
        url: "https://help.operatoruplift.com/getting-started"
      },
      {
        title: "How It Works",
        description: "Understand how agents, permissions, and privacy work together.",
        iconType: 'kanban',
        url: "https://help.operatoruplift.com/core-concepts"
      },
      {
        title: "For Developers",
        description: "Build your own agents and publish them to the marketplace.",
        iconType: 'globe',
        url: "https://help.operatoruplift.com/api-reference"
      }
    ]
  },
  buildWithUs: {
    tag: "GET STARTED",
    cta: "REQUEST ACCESS",
    headline: "Deploy AI agents on your infrastructure.",
    buttonText: "Request Access",
    url: "/login"
  },
  contact: {
    tag: "GET IN TOUCH",
    headline: "Let's Connect",
    subhead: "We know no one likes to fill forms, so just choose your way of communication and we'll come there, and if you're looking for job follow us on",
    subheadLinkText: "LinkedIn",
    subheadLinkUrl: "https://linkedin.com/company/operatoruplift",
    options: [
      {
        id: 'whatsapp',
        title: 'WhatsApp',
        description: 'Chat with us instantly',
        iconType: 'whatsapp',
        url: 'https://wa.me/18049311722'
      },
      {
        id: 'email',
        title: 'Email',
        description: 'matt@operatoruplift.com',
        iconType: 'email',
        url: 'mailto:matt@operatoruplift.com'
      },
      {
        id: 'meeting',
        title: 'Book a Meeting',
        description: 'Schedule a video call',
        iconType: 'calendar',
        url: 'https://cal.com/rvaclassic'
      },
      {
        id: 'twitter',
        title: 'X (Twitter)',
        description: 'Follow and DM us',
        iconType: 'twitter',
        url: 'https://x.com/OperatorUplift'
      },
      {
        id: 'discord',
        title: 'Discord',
        description: 'Join our community',
        iconType: 'discord',
        url: 'https://discord.gg/eka7hqJcAY'
      },
      {
        id: 'linkedin',
        title: 'LinkedIn',
        description: 'Connect professionally',
        iconType: 'linkedin',
        url: 'https://www.linkedin.com/company/operatoruplift'
      }
    ]
  },
  footer: {
    tag: "FOOTER",
    copyright: "\u00a9 Operator Uplift 2026. All rights reserved.",
    socials: {
      twitter: "https://x.com/OperatorUplift",
      linkedin: "https://www.linkedin.com/company/operatoruplift",
      github: "https://github.com/operatoruplift"
    },
    sections: {
      resources: {
        title: "Resources",
        links: [
          { label: "Docs", url: "https://help.operatoruplift.com" },
          { label: "Contact", action: "contact" }
        ]
      },
      company: {
        title: "Company",
        links: [
          { label: "Contact", action: "contact" }
        ]
      },
      legal: {
        title: "Legal",
        links: [
          { label: "Privacy Policy", action: "privacy" },
          { label: "Terms of Service", action: "terms" }
        ]
      }
    }
  }
};

export const fetchAppData = async (): Promise<AppData> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(APP_CONTENT);
    }, 50);
  });
};
