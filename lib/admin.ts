/**
 * Admin authorization helper.
 *
 * The /admin dashboard surfaces operator-only data (waitlist entries,
 * blog drafts, analytics). It must never be accessible to general
 * users, even ones with active Pro subscriptions.
 *
 * Authorization model:
 *   - Caller must have a verified Privy session (handled by
 *     verifySession() in lib/auth.ts).
 *   - Caller's email must appear in PAYWALL_BYPASS_EMAILS (the same
 *     allowlist used by /dev/reliability + /settings/part2-runner).
 *
 * Returning false (rather than throwing) lets routes decide how to
 * respond: API routes return 403; pages call notFound() so /admin
 * doesn't even confirm the route exists to non-admins.
 */
import { getUserEmail } from './auth';

/**
 * Reads PAYWALL_BYPASS_EMAILS and returns the lowercased allowlist.
 * Returns an empty array if the env var is unset or empty (effectively
 * locks /admin out completely until configured).
 */
export function adminEmails(): string[] {
    const raw = process.env.PAYWALL_BYPASS_EMAILS || '';
    return raw
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
}

/**
 * Returns true if the given verified user is on the admin allowlist.
 * Looks up email from Privy by userId. Non-admins receive false
 * (no error) so callers can render 404 instead of 403, hiding the
 * existence of the admin surface.
 */
export async function isAdmin(userId: string): Promise<boolean> {
    const allowed = adminEmails();
    if (allowed.length === 0) return false;
    const email = await getUserEmail(userId);
    if (!email) return false;
    return allowed.includes(email.toLowerCase());
}
