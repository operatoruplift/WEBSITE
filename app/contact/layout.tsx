import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact',
    description:
        'Talk to the Operator Uplift team. WhatsApp, email, calendar, X, Discord, or LinkedIn, pick the one you prefer.',
    openGraph: {
        title: 'Contact, Operator Uplift',
        description:
            'Talk to the Operator Uplift team. Pick whichever channel you prefer.',
        url: 'https://operatoruplift.com/contact',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Contact, Operator Uplift',
        description:
            'Talk to the Operator Uplift team. Pick whichever channel you prefer.',
    },
    alternates: {
        canonical: '/contact',
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
