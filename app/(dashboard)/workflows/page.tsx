import RetiredSurface from "@/src/components/RetiredSurface";

/**
 * /workflows route. 2026-05-22 dashboard cleanup, second wave.
 *
 * Route renders the retired-surface card. External links to
 * /workflows keep resolving so nothing 404s; the page reads as
 * deliberate retirement, not runtime error.
 */
export default function WorkflowsPage() {
    return (
        <RetiredSurface
            title="Workflow builder is retired."
            body="The visual workflow builder was a feature of the prior AI-assistant product. The commitment-infrastructure protocol is a single five-step loop (commit, stake, prove, verify, settle); there is no workflow graph to build."
        />
    );
}
