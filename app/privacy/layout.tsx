import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy policy',
    description:
        'How Operator Uplift handles your account data, AI provider routing, audit log, and the third parties we contract with.',
    openGraph: {
        title: 'Privacy policy, Operator Uplift',
        description:
            'How Operator Uplift handles your account data, AI provider routing, audit log, and third parties.',
        url: 'https://operatoruplift.com/privacy',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'Privacy policy, Operator Uplift',
        description:
            'How Operator Uplift handles your account data, AI provider routing, audit log, and third parties.',
    },
    alternates: {
        canonical: '/privacy',
    },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
