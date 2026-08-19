import { test, expect } from '@playwright/test';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import {
    isEscrowConfigured,
    loadSettlementAuthority,
    PLACEHOLDER_PROGRAM_ID,
} from '@/lib/solana/escrow/server';

/**
 * Unit coverage for the server-side escrow gating. The full settle-proof
 * route can only be exercised against a deployed program, but its safety
 * gates (configured-check + key parsing) are pure and tested here so the
 * route can never sign with the wrong key or fire before it is configured.
 */

const REAL_ID = 'Ej8Uupt7cSVJZBSbmz4RnT2WNQ5etNjs4nEwjNhkgdXn';

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
    const prev: Record<string, string | undefined> = {};
    for (const k of Object.keys(vars)) {
        prev[k] = process.env[k];
        if (vars[k] === undefined) delete process.env[k];
        else process.env[k] = vars[k];
    }
    try {
        fn();
    } finally {
        for (const k of Object.keys(prev)) {
            if (prev[k] === undefined) delete process.env[k];
            else process.env[k] = prev[k];
        }
    }
}

test('isEscrowConfigured is false until both program id + authority secret are set', () => {
    withEnv(
        { NEXT_PUBLIC_ESCROW_PROGRAM_ID: undefined, ESCROW_SETTLEMENT_AUTHORITY_SECRET: undefined },
        () => expect(isEscrowConfigured()).toBe(false),
    );
    withEnv(
        { NEXT_PUBLIC_ESCROW_PROGRAM_ID: PLACEHOLDER_PROGRAM_ID, ESCROW_SETTLEMENT_AUTHORITY_SECRET: 'x' },
        () => expect(isEscrowConfigured()).toBe(false), // placeholder id never counts as configured
    );
    withEnv(
        { NEXT_PUBLIC_ESCROW_PROGRAM_ID: REAL_ID, ESCROW_SETTLEMENT_AUTHORITY_SECRET: undefined },
        () => expect(isEscrowConfigured()).toBe(false), // no key
    );
    withEnv(
        { NEXT_PUBLIC_ESCROW_PROGRAM_ID: REAL_ID, ESCROW_SETTLEMENT_AUTHORITY_SECRET: 'present' },
        () => expect(isEscrowConfigured()).toBe(true),
    );
});

test('loadSettlementAuthority parses both a base58 and a JSON-array secret', () => {
    const kp = Keypair.generate();

    withEnv({ ESCROW_SETTLEMENT_AUTHORITY_SECRET: bs58.encode(kp.secretKey) }, () => {
        expect(loadSettlementAuthority().publicKey.equals(kp.publicKey)).toBe(true);
    });

    withEnv({ ESCROW_SETTLEMENT_AUTHORITY_SECRET: JSON.stringify(Array.from(kp.secretKey)) }, () => {
        expect(loadSettlementAuthority().publicKey.equals(kp.publicKey)).toBe(true);
    });
});

test('loadSettlementAuthority throws when the secret is unset', () => {
    withEnv({ ESCROW_SETTLEMENT_AUTHORITY_SECRET: undefined }, () => {
        expect(() => loadSettlementAuthority()).toThrow(/not set/);
    });
});
