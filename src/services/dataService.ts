import { AppData } from '@/lib/types';

/**
 * APP_CONTENT, the marketing-site copy library.
 *
 * Trimmed in PR #347 to drop dead structures (problem, market,
 * product, security, developerDocs, buildWithUs) that were used by
 * sections removed in PR #322. Only the three keys still imported
 * stay: hero (Hero.tsx), contact (Contact.tsx), footer (Footer.tsx).
 */
export const APP_CONTENT: AppData = {
  hero: {
    visionTag: "AI ASSISTANT",
    headline: "AI that runs on your terms.",
    subhead: "Drafts your email, schedules your meetings. Nothing goes out without your tap.",
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
          { label: "Blog", action: "blog" },
          { label: "Pricing", action: "pricing" }
        ]
      },
      company: {
        title: "Company",
        links: [
          { label: "Contact", action: "contact" },
          { label: "Press kit", action: "press" }
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
