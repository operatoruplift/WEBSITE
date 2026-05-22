import RetiredSurface from "@/src/components/RetiredSurface";

/**
 * /onboarding route. 2026-05-22 dashboard cleanup, second wave.
 *
 * Route renders the retired-surface card. External links to
 * /onboarding keep resolving so nothing 404s; the page reads as
 * deliberate retirement, not runtime error.
 */
export default function OnboardingPage() {
    return (
        <RetiredSurface
            title="Web onboarding is retired."
            body="Onboarding moved into the mobile apps. Join the waitlist to receive your first commitment ritual when the apps go live."
        />
    );
}
