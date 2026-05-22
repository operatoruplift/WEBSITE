import RetiredSurface from '@/src/components/RetiredSurface';

/**
 * /security route. 2026-05-22 dashboard cleanup.
 *
 * The security page surfaced signed receipts for the retired
 * AI-assistant tool executions (Gmail draft, Calendar create). The
 * trust-stack plumbing is intact (Solana audit roots, Filecoin + 0G
 * mirrors) and supports the commitment-infrastructure brand, but the
 * end-user surface is no longer relevant on the web today, every
 * verdict is rendered inside the mobile app when it ships.
 *
 * For the judge-facing verifier cookbook, see /demo/hackathon.
 */
export default function SecurityPage() {
    return (
        <RetiredSurface
            title="Signed receipts moved to the apps."
            body="Every check-in produces an ed25519-signed receipt mirrored to Filecoin and 0G Storage and committed via Merkle root to Solana devnet. The verifier cookbook lives at /demo/hackathon. The end-user view of your own receipts will surface in the iOS and Android apps when they ship."
            relatedLabel="Verifier cookbook"
            relatedHref="/demo/hackathon"
        />
    );
}
