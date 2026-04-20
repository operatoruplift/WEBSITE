"use client";

import { PrivyProvider } from '@privy-io/react-auth';
import { PrivyTokenSync } from './PrivyTokenSync';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

export function PrivyWrapper({ children }: { children: React.ReactNode }) {
    if (!PRIVY_APP_ID) {
        // Privy not configured, pass through without auth wrapper
        // This allows the app to run in development without a Privy account
        return <>{children}</>;
    }

    return (
        <PrivyProvider
            appId={PRIVY_APP_ID}
            config={{
                appearance: {
                    theme: 'dark',
                    accentColor: '#F97316',
                    logo: '/logo.svg',
                },
                loginMethods: ['google', 'github', 'wallet'],
                embeddedWallets: {
                    solana: { createOnLogin: 'off' },
                },
                walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
                supportedChains: [
                    {
                        id: 101,
                        name: 'Solana',
                        nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
                        rpcUrls: {
                            default: { http: ['https://api.mainnet-beta.solana.com'] },
                        },
                    } as any,
                ],
            }}
        >
            <PrivyTokenSync />
            {children}
        </PrivyProvider>
    );
}
