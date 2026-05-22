/**
 * FAQ source-of-truth, lifted out of FAQ.tsx so both the
 * client-side accordion AND server-rendered JSON-LD schema can
 * import the same array. Importing client-only React from a server
 * component is illegal, so the FAQ.tsx accordion can't carry this
 * data exclusively.
 *
 * When adding or editing questions, edit this file. Both the
 * homepage FAQ section and the schema.org FAQPage JSON-LD will
 * pick up the change.
 */

export interface FaqEntry {
    q: string;
    a: string;
}

export const FAQ_ITEMS: FaqEntry[] = [
    {
        q: 'What does Operator Uplift do?',
        a: 'It is commitment infrastructure for high-intent operators. You declare a commitment in your own words, stake real money on it, and an AI Game Master adjudicates every daily check-in. Honor it, your stake stays yours. Miss the mark, the stake slashes. The honor system is dead; this is what replaces it.',
    },
    {
        q: 'How is this different from a habit tracker?',
        a: 'Habit trackers trust the honor system. You self-report, push notifications nag, streaks reset, and nothing actually happens when you skip a day. Operator Uplift puts real money on the line and an AI adjudicator on the other side. Drift stops being free. Follow-through stops being optional.',
    },
    {
        q: 'What does the AI Game Master actually do?',
        a: 'It judges your check-ins. Did you do it, partially do it, or skip? Photo, GPS, integration data, or text where appropriate. Reasoning is streamed back to you so the verdict is never a black box. The point is to remove "I will be honest with myself" from the system, because most days, most operators are not.',
    },
    {
        q: 'How do the money stakes work?',
        a: 'You set the amount you can afford to lose. USDC or card. Funds sit in escrow while the commitment is active. Honor it: the money returns to you. Miss it: the stake slashes automatically and the recipient (a witness, a charity you chose, or back to the protocol) receives it. No manual chasing. No "let me just refund you this once."',
    },
    {
        q: 'Who is a witness?',
        a: 'Someone you invite to watch the commitment. Free tier gets 1 witness. Pro gets up to 5. Circle gets unlimited. Witnesses see the same dashboard you do: the streak, the check-ins, the receipts. The point is that "someone will know" is the oldest accountability mechanism and we are bringing it back, but with an AI adjudicator so you cannot lie to your friend either.',
    },
    {
        q: 'Is my data private?',
        a: 'Your commitment text and check-in notes are yours. We do not sell them. The AI provider you pick (Anthropic) processes the adjudication; no training on your data. The signed-receipt rail (Solana settlement, Filecoin + 0G mirrors) is on by default for the Pro tier and proves what happened without exposing the contents. Read the privacy policy for the full breakdown.',
    },
    {
        q: 'How much does it cost?',
        a: 'Free forever for 1 active commitment, 1 witness, no stakes. Operator Pro is $8 a month for unlimited commitments, money stakes, up to 5 witnesses, and on-chain settlement receipts. Operator Circle is $24 a month for group commitments, shared progress boards, and a coach role. Cancel any time.',
    },
    {
        q: 'What if I disagree with the AI Game Master?',
        a: 'You appeal. The check-in flow surfaces an appeal button that lets a witness or a human operator review the disputed verdict. Stakes pause while the appeal is open. If the appeal upholds you, the streak counts. If it does not, the stake slashes as decided. The protocol is strict on purpose, but it is not a black box.',
    },
    {
        q: 'I am not crypto-native. Can I still use this?',
        a: 'Yes. Card payments work for stakes the same way they work anywhere else. The on-chain settlement is plumbing under the hood; you never have to touch a wallet unless you want to. The crypto-native path is there for operators who prefer USDC and self-custody, and it is opt-in only.',
    },
];
