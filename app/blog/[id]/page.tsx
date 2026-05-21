'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import Navbar from '@/src/components/Navbar';
import Footer from '@/src/components/Footer';
import { posts } from '../posts';
import { BlogToc } from './BlogToc';

function getArticleContent(id: string) {
    const content: Record<string, React.ReactNode> = {
        'arkiv-agent-memory-you-own': (
            <div className="space-y-6">
                <p className="text-lg">Here is the problem nobody likes to talk about. Your AI assistant remembers things about you. Your tone. The people you email most. The hours you prefer to work. The day that assistant gets sold, swapped, or shut down, all of that goes too. You start over.</p>

                <p>We found a way to let you keep your memory.</p>

                <h2>What changed this week</h2>
                <p>The assistant still remembers things the same way it did yesterday. The difference is what happens to that memory when you want to leave.</p>
                <p>Today, when the assistant writes down something about you, we also save a copy on a public record nobody can quietly edit, not even us. Think of it as a notarized version of your memory. Our name is on it as the place that wrote it down. But you can take the key.</p>
                <p>If a day comes when you want your memory off our servers, you take it. The notarized copy stays, with our name as the original writer, but the control moves to you. We become read-only on your own history. You can move it, archive it, or burn it. The choice is yours.</p>

                <h2>Like a deed, not a rental</h2>
                <p>It is closer to how property works in the real world. The deed names the original builder. The current owner can do what they want with the building. We are saying out loud that we want to be the builder, not the landlord.</p>
                <p>Most assistants are the landlord. Your relationship with them is a relationship with their database. The day that database changes hands, your memory does too. We do not want that to be the deal here.</p>

                <h2>What you do not have to do</h2>
                <p>Nothing changes about how you use the assistant. You do not install anything new. You do not learn a new word. You do not pay a fee. The default experience is unchanged.</p>
                <p>The new option is opt-in. If you never want to think about it, you never have to. The day you do want your memory under your own name, the path is there.</p>

                <h2>Why now</h2>
                <p>A hackathon gave us a deadline. The brief was almost the exact pitch we have been making for receipts since last month: build something where the important data lives on a public record, not just on our servers. Receipts (proof of what the assistant did for you) already live in two public places. This week we added a third, and used it for the part that hurts the most when an AI assistant disappears, your own history with it.</p>
                <p>The interesting part was not the technology. It was finally writing down the &quot;memory is yours&quot; promise in a way that is not just a slogan.</p>

                <h2>Honest about what is live today</h2>
                <p>We are not going to tell you the page is full when it is not. The notarized copies start landing the day we flip a switch on our side. Until then, the dashboard at <a href="/arkiv">/arkiv</a> says exactly that, in plain English. No fake list, no placeholder rows. If a feature is shipped, the page reflects it. If not, the page says so.</p>
                <p>Your assistant will still default to keeping memory in our database, because that is what makes it fast. But the moment you want a memory you actually own, the path is there. Same assistant. Same tap. Just yours.</p>
            </div>
        ),
        'og-storage-second-mirror': (
            <div className="space-y-6">
                <p className="text-lg">A founder we respect sent us the 0G docs and asked which modules we should fold in. We spent an afternoon on it, almost wrote a &quot;here is why we are holding off&quot; post, then re-read what we had written and realized we had answered the wrong question.</p>

                <p>The question was not &quot;should 0G replace our Filecoin mirror.&quot; The answer to that is no, and it stays no. The right question for a hackathon is &quot;can 0G add a second public mirror on top of what we already have.&quot; That answer is yes, and shipping it took an afternoon.</p>

                <h2>What changed this week</h2>
                <p>Every signed receipt now gets pinned to <strong>two</strong> public storage networks instead of one. Filecoin (via Lighthouse) was already there from last week. 0G testnet is there now too.</p>
                <p>The two networks hold byte-identical copies of the same receipt JSON. Your <a href="/security">/security</a> page shows two clickable links per receipt: one labeled <code>filecoin:</code>, one labeled <code>0g:</code>. Either link gets you back to the same bytes we signed.</p>

                <h2>Why two networks instead of one</h2>
                <p>The honest answer: not because one was failing. Filecoin via Lighthouse works fine. We added 0G because the trust story gets meaningfully stronger when nobody can break the proof by knocking out a single storage provider.</p>
                <p>If Lighthouse changes its terms tomorrow, the Filecoin link could break. If 0G&apos;s testnet indexer goes down, the 0G link breaks. The signed bytes themselves never change, but the convenient verification path through one network could close. With two parallel networks, a judge or an auditor can pick whichever one is up.</p>
                <p>Same principle as keeping a backup of your photos in two cloud providers, except for the cryptographic proof that your assistant did what you said it did.</p>

                <h2>What did NOT change</h2>
                <p>The signed receipt is the same shape it was last week. The ed25519 signature is the same. The Solana fingerprint we publish every five receipts is the same. The <a href="/api/receipts/public-key">/api/receipts/public-key</a> endpoint returns the same key.</p>
                <p>0G Storage joined the side of the architecture that holds the bytes, not the side that signs them. Storage is provenance. Signature is authenticity. We did not move any signature work to 0G; we duplicated the public-archive step.</p>

                <h2>What you do not have to think about</h2>
                <p>You do not have to know what 0G is. You do not have to install a wallet. You do not have to pay a 0G testnet fee. Both mirrors are operational metadata we run on our side. The only place 0G is visible to you is the small <code>0g: bafyrei...</code> link next to each receipt on /security, and that link is one click away from a small JSON explanation page if you ever want to verify the bytes yourself.</p>

                <h2>The Agent ID follow-up landed too</h2>
                <p>We said this was the smaller half of the integration and that 0G Agent ID was the follow-up. That follow-up is now live. Each of our agents (Calendar, Gmail) has an entry in <code>data/og-agent-ids.json</code> that points at the 0G Foundation reference AgenticID contract on Galileo Testnet. The mint script (<code>scripts/og-agent-id-mint.mjs</code>) is in the repo; once we fund a testnet wallet, each agent gets an ERC-7857 Intelligent NFT and the chainscan link surfaces on <code>/agents/calendar.json</code> + <code>/agents/gmail.json</code>. Until then, the JSON omits the field entirely, so we never claim a tokenId we have not minted.</p>

                <h2>What we still skipped from 0G</h2>
                <p>Storage and Agent ID are shipped; the three other 0G modules (Compute, Persistent Memory, TEE Privacy) stay deferred. Decentralized GPU marketplace would break our &quot;bring your own key&quot; promise. Persistent Memory is still &quot;coming soon&quot; on their side. TEE inference privacy is a problem we already solved by not running inference ourselves.</p>
                <p>If you are a founder evaluating any of these infrastructure platforms (0G, but also the various decentralized AI / wallet / agent stacks that show up every month), the move that worked for us was: &quot;is there a smallest possible thing I can ship that adds verifiable value without rewriting my product?&quot; The answer is usually a parallel index, a second mirror, or a redundant signer. Not a stack swap.</p>

                <p>You did not buy us to learn about decentralized storage. You bought us for an assistant that drafts your email and waits for your tap. The two mirrors are part of why that tap is safe.</p>
            </div>
        ),
        'filecoin-elevenlabs-trust-stack': (
            <div className="space-y-6">
                <p className="text-lg">Your assistant sent a follow-up email last Tuesday. A year from now, the recipient disputes that the email said what you remember. Where is the proof, and who controls it?</p>

                <p>Here is what was already true before this week, and what changed.</p>

                <h2>What was already true</h2>
                <p>Every action your assistant takes (drafting an email, creating a calendar event, charging a small fee for the work) produces a small record called a receipt. That receipt has been doing three jobs for a while:</p>
                <p><strong>One.</strong> The receipt is signed with a digital key only we hold. Anyone with our matching public key can confirm the signature. If a forger tries to fake a receipt, the signature does not check out.</p>
                <p><strong>Two.</strong> Every five receipts, we compute a fingerprint of all of them and post that fingerprint to Solana. The fingerprint cannot be quietly rewritten. So if we ever tried to delete a receipt or reorder them, the chain catches it.</p>
                <p><strong>Three.</strong> The signing key is tied to <code>operatoruplift.sol</code>, a public name on Solana. You can see on a public blockchain explorer which key signs your receipts. If we ever rotate the key, the chain shows the rotation publicly.</p>

                <h2>What was missing</h2>
                <p>The receipt JSON itself, the actual bytes you would verify a signature against, only lived in our database. The Solana fingerprint catches deletions and reorderings, but it does not catch a single-receipt edit during a five-receipt window. In theory, between two fingerprint publications, we could edit one row, re-sign it, and the new signature would still verify against the same public key. That is the loophole.</p>

                <h2>What changed this week</h2>
                <p>Every receipt is now also pinned to a public storage network called Filecoin, fetchable from any IPFS gateway. The bytes live in two places at once. There is the convenient copy in our database. And there is a durable copy at a public address anyone can fetch from, no account required.</p>
                <p>The public address shows up on your <a href="/security">/security</a> page next to every receipt as a small clickable link. Click it and a public gateway returns the same bytes we signed. If we edited the record on our side, the two copies would not match. That closes the loophole.</p>

                <h2>What this means in practice</h2>
                <p>Three things, in order of how often they matter.</p>
                <p><strong>Portability.</strong> If we shut down tomorrow, your receipts do not vanish. The public copy is pinned on a network with many operators. You can show a third party what your assistant did for you without going through us.</p>
                <p><strong>Dispute resolution.</strong> If a client, a vendor, or your own bookkeeper asks &quot;did this happen?&quot;, you hand over the public link. They open it without logging in. Either it matches the story you told them or it does not.</p>
                <p><strong>Trust in the next tap.</strong> You are more willing to let an agent send an email when you know there is a tamper-evident record afterwards. The pile of primitives (signature, blockchain fingerprint, on-chain identity, public storage) is not for show. It is so the next time the assistant asks to send something, the &quot;yes&quot; feels safe.</p>

                <h2>Why we waited</h2>
                <p>Two weeks ago we said public storage was not in scope yet. The honest reason was that we wanted to ship it well or not at all. Half-wired public storage would have been worse than none. It works now because the full round trip works: you tap, the action runs, the receipt signs, the public copy lands, the link appears on your page. If any link in the chain breaks, the link stays hidden until it works again. We never claim it is there when it is not.</p>

                <h2>A footnote on the demo voice</h2>
                <p>The narration in our latest product video was made with the same AI voice provider you can use through us. This is a marketing note, not a product pillar. We mention it because we have a rule that anything in our marketing that looks like a capability should be a real one we use ourselves, not a stage prop. The voice is one example. The receipts are the bigger one.</p>
            </div>
        ),
        'channel-agnostic-photon-spectrum': (
            <div className="space-y-6">
                <p className="text-lg">You are standing in line for coffee, replying to a friend in iMessage. One row down in the same thread list is your assistant. You tap into the thread, type &quot;remind me to email Alex about the quote tomorrow morning,&quot; and put your phone away. At nine the next morning, a reminder hits your screen and a draft is already waiting in your inbox.</p>

                <p>The pitch every other AI assistant makes is &quot;download our app.&quot; The pitch we make is &quot;you already have an app for talking to people. We put the assistant there too.&quot;</p>

                <h2>iMessage is shipping today</h2>
                <p>Connect your phone number once on the integrations page. After that, any message you send to our agent number routes through the same approval flow you would get on the web. You ask in iMessage. The assistant drafts. You tap yes or no. If yes, the action runs on your real Gmail or Google Calendar. If no, nothing happens.</p>
                <p>Two examples we use almost every day.</p>
                <p><strong>Inbox triage from the couch.</strong> &quot;Draft replies to my last three emails, ask me before sending.&quot; Three drafts come back as separate texts. You tap yes on the ones that read right, no on the ones that need work.</p>
                <p><strong>Calendar from the road.</strong> &quot;Block out tomorrow afternoon for deep work and send Alex a tentative for 3pm.&quot; You get a confirmation message. Tap yes. The event is on your calendar before you cross the next intersection.</p>

                <h2>Telegram and WhatsApp are right behind</h2>
                <p>The assistant does not actually know which app you are texting from. It only knows the words you sent and your verified number. That means once iMessage works, Telegram and WhatsApp are mostly a switch we flip when we are confident they hold up under real traffic. We label them ready instead of shipping today because we do not want to claim something until you can actually use it. The day you can, the label moves.</p>

                <h2>What we deliberately do not do</h2>
                <p>We do not read your iMessage history. We do not see the people you talk to. We do not store the contents of the conversation outside of the messages you direct at our assistant. The privacy boundary is the same as any other contact in your phone.</p>
                <p>We also do not promise channels we have not finished. Slack and Discord are not on our marketing because we have not wired the full round trip on either yet. When we do, they show up. Until then, they do not.</p>

                <h2>Why this matters more than it sounds</h2>
                <p>The hard part of an assistant is not the AI. It is the friction of remembering to use it. Every new app you have to open is a place the habit dies. Putting the assistant in the app you already check is what turns it from a tool you tried into a tool you actually use.</p>
                <p>You did not need another app on your home screen. You needed a way to get the inbox out of the way before your day starts. iMessage is where you live anyway. The assistant lives there now.</p>
            </div>
        ),
        'sns-anchored-signer-identity': (
            <div className="space-y-6">
                <p className="text-lg">Imagine someone forwards you an Operator Uplift receipt and says &quot;your assistant sent this to me six months ago.&quot; You want to confirm the receipt is real and was signed by us, not by someone pretending. Here is how you can do that without needing to trust our website at all.</p>

                <h2>Receipts are signed with a key. The key is published in public.</h2>
                <p>Every receipt your assistant produces carries a digital signature. The signature is made with a private key only we hold. To check the signature, you need our matching public key.</p>
                <p>The convenient place to find it is our website. Click a button, the key comes back, the signature checks out. That works, but it requires trusting that our website is telling the truth about which key is ours.</p>
                <p>The durable place is a public blockchain. We own a public name on Solana, <code>operatoruplift.sol</code>. It works the same way an internet domain works, except the registry lives on a public chain instead of a private company database. The name maps to a single owner address, and that owner address matches the key we use to sign your receipts.</p>

                <h2>Why this is useful for you</h2>
                <p>Three reasons, simplest first.</p>
                <p><strong>You can verify a receipt without our website.</strong> Open any Solana blockchain explorer. Look up <code>operatoruplift.sol</code>. Read the owner address. That is the same key our receipts are signed with. If a forger tries to sign a fake receipt with a different key, the forgery does not check out.</p>
                <p><strong>You can verify a receipt years from now.</strong> Websites change. Companies pivot. Blockchains keep the same record forever. If you keep a receipt on disk and check it in 2030, the chain still tells you the public key our name was bound to at that time.</p>
                <p><strong>You can tell when the key has changed.</strong> Companies do rotate signing keys, for security or after staff turnover. When that happens, we update the chain too, and the update is public. Anyone watching can see the new key replaced the old one. The rotation is not silent.</p>

                <h2>What this looks like on your /security page</h2>
                <p>You do not have to think about any of this to use the product. Open <a href="/security">/security</a>, you see your receipts. Under the header there is a small &quot;Signed by operatoruplift.sol&quot; line with a link. Click it and the on-chain record opens. If you are not curious, the assistant works the same way it always did. The point is that the option to check is always one click away, not buried in a developer manual.</p>

                <h2>Why a blockchain at all</h2>
                <p>Two reasons we keep coming back to. The first is that no one company owns a blockchain, so nobody can rewrite the record after the fact. The second is that the receipt itself, the chain entry, and the public storage all sit in different places, owned by different people. To fake your assistant doing something it did not do, a bad actor would have to break all three independently. We made that hard on purpose.</p>
                <p>You did not buy us to learn about cryptography. You bought an assistant that does the parts of your day you would rather not do. The chain is there so the assistant feels safe to trust when you are not watching.</p>
            </div>
        ),
        'one-chain-now-cross-chain-soon': (
            <div className="space-y-6">
                <p className="text-lg">You sign up, you connect Gmail, you ask the assistant to draft a reply. The reply comes back, you tap yes, the email sends. At no point did anyone ask you to install a wallet, copy a long string of characters, or sign a transaction. That is on purpose. Here is what is happening behind the scenes and why it stays out of your way.</p>

                <h2>What the chain is doing while you do nothing</h2>
                <p>Every time your assistant takes an action (drafting an email, creating a calendar event, charging a tiny fee for the work) three things happen.</p>
                <p>One, the assistant produces a receipt: a small record of what just happened.</p>
                <p>Two, we sign the receipt so anyone can later check it came from us.</p>
                <p>Three, the chain records that the receipt existed. Not the contents, not who the email went to, just a tiny proof that says &quot;this receipt happened, in this order, on this date.&quot;</p>
                <p>That third step is what a blockchain is good at. It is a stack of dated entries that nobody can quietly rearrange afterwards. We use it for one job: ordering. Nothing else.</p>

                <h2>Why you do not have to think about it</h2>
                <p>Because we picked a chain where the housekeeping is fast and the per-entry cost is a tiny fraction of a cent. We pay the fee. You never see it. The record settles in less than a second, so even if you are watching the approval modal, the entry is done before you blink.</p>
                <p>The alternative is a chain where each entry costs a dollar or more and takes a minute to confirm. That works for moving large sums of money. It does not work for &quot;the assistant just sent a follow-up.&quot; You would feel the delay and the cost.</p>

                <h2>Other chains are coming. You will still not see them.</h2>
                <p>Some users care which blockchain a record lives on. Enterprise buyers ask about Ethereum because that is where most of their other on-chain commitments sit. We will add Ethereum and Base next. The assistant does not change. The approval flow does not change. The only thing that changes is a small badge on each receipt that says which chain it landed on.</p>
                <p>We did not start with multiple chains because shipping one chain well is more useful than shipping three chains halfway. The trust story is only as strong as the weakest link. The chain we use today works end-to-end. The others come once that link is as strong.</p>

                <h2>What the chain is not</h2>
                <p>The chain is not where your data lives. Your emails stay in Gmail. Your calendar stays in Google Calendar. Your conversations with the assistant stay in your browser. The chain only sees a small fingerprint of each action, never the contents. If you assumed your inbox was being copied to a blockchain, it is not. That would be a privacy disaster.</p>
                <p>The chain is also not where you pay. The per-action fees we charge use a stable digital dollar, but we pull from a small deposit you make once. You never approve a transaction per email or per event. The deposit covers the work for as long as it lasts, then we ask you to refill.</p>

                <h2>The honest version</h2>
                <p>If you have ever tried a crypto product and given up because you had to learn the chain to use the app, that was somebody treating the chain as a feature instead of a tool. We treat it as a tool. You hire an assistant. The assistant gets the work done. The chain quietly proves it actually happened. None of those three sentences require you to know what a blockchain is, and that is the whole point.</p>
            </div>
        ),
        'balaji-pivot-advice': (
            <div className="space-y-6">
                <p className="text-lg">Balaji looked at what I was building and told me to walk away.</p>

                <p>It was March. I showed him Operator Uplift: an AI assistant that drafts your email, schedules your meetings, and waits for your tap before it sends. Five minutes in, he gave me three pieces of advice, in the order they came out.</p>

                <p><strong>One.</strong> Walk away. Solo founder, no funding, trying to beat Perplexity and OpenAI. He told me I was going to lose.</p>

                <p><strong>Two.</strong> If you stay, do not pitch &quot;privacy.&quot; Find a profession that <em>has to</em> care, where a leak ends a career. Lawyers. Accountants. Therapists.</p>

                <p><strong>Three.</strong> Whatever you ship, put it on-chain. You are on Solana. Use Solana.</p>

                <p>I disagreed with one of them. I agreed with one. The third I was already doing. Here is what changed, in plain English.</p>

                <h2>The one I disagreed with</h2>

                <p>I am not building a better ChatGPT. I never was. The piece I am building is the layer underneath: the thing that asks before it sends, signs a receipt after, and keeps your history under your name instead of theirs. The model in the middle is replaceable.</p>

                <p>If you frame it as &quot;solo founder fighting OpenAI on model quality,&quot; sure, walk away. But that is not the fight. The fight is whether the next AI assistant you use leaves you with proof of what it did, or just leaves you trusting a screenshot.</p>

                <p>Balaji was not convinced. That is fair. I am building so the work itself is the argument.</p>

                <h2>The one I agreed with</h2>

                <p>He was right about the pitch. &quot;Privacy is better&quot; lands flat because privacy is most people&apos;s third or fourth concern. But when privacy is the difference between keeping a license and losing one, it stops being optional. A lawyer cannot paste a client file into ChatGPT without a serious problem. A therapist cannot put a session note in the cloud without a HIPAA conversation. An accountant cannot share a tax return with a model that might train on it.</p>

                <p>So I cut the general &quot;privacy is good&quot; copy and pointed the product at the three professions where the answer to &quot;why does this matter&quot; writes itself. The longer version of that argument is in a separate post.</p>

                <h2>The one I was already doing</h2>

                <p>The on-chain part. Every action the assistant takes produces a signed record. Every five records, a fingerprint of all of them lands on a public chain. If we ever tried to quietly rewrite history, the chain would catch it.</p>

                <p>The point was never to be a crypto product. The point was that &quot;trust me&quot; is not a feature; a record anyone can verify is.</p>

                <h2>What I kept that he would have cut</h2>

                <p>I kept going solo. I kept the name. I kept the framing that the assistant&apos;s job is to wait for your tap, not to be smarter than the room. None of those are proven yet. They get tested every week by every user who decides whether to come back the next day.</p>

                <p>The takeaway is not &quot;listen to smart people.&quot; The takeaway is: listen, write down exactly what they said, separate the parts you believe from the parts you do not, and change the things that deserve to change. Then ship the rest.</p>
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
                <p className="text-lg">Most apps ask you to trust their database. Ours leaves a trail anyone can check, even us.</p>

                <p>Here is what that means in plain English.</p>

                <h2>Every tap leaves a record</h2>
                <p>When you tap Approve on a draft email or a calendar event, the assistant writes down what just happened: which tool, what was sent, when, who asked, and what came back. That record gets a fingerprint nobody can forge. The fingerprint is small. The record is small. We keep both.</p>

                <h2>Every five records, a receipt of receipts</h2>
                <p>Every fifth action, we take all the fingerprints from the last five and roll them into one. Then we post that one to a public chain. The public chain is not ours. It costs us a fraction of a cent to post. We cannot quietly remove it.</p>
                <p>Why this matters: if we ever tried to rewrite history by editing one of your earlier actions, the rolled-up fingerprint would no longer match the new edits. The chain catches the lie.</p>

                <h2>Every record gets a public backup</h2>
                <p>Beyond the chain, each record also lands on a public storage network the day it is signed. Anyone can fetch the same record from that network and compare it to what we have. If they differ, somebody changed something.</p>
                <p>You can see these backups on your <a href="/security">security page</a>. The small <code>filecoin:</code> and <code>0g:</code> links next to each row open the public copy.</p>

                <h2>Why we built it this way</h2>
                <p>The simplest version of trust is "we promise." That breaks the day promises change hands. Companies get acquired. Founders leave. Databases get migrated.</p>
                <p>The version that survives those days is a record on a network we do not own. So that is what we built.</p>

                <p>This is the same plumbing that lets you prove a year from now that the email your assistant sent really did go out on the date you remember. Nothing fancier than that, but nothing weaker either.</p>
            </div>
        ),
        'local-first-threat-model': (
            <div className="space-y-6">
                <p className="text-lg">Every privacy product has a threat model. Most of them hide it. Here is ours, stated honestly.</p>
                <p><strong>What we protect against:</strong></p>
                <p>(1) Cloud-side data retention. The web app routes prompts through whichever AI provider you pick per turn (Anthropic, OpenAI, Google, xAI, DeepSeek). Beyond that hop, we do not store agent conversations, tool-call outputs, or attachment bodies in our own database. Chat sessions and memory live in your browser&apos;s localStorage. The desktop+Ollama path on the roadmap removes the provider hop entirely; until then, the trade-off is the one each provider documents.</p>
                <p>(2) Silent action. Every write happens behind an approval modal. A compromised LLM cannot send an email without you clicking Allow.</p>
                <p>(3) Tampered audit history. Two layers stack here. The on-chain Merkle root means we cannot delete or rewrite what your agent did without it being detectable. The Filecoin mirror means we cannot quietly edit a single receipt either, since the bytes are pinned to a public IPFS gateway and anyone can fetch the same JSON we signed.</p>
                <p>(4) Credential leaks from the client. Settings &rarr; Security exposes a passphrase setup that hashes a key via Web Crypto AES-256-GCM. The encrypt/decrypt round-trip is wired up but is not yet called by the chat session and memory persistence paths, so today the data sits in localStorage as plain JSON. We disclose this state in the Settings UI itself rather than in marketing copy. Encrypt-at-rest ships once those flows call secureStore/secureRetrieve.</p>
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
                <p>Operator Uplift answers it three ways. First, the only data that reaches a third-party AI provider is the prompt you send for that turn, against the provider you pick. We do not silently route content through a model you did not choose. Second, every tool action requires approval, the agent can not silently forward a client email to an outside service. Third, the audit trail is on-chain, when the bar or the IRS asks &quot;what did your AI do,&quot; you have a cryptographic record. The desktop+Ollama path on the roadmap removes the provider hop entirely for users who need full on-device inference.</p>
                <p>The three professions are our wedge because they share three traits: high hourly rate (they can pay $50/mo without thinking), strict confidentiality obligation (they need what we built), and a peer network (they tell each other about tools that work). One referral per customer is our growth loop.</p>
            </div>
        ),
        'why-solana-for-audit-roots': (
            <div className="space-y-6">
                <p className="text-lg">We post a fingerprint of every five actions on a public chain so nobody can quietly rewrite history, not even us. People ask why we picked the chain we picked. Here is the short answer.</p>

                <h2>What we actually need</h2>
                <p>Three things matter for a chain we use as a tamper-evident notebook.</p>
                <p><strong>It has to be fast.</strong> The user just tapped Approve. If the proof takes ten minutes to land, the user is gone by then.</p>
                <p><strong>It has to be cheap.</strong> We post a tiny fingerprint, not money. If posting costs a dollar, we cannot afford to do it for every five actions across every user.</p>
                <p><strong>Anyone has to be able to check it.</strong> If only we can check our own notebook, the whole point is gone.</p>

                <h2>Why Solana fits</h2>
                <p>The chain we use confirms in under half a second. Bitcoin takes an hour. Ethereum takes ten or fifteen minutes. Half a second means the user is still on the page when the proof lands.</p>
                <p>Posting costs a fraction of a cent. We never pass that to you. Reads are free.</p>
                <p>Anyone can look up what we posted on a public explorer. You do not have to trust us. You do not have to trust the chain we picked. You can read the same bytes we did.</p>

                <h2>What we looked at and did not pick</h2>
                <p>We looked at the Ethereum side of the world. The price math works on the newer Ethereum networks, but the wait time still adds friction the user feels.</p>
                <p>We looked at a different kind of chain built just for storing data. That one is excellent for what it does. We did not need that much. A small bookmark on a fast cheap chain was enough.</p>

                <p>This is not a culture statement about which chain is best. It is the chain that matched what we actually needed.</p>
            </div>
        ),
        'why-i-built-an-ai-os': (
            <div className="space-y-6">
                <p className="text-lg">Balaji told me to pivot.</p>
                <p>He is one of the smartest people in tech. He looked at what I was building, an AI operating layer with approval-gated tool access and a local-first roadmap, and said: you are competing with Perplexity, OpenAI, Anthropic, and Google. Solo founder. No funding. Walk away.</p>
                <p>I didn&apos;t.</p>
                <p>Not because I think I am smarter than Balaji. I don&apos;t. But because the thing he was describing, competing on model quality, on inference speed, on benchmark scores, isn&apos;t what I am building.</p>
                <p>I am not building a better ChatGPT. I am building the OS layer that runs underneath all of them.</p>
                <p>Here is the distinction that matters: every AI assistant you use today is a tenant. It lives on someone else&apos;s server. It reads your data, stores your context, and makes decisions about what to remember and what to forget, on their terms, not yours. You don&apos;t own any of it.</p>
                <p>Operator Uplift is the landlord. The web app today is approval-gated: every tool call, every email, every booking pauses for your tap and emits a signed receipt. The desktop build on the roadmap pulls inference local via Ollama so even the prompt never leaves your machine. The model underneath can be Claude, Llama, GPT, anything. We don&apos;t compete with the models. We are the environment they run in, with the trust and audit primitives the cloud assistants leave out.</p>
                <p>The pivot Balaji suggested would have made me a better-funded version of something that already exists. Staying the course means building something that doesn&apos;t.</p>
                <p>I have been homeless. I have built from nothing before. The only thing that has ever worked for me is building something I actually believe in, not something that is easier to explain to investors.</p>
                <p>So I didn&apos;t pivot. And I am still building.</p>
            </div>
        ),
        'what-93-percent-retention-looks-like': (
            <div className="space-y-6">
                <p className="text-lg">Everyone talks about retention like it is a number. It is not. It is a behavior.</p>
                <p>93% retention at 300 users means that out of every 100 people who tried Operator Uplift, 93 came back. Not because we sent them a push notification. Not because we ran a re-engagement campaign. Because the thing worked and they needed it again.</p>
                <p>Here is what that actually looks like day to day:</p>
                <p>It looks like a message at 11pm from a beta user saying &quot;I have been using the task agent every morning for 6 weeks, it is the first thing I open.&quot; It looks like someone in our Discord asking when the calendar agent ships because they have already restructured their workflow around the assumption that it will. It looks like 2,500 community members who joined before we had a public product.</p>
                <p>High retention at small scale is the only signal that matters early. It tells you the core loop works. It tells you the people who found you are not leaving. Everything else, growth, revenue, press, is just amplification of that signal.</p>
                <p>What drives our retention isn&apos;t features. It is the trust loop. Approval before every action and a signed receipt afterward means people stop second-guessing what their assistant did, they can scroll back and verify. The product becomes part of your routine because it does not surprise you. You don&apos;t churn from a tool that never embarrasses you.</p>
                <p>We are not optimizing for DAU. We are optimizing for dependency. The kind that feels good because you chose it.</p>
                <p>93% is the proof that we are on the right track. The next phase is finding out what happens when 3,000 people feel that way instead of 300.</p>
            </div>
        ),
        'local-ai-vs-cloud-ai': (
            <div className="space-y-6">
                <p className="text-lg">The privacy argument for local AI is usually made wrong.</p>
                <p>Most people frame it as: &quot;cloud AI is spying on you.&quot; That is technically true but emotionally unconvincing. Nobody thinks Google is personally reading their queries. The threat feels abstract, so the argument doesn&apos;t land.</p>
                <p>Here is the privacy case that actually matters: it is not about surveillance. It is about control.</p>
                <p>When your AI runs in the cloud, the company decides what it remembers, what it forgets, what it shares with advertisers, what it hands over to governments, and when it shuts down. You have no say. You are not a user. You are a data source.</p>
                <p>When your AI runs locally, you make those decisions. The AI serves you because it literally cannot serve anyone else.</p>
                <p>This isn&apos;t a niche concern. It is the fundamental question of who owns your cognitive infrastructure. We are at the beginning of a world where AI handles your calendar, finances, health data, relationships, work. Where that runs, on your device or someone else&apos;s server, is the most important infrastructure decision of the next decade.</p>
                <p>Local AI isn&apos;t the privacy choice. It is the ownership choice. Privacy is just what ownership feels like.</p>
            </div>
        ),
        'how-solana-changes-agent-economy': (
            <div className="space-y-6">
                <p className="text-lg">Most people think of the chain we use as a place to trade tokens. That is not what we use it for.</p>
                <p>We use it because three things that are normally separate finally fit into one.</p>
                <p>Today, if you want to publish an AI assistant other people can use, you need three different companies. One to handle payment (Stripe). One to host the code (GitHub). One to vouch that the assistant is real and works (your own reputation, or a marketplace's blessing). None of these three talk to each other. All of them take a cut. All of them can decide tomorrow that you do not get to be on the list anymore.</p>
                <p>On a public chain, those three things become one. Publishing the assistant is one step. Paying for it is another step. The history of who used it, what it did, and whether it worked, is the chain itself. Anyone can publish. Anyone can pay. Nobody has to ask permission.</p>
                <p>What that means in practice: a developer in Lagos can publish a Yoruba language tutor agent to the store tonight. A user in Tokyo can deploy it tomorrow morning. Transaction settles in 400 milliseconds. No app store approval. No payment processor. No middleman.</p>
                <p>That is not a crypto pitch. That is a distribution model.</p>
            </div>
        ),
        'building-solo': (
            <div className="space-y-6">
                <p className="text-lg">I built Velocity Esports alone. No co-founder, no funding, no connections. Just a belief that competitive gaming was going to be bigger than anyone thought, and a willingness to do the unglamorous work.</p>
                <p>I got partnerships with Epic Games and Quest Nutrition not because I had leverage, but because I showed up prepared and didn&apos;t waste their time.</p>
                <p>Three things that carry directly into Operator Uplift:</p>
                <p><strong className="text-white">Distribution is the product.</strong> In esports, the game is the platform. I learned to think about what I was building in terms of who it moves through. The Solana Agent Store is how Operator Uplift moves.</p>
                <p><strong className="text-white">Retention beats acquisition every time.</strong> A player who plays 500 hours is worth more than 50 who play 10. 93% retention at 300 users is more valuable than 30% retention at 3,000. We build for the people who will never leave.</p>
                <p><strong className="text-white">Solo doesn&apos;t mean alone.</strong> I had no co-founder at Velocity. But I had a community. 2,500 community members before a public product isn&apos;t a vanity metric. That is the company.</p>
                <p>The hardest part of building solo isn&apos;t the workload. It is the silence. No one to tell you you are right when you are scared you are wrong. You build the conviction yourself, every day, from scratch.</p>
                <p>I have done it before. I know what it costs. And I know what it is worth.</p>
            </div>
        ),
    };

    return content[id] || (
        <div className="space-y-6">
            <p className="text-lg">{posts.find(p => p.id === id)?.excerpt}</p>
            <p>This is part of our ongoing development of Operator Uplift, the approval-gated AI agent platform with a local-first desktop build on the roadmap. We ship updates constantly and share our progress transparently.</p>
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
            <div className="theme-light w-full bg-background min-h-screen">
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
        <div className="theme-light w-full bg-background min-h-screen">
            <Navbar currentPage="blog" />

            <article className="pt-32 pb-24 px-6 md:px-12 max-w-[720px] mx-auto">
                <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8">
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
                    <p className="text-gray-400 text-sm mb-6">Operator Uplift is in private beta. Join the waitlist and we&apos;ll let you in.</p>
                    <Link href="/login" className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-primary/80 transition-colors">
                        Try it free
                    </Link>
                </div>
            </article>

            <Footer />
        </div>
    );
}
