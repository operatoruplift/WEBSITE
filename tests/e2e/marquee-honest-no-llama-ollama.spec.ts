import { test, expect } from '@playwright/test';

// Cold-compile budget: homepage compiles on first hit. 90s leaves
// room for compile + the marquee asserter.
test.describe.configure({ timeout: 90_000 });

/**
 * Locks in the post-trim composition of the homepage TrustedBy
 * marquee.
 *
 * PR #471 trimmed Llama and Ollama from the "Built on the model
 * you already pay for" marquee. Reason: that header is a
 * hosted-API claim. Llama and Ollama route through
 * lib/llm.ts:189's local Ollama path, which only works once the
 * desktop app ships (currently roadmap). Putting them in the
 * marquee would overclaim that we ship a hosted Llama experience
 * today.
 *
 * The /chat model picker stays the canonical full-list source
 * (lib/llm.ts::mapModelId); the homepage marquee is the trimmed
 * "you can pay for these today" subset.
 *
 * The 5 hosted providers shipped via marquee:
 *   Anthropic (Claude Opus 4.7)
 *   OpenAI    (GPT-5.5)
 *   Google    (Gemini 3.1 Pro)
 *   xAI       (Grok 4.3)
 *   DeepSeek  (DeepSeek V4 Pro)
 *
 * If a regression re-adds Llama or Ollama (or any local-only
 * provider) to the marquee, this spec fires.
 */

test('homepage TrustedBy marquee does NOT include Llama or Ollama', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    // Scope to the marquee region by aria-label rather than the
    // header text so a future header rename doesn't accidentally
    // pass this test by missing the section.
    const marquee = page.getByRole('region', { name: /Supported AI models/i });
    await expect(marquee).toBeVisible({ timeout: 10_000 });

    // Get the visible (non-aria-hidden) entries by reading the
    // marquee text. The component duplicates the list for a seamless
    // scroll; the duplicate half is aria-hidden so a screen reader
    // doesn't double-announce. That same aria-hidden makes the inner
    // text safe to read for these assertions.
    const text = await marquee.innerText();
    const lower = text.toLowerCase();

    expect(lower, 'Llama leaked back into the marquee').not.toContain('llama');
    expect(lower, 'Ollama leaked back into the marquee').not.toContain('ollama');
});

test('homepage TrustedBy marquee surfaces all five hosted providers', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });

    const marquee = page.getByRole('region', { name: /Supported AI models/i });
    await expect(marquee).toBeVisible({ timeout: 10_000 });

    const text = (await marquee.innerText()).toLowerCase();

    // The five hosted providers that have shipped consumer/API
    // surfaces by May 2026 and that map through lib/llm.ts. If
    // anyone trims this further without updating the deck or
    // /chat model picker, this fires.
    for (const provider of ['anthropic', 'openai', 'google', 'xai', 'deepseek']) {
        expect(text, `${provider} should be in the marquee`).toContain(provider);
    }
});
