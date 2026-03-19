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
    subline: 'You have 40 apps. 40 subscriptions. 40 different places storing your data. None of them talk to each other. None are yours.',
    pillars: [
      { id: 'siloed-memory', emoji: '🧠', problem: 'Siloed Memory', solution: 'Unified Context', description: 'No unified shared context across your tools. Your agents should remember everything — across apps, sessions, and devices.', href: '#product' },
      { id: 'exposed-privacy', emoji: '🔓', problem: 'Exposed Privacy', solution: 'Local-First', description: 'Your data leaks to unknown servers. With Operator Uplift, your data lives on your hardware. Zero vendor lock-in.', href: '#product' },
      { id: 'no-boundaries', emoji: '⚠️', problem: 'No Boundaries', solution: 'You Own It', description: 'Agents monetize your private data. Operator Uplift gives you full ownership — every permission explicit, every action approved.', href: '#product' },
    ],
    solution: 'A local-first AI operating system that replaces your entire app stack with one intelligent agent.',
  },
  market: {
    headline: 'Massive and Growing.',
    subhead: 'The AI agent market is accelerating. Operator Uplift is positioned at the intersection of AI, crypto, and consumer software.',
    stats: [
      { value: '$103B', label: 'Total Addressable Market' },
      { value: '$18B', label: 'Serviceable Addressable Market' },
      { value: '100M+', label: 'Target Users (SOM)' },
      { value: '#1', label: 'Local-First AI OS' },
    ],
  },
  hero: {
    visionTag: "VISION",
    headline: "Your Life, Automated.",
    subhead: "One App. Every Agent. All Yours.",
    description: "Local-first AI agents you control, running on your device. Install agents, run tasks in secure sessions, and approve access with clear permissions.",
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
    tag: "PRODUCT",
    headline: "Local-First Agent Command Center",
    subhead: "Install agents, run tasks in secure sessions, and approve access with clear permissions.",
    features: [
      {
        id: 'isolated',
        navTitle: 'ISOLATED ENV',
        cardTitle: '1. Isolated Environment',
        description: 'Agents use private, encrypted local memory where supported, with optional sync, so your data starts on your device and stays under your control.',
        iconType: 'kanban'
      },
      {
        id: 'store',
        navTitle: 'AGENT STORE',
        cardTitle: '2. Agent Store',
        description: 'Discover, install, and run agents from a Solana-powered marketplace. Developers can price agents, and payment rails may include Solana-based credits, while users get one-click agent deployment with transparent permissions and ownership.',
        iconType: 'globe'
      },
      {
        id: 'runtime',
        navTitle: 'SESSION RUNTIME',
        cardTitle: '3. Session Runtime',
        description: 'Each task runs in a session-based runtime that starts fast, stays isolated, and ends cleanly. When the session ends, the agent loses access to your system — ensuring strict isolation with no long-term persistence.',
        iconType: 'terminal'
      },
      {
        id: 'tokens',
        navTitle: 'TIME LIMITED ACCESS KEYS',
        cardTitle: '4. Time Limited Access Keys',
        description: 'Time-limited access keys define exactly what an agent can see or do for a specific task. Keys unlock the Agentic Vault only for that session and can be revoked at any time, ensuring that permissions are precise, revocable, and always under your control.',
        iconType: 'message'
      },
      {
        id: 'permissions',
        navTitle: 'PERMISSIONS',
        cardTitle: '5. Permission Actions',
        description: 'Every file read, device control, and network call is a permission action that you can see and approve. Operator Uplift enforces the boundaries you set — file access, device control, and network calls — are governed by explicit permissions. No silent behavior, no surprises.',
        iconType: 'check'
      }
    ]
  },
  security: {
    tag: "ENTERPRISE",
    headline: "Operator Uplift delivers an enterprise-grade agentic infrastructure",
    subhead: "With isolated runtimes for maximum security, a unified interface that minimizes learning curve, and seamless integration of private AI agents for scalable automation.",
    features: {
      security: {
        tag: "SECURE AT EVERY LEVEL",
        title: "Local-first security and full compliance",
        description: "Operator Uplift uses isolated sandboxes, encrypted local memory and token based access rules to ensure that your data, intellectual property, logs and workflows never leave your environment. Agents receive only the context you explicitly approve for a limited time window, which prevents oversharing and eliminates the risk of cloud based data leakage.",
        linkText: "Learn more about security",
        linkUrl: "https://help.operatoruplift.com/"
      },
      enterprise: {
        tag: "ACROSS YOUR DEVELOPMENT STACK",
        title: "Independent of interfaces and external vendors",
        description: "Operator Uplift integrates with any model provider, internal API, or device. Deploy agents with one interface, and evolve them over time without vendor lock-in. As your internal systems mature, your agents upgrade seamlessly with shared memory, cross-device sync, and modular extensions.",
        linkText: "Learn more about enterprise",
        linkUrl: "/contact"
      }
    }
  },
  developerDocs: {
    tag: "BUILD WITH US",
    headline: "Developer Docs",
    description: "Everything you need to integrate Operator Uplift agents into your infrastructure. Explore our guides, samples, and API references.",
    links: [
      {
        title: "Quickstart Guide",
        description: "Get up and running with Operator Uplift in minutes. Deploy your first agent container.",
        iconType: 'terminal',
        url: "https://help.operatoruplift.com/getting-started"
      },
      {
        title: "Core Concepts",
        description: "Deep dive into the architecture, session tokens, and security vaults.",
        iconType: 'kanban',
        url: "https://help.operatoruplift.com/core-concepts"
      },
      {
        title: "API Reference",
        description: "Complete reference for the Agent Store API and Runtime SDKs.",
        iconType: 'globe',
        url: "https://help.operatoruplift.com/api-reference"
      }
    ]
  },
  buildWithUs: {
    tag: "BUILD WITH US",
    cta: "START BUILDING",
    headline: "Ready to build the software of the future?",
    buttonText: "Start Building",
    url: "https://help.operatoruplift.com"
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
          { label: "Contact Sales", action: "contact" }
        ]
      },
      company: {
        title: "Company",
        links: [
          { label: "Careers", url: "https://linkedin.com/company/operatoruplift" },
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
