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
    subline: 'You jump between Gmail, Calendar, Slack, Notion, and twenty more, every day. Each one stores your stuff somewhere different, and AI tools can only see one app at a time.',
    pillars: [
      { id: 'siloed-memory', emoji: '🧠', problem: 'Apps don\'t talk', solution: 'One assistant', description: 'Your inbox doesn\'t know about your calendar. Your notes don\'t know about your messages. One assistant that sees the whole picture and moves work across them.', href: '#product' },
      { id: 'no-blanket-trust', emoji: '🔓', problem: 'Free-running AI', solution: 'Tap to approve', description: 'Most AI agents act on your behalf the moment they decide to. Ours pauses before anything is sent, booked, or saved, and waits for your tap. Every action gets a signed receipt you can scroll back through.', href: '#product' },
      { id: 'audit-trail', emoji: '⚠️', problem: 'No proof afterward', solution: 'On-chain audit log', description: 'When something goes wrong with a chat-only assistant, all you have is a fading memory. Ours hashes every action and anchors the log to a Merkle root on Solana. The history can\'t be quietly rewritten.', href: '#product' },
    ],
    solution: 'one assistant for all your apps, with approval before every action and a receipt afterward.',
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
    visionTag: "AI ASSISTANT",
    headline: "AI that runs on your terms.",
    subhead: "Drafts your email, schedules your meetings. Nothing goes out without your tap.",
    description: "",
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
    headline: "Your AI. Your rules.",
    subhead: "Five small ideas that keep you in charge.",
    features: [
      {
        id: 'isolated',
        navTitle: 'YOUR DATA',
        cardTitle: '1. Your data stays yours',
        description: 'You can export or erase your account from Settings → Data. Third parties (Anthropic, OpenAI, Google, xAI, DeepSeek) only see the prompts you send them, and only the one you select per turn. We don\u2019t resell.',
        iconType: 'kanban'
      },
      {
        id: 'store',
        navTitle: 'PICK HELPERS',
        cardTitle: '2. Pick your helpers',
        description: 'Browse a built-in store of ready-made AI helpers, like an app store, but for AI. One tap to add one, one tap to remove.',
        iconType: 'globe'
      },
      {
        id: 'runtime',
        navTitle: 'CLEAN EXITS',
        cardTitle: '3. Clean exits',
        description: 'When a helper finishes a job, its access shuts off. No background snooping, no lingering logins. Clean in, clean out.',
        iconType: 'terminal'
      },
      {
        id: 'tokens',
        navTitle: 'ACCESS',
        cardTitle: '4. Temporary access only',
        description: 'Helpers only see what you allow, for as long as you allow it. Like a guest pass that expires on its own.',
        iconType: 'message'
      },
      {
        id: 'permissions',
        navTitle: 'APPROVAL',
        cardTitle: '5. You approve everything',
        description: 'Every action, read this, send that, look something up online, needs your okay first.',
        iconType: 'check'
      }
    ]
  },
  security: {
    tag: "TRUST",
    headline: "Trust by construction, not promise.",
    subhead: "Approval gate before every action, signed receipt afterward, on-chain audit log. HIPAA-aware architecture, GDPR workflows, MIT-licensed open source.",
    features: {
      security: {
        tag: "VERIFIABLE",
        title: "Every action carries a receipt",
        description: "Each tool action emits an ed25519-signed receipt with a request ID. Receipts hash into a Merkle tree that we anchor to Solana via the deployed audit-trail Anchor program. You can verify a receipt against the public key without trusting our server.",
        linkText: "Security documentation",
        linkUrl: "/docs/receipts"
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
        description: 'operatoruplift@gmail.com',
        iconType: 'email',
        url: 'mailto:operatoruplift@gmail.com'
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
    tag: "OPERATOR UPLIFT",
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
          { label: "Docs", action: "docs" },
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
