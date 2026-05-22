import RetiredSurface from '@/src/components/RetiredSurface';

/**
 * /profile route. 2026-05-22 dashboard cleanup.
 *
 * The profile surface exposed AI-assistant settings (model swap,
 * memory toggles, agent personality). The commitment-infrastructure
 * brand has no equivalent yet, the iOS + Android apps will host
 * profile settings when they ship. Route stays alive but renders the
 * retired-surface card.
 */
export default function ProfilePage() {
    return (
        <RetiredSurface
            title="Profile settings move to the app."
            body="The web profile page was wired for the prior AI-assistant product (model preferences, memory toggles, agent personality). The new product is mobile-first and profile settings will live in the iOS and Android apps when they ship. The waitlist gets first access."
        />
    );
}
