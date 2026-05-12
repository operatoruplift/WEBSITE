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
        id: 'filecoin-elevenlabs-trust-stack',
        title: 'Filecoin Mirrors and ElevenLabs Voice: Two New Layers on the Trust Stack',
        excerpt: 'Every signed receipt now anchors to Filecoin so a judge can byte-compare the JSON without trusting our Supabase. And the demo voiceover is a server endpoint, not a separate editor. Here is how both shipped and how the trust pillar widened in two weeks.',
        date: 'May 12, 2026',
        readTime: '5 min read',
        category: 'engineering',
        featured: true,
    },
    {
        id: 'channel-agnostic-photon-spectrum',
        title: 'Your Agent Should Live in iMessage, Not Another App',
        excerpt: 'Most agent products ship a chat UI you have to install. We ship the same agent into the chat app you already keep open: iMessage shipping today, Telegram and WhatsApp ready, all behind one Photon Spectrum webhook. Here is the bridge.',
        date: 'May 11, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'sns-anchored-signer-identity',
        title: 'The .sol Name That Proves We Signed It',
        excerpt: 'Every Operator Uplift receipt is signed by an ed25519 key. We anchor that key to operatoruplift.sol on the Solana Name Service so the signer identity is human-readable, swappable, and verifiable from any blockchain explorer. Here is how the cross-check works and why the chain does the work.',
        date: 'May 9, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'one-chain-now-cross-chain-soon',
        title: 'Solana Today, Base and Ethereum Next: One Chain Now, Cross-Chain Soon',
        excerpt: 'Solana is the right chain for the demo: 400ms finality, fractional-cent gas, ed25519 receipts that publish on-chain in real time. Base and Ethereum follow once we wire the x402 buyer client. Here is why we did not start cross-chain and exactly what changes when we do.',
        date: 'May 10, 2026',
        readTime: '4 min read',
        category: 'engineering',
    },
    {
        id: 'balaji-pivot-advice',
        title: 'Balaji told me to pivot. I didn\u2019t. Here\u2019s why.',
        excerpt: 'He looked at what I was building and said walk away. I disagreed on the diagnosis, agreed on the wedge critique, and changed three things because of him. What I actually kept and what I actually cut.',
        date: 'April 17, 2026',
        readTime: '4 min read',
        category: 'announcement',
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
