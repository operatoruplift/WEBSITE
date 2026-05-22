import RetiredSurface from "@/src/components/RetiredSurface";

/**
 * /app route. 2026-05-22 dashboard cleanup, second wave.
 *
 * Route renders the retired-surface card. External links to
 * /app keep resolving so nothing 404s; the page reads as
 * deliberate retirement, not runtime error.
 */
export default function AppPage() {
    return (
        <RetiredSurface
            title="Dashboard home is retired."
            body="The /app dashboard home was the entry point of the prior AI-assistant product. The commitment-infrastructure product is mobile-first; the equivalent home screen lives in the iOS + Android apps when they ship."
        />
    );
}
