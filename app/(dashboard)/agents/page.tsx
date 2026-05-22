import RetiredSurface from "@/src/components/RetiredSurface";

/**
 * /agents route. 2026-05-22 dashboard cleanup, second wave.
 *
 * Route renders the retired-surface card. External links to
 * /agents keep resolving so nothing 404s; the page reads as
 * deliberate retirement, not runtime error.
 */
export default function AgentsPage() {
    return (
        <RetiredSurface
            title="Agents marketplace is retired."
            body="The Helpers / Agents marketplace was load-bearing for the prior AI-assistant product. The commitment-infrastructure product has a single impartial AI Game Master that adjudicates uploaded proof, not a marketplace of installable agents."
        />
    );
}
