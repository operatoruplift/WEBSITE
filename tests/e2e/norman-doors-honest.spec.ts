import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe.configure({ timeout: 30_000 });

/**
 * Norman door audit.
 *
 * Per docs/UX_PRINCIPLES.md, a Norman door is any UI element whose
 * affordance lies about what it does. The most common pattern that
 * creeps in: a button that looks fully active (full-color fill,
 * hover state, no aria-disabled) but is wired to do nothing.
 *
 * This spec source-scans the marketing pages for two known offenders:
 *
 *   1. <button disabled> with a full-color background class. If you
 *      really need a disabled state, downgrade the visual: border-only,
 *      muted text, or a <div> styled as a label ("Coming next") so
 *      the cursor never turns into a pointer.
 *
 *   2. <button type="button" onClick={() => {}}> (empty click handler).
 *      If the click does nothing, the button should not exist.
 *
 * The waitlist + admin + paywall pages are the highest-risk surfaces
 * because they have CTAs the user is hunting for.
 */

const repoRoot = path.resolve(__dirname, '..', '..');

const PAGES_TO_AUDIT = [
    'app/waitlist/page.tsx',
    'app/(auth)/paywall/page.tsx',
    'app/press-kit/page.tsx',
];

test('No always-disabled "Pay with wallet" button on the waitlist page', () => {
    // The wallet checkout tiles on /waitlist used to render
    //   <button disabled className="...">Pay with wallet</button>
    // which looked clickable but did nothing. The fix replaced them
    // with <div>Coming next</div> labels. This catches a future
    // contributor who reintroduces the always-disabled button.
    //
    // Note: we deliberately allow `disabled={...}` (a dynamic
    // disabled state, e.g. while a submit is in-flight). The literal
    // `<button disabled` (no `=`) is the always-off shape we ban.
    const src = fs.readFileSync(path.join(repoRoot, 'app', 'waitlist', 'page.tsx'), 'utf-8');
    expect(src).not.toMatch(/<button[^>]*\sdisabled\s/);
    expect(src).not.toMatch(/<button[^>]*disabled>[^<]*Pay with wallet/);
});

test('Waitlist email input is autofocus + Enter submits', () => {
    // Jakob's Law: every waitlist landing the user has ever filled in
    // works this way. Our form has to match. autoFocus is the JSX
    // attribute; HTML form submit-on-Enter is the default behavior
    // for <form> + <input type="email"> + <button type="submit">,
    // so we just need to assert all three are present in the same
    // form block.
    const src = fs.readFileSync(path.join(repoRoot, 'app', 'waitlist', 'page.tsx'), 'utf-8');
    expect(src).toMatch(/autoFocus/);
    expect(src).toMatch(/<form[\s\S]+type="email"[\s\S]+type="submit"[\s\S]+<\/form>/);
});

test('Marketing pages do not ship empty-onClick buttons', () => {
    for (const file of PAGES_TO_AUDIT) {
        const src = fs.readFileSync(path.join(repoRoot, file), 'utf-8');
        // onClick={() => {}} or onClick={()=>{}}, with or without spaces.
        expect(src, `${file} ships a no-op onClick`).not.toMatch(/onClick=\{\s*\(\s*\)\s*=>\s*\{\s*\}\s*\}/);
    }
});

test('docs/UX_PRINCIPLES.md exists and names both Norman and Jakob', () => {
    // The principles doc is the source of truth for this spec. If
    // it goes away, this spec loses its grounding.
    const p = path.join(repoRoot, 'docs', 'UX_PRINCIPLES.md');
    expect(fs.existsSync(p)).toBe(true);
    const src = fs.readFileSync(p, 'utf-8');
    expect(src).toMatch(/Norman/);
    expect(src).toMatch(/Jakob/);
});

test('Consumer copy lists the jargon ban', () => {
    // UX principle 3: certain technical terms belong in /docs, not
    // in /blog. The principle doc names the ban list explicitly so a
    // future contributor knows what to avoid.
    const src = fs.readFileSync(path.join(repoRoot, 'docs', 'UX_PRINCIPLES.md'), 'utf-8');
    expect(src).toMatch(/Jargon list to scrub/i);
});
