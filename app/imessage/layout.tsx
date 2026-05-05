import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'iMessage agent',
    description:
        'Text Operator Uplift like a friend. Claude Haiku replies in 2 to 4 seconds. Honors STOP and HELP. No app to install.',
    openGraph: {
        title: 'iMessage agent, Operator Uplift',
        description:
            'Text the bot from your iPhone. Claude Haiku replies in 2 to 4 seconds.',
        url: 'https://operatoruplift.com/imessage',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'iMessage agent, Operator Uplift',
        description:
            'Text the bot from your iPhone. Claude Haiku replies in 2 to 4 seconds.',
    },
    alternates: {
        canonical: '/imessage',
    },
};

export default function IMessageLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
