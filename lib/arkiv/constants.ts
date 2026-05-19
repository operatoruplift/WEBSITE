/**
 * Arkiv project attribute. Every entity created by Operator Uplift in
 * Arkiv carries this attribute so our queries return our data and not
 * any other project's data sharing the public Arkiv layer.
 *
 * The value combines:
 *   - project slug (operatoruplift)
 *   - a deterministic short hash so this string is globally unique
 *     across the public Arkiv namespace without leaking anything
 *     useful about the deploy.
 *
 * Per Arkiv best practice #1, this MUST be included in every
 * createEntity / updateEntity / mutateEntities call and every query.
 *
 * Do not change the value once Arkiv data has been written; doing so
 * orphans all previously created entities from our queries.
 */
export const PROJECT_ATTRIBUTE = {
    key: 'project',
    value: 'operatoruplift-bucharest-arkiv-7q3w',
} as const;

if (!PROJECT_ATTRIBUTE.value) {
    throw new Error(
        'PROJECT_ATTRIBUTE.value is empty. Set it to a globally unique slug in lib/arkiv/constants.ts before any Arkiv call.',
    );
}

/**
 * Entity-type discriminator keys used alongside PROJECT_ATTRIBUTE so
 * each entity declares what it is. These are stable strings; renaming
 * one orphans all entities of that type from existing queries (same
 * caveat as PROJECT_ATTRIBUTE).
 */
export const ENTITY_TYPE = {
    AGENT: 'agent',
    MEMORY_EVENT: 'memory-event',
    BLOG_POST: 'blog-post',
    UPDATE: 'product-update',
    RECEIPT_MIRROR: 'receipt-mirror',
} as const;

export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

/**
 * Trusted creator wallet for backend-published Arkiv data
 * (blog posts, product updates, receipt mirrors). The frontend reads
 * filtered by `.createdBy(CREATOR_WALLET_ADDRESS)` so a third party
 * can't poison the dashboard by publishing entities with our project
 * attribute. Per Arkiv best practice #12.
 *
 * User-owned entities (Memory) are created by the user's own wallet
 * via MetaMask; this constant does not apply to them.
 *
 * Set via NEXT_PUBLIC_ARKIV_CREATOR_ADDRESS at deploy time. Returns an
 * empty string in environments where the var is unset so the read path
 * still works (it just won't filter by creator).
 */
export function getCreatorWalletAddress(): string {
    return process.env.NEXT_PUBLIC_ARKIV_CREATOR_ADDRESS ?? '';
}

/**
 * Braga testnet metadata, sourced from the Arkiv best-practices skill
 * so judges who clone the repo know exactly which network they're
 * looking at without needing to read SDK internals.
 */
export const BRAGA_TESTNET = {
    name: 'Arkiv Braga Testnet',
    chainId: 60138453102,
    rpcUrl: 'https://braga.hoodi.arkiv.network/rpc',
    explorer: 'https://explorer.braga.hoodi.arkiv.network/',
    faucet: 'https://braga.hoodi.arkiv.network/faucet/',
    nativeCurrency: 'GLM',
} as const;
