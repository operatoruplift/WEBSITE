import RetiredSurface from "@/src/components/RetiredSurface";

/**
 * /marketplace route. 2026-05-22 dashboard cleanup, second wave.
 *
 * Route renders the retired-surface card. External links to
 * /marketplace keep resolving so nothing 404s; the page reads as
 * deliberate retirement, not runtime error.
 */
export default function MarketplacePage() {
    return (
        <RetiredSurface
            title="Marketplace is retired."
            body="The Helpers marketplace was wired for the prior AI-assistant product. The commitment-infrastructure product has no installable extensions, the protocol itself is the surface."
        />
    );
}
