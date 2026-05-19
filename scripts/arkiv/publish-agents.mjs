#!/usr/bin/env node
/**
 * Publish each agent identity card (currently Calendar + Gmail) to
 * Arkiv Braga testnet under PROJECT_ATTRIBUTE. Mirrors the static
 * /agents/<slug>.json manifest so a judge can read the same content
 * either from our origin (HTTP) or from Arkiv (tamper-proof,
 * queryable).
 *
 * Operator usage:
 *
 *   1. Fund the wallet at https://braga.hoodi.arkiv.network/faucet/
 *   2. Export ARKIV_PRIVATE_KEY=<0x...>
 *   3. node scripts/arkiv/publish-agents.mjs
 *
 * The script is idempotent: re-running it publishes a fresh version
 * of each agent. The /arkiv page surfaces the most-recent one (per
 * lib/arkiv/agent.ts::getAgentBySlug).
 *
 * Why a script rather than a build-time step: Arkiv writes cost gas,
 * so this should never run on every deploy. The operator triggers it
 * manually when an agent's checksum changes.
 */
import 'dotenv/config';
import crypto from 'node:crypto';

import { createWalletClient, http } from '@arkiv-network/sdk';
import { privateKeyToAccount } from '@arkiv-network/sdk/accounts';
import { braga } from '@arkiv-network/sdk/chains';
import { ExpirationTime, jsonToPayload } from '@arkiv-network/sdk/utils';

const PROJECT_ATTRIBUTE = {
    key: 'project',
    value: 'operatoruplift-bucharest-arkiv-7q3w',
};

async function fetchAgentManifest(slug) {
    const url = `https://www.operatoruplift.com/agents/${slug}.json`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }
    return await res.json();
}

async function main() {
    const privateKey = process.env.ARKIV_PRIVATE_KEY;
    if (!privateKey) {
        console.error('ARKIV_PRIVATE_KEY not set. Get a key + fund it at https://braga.hoodi.arkiv.network/faucet/');
        process.exit(1);
    }

    const normalized = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const wallet = createWalletClient({
        chain: braga,
        transport: http(),
        account: privateKeyToAccount(normalized),
    });

    const slugs = ['calendar', 'gmail'];
    for (const slug of slugs) {
        console.log(`\n${slug} -> fetching live manifest...`);
        const manifest = await fetchAgentManifest(slug);
        const { checksum } = manifest;
        if (!checksum || !/^[a-f0-9]{64}$/.test(checksum)) {
            throw new Error(`${slug}: missing or malformed checksum`);
        }

        const verify = crypto.createHash('sha256');
        const { checksum: _omit, ...rest } = manifest;
        verify.update(canonicalize(rest));
        const recomputed = verify.digest('hex');
        if (recomputed !== checksum) {
            throw new Error(
                `${slug}: live manifest checksum mismatch. embedded=${checksum} recomputed=${recomputed}`,
            );
        }
        console.log(`${slug} -> checksum verified ${checksum.slice(0, 12)}...`);

        const result = await wallet.createEntity({
            payload: jsonToPayload({
                slug,
                name: manifest.name,
                description: manifest.description,
                version: manifest.version,
                publisher: manifest.publisher,
                capabilities: manifest.capabilities,
                checksum,
            }),
            contentType: 'application/json',
            attributes: [
                PROJECT_ATTRIBUTE,
                { key: 'entityType', value: 'agent' },
                { key: 'slug', value: slug },
                { key: 'version', value: manifest.version },
                { key: 'checksum', value: checksum },
                { key: 'publishedAt', value: Date.now() },
            ],
            expiresIn: ExpirationTime.fromDays(30),
        });

        console.log(`${slug} -> published`);
        console.log(`        entityKey ${result.entityKey}`);
        console.log(`        txHash    ${result.txHash}`);
        console.log(`        explorer  https://explorer.braga.hoodi.arkiv.network/entity/${result.entityKey}`);
    }
}

function canonicalize(obj) {
    if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
    if (Array.isArray(obj)) return '[' + obj.map(canonicalize).join(',') + ']';
    const keys = Object.keys(obj).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalize(obj[k])).join(',') + '}';
}

main().catch((err) => {
    console.error('\npublish-agents failed:', err);
    process.exit(1);
});
