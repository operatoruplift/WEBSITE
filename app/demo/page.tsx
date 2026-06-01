import { redirect } from 'next/navigation';

/**
 * /demo
 *
 * Bridges the canonical "live demo" URL to the actual demo page.
 *
 * The Loops House Challenge 02 submission (docs/LOOPS_HOUSE_SUBMISSION.md)
 * advertises `https://www.operatoruplift.com/demo` as the live-demo URL,
 * and the page that actually walks the judge through the 5-step
 * x402 + ERC-8004 flow lives at /demo/hackathon. Without this
 * redirect, a judge clicking the submission link would hit a 404
 * since /demo had no page.tsx.
 *
 * Returns a 308 (permanent) redirect so a judge's bookmarked URL
 * is also fixed once Vercel caches the redirect.
 */
export default function DemoIndexPage() {
    redirect('/demo/hackathon');
}
