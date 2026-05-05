import { test, expect } from '@playwright/test';
import { stripMarkdown } from '@/lib/photon/strip-markdown';

/**
 * Unit tests for the stripMarkdown helper used by lib/photon/agent.ts.
 *
 * iMessage does not render markdown. The agent's system prompt asks
 * Claude Haiku for plain text, but models drift, so this helper is the
 * second-line defense that strips backticks, asterisks, link wrappers,
 * etc. before sending. A regression that lets markdown leak through
 * shows up on iPhones as broken-looking literal characters.
 */

test('drops fenced code blocks but keeps the body', () => {
    const out = stripMarkdown('Here is some code:\n```js\nconst x = 1;\n```\nThanks.');
    expect(out).toContain('const x = 1;');
    expect(out).not.toContain('```');
});

test('drops inline backticks but keeps the term', () => {
    expect(stripMarkdown('Use `npm run build` to ship')).toBe('Use npm run build to ship');
});

test('drops bold/italic markers', () => {
    expect(stripMarkdown('this is **important** stuff')).toBe('this is important stuff');
    expect(stripMarkdown('feel *strongly* about it')).toBe('feel strongly about it');
    expect(stripMarkdown('really __big__ news')).toBe('really big news');
    expect(stripMarkdown('barely _emphasized_ text')).toBe('barely emphasized text');
});

test('replaces [text](url) with "text (url)"', () => {
    expect(stripMarkdown('See [docs](https://example.com/docs).')).toBe('See docs (https://example.com/docs).');
});

test('collapses [url](url) to just the url (no doubling)', () => {
    expect(stripMarkdown('Visit [https://example.com](https://example.com)')).toBe('Visit https://example.com');
});

test('replaces image markdown with [image] url', () => {
    expect(stripMarkdown('![logo](https://example.com/img.png) here')).toBe('[image] https://example.com/img.png here');
});

test('drops leading heading markers', () => {
    expect(stripMarkdown('# Title\nbody')).toBe('Title\nbody');
    expect(stripMarkdown('### Subtitle')).toBe('Subtitle');
});

test('drops list bullets and numbered markers', () => {
    expect(stripMarkdown('- one\n- two\n- three')).toBe('one\ntwo\nthree');
    expect(stripMarkdown('1. first\n2. second')).toBe('first\nsecond');
});

test('drops blockquote markers', () => {
    expect(stripMarkdown('> they said this\nand then this')).toBe('they said this\nand then this');
});

test('returns empty string for empty input', () => {
    expect(stripMarkdown('')).toBe('');
});

test('preserves plain text untouched', () => {
    const plain = 'Hey, your 9am meeting moved to 9:30. Need anything else?';
    expect(stripMarkdown(plain)).toBe(plain);
});

test('does not strip asterisk inside ordinary words like 2*3', () => {
    // Math expression uses standalone asterisks not paired around a word.
    // Our regex requires non-* content between markers, so 2*3 should
    // pass through unchanged.
    expect(stripMarkdown('2*3 = 6')).toBe('2*3 = 6');
});
