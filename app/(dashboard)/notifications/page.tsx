import RetiredSurface from "@/src/components/RetiredSurface";

/**
 * /notifications route. 2026-05-22 dashboard cleanup, second wave.
 *
 * Route renders the retired-surface card. External links to
 * /notifications keep resolving so nothing 404s; the page reads as
 * deliberate retirement, not runtime error.
 */
export default function NotificationsPage() {
    return (
        <RetiredSurface
            title="Notifications inbox is retired."
            body="The notifications inbox surfaced agent-fired events from the prior AI-assistant product. Check-in reminders and verdict notifications will live in the iOS + Android apps when they ship."
        />
    );
}
