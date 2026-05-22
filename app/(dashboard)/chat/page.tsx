import RetiredSurface from '@/src/components/RetiredSurface';

/**
 * /chat route. 2026-05-22 dashboard cleanup.
 *
 * The chat UI was the front door of the retired AI-assistant product
 * (multi-model swap, per-turn approval modal, tool execution). The
 * commitment-infrastructure brand has no equivalent surface, so the
 * route renders a retired-surface card. External /chat links keep
 * resolving (no 404, no broken inbound traffic) and the page reads
 * as deliberate, not as a runtime error.
 */
export default function ChatPage() {
    return (
        <RetiredSurface
            title="The chat product is retired."
            body="Operator Uplift used to be a chat-driven AI assistant that drafted emails and scheduled meetings. That product was retired when the brand re-framed to commitment infrastructure on 2026-05-22. The new product is a mobile-first commitment app, with stakes, proof-based check-ins, and pooled redistribution."
            relatedLabel="See how it works"
            relatedHref="/#how-it-works"
        />
    );
}
