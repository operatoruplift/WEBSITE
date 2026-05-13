// Blog post metadata. Lifted out of app/blog/page.tsx (which is
// 'use client') so that server components like sitemap.ts, RSS feeds,
// and future MDX loaders can import the post list without dragging
// React or client-only code into their bundles.

export interface BlogPost {
    id: string;
    title: string;
    excerpt: string;
    date: string;
    readTime: string;
    category: 'update' | 'engineering' | 'announcement' | 'guide';
    featured?: boolean;
}

export const posts: BlogPost[] = [
    {
        id: 'balaji-pivot-advice',
        title: 'Balaji told me to pivot. I didn\u2019t. Here\u2019s why.',
        excerpt: 'He looked at what I was building and said walk away. I disagreed on the diagnosis, agreed on the wedge critique, and changed three things because of him. What I actually kept and what I actually cut.',
        date: 'April 17, 2026',
        readTime: '4 min read',
        category: 'announcement',
        featured: true,
    },
    {
        id: 'why-we-said-no-to-0g',
        title: 'We looked at 0G this week. Here is why we are holding off.',
        excerpt: '0G has five modules: storage, compute, persistent memory, agent ID, TEE privacy. We are a consumer app that ships when something works, not when it announces. Here is the honest read on each module and the one piece that could change our mind.',
        date: 'May 14, 2026',
        readTime: '5 min read',
        category: 'guide',
    },
    {
        id: 'filecoin-elevenlabs-trust-stack',
        title: 'Receipts now have a public backup nobody can edit, not even us',
        excerpt: 'Your assistant has been signing receipts on Solana for months. The signature was real, but the bytes lived on our servers. Now those same bytes are also pinned to a public network anyone can fetch from. Here is what that closes, in plain English.',
        date: 'May 12, 2026',
        readTime: '5 min read',
        category: 'update',
    },
    {
        id: 'channel-agnostic-photon-spectrum',
        title: 'Talk to your assistant in iMessage, not another app',
        excerpt: 'You already have iMessage open. Now your assistant lives there too. Ask in a text, tap to approve the draft, the email lands in your Gmail. No new app to install. Telegram and WhatsApp coming the same way.',
        date: 'May 11, 2026',
        readTime: '4 min read',
        category: 'update',
    },
    {
        id: 'sns-anchored-signer-identity',
        title: 'How to tell it was really us that signed your receipt',
        excerpt: 'Every action your assistant takes leaves a signed receipt. But how do you know the signature came from us and not someone pretending? We publish our signing identity on a public blockchain, so even if our website goes down, you can still check.',
        date: 'May 9, 2026',
        readTime: '3 min read',
        category: 'guide',
    },
    {
        id: 'one-chain-now-cross-chain-soon',
        title: 'Why you never see a blockchain when using Operator Uplift',
        excerpt: 'You tap, the email sends, the receipt appears. Behind the scenes there is a chain doing the bookkeeping, but you never have to think about it. Here is what that chain is doing and why it stays out of your way.',
        date: 'May 10, 2026',
        readTime: '3 min read',
        category: 'guide',
    },
    {
        id: 'governed-approvals',
        title: 'Governed Approvals: Why Every Agent Action Needs a Human',
        excerpt: 'The single biggest difference between a helpful agent and a dangerous one is a human in the loop at the right moment. Here is how we designed the approval flow.',
        date: 'April 16, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'audit-trail',
        title: 'How the On-Chain Audit Trail Works',
        excerpt: 'Every agent action is SHA-256 hashed and the Merkle root is published to a Solana devnet program every N actions. Here is the exact pipeline.',
        date: 'April 16, 2026',
        readTime: '5 min read',
        category: 'engineering',
    },
    {
        id: 'local-first-threat-model',
        title: 'Our Threat Model for Local-First AI',
        excerpt: 'What we protect against, what we do not, and why we made each trade-off. The honest version.',
        date: 'April 15, 2026',
        readTime: '5 min read',
        category: 'engineering',
    },
    {
        id: 'wedge-lawyer-accountant-therapist',
        title: 'The Three Professions Who Can Not Afford a Data Leak',
        excerpt: 'Lawyers, accountants, therapists. Every one of them has a confidentiality obligation that cloud AI breaks by default. This is our wedge.',
        date: 'April 15, 2026',
        readTime: '4 min read',
        category: 'guide',
    },
    {
        id: 'why-solana-for-audit-roots',
        title: 'Why Solana for Audit Roots',
        excerpt: 'Not every blockchain is a good audit layer. Solana happens to fit the three constraints: fast finality, cheap writes, verifiable publicly. Here is the math.',
        date: 'April 14, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'why-i-built-an-ai-os',
        title: 'Why I Built an AI OS Instead of Pivoting',
        excerpt: 'The earlier version of the Balaji post, on why the OS-layer framing won over the "build a better ChatGPT" critique. See the April 17 post for the specific breakdown.',
        date: 'April 6, 2026',
        readTime: '5 min read',
        category: 'announcement',
    },
    {
        id: 'what-93-percent-retention-looks-like',
        title: 'What 93% Retention Actually Looks Like at 300 Users',
        excerpt: 'Everyone talks about retention like it\'s a number. It\'s not. It\'s a behavior. 93% retention means 93 out of 100 people came back. Not because of push notifications. Because the thing worked.',
        date: 'April 5, 2026',
        readTime: '4 min read',
        category: 'announcement',
    },
    {
        id: 'local-ai-vs-cloud-ai',
        title: 'Local AI vs Cloud AI: The Privacy Case Nobody\'s Making',
        excerpt: 'The privacy argument for local AI is usually made wrong. It\'s not about surveillance, it\'s about control. The web app routes through whichever provider you pick per turn; the desktop+Ollama path on the roadmap pulls inference fully local. Both layers get the same approval gate and signed receipts.',
        date: 'April 4, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'how-solana-changes-agent-economy',
        title: 'How Solana Changes the Agent Economy',
        excerpt: 'We\'re building on Solana because it collapses payment, publishing, and trust into one layer. A developer in Lagos can publish an agent tonight. A user in Tokyo deploys it tomorrow. 400ms settlement.',
        date: 'April 3, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'building-solo',
        title: 'Building Solo: What Bootstrapping Velocity Esports Taught Me About AI',
        excerpt: 'I built Velocity Esports alone. Got partnerships with Epic Games and Quest Nutrition not because I had leverage, but because I showed up prepared. Three lessons that carry directly into Operator Uplift.',
        date: 'April 2, 2026',
        readTime: '5 min read',
        category: 'announcement',
    },
];
