import RetiredSurface from "@/src/components/RetiredSurface";

/**
 * /settings route. 2026-05-22 dashboard cleanup, second wave.
 *
 * Route renders the retired-surface card. External links to
 * /settings keep resolving so nothing 404s; the page reads as
 * deliberate retirement, not runtime error.
 */
export default function SettingsPage() {
    return (
        <RetiredSurface
            title="Web settings are retired."
            body="Settings for the prior AI-assistant product (model preferences, integration toggles, notification rules) no longer apply. Profile + privacy controls will live in the iOS + Android apps when they ship."
        />
    );
}
