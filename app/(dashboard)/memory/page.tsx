import RetiredSurface from "@/src/components/RetiredSurface";

/**
 * /memory route. 2026-05-22 dashboard cleanup, second wave.
 *
 * Route renders the retired-surface card. External links to
 * /memory keep resolving so nothing 404s; the page reads as
 * deliberate retirement, not runtime error.
 */
export default function MemoryPage() {
    return (
        <RetiredSurface
            title="Memory vault is retired."
            body="The memory vault stored conversation history and knowledge graphs for the prior AI-assistant product. The new product verifies follow-through through uploaded proof, not conversation memory."
        />
    );
}
