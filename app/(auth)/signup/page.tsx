import { redirect } from 'next/navigation';

/**
 * /signup is intentionally retired.
 *
 * The page used to call `/api/auth/signup` (Supabase Auth) and write
 * a Supabase session token to localStorage.token. The rest of the
 * app validates `localStorage.token` as a Privy JWT via
 * lib/auth.ts::verifySession, so anyone who signed up through this
 * surface ended up with a token that couldn't authenticate against
 * any gated API: chat fell into demo mode, /integrations stayed at
 * enter_phone, /api/subscription returned 401. Wave 1 risk #1.
 *
 * Hard server redirect to /login (which uses the Privy widget for
 * Google / GitHub / Wallet auth, the canonical path). The
 * consumer-copy test that navigates to /signup just lands on /login
 * and asserts the same "no Commander" rule.
 *
 * The Supabase Auth route at /api/auth/signup is left in place;
 * nothing in the app calls it once /signup itself is gone, but
 * removing the route file is a separate cleanup PR.
 */
export default function SignupPage(): never {
    redirect('/login');
}
