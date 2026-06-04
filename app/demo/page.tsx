import { redirect } from 'next/navigation';

/**
 * /demo
 *
 * Bridges the canonical "live demo" URL to the actual judge
 * walkthrough at /demo/hackathon. /demo is the short URL judges
 * and skeptics get pointed to from the deck, outbound DMs, and
 * prior hackathon submissions; preserving it as a 308 means those
 * inbound links keep working forever.
 */
export default function DemoIndexPage() {
    redirect('/demo/hackathon');
}
