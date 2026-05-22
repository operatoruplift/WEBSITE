import RetiredSurface from '@/src/components/RetiredSurface';

/**
 * /swarm route. 2026-05-22 dashboard cleanup.
 *
 * The swarm UI hosted the retired "multi-agent debate" surface
 * (Chairman / Contrarian / Outsider roles). Commitment infrastructure
 * has a single impartial AI Game Master that adjudicates uploaded
 * proof, not a multi-agent council. Route stays alive but renders
 * the retired-surface card.
 */
export default function SwarmPage() {
    return (
        <RetiredSurface
            title="Multi-agent swarm is retired."
            body='The "LLM Council" debate UI was an experimental feature of the prior AI-assistant product. The new product uses a single impartial AI Game Master that scores uploaded proof and streams its reasoning back to you. If you disagree, you appeal to a witness or a human reviewer, not to a second model.'
            relatedLabel="How AI verification works"
            relatedHref="/#faq"
        />
    );
}
