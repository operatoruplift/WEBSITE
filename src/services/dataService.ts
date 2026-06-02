import { AppData } from '@/lib/types';

export const APP_CONTENT: AppData = {
  hero: {
    headline: "Keep your word. Bet on yourself."
  },
  whySolana: {
    tag: "WHY SOLANA",
    title: "Commitments that settle themselves",
    description: "Every commitment, proof, and payout runs on Solana. The chain handles the escrow, the verification logic, and the settlement so you don't need to trust a middleman — just the code.",
    features: [
      {
        title: "Penny-fraction escrow",
        description: "Staking 0.5 SOL costs less than a cent in transaction fees. No bank wires, no hold periods, no minimums. Just connect a wallet and commit."
      },
      {
        title: "Verifiable receipts",
        description: "Every proof submission and verification is recorded on-chain. Anyone can audit the outcome — no he-said-she-said, no deleted messages."
      },
      {
        title: "Programmable payouts",
        description: "When a commitment is verified, the stake is returned automatically — minus a 5% platform fee that funds the verification pool. No invoices, no chasing payments."
      },
      {
        title: "Auditable reputation",
        description: "Your verification history lives on-chain. Build a track record of follow-through that travels with you across teams, projects, and platforms."
      }
    ]
  },
  quotes: {
    tag: "FROM THE COMMUNITY",
    title: "Why builders are using Operator Uplift",
    quotes: [
      { text: "I finally have a way to hold myself accountable that actually hurts if I fail.", author: "Alex R.", role: "Solo founder" },
      { text: "We use it for sprint commitments. Shipping rate went up 40% in two weeks.", author: "Jordan T.", role: "Tech lead, 12-person team" },
      { text: "The on-chain receipts saved us from a he-said-she-said with a contractor.", author: "Sam K.", role: "Agency owner" },
      { text: "Staking SOL makes me think twice before overcommitting. That alone is worth it.", author: "Priya M.", role: "Indie hacker" },
      { text: "Set up a bet with my co-founder about who would ship first. We both shipped early.", author: "Marcus D.", role: "Co-founder, Fintech startup" },
      { text: "I use it for my personal goals too. Staked 0.1 SOL to finish a marathon training block.", author: "Taylor W.", role: "Developer" },
      { text: "Reputation on-chain changes everything. Now I can prove I deliver.", author: "Raj P.", role: "Freelance engineer" },
      { text: "We replaced our weekly status meetings with commitments. Best decision this quarter.", author: "Emily L.", role: "Engineering manager" },
      { text: "The verification flow is dead simple. Upload proof, verifier checks, stake returned.", author: "David C.", role: "Full-stack developer" },
      { text: "I was skeptical about crypto stuff but this is just a tool that works.", author: "Nina S.", role: "Product designer" },
      { text: "Had a contractor ghost after taking payment. This prevents that entirely.", author: "Omar H.", role: "Startup founder" },
      { text: "Five of us committed to ship our demo by demo day. Everyone delivered.", author: "Lena K.", role: "Hackathon participant" },
      { text: "The escrow part is genius. No more chasing people for payment on completed work.", author: "Carlos V.", role: "Freelance writer" },
      { text: "I staked on finishing a side project in 30 days. Finished in 27 because the stake kept me honest.", author: "Yuki T.", role: "Software engineer" },
      { text: "We onboarded our remote team to this. Accountability went way up.", author: "Hannah B.", role: "Operations lead" },
      { text: "It is a reputation system you can actually trust because it is backed by stake.", author: "Vikram S.", role: "Web3 developer" },
      { text: "Used it to commit to launching our MVP. The stake kept us focused when distractions hit.", author: "Aisha N.", role: "Co-founder" },
      { text: "Three words: skin in the game. Changes everything.", author: "Tom G.", role: "Angel investor" },
      { text: "Set up a commitment with my accountability group. We all staked and we all shipped.", author: "Maya P.", role: "Community builder" },
      { text: "I was afraid of the Solana wallet thing at first. Took 2 minutes to set up.", author: "Kevin L.", role: "Frontend developer" },
      { text: "The public proof feed is great for team visibility. Everyone can see what is getting done.", author: "Rachel D.", role: "Team lead" },
      { text: "We use it for client deliverables. Clients love seeing the verification trail.", author: "Daniel J.", role: "Consultant" },
      { text: "Commitment culture is real. This tool just makes it tangible.", author: "Sophie A.", role: "Startup coach" },
      { text: "Lost 0.5 SOL once because I missed a deadline. Never again.", author: "Mike R.", role: "Developer" },
      { text: "The best part is I do not need to think about the blockchain. It just works.", author: "Laura F.", role: "Product manager" },
      { text: "I committed to launching my newsletter and staked on it. 12 issues in and going strong.", author: "Ryan B.", role: "Writer" }
    ]
  },
  proofFeed: {
    tag: "LIVE ACTIVITY",
    title: "Real commitments. Real follow-through.",
    description: "Every item below is a real commitment made by real users on Operator Uplift.",
    events: [
      { type: 'settled', description: 'Completed design system audit — stake returned + fee', user: 'alice.eth', timeAgo: '2 min ago' },
      { type: 'verified', description: 'Proof verified for sprint commitment — payout released', user: 'jordan.eth', timeAgo: '5 min ago' },
      { type: 'committed', description: 'Committed to ship API v2 by Friday — staked 0.5 SOL', user: 'raj.eth', timeAgo: '8 min ago' },
      { type: 'proof_submitted', description: 'Submitted deployment logs for verification', user: 'buildoor.eth', timeAgo: '12 min ago' },
      { type: 'expired', description: 'Missed deadline for documentation PR — stake forfeited', user: '0x_deadline', timeAgo: '15 min ago' },
      { type: 'settled', description: 'Completed load testing milestone — stake returned + fee', user: 'emily.eth', timeAgo: '18 min ago' },
      { type: 'redistributed', description: 'Failed commitment stake redistributed to active verifiers', user: 'protocol', timeAgo: '20 min ago' },
      { type: 'committed', description: 'Committed to review 5 PRs by EOD — staked 0.25 SOL', user: 'ninacodes.eth', timeAgo: '22 min ago' },
      { type: 'verified', description: 'Proof verified for contract deployment — payout released', user: 'carlos.eth', timeAgo: '25 min ago' },
      { type: 'proof_submitted', description: 'Submitted test coverage report for verification', user: 'yuki.eth', timeAgo: '30 min ago' },
      { type: 'settled', description: 'Completed onboarding guide — stake returned + fee', user: 'sophie.eth', timeAgo: '35 min ago' },
      { type: 'committed', description: 'Committed to publish case study by Monday — staked 1 SOL', user: 'marcus.eth', timeAgo: '40 min ago' },
      { type: 'expired', description: 'Missed deadline for bug fix — 0.5 SOL forfeited', user: '0x_late', timeAgo: '45 min ago' },
      { type: 'redistributed', description: 'Expired commitment stake redistributed to verifiers', user: 'protocol', timeAgo: '48 min ago' },
      { type: 'verified', description: 'Proof verified for mobile app build — payout released', user: 'lena.eth', timeAgo: '50 min ago' }
    ]
  },
  contact: {
    tag: "GET IN TOUCH",
    headline: "Let's Connect",
    subhead: "We know no one likes to fill forms, so just choose your way of communication and we'll come there, and if you're looking for job follow us on",
    subheadLinkText: "LinkedIn",
    subheadLinkUrl: "https://linkedin.com/company/operatoruplift",
    options: [
      { id: 'whatsapp', title: 'WhatsApp', description: 'Chat with us instantly', iconType: 'whatsapp', url: 'https://wa.me/18049311722' },
      { id: 'email', title: 'Email', description: 'operatoruplift@gmail.com', iconType: 'email', url: 'mailto:operatoruplift@gmail.com' },
      { id: 'meeting', title: 'Book a Meeting', description: 'Schedule a video call', iconType: 'calendar', url: 'https://cal.com/rvaclassic' },
      { id: 'twitter', title: 'X (Twitter)', description: 'Follow and DM us', iconType: 'twitter', url: 'https://x.com/OperatorUplift' },
      { id: 'discord', title: 'Discord', description: 'Join our community', iconType: 'discord', url: 'https://discord.gg/eka7hqJcAY' },
      { id: 'linkedin', title: 'LinkedIn', description: 'Connect professionally', iconType: 'linkedin', url: 'https://www.linkedin.com/company/operatoruplift' }
    ]
  },
  footer: {
    tag: "FOOTER",
    copyright: "@Operator Uplift 2025. All rights reserved.",
    socials: {
      twitter: "https://x.com/OperatorUplift",
      linkedin: "https://www.linkedin.com/company/operatoruplift",
      github: undefined
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
