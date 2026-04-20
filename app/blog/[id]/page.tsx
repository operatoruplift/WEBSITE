'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { posts } from '../page';
import { BlogToc } from './BlogToc';

function getArticleContent(id: string) {
    const content: Record<string, React.ReactNode> = {
        'balaji-pivot-advice': (
            <div className="space-y-6">
                <p className="text-lg">Balaji looked at what I was building and told me to walk away.</p>
                <p>This is specific, so I&apos;ll be specific. I showed him Operator Uplift in March: a local-first AI operator with approval-gated tool calls and on-chain audit receipts. He gave three pieces of advice, back to back, in the order he gave them.</p>
                <p><strong>One.</strong> &quot;You&apos;re competing with Perplexity, OpenAI, Anthropic, and Google. Solo founder, no funding, walk away.&quot;</p>
                <p><strong>Two.</strong> &quot;If you stay, your wedge isn&apos;t privacy. It&apos;s a professional class that has a confidentiality obligation and no product that respects it. Lawyers. Accountants. Therapists.&quot;</p>
                <p><strong>Three.</strong> &quot;Whatever you ship, ship it on-chain. You&apos;re on Solana. Use Solana.&quot;</p>
                <p>I disagreed on point one. I agreed on point two. I was already doing point three. Here&apos;s the honest breakdown of what I kept, what I changed, and what stayed the same.</p>

                <h2>What I disagreed with</h2>
                <p>I am not competing with Perplexity or ChatGPT. Those products are vertical search and assistant chat, respectively. Operator Uplift is an OS layer: the thing that runs underneath an assistant to give it approval-gated tool access, signed receipts, and local memory. The LLM is a dependency, not the product.</p>
                <p>If you frame it as &quot;build a better ChatGPT,&quot; I should walk away. A solo founder can&apos;t beat a $100B company on model quality or inference latency. But I&apos;m not trying to. I&apos;m trying to build the trust and permissions layer they&apos;ll all eventually need.</p>
                <p>That argument either holds up or it doesn&apos;t. Balaji wasn&apos;t convinced in March. That&apos;s fair. I&apos;m building to be convincing by the Colosseum demo day on May 14.</p>

                <h2>What I agreed with and changed</h2>
                <p>He was right about the wedge. I had been pitching &quot;local AI is better for privacy&quot; as a general-purpose message. That&apos;s a weak pitch because privacy-in-general is everybody&apos;s number three concern. But privacy <em>as a statutory obligation</em> is somebody&apos;s number one concern, every single day, on pain of losing their professional license.</p>
                <p>So I cut the general privacy copy and rewrote the wedge around three professions: lawyers, accountants, therapists. The blog post on that reasoning is still up. Whether that wedge holds or needs to be retooled for consumers will be tested publicly after May 14.</p>
                <p>I also took his on-chain advice to its logical end. Every tool action on Operator Uplift now produces an ed25519-signed receipt. Every five receipts, the Merkle root is published via our Anchor <code>publish_root</code> program on Solana devnet. The receipts and the public key are independently verifiable. Judges can export a receipt and check the signature with the key from <code>/api/receipts/public-key</code> without trusting me.</p>

                <h2>What I changed that he didn&apos;t ask for</h2>
                <p>Three things changed independently of his advice, worth noting because they followed the same diagnostic.</p>
                <p><strong>Consumer-first onboarding.</strong> A professional-only wedge is too narrow for a Demo Day audience. So <code>/chat</code> is now reachable with zero signup in explicit Demo mode, with every action labeled simulated, and Real mode unlocks only when you have Google connected or an API key. That way the consumer demo and the professional product share the same UI but never fake the receipt layer.</p>
                <p><strong>Explicit capability states.</strong> The codebase now carries <code>capability_google</code>, <code>capability_key</code>, and <code>capability_real</code> as first-class server-side flags. No path produces a receipt without <code>capability_real === true</code>. No path claims real execution unless the tool actually ran.</p>
                <p><strong>Stub adapters labeled honestly.</strong> MagicBlock was on the shortlist for a faster settlement layer. We shipped the adapter interface but flagged it clearly as <em>Inactive</em> on the hackathon page because the real gateway isn&apos;t wired. No fake claims.</p>

                <h2>What I kept that he would have cut</h2>
                <p>I kept the OS-layer framing. I kept going solo. I kept Operator Uplift as the name. I kept the plan to ship a Tauri desktop wrapper that can run local Ollama. None of those are market-tested yet. They&apos;ll be tested on May 14 and in the thirty days after.</p>
                <p>I write this honestly because Balaji&apos;s critique was honest. If it turns out he was right and I&apos;m wrong, this post gets an addendum. If it turns out the wedge is narrower than professions and the real answer is consumer, the product is already built to pivot there without a rewrite. That part is deliberate.</p>
                <p>The takeaway isn&apos;t &quot;listen to smart people.&quot; The takeaway is: listen, write down exactly what they said, separate the parts you believe from the parts you don&apos;t, and change the things that deserve to change. Then ship.</p>
            </div>
        ),
        'governed-approvals': (
            <div className="space-y-6">
                <p className="text-lg">The single biggest difference between a helpful agent and a dangerous one is a human in the loop at the right moment.</p>
                <p>Most agent products fail in one of two directions. Either they ask for approval on everything, which makes them slower than doing the task yourself. Or they ask for nothing, which turns every LLM hallucination into a real-world action your inbox will hate you for.</p>
                <p>Operator Uplift takes a third path. The agent is free to read, reason, and plan. It is not free to act until a human confirms. Reads like &quot;list my calendar events for tomorrow&quot; run without asking. Writes like &quot;send this email&quot; or &quot;create this calendar event&quot; pop an approval modal with the exact payload, risk level, and one-click allow-or-deny.</p>
                <p>The modal shows: the tool being called (Calendar, Gmail, etc), the action (create event, send draft), the risk level (MEDIUM for calendar writes, HIGH for gmail sends), every parameter the agent is about to send (who, what, when), and a single primary CTA. No buried toggles, no checkboxes, no fine print. Either you approve this specific action once, or you deny it.</p>
                <p>Every approval is logged. The audit log is hashed and the Merkle root is published to Solana devnet. If the agent acts, there is proof that a human said yes.</p>
                <p>This is the opposite of how most SaaS approval flows work. You do not get to say &quot;always allow this agent to send email&quot; because a future prompt injection could turn that blanket permission into an exfiltration vector. Every action stands on its own.</p>
                <p>It is slower. On purpose. The slowness is the feature.</p>
            </div>
        ),
        'audit-trail': (
            <div className="space-y-6">
                <p className="text-lg">Every agent action in Operator Uplift is hashed, logged, and eventually published on-chain. Here is the exact pipeline.</p>
                <p><strong>Step 1 &mdash; SHA-256 hash on the client.</strong> When an agent emits a tool_use block and the user approves it, we compute a SHA-256 digest of the action payload using the Web Crypto API. The hash covers: tool name, action, params, user ID, timestamp, outcome. This is the &quot;leaf&quot; of the audit tree.</p>
                <p><strong>Step 2 &mdash; Dual write.</strong> The leaf hash plus the full action details are written to two places: localStorage for fast client-side lookup, and a server-side Supabase table (audit_entries) via an authenticated POST. Supabase is the source of truth. localStorage is a cache.</p>
                <p><strong>Step 3 &mdash; Merkle root every N actions.</strong> On every 5th action, the server computes a Merkle root over all leaf hashes since the last publication. This collapses an arbitrary number of actions into a single 32-byte commitment.</p>
                <p><strong>Step 4 &mdash; Publish on-chain.</strong> The Merkle root is passed to the Anchor publish_root instruction on our program (deployed to Solana devnet, program ID LeHntjrypUvoedo4DHdBXUNyC2gKxnRH7wzp2UE2w1P). The server wallet signs the tx. The tx signature is stored in the audit_roots Supabase table.</p>
                <p><strong>Step 5 &mdash; Verify anywhere.</strong> To prove any single action was logged at time T, you fetch the leaf from Supabase, reconstruct the Merkle proof, and check the root matches what is on-chain. The on-chain commitment makes it impossible for us to quietly rewrite history.</p>
                <p>The devnet deployment is the research-grade version. Mainnet is on the roadmap once the program is audited.</p>
            </div>
        ),
        'local-first-threat-model': (
            <div className="space-y-6">
                <p className="text-lg">Every privacy product has a threat model. Most of them hide it. Here is ours, stated honestly.</p>
                <p><strong>What we protect against:</strong></p>
                <p>(1) Cloud-side data retention. When an agent reads your calendar or drafts an email, the raw content stays on your machine or passes through our server only as transient inference. We do not store agent conversations, attachments, or the output of tool calls in a persistent cloud database.</p>
                <p>(2) Silent action. Every write happens behind an approval modal. A compromised LLM cannot send an email without you clicking Allow.</p>
                <p>(3) Tampered audit history. The on-chain Merkle root means we cannot delete or rewrite what your agent did without it being detectable.</p>
                <p>(4) Credential leaks from the client. API keys live encrypted in your browser via AES-256-GCM. Even a stolen laptop with the disk unlocked requires your passphrase to use them.</p>
                <p><strong>What we do NOT protect against (yet):</strong></p>
                <p>(1) Compromised LLM provider. If Anthropic or OpenAI is breached, and they decide to log your prompts, we cannot stop that. Use Ollama if you need full local inference.</p>
                <p>(2) Malicious browser extensions. An extension with content-script access can read anything the page can read, including your approvals modal. This is an operating-system-level problem we inherit.</p>
                <p>(3) Social engineering of the human. If you click Allow on every prompt without reading, we cannot save you. The approval modal is a chance to think, not a guaranteed safeguard.</p>
                <p>(4) Nation-state adversaries. We are a beta product. Assume a sophisticated adversary can find a flaw in our stack. For anything requiring genuine state-adversary defense, use the self-hosted Tauri build on an air-gapped machine.</p>
                <p>The point of publishing the threat model is not to claim perfection. It is to give you enough information to decide whether our guarantees match your threat profile.</p>
            </div>
        ),
        'wedge-lawyer-accountant-therapist': (
            <div className="space-y-6">
                <p className="text-lg">Lawyers, accountants, therapists. Three professions, one shared problem: every one of them has a statutory confidentiality obligation that cloud AI breaks by default.</p>
                <p>When a lawyer drafts a brief in ChatGPT, the client&apos;s name, the case details, and the legal theory enter OpenAI&apos;s servers. The ABA has guidance saying that is probably a waiver of attorney-client privilege in most jurisdictions. Most lawyers do not realize this. The ones who do have stopped using cloud AI.</p>
                <p>Accountants face the same wall. Tax documents, bank reconciliations, payroll, client financials. Any of it going into a third-party LLM is a potential SOC 2 finding and a definite IRS Circular 230 problem if the information is ever subpoenaed from the model provider.</p>
                <p>Therapists are the cleanest case. HIPAA is explicit. Patient session notes cannot sit in a system the provider has access to without a Business Associate Agreement. No major LLM provider will sign a BAA for individual practitioners.</p>
                <p>This is our wedge. Not &quot;AI is cool.&quot; Not &quot;productivity.&quot; The question &quot;how do I use AI without breaking my professional license.&quot;</p>
                <p>Operator Uplift answers it three ways. First, agents run with encrypted local memory &mdash; session notes, draft briefs, and financial records never touch a third-party cloud unless you explicitly send them. Second, every tool action requires approval &mdash; the agent can not silently forward a client email to an outside service. Third, the audit trail is on-chain &mdash; when the bar or the IRS asks &quot;what did your AI do,&quot; you have a cryptographic record.</p>
                <p>The three professions are our wedge because they share three traits: high hourly rate (they can pay $19/mo without thinking), strict confidentiality obligation (they need what we built), and a peer network (they tell each other about tools that work). One referral per customer is our growth loop.</p>
            </div>
        ),
        'why-solana-for-audit-roots': (
            <div className="space-y-6">
                <p className="text-lg">Not every blockchain is a good audit layer. We looked at several. Solana fits.</p>
                <p>An audit-root blockchain has three constraints. <strong>Finality has to be fast</strong> because the user is waiting for the action to be provable. <strong>Writes have to be cheap</strong> because we are committing a 40-byte payload every N actions, not moving tokens. <strong>Verifiability has to be public</strong> because the whole point is that anyone &mdash; not just us &mdash; can audit the history.</p>
                <p><strong>Solana finality is 400 ms.</strong> Bitcoin is 60 minutes. Ethereum is 12&ndash;15 minutes plus congestion. Neither is acceptable if the user is watching the approval modal. Solana&apos;s 400ms means the audit commitment lands before they have clicked away.</p>
                <p><strong>Solana writes are ~$0.00025.</strong> Ethereum L1 is $1&ndash;$20 per write. L2 rollups are $0.01&ndash;$0.10 and add a settlement delay. At our commit cadence (every 5 actions), Solana writes cost ~$0.00005 per audited action. At that price we never pass the cost to the user.</p>
                <p><strong>Solana verifiability is public.</strong> Every tx signature we publish can be checked by anyone on solana.fm, Solscan, or a self-run RPC node. You do not have to trust us or Solana Labs. The bytes are public.</p>
                <p>We evaluated Ethereum L2s (Base, Arbitrum). The cost math works, but the 1&ndash;2 minute wait for full finality through the bridge adds friction that is not worth the arguably-better institutional reputation of Ethereum.</p>
                <p>We evaluated Celestia for data availability. The DA layer is excellent, but we do not need data availability &mdash; we need a commitment register. Posting the Merkle root to a single Solana account is cheaper and simpler.</p>
                <p>The choice of Solana is not a crypto culture statement. It is an engineering match for the constraints.</p>
            </div>
        ),
        'why-i-built-an-ai-os': (
            <div className="space-y-6">
                <p className="text-lg">Balaji told me to pivot.</p>
                <p>He is one of the smartest people in tech. He looked at what I was building, a local-first AI operating system, and said: you are competing with Perplexity, OpenAI, Anthropic, and Google. Solo founder. No funding. Walk away.</p>
                <p>I didn't.</p>
                <p>Not because I think I am smarter than Balaji. I don't. But because the thing he was describing, competing on model quality, on inference speed, on benchmark scores, isn't what I am building.</p>
                <p>I am not building a better ChatGPT. I am building the OS layer that runs underneath all of them.</p>
                <p>Here is the distinction that matters: every AI assistant you use today is a tenant. It lives on someone else's server. It reads your data, stores your context, and makes decisions about what to remember and what to forget, on their terms, not yours. You don't own any of it.</p>
                <p>Operator Uplift is the landlord. It runs on your device. Your agents, your memory, your context, encrypted, local, yours. The model underneath can be Claude, Llama, GPT, anything. We don't compete with the models. We are the environment they run in.</p>
                <p>The pivot Balaji suggested would have made me a better-funded version of something that already exists. Staying the course means building something that doesn't.</p>
                <p>I have been homeless. I have built from nothing before. The only thing that has ever worked for me is building something I actually believe in, not something that is easier to explain to investors.</p>
                <p>So I didn't pivot. And I am still building.</p>
            </div>
        ),
        'what-93-percent-retention-looks-like': (
            <div className="space-y-6">
                <p className="text-lg">Everyone talks about retention like it is a number. It is not. It is a behavior.</p>
                <p>93% retention at 300 users means that out of every 100 people who tried Operator Uplift, 93 came back. Not because we sent them a push notification. Not because we ran a re-engagement campaign. Because the thing worked and they needed it again.</p>
                <p>Here is what that actually looks like day to day:</p>
                <p>It looks like a message at 11pm from a beta user saying "I have been using the task agent every morning for 6 weeks, it is the first thing I open." It looks like someone in our Discord asking when the calendar agent ships because they have already restructured their workflow around the assumption that it will. It looks like 2,500 community members who joined before we had a public product.</p>
                <p>High retention at small scale is the only signal that matters early. It tells you the core loop works. It tells you the people who found you are not leaving. Everything else, growth, revenue, press, is just amplification of that signal.</p>
                <p>What drives our retention isn't features. It is ownership. When your data lives on your device, when your agents remember what you told them last week without phoning home to a server, the product becomes part of your environment. You don't churn from your environment.</p>
                <p>We are not optimizing for DAU. We are optimizing for dependency. The kind that feels good because you chose it.</p>
                <p>93% is the proof that we are on the right track. The next phase is finding out what happens when 3,000 people feel that way instead of 300.</p>
            </div>
        ),
        'local-ai-vs-cloud-ai': (
            <div className="space-y-6">
                <p className="text-lg">The privacy argument for local AI is usually made wrong.</p>
                <p>Most people frame it as: "cloud AI is spying on you." That is technically true but emotionally unconvincing. Nobody thinks Google is personally reading their queries. The threat feels abstract, so the argument doesn't land.</p>
                <p>Here is the privacy case that actually matters: it is not about surveillance. It is about control.</p>
                <p>When your AI runs in the cloud, the company decides what it remembers, what it forgets, what it shares with advertisers, what it hands over to governments, and when it shuts down. You have no say. You are not a user. You are a data source.</p>
                <p>When your AI runs locally, you make those decisions. The AI serves you because it literally cannot serve anyone else.</p>
                <p>This isn't a niche concern. It is the fundamental question of who owns your cognitive infrastructure. We are at the beginning of a world where AI handles your calendar, finances, health data, relationships, work. Where that runs, on your device or someone else's server, is the most important infrastructure decision of the next decade.</p>
                <p>Local AI isn't the privacy choice. It is the ownership choice. Privacy is just what ownership feels like.</p>
            </div>
        ),
        'how-solana-changes-agent-economy': (
            <div className="space-y-6">
                <p className="text-lg">Most people think about Solana as a place to trade tokens. That is not what we are building on it for.</p>
                <p>We are building the Operator Uplift Agent Store on Solana because it is the only infrastructure that makes a permissionless agent marketplace economically viable.</p>
                <p>Here is the problem with Web2: you need a payment layer, a publishing layer, and a trust layer. Those are three separate systems, Stripe, GitHub, and your reputation. They don't talk to each other. They are all controlled by someone else. They all take a cut.</p>
                <p>On Solana, those three things collapse into one. An agent is published as a program. Payment is a transaction. Trust is the on-chain record of every interaction that agent has ever had. Permissionless, anyone can publish, anyone can pay, the history is public and auditable.</p>
                <p>What that means in practice: a developer in Lagos can publish a Yoruba language tutor agent to the store tonight. A user in Tokyo can deploy it tomorrow morning. Transaction settles in 400 milliseconds. No app store approval. No payment processor. No middleman.</p>
                <p>That is not a crypto pitch. That is a distribution model.</p>
            </div>
        ),
        'building-solo': (
            <div className="space-y-6">
                <p className="text-lg">I built Velocity Esports alone. No co-founder, no funding, no connections. Just a belief that competitive gaming was going to be bigger than anyone thought, and a willingness to do the unglamorous work.</p>
                <p>I got partnerships with Epic Games and Quest Nutrition not because I had leverage, but because I showed up prepared and didn't waste their time.</p>
                <p>Three things that carry directly into Operator Uplift:</p>
                <p><strong className="text-white">Distribution is the product.</strong> In esports, the game is the platform. I learned to think about what I was building in terms of who it moves through. The Solana Agent Store is how Operator Uplift moves.</p>
                <p><strong className="text-white">Retention beats acquisition every time.</strong> A player who plays 500 hours is worth more than 50 who play 10. 93% retention at 300 users is more valuable than 30% retention at 3,000. We build for the people who will never leave.</p>
                <p><strong className="text-white">Solo doesn't mean alone.</strong> I had no co-founder at Velocity. But I had a community. 2,500 community members before a public product isn't a vanity metric. That is the company.</p>
                <p>The hardest part of building solo isn't the workload. It is the silence. No one to tell you you are right when you are scared you are wrong. You build the conviction yourself, every day, from scratch.</p>
                <p>I have done it before. I know what it costs. And I know what it is worth.</p>
            </div>
        ),
    };

    return content[id] || (
        <div className="space-y-6">
            <p className="text-lg">{posts.find(p => p.id === id)?.excerpt}</p>
            <p>This is part of our ongoing development of Operator Uplift, the local-first AI agent platform. We ship updates constantly and share our progress transparently.</p>
            <p>Follow us on <a href="https://x.com/OperatorUplift" target="_blank" rel="noreferrer" className="text-primary hover:underline">X</a> and join our <a href="https://discord.gg/eka7hqJcAY" target="_blank" rel="noreferrer" className="text-primary hover:underline">Discord</a> for the latest updates.</p>
        </div>
    );
}

const categoryColors: Record<string, string> = {
    update: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    engineering: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/20',
    announcement: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/20',
    guide: 'text-sky-400 bg-sky-400/10 border-sky-400/20',
};

export default function BlogPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const post = posts.find(p => p.id === id);

    if (!post) {
        return (
            <div className="w-full bg-background min-h-screen">
                <Navbar currentPage="blog" />
                <div className="pt-32 pb-24 px-6 md:px-12 max-w-[800px] mx-auto text-center">
                    <h1 className="text-3xl font-medium text-white mb-4">Post not found</h1>
                    <Link href="/blog" className="text-primary hover:underline">Back to blog</Link>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="w-full bg-background min-h-screen">
            <Navbar currentPage="blog" />

            <article className="pt-32 pb-24 px-6 md:px-12 max-w-[720px] mx-auto">
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8">
                    <ArrowLeft size={14} /> Back to blog
                </Link>

                <div className="flex items-center gap-3 mb-6">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded border ${categoryColors[post.category]}`}>
                        {post.category}
                    </span>
                </div>

                <h1 className="text-3xl md:text-[2.5rem] font-medium text-white mb-6 tracking-tight leading-[1.12]">
                    {post.title}
                </h1>

                <div className="flex items-center gap-4 text-xs text-gray-500 font-mono mb-12 pb-8 border-b border-white/10">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {post.date}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime}</span>
                    <span className="flex items-center gap-1"><Tag size={12} /> {post.category}</span>
                </div>

                <div className="blog-content max-w-none text-[#D4D4D8] text-[17px] leading-[1.75]">
                    {getArticleContent(id)}
                </div>

                {/* Client-side TOC. Scans .blog-content for h2 after mount
                    and only renders at xl breakpoint. Hidden entirely if
                    the post has fewer than two h2s, no visual clutter. */}
                <BlogToc />


                {/* CTA */}
                <div className="mt-16 p-8 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
                    <h3 className="text-xl font-medium text-white mb-3">Want to try it?</h3>
                    <p className="text-gray-400 text-sm mb-6">Operator Uplift is in private beta. Join the waitlist for early access.</p>
                    <Link href="/login" className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-primary/80 transition-colors">
                        Get Early Access
                    </Link>
                </div>
            </article>

            <Footer />
        </div>
    );
}
