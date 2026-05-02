import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Helpers',
    description:
        'AI helpers for the parts of your day you would rather not handle yourself. Free during beta. Try any helper in chat without signing up.',
    openGraph: {
        title: 'Helpers, Operator Uplift',
        description:
            'AI helpers for the parts of your day you would rather not handle yourself. Free during beta.',
        url: 'https://operatoruplift.com/store',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Helpers, Operator Uplift',
        description:
            'AI helpers for the parts of your day you would rather not handle yourself.',
    },
    alternates: {
        canonical: '/store',
    },
};

export default function StoreLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
