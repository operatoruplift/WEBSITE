"use client";

import { PrivyProvider } from '@privy-io/react-auth';
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana';
import { PrivyTokenSync } from './PrivyTokenSync';

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

// Initialize once at module scope so PrivyProvider isn't passed a fresh
// reference on every render (avoids the wallet list re-mounting).
const SOLANA_CONNECTORS = toSolanaWalletConnectors();

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
                // Pass Solana connectors so the wallet picker actually
                // shows Phantom/Backpack/etc. Without this, Privy logs a
                // warning on every marketing page and the wallet button
                // on /login fails to surface available providers.
                externalWallets: {
                    solana: { connectors: SOLANA_CONNECTORS },
                },
                walletConnectCloudProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
                // The Privy supportedChains type is EVM-shaped; we pass a
                // Solana chain definition through `as unknown` so the
                // cast is explicit and readers see the intentional gap
                // between Privy's typing and Solana's chain shape.
                supportedChains: [
                    ({
                        id: 101,
                        name: 'Solana',
                        nativeCurrency: { name: 'SOL', symbol: 'SOL', decimals: 9 },
                        rpcUrls: {
                            default: { http: ['https://api.mainnet-beta.solana.com'] },
                        },
                    } as unknown) as never,
                ],
            }}
        >
            <PrivyTokenSync />
            {children}
        </PrivyProvider>
    );
}
