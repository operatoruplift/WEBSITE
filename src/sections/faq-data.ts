/**
 * FAQ source-of-truth. Both the homepage FaqSection and the
 * schema.org FAQPage JSON-LD read from this list. Adding or editing
 * a question only needs an edit here.
 *
 * 2026-05-22 rewrite (pooled-stakes brand update):
 *   The four anchor questions come from the founder's brand spec
 *   (how stakes work, where the money goes when someone fails, how
 *   AI verification works, who the product is for). Supporting
 *   questions follow, no jargon, no long paragraphs.
 */

export interface FaqEntry {
    q: string;
    a: string;
}

export const FAQ_ITEMS: FaqEntry[] = [
    {
        q: 'How do the stakes work?',
        a: 'You set the amount you can afford to lose. USDC or card. Funds sit in escrow while the commitment is active. Honor the commitment and the money returns to you. Miss it and the stake is redistributed automatically. No manual chasing. No "let me just refund you this once."',
    },
    {
        q: 'Where does the money go when someone fails?',
        a: 'Failed stakes are pooled and redistributed to other operators who kept their word during the same period. A small protocol fee covers operations (verification compute, settlement gas, support). The company does not profit from your failure; the people who actually showed up do.',
    },
    {
        q: 'How does AI verification work?',
        a: 'When you check in, you upload proof: a photo, GPS data, an integration ping (Strava, GitHub, Calendar), or a short note where appropriate. An impartial AI Game Master scores the evidence and streams reasoning back to you. You see why it judged the way it judged. If you disagree, you appeal to a witness or a human reviewer.',
    },
    {
        q: 'Who is this for?',
        a: 'Anyone who needs trusted follow-through and is tired of trusting themselves. People building habits (running, language learning, no alcohol). Freelancers and creators who promise delivery dates. Service providers and operators who need a track record clients can verify. You do not need to be crypto-native, card payments work the same way.',
    },
    {
        q: 'How is this different from a habit tracker?',
        a: 'Habit trackers measure what you already did and trust you to self-report. We make the commitment itself real, with money on the line and an AI on the other side of the check-in. The tracking is a side effect of being on the hook. Drift stops being free.',
    },
    {
        q: 'What if I disagree with the AI Game Master?',
        a: 'You appeal. The check-in flow surfaces an appeal button that routes the disputed verdict to a witness or a human reviewer. The stake pauses while the appeal is open. If the appeal upholds you, the streak counts. If not, the stake settles as decided.',
    },
    {
        q: 'I am not crypto-native. Can I still use this?',
        a: 'Yes. Card payments work for stakes the same way they work anywhere else. The on-chain settlement is plumbing under the hood; you never have to touch a wallet unless you want to.',
    },
    {
        q: 'Is my data private?',
        a: 'Your commitment text and proof uploads are yours. We do not sell them. The AI provider you pick processes verification with no training on your data. The signed-receipt rail (Solana settlement) proves what happened without exposing the contents.',
    },
];
