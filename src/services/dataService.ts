import { AppData } from '@/lib/types';

export const APP_CONTENT: AppData = {
  hero: {
    visionTag: "VISION",
    headline: "Install. Plug. Run.",
    subhead: "Run your AI Agents in a secured Enviornment and connect them with your Agentic Vault",
    description: "Download an open-source platform where locally-run agents collaborate through shared context with unlimited personal memory.",
    downloads: {
      windows: {
        id: "windows",
        label: "Download for Windows",
        url: "#",
        version: "v0.0.1-beta (x64)",
        type: "windows"
      }
    }
  },
  product: {
    tag: "PRODUCT",
    headline: "Self-Contained AI Enviornment",
    subhead: "A new compute layer with containerized agents, user controlled data and a marketplace for agents",
    features: [
      {
        id: 'isolated',
        navTitle: 'ISOLATED ENV',
        cardTitle: '1. Isolated Environment',
        description: 'A secure and high-speed sandbox where every agent runs independently. Your data stays local, execution is fast, and each agent operates inside a protected space built for safety and performance.',
        iconType: 'kanban'
      },
      {
        id: 'store',
        navTitle: 'AGENT STORE',
        cardTitle: '2. Agent Store',
        description: 'A curated store where you can access, install, and deploy agents with one click. Developers get a space for monetizing their agents, and users get effortless setup and clear permissions.',
        iconType: 'globe'
      },
      {
        id: 'runtime',
        navTitle: 'SESSION RUNTIME',
        cardTitle: '3. Session-Based Runtime',
        description: 'Agents receive a temporary, secure workspace for each task they perform. This plug-and-play mechanism ensures fast execution, strict isolation, and no long-term access to your system once the session ends.',
        iconType: 'terminal'
      },
      {
        id: 'tokens',
        navTitle: 'SESSION TOKENS',
        cardTitle: '4. Session-Based Tokens',
        description: 'Short-lived, context-aware tokens define exactly what an agent can see or do. They unlock the Agentic Vault, ensuring that permissions are precise, revocable, and always under your control.',
        iconType: 'message'
      },
      {
        id: 'permissions',
        navTitle: 'PERMISSIONS',
        cardTitle: '5. Permission Actions',
        description: 'Every outward action—file access, device control, network calls—is governed by explicit permissions. No silent behavior, no surprises. You define what agents can do, and UPLIFT enforces those boundaries automatically.',
        iconType: 'check'
      }
    ]
  },
  security: {
    tag: "ENTERPRISE",
    headline: "Uplift delivers an enterprise-grade agentic infrastructure",
    subhead: "With isolated runtimes for maximum security, a unified interface that minimizes learning curve, and seamless integration of private AI agents for scalable automation.",
    features: {
      security: {
        tag: "SECURE AT EVERY LEVEL",
        title: "Local-first security and full compliance",
        description: "Uplift uses isolated sandboxes, encrypted local memory and token based access rules to ensure that your data, intellectual property, logs and workflows never leave your environment. Agents receive only the context you explicitly approve for a limited time window, which prevents oversharing and eliminates the risk of cloud based data leakage.",
        linkText: "Learn more about security",
        linkUrl: "#"
      },
      enterprise: {
        tag: "ACROSS YOUR DEVELOPMENT STACK",
        title: "Independent of interfaces and external vendors",
        description: "Uplift integrates with any model provider, internal API, or device. Deploy the agents with one interface, and evolve them over time without vendor lock-in. As your internal systems mature, your agents upgrade seamlessly with shared memory, cross-device sync, and modular extensions.",
        linkText: "Learn more about enterprise",
        linkUrl: "#"
      }
    }
  },
  developerDocs: {
    tag: "BUILD WITH US",
    headline: "Developer Docs",
    description: "Everything you need to integrate Uplift agents into your infrastructure. Explore our guides, samples, and API references.",
    links: [
      {
        title: "Quickstart Guide",
        description: "Get up and running with Uplift in minutes. Deploy your first agent container.",
        iconType: 'terminal',
        url: "https://docs.operatoruplift.com/"
      },
      {
        title: "Core Concepts",
        description: "Deep dive into the architecture, session tokens, and security vaults.",
        iconType: 'kanban',
        url: "https://docs.operatoruplift.com/"
      },
      {
        title: "API Reference",
        description: "Complete reference for the Agent Store API and Runtime SDKs.",
        iconType: 'globe',
        url: "https://docs.operatoruplift.com/"
      }
    ]
  },
  buildWithUs: {
    tag: "BUILD WITH US",
    cta: "START BUILDING",
    headline: "Ready to build the software of the future?",
    buttonText: "Start Building",
    url: "https://docs.operatoruplift.com"
  },
  contact: {
    tag: "GET IN TOUCH",
    headline: "Let's Connect",
    subhead: "We know no one likes to fill forms, so just choose your way of communication and we'll come there, and if you're looking for job follow us on",
    subheadLinkText: "Wellfound",
    subheadLinkUrl: "https://wellfound.com/company/uplift-os",
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
        description: 'dhruv@operatoruplift.com',
        iconType: 'email',
        url: 'mailto:dhruv@operatoruplift.com'
      },
      {
        id: 'meeting',
        title: 'Book a Meeting',
        description: 'Schedule a video call',
        iconType: 'calendar',
        url: 'https://calendly.com/dhruv-helloaven/30min'
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
        url: 'https://discord.gg/duvYhkW5'
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
    copyright: "@Uplift 2025. All rights reserved.",
    socials: {
      twitter: "https://x.com/OperatorUplift",
      linkedin: "https://www.linkedin.com/company/operatoruplift",
      github: "https://github.com/uplift-labs"
    },
    sections: {
      resources: {
        title: "Resources",
        links: [
          { label: "Docs", url: "https://docs.operatoruplift.com" },
          { label: "Contact Sales", action: "contact" }
        ]
      },
      company: {
        title: "Company",
        links: [
          { label: "Careers", url: "https://wellfound.com/company/uplift-os" },
          { label: "Enterprise", action: "security" }
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
