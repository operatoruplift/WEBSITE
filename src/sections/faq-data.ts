/**
 * FAQ source-of-truth. Both the homepage FaqSection and the
 * schema.org FAQPage JSON-LD read from this list. Adding or editing
 * a question only needs an edit here.
 *
 * 2026-05-22 founder brief: "Add a short FAQ that answers: how the
 * stakes work, where the money goes when someone fails, how AI
 * verification works, and who the product is for." Four questions.
 * Plain English. No jargon. No long paragraphs.
 *
 * Earlier rewrites added supporting questions (habit-tracker compare,
 * appeal flow, crypto onboarding, privacy). Those moved to the
 * /docs/faq-style surfaces; the homepage stays at the founder-spec
 * four so a visitor can scan in one pass.
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
];
