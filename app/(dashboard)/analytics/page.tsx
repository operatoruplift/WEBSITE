import RetiredSurface from "@/src/components/RetiredSurface";

/**
 * /analytics route. 2026-05-22 dashboard cleanup, second wave.
 *
 * Route renders the retired-surface card. External links to
 * /analytics keep resolving so nothing 404s; the page reads as
 * deliberate retirement, not runtime error.
 */
export default function AnalyticsPage() {
    return (
        <RetiredSurface
            title="Analytics dashboard is retired."
            body="The analytics surface tracked usage of the prior AI-assistant product (chat sessions, helper installs, briefing runs). The commitment-infrastructure product will surface honor-rate, streaks, and pool redistribution inside the iOS + Android apps when they ship."
        />
    );
}
