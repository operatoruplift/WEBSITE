import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of service',
    description:
        'Terms governing your use of Operator Uplift, including responsibilities, intellectual property, and limitation of liability.',
    openGraph: {
        title: 'Terms of service, Operator Uplift',
        description:
            'Terms governing your use of Operator Uplift, including responsibilities and limitation of liability.',
        url: 'https://operatoruplift.com/terms',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'Terms of service, Operator Uplift',
        description:
            'Terms governing your use of Operator Uplift, including responsibilities and limitation of liability.',
    },
    alternates: {
        canonical: '/terms',
    },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
