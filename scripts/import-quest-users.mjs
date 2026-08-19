#!/usr/bin/env node
/**
 * import-quest-users.mjs
 *
 * One-off migration: copy the user list from joinquestnow.com (the NS Quest
 * Supabase project) into the Operator Uplift waitlist table, idempotently.
 *
 * SAFETY
 *  - Dry-run by default. It only writes when you pass `--apply`.
 *  - Idempotent: upserts on `email` with ignoreDuplicates, so re-running never
 *    double-adds and never overwrites existing Uplift signups.
 *  - PII-aware: it never prints full email addresses, only masked samples and
 *    counts. It reads real people's emails, so treat the service keys as secrets
 *    and run it from a trusted machine, never in CI logs.
 *  - CONSENT: these users signed up for Quest, not Uplift. Confirm you have a
 *    lawful basis / their consent to move them onto the Uplift waitlist before
 *    running with `--apply`. That's a product/legal decision, not a code one.
 *
 * REQUIRED ENV (all four; the script refuses to run without them)
 *   QUEST_SUPABASE_URL           https://<quest-ref>.supabase.co
 *   QUEST_SUPABASE_SERVICE_KEY   Quest service-role key (source, read)
 *   UPLIFT_SUPABASE_URL          https://<uplift-ref>.supabase.co
 *   UPLIFT_SUPABASE_SERVICE_KEY  Uplift service-role key (target, write)
 * OPTIONAL ENV
 *   UPLIFT_WAITLIST_TABLE        target table (default: waitlist)
 *
 * USAGE
 *   node scripts/import-quest-users.mjs            # dry run: report only
 *   node scripts/import-quest-users.mjs --apply    # actually upsert
 *
 * Dependencies: @supabase/supabase-js (already a repo dependency).
 */

import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const TARGET_TABLE = process.env.UPLIFT_WAITLIST_TABLE || 'waitlist';
const PER_PAGE = 1000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[import] missing required env: ${name}`);
    process.exit(1);
  }
  return v;
}

/** Mask an email for logs: keep first char + domain (a****@example.com). */
function mask(email) {
  const [local, domain] = String(email).split('@');
  if (!domain) return '***';
  const head = local.slice(0, 1);
  return `${head}${'*'.repeat(Math.max(1, local.length - 1))}@${domain}`;
}

/**
 * Read every Quest user via the Supabase Auth admin API (paginated). This is
 * the authoritative user list. If your emails live in a public table instead,
 * swap this for `questDb.from('<table>').select('email')`.
 */
async function readQuestEmails(questAuthAdmin) {
  const emails = new Set();
  let page = 1;
  for (;;) {
    const { data, error } = await questAuthAdmin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw new Error(`Quest listUsers failed: ${error.message}`);
    const users = data?.users ?? [];
    for (const u of users) {
      const email = (u.email || '').trim().toLowerCase();
      if (EMAIL_RE.test(email)) emails.add(email);
    }
    if (users.length < PER_PAGE) break;
    page += 1;
  }
  return [...emails];
}

async function main() {
  const questUrl = requireEnv('QUEST_SUPABASE_URL');
  const questKey = requireEnv('QUEST_SUPABASE_SERVICE_KEY');
  const upliftUrl = requireEnv('UPLIFT_SUPABASE_URL');
  const upliftKey = requireEnv('UPLIFT_SUPABASE_SERVICE_KEY');

  const quest = createClient(questUrl, questKey, { auth: { persistSession: false } });
  const uplift = createClient(upliftUrl, upliftKey, { auth: { persistSession: false } });

  console.log(`[import] mode: ${APPLY ? 'APPLY (will write)' : 'DRY RUN (no writes)'}`);
  console.log('[import] reading Quest users...');
  const emails = await readQuestEmails(quest.auth.admin);
  console.log(`[import] found ${emails.length} valid unique Quest emails`);
  if (emails.length) {
    console.log(`[import] sample: ${emails.slice(0, 3).map(mask).join(', ')}`);
  }

  if (!APPLY) {
    console.log('[import] dry run complete. Re-run with --apply to upsert into ' + `"${TARGET_TABLE}".`);
    return;
  }

  let inserted = 0;
  for (let i = 0; i < emails.length; i += PER_PAGE) {
    const batch = emails.slice(i, i + PER_PAGE).map((email) => ({ email }));
    // ignoreDuplicates => existing Uplift signups are untouched; new ones added.
    const { error, count } = await uplift
      .from(TARGET_TABLE)
      .upsert(batch, { onConflict: 'email', ignoreDuplicates: true, count: 'exact' });
    if (error) throw new Error(`upsert batch @${i} failed: ${error.message}`);
    inserted += count ?? 0;
    console.log(`[import] batch ${i / PER_PAGE + 1}: processed ${batch.length}`);
  }

  console.log(`[import] done. ${inserted} new rows added to "${TARGET_TABLE}" (duplicates skipped).`);
}

main().catch((err) => {
  console.error('[import] failed:', err instanceof Error ? err.message : err);
  process.exit(1);
});
