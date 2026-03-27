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
    subline: 'You juggle 40 apps. 40 passwords. 40 places your data gets stored. They don\'t talk to each other, and none of them work for you.',
    pillars: [
      { id: 'siloed-memory', emoji: '🧠', problem: 'Scattered Tools', solution: 'One Place', description: 'Your notes are in one app, your calendar in another, your files in a third. AI should connect all of it and remember what matters.', href: '#product' },
      { id: 'exposed-privacy', emoji: '🔓', problem: 'No Privacy', solution: 'Your Device', description: 'Every app you use sends your data to someone else\'s server. We think your data should stay on your device, period.', href: '#product' },
      { id: 'no-boundaries', emoji: '⚠️', problem: 'No Control', solution: 'Your Rules', description: 'Big tech AI watches everything you do. Operator Uplift puts you in charge. You decide what AI can see and do.', href: '#product' },
    ],
    solution: 'One app that replaces your entire toolkit with AI that actually works for you.',
  },
  market: {
    headline: 'The Future is Personal AI.',
    subhead: 'Millions of people are ready for AI that works for them, not against them. We are building the platform to make that happen.',
    stats: [
      { value: '$103B', label: 'AI Market by 2028' },
      { value: '40+', label: 'Apps Replaced' },
      { value: '100M+', label: 'People Ready' },
      { value: '#1', label: 'Privacy-First AI' },
    ],
  },
  hero: {
    visionTag: "VISION",
    headline: "Your Life, Automated.",
    subhead: "One App. Every Agent. All Yours.",
    description: "AI assistants that work for you, not big tech. They run on your device, respect your privacy, and do exactly what you tell them.",
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
    tag: "TRUST",
    headline: "Built for people who care about their privacy.",
    subhead: "Your data never leaves your device. Your AI works for you, not advertisers. And you can switch providers anytime, no lock-in.",
    features: {
      security: {
        tag: "PRIVATE BY DEFAULT",
        title: "Your data stays on your device",
        description: "Everything is encrypted and stored locally. Your conversations, files, and workflows never touch our servers. Agents only see what you share, and only for as long as you allow.",
        linkText: "How we protect your privacy",
        linkUrl: "https://help.operatoruplift.com/"
      },
      enterprise: {
        tag: "WORKS WITH EVERYTHING",
        title: "Use any AI model, any tool",
        description: "Operator Uplift works with Claude, GPT, Gemini, Llama, and more. Switch models anytime. Connect your favorite apps. No vendor lock-in, ever.",
        linkText: "See all integrations",
        linkUrl: "/contact"
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
    tag: "JOIN US",
    cta: "GET EARLY ACCESS",
    headline: "Ready to take control of your AI?",
    buttonText: "Join Waitlist",
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
