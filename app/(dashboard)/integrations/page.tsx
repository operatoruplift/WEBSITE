import RetiredSurface from '@/src/components/RetiredSurface';

/**
 * /integrations route. 2026-05-22 dashboard cleanup.
 *
 * Connecting Gmail, Calendar, and iMessage was a load-bearing feature
 * of the retired AI-assistant product. The commitment-infrastructure
 * brand has no equivalent (proof of follow-through happens through
 * uploaded evidence, not via tool-execution into a Google account).
 * The route stays alive so external links still resolve and renders
 * a retired-surface card instead of the old integrations grid.
 */
export default function IntegrationsPage() {
    return (
        <RetiredSurface
            title="Integrations surface is retired."
            body="Connecting Gmail, Calendar, and iMessage was load-bearing for the prior AI-assistant product. The commitment-infrastructure product verifies follow-through through uploaded proof (photo, GPS, integration ping), not by writing into your tools. When the iOS and Android apps ship, integrations will live there."
            relatedLabel="See how verification works"
            relatedHref="/#how-it-works"
        />
    );
}
