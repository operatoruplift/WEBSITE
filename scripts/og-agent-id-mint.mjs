#!/usr/bin/env node
/**
 * og-agent-id-mint, mint an ERC-7857 AgenticID token for each agent in
 * our registry against the 0G Foundation reference contract on
 * 0G Galileo Testnet, then persist the resulting tokenIds to
 * data/og-agent-ids.json so the public agent JSON manifests can link
 * straight to chainscan.
 *
 * Companion to lib/og/agent-id.ts (PR #571) and the 0G Storage anchor
 * cron (PR #569). Storage gave every receipt a second public mirror;
 * this gives every agent a second public identity.
 *
 * Run:
 *   OG_PRIVATE_KEY=0x... node scripts/og-agent-id-mint.mjs
 *
 *   # Override the contract (defaults to 0G Foundation reference):
 *   OG_AGENT_ID_CONTRACT=0x... node scripts/og-agent-id-mint.mjs
 *
 *   # Dry-run (just print what would be minted):
 *   OG_MINT_DRY_RUN=1 node scripts/og-agent-id-mint.mjs
 *
 * Required env:
 *   OG_PRIVATE_KEY        0x-prefixed private key for a funded
 *                         0G Galileo Testnet wallet. Fund from
 *                         https://faucet.0g.ai before running.
 *
 * Optional env:
 *   OG_RPC_URL            default https://evmrpc-testnet.0g.ai
 *   OG_AGENT_ID_CONTRACT  default 0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F
 *                         (0G Foundation reference deployment)
 *   NEXT_PUBLIC_SITE_URL  used to build the tokenURI that points at
 *                         /agents/{slug}.json. default operatoruplift.com
 *   OG_MINT_DRY_RUN       set to skip on-chain calls, useful for
 *                         smoke-testing the script wiring without
 *                         spending testnet gas
 *
 * Idempotent: an agent that already has a tokenId in
 * data/og-agent-ids.json is skipped. Re-runnable after adding new
 * agents to the registry.
 *
 * Exit codes:
 *   0  every agent successfully minted (or already minted)
 *   1  any agent failed
 *   2  missing prerequisite (no OG_PRIVATE_KEY, no ethers installed)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const PERSIST_PATH = path.join(REPO_ROOT, 'data', 'og-agent-ids.json');

const DEFAULT_CONTRACT = '0x2700F6A3e505402C9daB154C5c6ab9cAEC98EF1F';
const DEFAULT_RPC = 'https://evmrpc-testnet.0g.ai';
const DEFAULT_SITE = 'https://www.operatoruplift.com';

const FG = {
    red: (s) => `\x1b[31m${s}\x1b[0m`,
    green: (s) => `\x1b[32m${s}\x1b[0m`,
    yellow: (s) => `\x1b[33m${s}\x1b[0m`,
    cyan: (s) => `\x1b[36m${s}\x1b[0m`,
    dim: (s) => `\x1b[2m${s}\x1b[0m`,
};

const ABI_FRAGMENT = [
    'function mint(address to) returns (uint256)',
    'function setTokenURI(uint256 tokenId, string uri)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
];

async function loadEthers() {
    try {
        const ethers = await import('ethers');
        return ethers.ethers ?? ethers;
    } catch {
        console.error(FG.red('[fatal] `ethers` is not installed.'));
        console.error('  Install with: pnpm add ethers@^6');
        process.exit(2);
    }
}

function loadPersist() {
    const raw = fs.readFileSync(PERSIST_PATH, 'utf-8');
    return JSON.parse(raw);
}

function savePersist(state) {
    fs.writeFileSync(PERSIST_PATH, JSON.stringify(state, null, 4) + '\n', 'utf-8');
}

function header(text) {
    console.log('');
    console.log(FG.cyan('================================================================'));
    console.log(FG.cyan(text));
    console.log(FG.cyan('================================================================'));
}

async function main() {
    header('0G Agent ID mint');

    const privateKey = process.env.OG_PRIVATE_KEY?.trim();
    if (!privateKey) {
        console.error(FG.red('[fatal] OG_PRIVATE_KEY is not set.'));
        console.error('  Fund a wallet on Galileo testnet faucet: https://faucet.0g.ai');
        process.exit(2);
    }

    const rpcUrl = process.env.OG_RPC_URL?.trim() || DEFAULT_RPC;
    const contractAddress = process.env.OG_AGENT_ID_CONTRACT?.trim() || DEFAULT_CONTRACT;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || DEFAULT_SITE;
    const dryRun = !!process.env.OG_MINT_DRY_RUN;

    const state = loadPersist();
    const slugs = Object.keys(state.agents || {});

    if (slugs.length === 0) {
        console.error(FG.red('[fatal] data/og-agent-ids.json has no agents to mint.'));
        process.exit(1);
    }

    console.log(`  contract:  ${contractAddress}`);
    console.log(`  rpc:       ${rpcUrl}`);
    console.log(`  site:      ${siteUrl}`);
    console.log(`  agents:    ${slugs.join(', ')}`);
    if (dryRun) console.log(FG.yellow('  mode:      DRY RUN (no on-chain calls)'));
    console.log('');

    const ethers = await loadEthers();
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const balance = await provider.getBalance(wallet.address);
    console.log(`  wallet:    ${wallet.address}`);
    console.log(`  balance:   ${ethers.formatEther(balance)} (testnet token)`);

    if (balance === 0n && !dryRun) {
        console.error(FG.red('[fatal] wallet has zero balance. Fund from https://faucet.0g.ai first.'));
        process.exit(2);
    }

    const contract = new ethers.Contract(contractAddress, ABI_FRAGMENT, wallet);

    let mintedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const slug of slugs) {
        const existing = state.agents[slug];

        if (typeof existing === 'number') {
            console.log(`  ${FG.dim('[skip]')} ${slug} already has tokenId ${existing}`);
            skippedCount++;
            continue;
        }

        const tokenUri = `${siteUrl}/agents/${slug}.json`;
        console.log(`  ${FG.cyan('[mint]')} ${slug}  →  tokenURI=${tokenUri}`);

        if (dryRun) {
            console.log(FG.yellow(`    would call mint(${wallet.address}), then setTokenURI(<id>, "${tokenUri}")`));
            mintedCount++;
            continue;
        }

        try {
            const tx = await contract.mint(wallet.address);
            console.log(`    tx ${tx.hash} sent, waiting for confirmation...`);
            const receipt = await tx.wait();
            const tokenId = extractTokenIdFromReceipt(receipt, contract.interface);

            if (typeof tokenId !== 'number') {
                console.error(FG.red(`    could not parse Transfer event for ${slug}`));
                failedCount++;
                continue;
            }

            console.log(FG.green(`    minted tokenId=${tokenId}`));

            try {
                const uriTx = await contract.setTokenURI(tokenId, tokenUri);
                console.log(`    setTokenURI tx ${uriTx.hash}, waiting...`);
                await uriTx.wait();
                console.log(FG.green('    tokenURI set'));
            } catch (uriErr) {
                console.warn(FG.yellow(`    setTokenURI failed (non-fatal): ${uriErr.message ?? uriErr}`));
                console.warn(FG.yellow('    tokenId is still valid, link points at chainscan; we can set the URI manually later.'));
            }

            state.agents[slug] = tokenId;
            savePersist(state);
            console.log(FG.green(`    persisted to data/og-agent-ids.json`));
            mintedCount++;
        } catch (err) {
            console.error(FG.red(`    mint failed for ${slug}: ${err.message ?? err}`));
            failedCount++;
        }
    }

    console.log('');
    header('Summary');
    console.log(`  minted:   ${FG.green(String(mintedCount))}`);
    console.log(`  skipped:  ${FG.dim(String(skippedCount))} (already had tokenIds)`);
    console.log(`  failed:   ${failedCount > 0 ? FG.red(String(failedCount)) : '0'}`);
    console.log('');

    if (failedCount > 0) process.exit(1);
    process.exit(0);
}

function extractTokenIdFromReceipt(receipt, iface) {
    if (!receipt?.logs) return undefined;
    for (const log of receipt.logs) {
        try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === 'Transfer') {
                const raw = parsed.args.tokenId ?? parsed.args[2];
                if (typeof raw === 'bigint') return Number(raw);
                if (raw?.toString) return Number(raw.toString());
            }
        } catch {
            // not our event; skip
        }
    }
    return undefined;
}

main().catch((err) => {
    console.error(FG.red('[fatal] unexpected error:'));
    console.error(err);
    process.exit(1);
});
