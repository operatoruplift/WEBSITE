---
name: arkiv-ethlisbon
description: Use when working with @arkiv-network/sdk during the Network School Ethereum Hackathon hackathon, or any 36-hour Arkiv build. Adds 6 common pitfalls not in the official arkiv-best-practices skill (Node v24 bug, updateEntity full-replace, polling-not-WS events, watchEntities removed, Golem-DB legacy aliases, pagination requires limit). Includes 3 starter templates (agent memory, Notion-style notes, file vault with TTL), a demo prep checklist, and Claude Code prompting patterns. Pair with the official arkiv-best-practices skill for full Arkiv fluency.
---

# Arkiv Network School Ethereum Hackathon Builder Skill

## How to use this skill

This is the **Network School Ethereum Hackathon-specific layer** on top of the official `arkiv-best-practices` skill from `github.com/Arkiv-Network/skills`. It assumes:

1. The official skill is loaded (CRUD ops, 14 best practices, project attribute, $owner vs $creator, etc.).
2. You're shipping inside the 36-hour Network School Ethereum Hackathon window.

If you ran `npx @santiagodevrel/arkiv-ethlisbon-skill init`, both skills already live in `.claude/skills/`. If not, install the official one too:

```bash
npx skills add https://github.com/Arkiv-Network/skills --skill arkiv-best-practices
```

This skill does **not** repeat the official content. It only adds the things Network School Ethereum Hackathon teams actually trip over.

---

<a id="pitfalls"></a>
## Section 1: Common pitfalls (not in the official skill)

### 1.1 Node v24 silently breaks `updateEntity`

`walletClient.updateEntity({...})` returns a promise that **never resolves** on Node v24. Open issue: `Arkiv-Network/arkiv-sdk-js#14`.

**Fix:** pin Node 22.10.x for the duration of the hackathon, or use Bun.

```bash
# nvm
nvm install 22.10
nvm use 22.10

# or bun
bun install
bun run script.ts
```

If you see `updateEntity` hanging, this is almost always the cause. Check `node --version` first.

### 1.2 `updateEntity` is FULL-REPLACE, not patch

Calling `updateEntity` with a partial `attributes` array **drops every attribute you omitted** — including the `PROJECT_ATTRIBUTE` that the official skill insists you include in everything. After a partial update, your entity disappears from your project's queries.

Always read first, merge second, write third:

```ts
// 1. Read current state
const current = await publicClient.getEntity(entityKey);

// 2. Merge — preserve PROJECT_ATTRIBUTE and existing attrs
const mergedAttrs = [
  ...current.attributes.filter(a => a.key !== "updated"),
  { key: "updated", value: Date.now() },
];

// 3. Write the full attribute set
await walletClient.updateEntity({
  entityKey,
  payload: jsonToPayload({ ...newData }),
  contentType: "application/json",
  attributes: mergedAttrs,
  expiresIn: ExpirationTime.fromHours(24),
});
```

The same applies to `mutateEntities({ updates: [...] })` — each update is a full-replace, not a patch.

### 1.3 `subscribeEntityEvents` is RPC polling, NOT WebSocket

The name suggests live subscriptions. It's actually a polling loop that hits the RPC endpoint every N milliseconds. Don't expect sub-second latency, and **always call `unsubscribe()`** or you leak the polling timer:

```ts
const unsubscribe = await publicClient.subscribeEntityEvents(
  {
    onEntityCreated: (e) => console.log("created", e.entityKey),
    onEntityExpired: (e) => console.log("expired", e.entityKey),
    onError: (err) => console.error(err),
  },
  5000,         // poll every 5s — tune to RPC rate limits
  100n          // start scanning from block 100
);

// later, when component unmounts / process exits:
unsubscribe();
```

**Filtering:** there is no server-side `.where()` for subscriptions — events fire for ALL entities on the chain. Filter inside your handler. If your event payload doesn't carry attributes, round-trip with `getEntity`:

```ts
onEntityCreated: async (e) => {
  const ent = await publicClient.getEntity(e.entityKey);
  if (ent.attributes.find(a => a.key === "project")?.value !== PROJECT_ATTRIBUTE.value) return;
  // your project's entity — handle it
}
```

**Caveat:** rapid bursts of activity can be missed if your interval is too long. For demos, 2000–5000 ms is usually fine.

### 1.4 `watchEntities` does NOT exist

Older blog posts, AI-generated code, and the deprecated `arkiv-sdk` package all reference `publicClient.watchEntities()`. It was removed (closed issue: `arkiv-sdk-js#15`). If you see it, replace with `subscribeEntityEvents` (above) or viem's inherited `watchEvent` for raw event log subscription.

### 1.5 Legacy aliases: "Golem DB" and "BTL"

Arkiv was rebranded from **Golem DB** in late 2025. Older blog posts, the `golemdb-sdk-demos` repo, and AI-generated code may use:

- `golem-db` / `Golem DB` instead of Arkiv
- `BTL` (block-time-to-live) instead of `expiresIn`
- `arkiv-sdk` (deprecated package) instead of `@arkiv-network/sdk`

If your AI assistant produces code with any of these, fix it. They refer to the same concepts but have moved on.

### 1.6 Pagination requires `.limit()`

`result.next()` throws `NoCursorOrLimitError` if you didn't set a `.limit()` on the original query. Standard pattern:

```ts
const result = await publicClient
  .buildQuery()
  .where(eq("entityType", "note"))
  .limit(20)             // <-- required for pagination to work
  .fetch();

// `result.next()` mutates `result` in place. Process the first page first,
// then advance through any remaining pages.
while (true) {
  for (const entity of result.entities) {
    /* process */
  }
  if (!result.hasNextPage()) break;
  await result.next();
}
```

Without `.limit()`, the query returns all matches in one go and `next()` blows up.

---

## Section 2: Network School Ethereum Hackathon starter templates

Three patterns that win at hackathons. Copy, adapt, ship.

Each template assumes you've replaced `PROJECT_ATTRIBUTE` with a globally unique slug (see official skill best practice #1). Use something like `<project-name>-<your-handle>-<random-suffix>`, e.g. `agentmem-santiagodevrel-7x9k`.

<a id="agent-memory"></a>
### Template A — Agent Memory (LLM context with TTL)

**Demo angle:** "Your AI agent remembers the last 7 days of conversation, immutably and queryable on-chain."

**Why it wins:** dovetails with current AI hype, showcases Arkiv's TTL + queryable attribute combo, easy to demo (just chat with it).

**What you can build with this:**
- **Telegram tutor bot** — remembers each user's last 7 days of questions and answers across conversations
- **Personal AI assistant** — your context syncs across web, mobile, and CLI from one on-chain memory store
- **Customer support chat** — agent loads the user's prior interactions before responding
- **AI audit log** — every model decision stored immutably for compliance/explainability ("on date X, the agent recommended Y based on Z")
- **Multi-agent system** — agents share memory through a common queryable store

```ts
// agent-memory.ts
import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { kaolin } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";

export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "agentmem-<your-handle>-<suffix>", // <-- replace before deploying
} as const;

const wallet = createWalletClient({
  chain: kaolin,
  transport: http(),
  account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
});
const publicClient = createPublicClient({ chain: kaolin, transport: http() });

// Append a message to an agent's memory.
export async function rememberEvent(opts: {
  agentId: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
}) {
  return wallet.createEntity({
    payload: jsonToPayload({ content: opts.content, ts: Date.now() }),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: "memory-event" },
      { key: "agentId", value: opts.agentId },
      { key: "sessionId", value: opts.sessionId },
      { key: "role", value: opts.role },
      { key: "ts", value: Date.now() },
    ],
    expiresIn: ExpirationTime.fromDays(7),
  });
}

// Recall events for a session, newest-first.
export async function recallSession(agentId: string, sessionId: string, limit = 50) {
  const result = await publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("entityType", "memory-event"),
      eq("agentId", agentId),
      eq("sessionId", sessionId),
    ])
    .withPayload(true)
    .withAttributes(true)
    .limit(limit)
    .fetch();
  return result.entities.map((e) => ({
    ...e.toJson(),
    role: e.attributes.find(a => a.key === "role")?.value,
  }));
}
```

<a id="notion-notes"></a>
### Template B — Notion-style Notes (user-owned, queryable, mutable)

**Demo angle:** "User-owned notes. Owner can update or transfer them. Public can read by tag. Auto-expire after 30 days unless extended."

**Why it wins:** classic dapp pattern that judges immediately understand; demonstrates ownership, mutation, and querying.

**What you can build with this:**
- **Personal todo app** — users own their tasks, can transfer them, browse by tag
- **Team wiki / shared notebook** — public read by anyone, editable only by the owner wallet
- **Web3 blogging platform** — drafts auto-expire if not published, posts queryable by topic
- **Community recipe book** — anyone can publish, owners can update, all browsable by ingredient/cuisine
- **Job board / classifieds** — listings auto-expire, searchable by category, owner can renew

```ts
// notes-app.ts (frontend with wagmi + MetaMask, or backend with private key)
import { createPublicClient, http } from "@arkiv-network/sdk";
import { kaolin } from "@arkiv-network/sdk/chains";
import { eq } from "@arkiv-network/sdk/query";
import { ExpirationTime, jsonToPayload } from "@arkiv-network/sdk/utils";

export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "notes-<your-handle>-<suffix>",
} as const;

const publicClient = createPublicClient({ chain: kaolin, transport: http() });

// === Constructing walletClient ===
// Backend (private key in env):
//   const wallet = createWalletClient({
//     chain: kaolin, transport: http(),
//     account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
//   });
//
// Frontend (browser + MetaMask, no wagmi):
//   import { custom } from "@arkiv-network/sdk";   // viem re-export
//   const wallet = createWalletClient({
//     chain: kaolin,
//     transport: custom(window.ethereum),
//     account: userAddress as `0x${string}`,
//   });
//
// Frontend (React + wagmi/RainbowKit): pass `useWalletClient()` result directly.

// Create a note. Pass any compatible walletClient (backend-built or wagmi hook).
export async function createNote(walletClient: any, opts: {
  title: string;
  body: string;
  tag: string;
}) {
  return walletClient.createEntity({
    payload: jsonToPayload({ title: opts.title, body: opts.body }),
    contentType: "application/json",
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: "note" },
      { key: "tag", value: opts.tag },
      { key: "created", value: Date.now() },
    ],
    expiresIn: ExpirationTime.fromDays(30),
  });
}

// Public query: notes by a specific owner, optionally filtered by tag.
export async function getNotesByOwner(owner: `0x${string}`, tag?: string) {
  let q = publicClient
    .buildQuery()
    .where([
      eq(PROJECT_ATTRIBUTE.key, PROJECT_ATTRIBUTE.value),
      eq("entityType", "note"),
    ])
    .ownedBy(owner)
    .withPayload(true)
    .withAttributes(true)
    .withMetadata(true)    // includes $owner, $creator, expiresAtBlock
    .limit(50);
  if (tag) q = q.where(eq("tag", tag));
  const result = await q.fetch();
  return result.entities;
}

// Update — REMEMBER: full-replace. Read current, merge, write.
export async function updateNote(walletClient: any, entityKey: `0x${string}`, patch: {
  title?: string;
  body?: string;
}) {
  const current = await publicClient.getEntity(entityKey);
  const currentJson = current.toJson();
  return walletClient.updateEntity({
    entityKey,
    payload: jsonToPayload({ ...currentJson, ...patch }),
    contentType: "application/json",
    attributes: current.attributes,                 // preserve all
    expiresIn: ExpirationTime.fromDays(30),
  });
}
```

<a id="file-vault"></a>
### Template C — File Vault with TTL (ephemeral file sharing)

**Demo angle:** "Drop a file, share a link, file auto-deletes after N hours. No central server, no account."

**Why it wins:** clear visual demo, showcases binary payload + programmable expiry, immediately useful.

**What you can build with this:**
- **Wormhole.app clone** — drop a file, get a link, auto-deletes after 24h
- **Event-specific file drop** — conference materials that vanish after the conference ends (no manual cleanup)
- **Confidential one-time document share** — encrypt before upload (with a separate tool), share key out-of-band, file self-destructs
- **Class assignment submission box** — students submit, deadline = TTL, no late submissions possible
- **Anonymous tip line** — leakers drop docs with short TTL so they're not permanently archived

```ts
// file-vault.ts
import { createPublicClient, createWalletClient, http } from "@arkiv-network/sdk";
import { privateKeyToAccount } from "@arkiv-network/sdk/accounts";
import { kaolin } from "@arkiv-network/sdk/chains";
import { ExpirationTime } from "@arkiv-network/sdk/utils";

export const PROJECT_ATTRIBUTE = {
  key: "project",
  value: "filevault-<your-handle>-<suffix>",
} as const;

const wallet = createWalletClient({
  chain: kaolin,
  transport: http(),
  account: privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`),
});
const publicClient = createPublicClient({ chain: kaolin, transport: http() });

// Upload a file. `data` is raw bytes (Uint8Array) — payload accepts binary directly.
export async function uploadFile(opts: {
  fileName: string;
  contentType: string;
  data: Uint8Array;
  ttlHours: number;          // 1..24 typical
}) {
  const { entityKey, txHash } = await wallet.createEntity({
    payload: opts.data,                 // raw bytes — NOT jsonToPayload
    contentType: opts.contentType,
    attributes: [
      PROJECT_ATTRIBUTE,
      { key: "entityType", value: "file" },
      { key: "fileName", value: opts.fileName },
      { key: "uploaded", value: Date.now() },
      { key: "size", value: opts.data.byteLength },
    ],
    expiresIn: ExpirationTime.fromHours(opts.ttlHours),
  });
  return { entityKey, txHash };
}

// Download by entity key (which doubles as the public download token).
export async function downloadFile(entityKey: `0x${string}`) {
  const entity = await publicClient.getEntity(entityKey);
  const fileName = entity.attributes.find(a => a.key === "fileName")?.value;
  return {
    fileName: String(fileName),
    contentType: entity.contentType,
    data: entity.payload,             // Uint8Array
  };
}
```

---

## Section 2.5: Quick reference snippets

These are the signatures the templates assume you know but don't show in full.

### Environment setup

Hackathon convention — keep keys in `.env`, never commit:

```bash
# .env (gitignored)
PRIVATE_KEY=0x...   # backend wallet, fund via Kaolin faucet
```

```ts
import "dotenv/config";   // top of your entry point
```

### `extendEntity` — push back the expiration

```ts
await wallet.extendEntity({
  entityKey,
  expiresIn: ExpirationTime.fromHours(24),  // adds 24h from "now"
});
```

### `mutateEntities` — batch creates/updates/deletes in ONE tx

Cheaper and faster than sequential calls. Each `update`/`create` is still full-replace semantics:

```ts
await wallet.mutateEntities({
  creates: [
    { payload, contentType, attributes, expiresIn: ExpirationTime.fromHours(1) },
    { payload, contentType, attributes, expiresIn: ExpirationTime.fromHours(1) },
  ],
  updates: [
    { entityKey, payload, contentType, attributes, expiresIn },
  ],
  deletes: [{ entityKey }],
  extensions: [{ entityKey, expiresIn: ExpirationTime.fromMinutes(30) }],
  ownershipChanges: [{ entityKey, newOwner: "0x..." }],
});
```

### File Vault (Template C) security note

`entityKey` is a public read token — anyone who has it can call `getEntity()` and download the payload. There is **no built-in access control on payloads**. For sensitive content, encrypt the payload before upload and distribute the decryption key out-of-band (Lit Protocol, server-issued sessions, etc.).

### `entity.toJson()` and `entity.toText()` semantics

Both methods deserialize the **payload** only — not attributes, not metadata. `toJson()` calls `JSON.parse(payload)` and throws on bad bytes; `toText()` returns the raw UTF-8 string. Always validate with a schema (zod/valibot) when downstream code depends on shape.

---

<a id="demo-checklist"></a>
## Section 3: Demo prep checklist (the night before)

- **Pin Node 22.10** — `nvm use 22.10` or commit a `.nvmrc`. Node v24 will break `updateEntity` mid-demo.
- **Faucet your demo wallet 24h ahead** — Kaolin faucet has PoW gating and can be slow during peak hackathon hours. Have at least 0.005 ETH.
- **Demo wallet ≠ personal wallet** — generate a fresh private key, fund it from the faucet, store in `.env`. Never your main wallet.
- **Test on Kaolin, not localhost** — judges don't have your local devnet.
- **Verify `PROJECT_ATTRIBUTE`** is unique and applied everywhere — if you skip it on one create, that entity is invisible to your queries.
- **`DEBUG=arkiv:*` for live debugging** — see RPC traffic, query strings, tx hashes. Turn off for the actual demo.
- **Deploy 24h before submission** — Vercel envs, dependency drift, RPC URLs all bite at the last minute.
- **Record a screencast as backup** — RPC outage during demo is rare but devastating; a 30s screen recording saves the demo.
- **Pre-load 5-10 sample entities** before the demo — empty queries make terrible visuals.
- **Have the explorer URL ready** — `https://explorer.kaolin.hoodi.arkiv.network/` — judges love seeing the on-chain proof.

---

<a id="prompting-patterns"></a>
## Section 4: Claude Code prompting patterns

When working on Arkiv code with Claude (this skill loaded), these prompts produce reliably good output:

### "Critique this Arkiv code for Network School Ethereum Hackathon production"
Triggers Claude to apply BOTH skills' anti-patterns. Catches missing `PROJECT_ATTRIBUTE`, hardcoded keys, sequential `createEntity` loops, etc.

### "Refactor this loop into a single `mutateEntities` batch"
Saves gas + tx count. Especially useful when seeding demo data.

### "Generate a query for entities of type X created by [address] in the last 24h"
Claude builds the right `where + createdBy + gt(timestamp)` chain.

### "Add a TTL extension flow before this entity expires"
Claude wires up `extendEntity` + the right `ExpirationTime` helper.

### "What gotchas apply to this code given @arkiv-network/sdk@0.6?"
Triggers a top-down review using both skills' content.

### "Validate this `updateEntity` call preserves all attributes"
Claude checks the full-replace gotcha specifically.

---

## Resources

- **Official skill (must-pair):** https://github.com/Arkiv-Network/skills
- **SDK repo:** https://github.com/Arkiv-Network/arkiv-sdk-js
- **Arkiv docs:** https://docs.arkiv.network/
- **Kaolin faucet:** https://kaolin.hoodi.arkiv.network/faucet/
- **Kaolin explorer:** https://explorer.kaolin.hoodi.arkiv.network/
- **GitHub org (74 repos, including 6+ usecase reference apps):** https://github.com/arkiv-network

---

*Built for Network School Ethereum Hackathon. If you find a gotcha not covered here, open an issue at github.com/santiagodevrel/arkiv-ethlisbon-skill/issues — we'll fold it in.*
