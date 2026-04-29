import { test, expect } from '@playwright/test';
import {
    looksLikeHtml,
    htmlToText,
    encodeHeader,
    buildRawEmail,
} from '@/lib/google/gmail';

/**
 * Unit tests for the Gmail email-construction helpers.
 *
 * buildRawEmail produces the base64url-encoded MIME blob that gets
 * sent via gmail.users.messages.send(). A regression here means the
 * user's outbound emails are malformed:
 *
 * - Missing or wrong headers -> bounced by strict MTAs (Proofpoint,
 *   Outlook 365)
 * - Wrong MIME boundary -> recipient sees raw multipart markers
 * - Unencoded non-ASCII subjects -> recipient sees "???"
 * - HTML body without text fallback -> screen-reader users see tags
 *
 * The function returns base64url; tests decode before inspecting.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/gmail-builders.spec.ts --reporter=list
 */

/** Decode the base64url output of buildRawEmail back to the raw MIME string. */
function decodeRawEmail(b64url: string): string {
    return Buffer.from(b64url, 'base64url').toString('utf8');
}

test.describe('looksLikeHtml', () => {
    test('detects common HTML tags', () => {
        expect(looksLikeHtml('<p>hello</p>')).toBe(true);
        expect(looksLikeHtml('<html><body>hi</body></html>')).toBe(true);
        expect(looksLikeHtml('<div class="foo">text</div>')).toBe(true);
        expect(looksLikeHtml('<table><tr><td>cell</td></tr></table>')).toBe(true);
        expect(looksLikeHtml('Visit <a href="...">link</a>')).toBe(true);
        expect(looksLikeHtml('Line 1<br/>Line 2')).toBe(true);
        expect(looksLikeHtml('<ul><li>item</li></ul>')).toBe(true);
        expect(looksLikeHtml('<h1>Header</h1>')).toBe(true);
        expect(looksLikeHtml('<strong>bold</strong>')).toBe(true);
    });

    test('returns false for plain text', () => {
        expect(looksLikeHtml('hello world')).toBe(false);
        expect(looksLikeHtml('multi\nline\ntext')).toBe(false);
        expect(looksLikeHtml('email me at user@example.com')).toBe(false);
        expect(looksLikeHtml('5 < 10 and 10 > 5')).toBe(false); // false-positive guard
    });

    test('detection is case-insensitive', () => {
        expect(looksLikeHtml('<P>hello</P>')).toBe(true);
        expect(looksLikeHtml('<DIV>hello</DIV>')).toBe(true);
    });
});

test.describe('htmlToText', () => {
    test('strips simple tags', () => {
        expect(htmlToText('<p>hello</p>')).toBe('hello');
        expect(htmlToText('<strong>bold</strong>')).toBe('bold');
    });

    test('removes <style> and <script> blocks entirely', () => {
        const html = '<style>p{color:red}</style><p>visible</p><script>alert(1)</script>';
        expect(htmlToText(html)).toBe('visible');
    });

    test('replaces <br> with newline', () => {
        expect(htmlToText('Line 1<br>Line 2')).toBe('Line 1\nLine 2');
        expect(htmlToText('Line 1<br/>Line 2')).toBe('Line 1\nLine 2');
        expect(htmlToText('Line 1<br />Line 2')).toBe('Line 1\nLine 2');
    });

    test('inserts newlines after closing block tags', () => {
        const out = htmlToText('<p>first</p><p>second</p>');
        expect(out).toBe('first\nsecond');
    });

    test('decodes HTML entities', () => {
        // &nbsp; becomes a literal space, so the surrounding spaces compound.
        // Order of replacements: &amp;->&, &lt;-><, &gt;->>, &quot;->", &nbsp;-> .
        expect(htmlToText('&amp;')).toBe('&');
        expect(htmlToText('&lt;')).toBe('<');
        expect(htmlToText('&gt;')).toBe('>');
        expect(htmlToText('&quot;')).toBe('"');
        expect(htmlToText('a&nbsp;b')).toBe('a b');
    });

    test('collapses 3+ consecutive newlines to 2', () => {
        expect(htmlToText('<p>a</p><p>b</p><p>c</p>')).toBe('a\nb\nc');
        expect(htmlToText('a<br/><br/><br/><br/>b')).toBe('a\n\nb');
    });

    test('trims leading and trailing whitespace', () => {
        expect(htmlToText('  <p>hi</p>  ')).toBe('hi');
    });
});

test.describe('encodeHeader (RFC 2047)', () => {
    test('passes through ASCII subjects unchanged', () => {
        expect(encodeHeader('Hello World')).toBe('Hello World');
        expect(encodeHeader('Re: Meeting tomorrow')).toBe('Re: Meeting tomorrow');
    });

    test('passes through ASCII punctuation unchanged', () => {
        expect(encodeHeader('Re: [PR #234] please review')).toBe('Re: [PR #234] please review');
    });

    test('base64-encodes when subject contains emoji', () => {
        const result = encodeHeader('Coffee tomorrow ☕');
        expect(result.startsWith('=?UTF-8?B?')).toBe(true);
        expect(result.endsWith('?=')).toBe(true);
        // Decoding must round-trip
        const inner = result.slice('=?UTF-8?B?'.length, -2);
        expect(Buffer.from(inner, 'base64').toString('utf8')).toBe('Coffee tomorrow ☕');
    });

    test('base64-encodes when subject contains accented chars', () => {
        const result = encodeHeader('Café meeting');
        expect(result.startsWith('=?UTF-8?B?')).toBe(true);
        const inner = result.slice('=?UTF-8?B?'.length, -2);
        expect(Buffer.from(inner, 'base64').toString('utf8')).toBe('Café meeting');
    });

    test('handles empty string', () => {
        expect(encodeHeader('')).toBe('');
    });
});

test.describe('buildRawEmail (plain text)', () => {
    test('builds a basic plain-text email with To + Subject + body', () => {
        const raw = decodeRawEmail(buildRawEmail({
            to: 'alice@example.com',
            subject: 'Hello',
            body: 'plain body',
        }));
        expect(raw).toContain('To: alice@example.com');
        expect(raw).toContain('Subject: Hello');
        expect(raw).toContain('MIME-Version: 1.0');
        expect(raw).toContain('Content-Type: text/plain; charset="UTF-8"');
        expect(raw).toContain('plain body');
    });

    test('includes Cc and Bcc when provided', () => {
        const raw = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'Test',
            body: 'body',
            cc: 'b@example.com',
            bcc: 'c@example.com',
        }));
        expect(raw).toContain('Cc: b@example.com');
        expect(raw).toContain('Bcc: c@example.com');
    });

    test('omits Cc and Bcc when not provided', () => {
        const raw = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'Test',
            body: 'body',
        }));
        expect(raw).not.toContain('Cc:');
        expect(raw).not.toContain('Bcc:');
    });

    test('includes From when provided, omits otherwise', () => {
        const withFrom = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'Test',
            body: 'body',
            from: 'bob@example.com',
        }));
        expect(withFrom).toContain('From: bob@example.com');

        const withoutFrom = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'Test',
            body: 'body',
        }));
        expect(withoutFrom).not.toContain('From:');
    });

    test('encodes non-ASCII subject via RFC 2047', () => {
        const raw = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'Café ☕',
            body: 'body',
        }));
        expect(raw).toContain('Subject: =?UTF-8?B?');
    });

    test('uses CRLF line endings (RFC 5322)', () => {
        const raw = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'Test',
            body: 'body',
        }));
        // The spec mandates CRLF between headers
        expect(raw).toContain('\r\n');
    });
});

test.describe('buildRawEmail (HTML)', () => {
    test('detects HTML body and emits multipart/alternative', () => {
        const raw = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'Newsletter',
            body: '<p>Hello there</p>',
        }));
        expect(raw).toContain('Content-Type: multipart/alternative; boundary="ou-mail-');
        expect(raw).toContain('Content-Type: text/plain; charset="UTF-8"');
        expect(raw).toContain('Content-Type: text/html; charset="UTF-8"');
        // Both parts present
        expect(raw).toContain('<p>Hello there</p>');
        expect(raw).toContain('Hello there'); // text fallback derived from HTML
    });

    test('explicit html field overrides body detection', () => {
        const raw = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'Test',
            body: 'plain alternative',
            html: '<p>HTML version</p>',
        }));
        expect(raw).toContain('multipart/alternative');
        expect(raw).toContain('plain alternative'); // text part is the body
        expect(raw).toContain('<p>HTML version</p>'); // html part is the html field
    });

    test('boundary marker is unique per email (timestamp + random)', () => {
        const a = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'A',
            body: '<p>html</p>',
        }));
        const b = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'B',
            body: '<p>html</p>',
        }));
        const aBoundary = a.match(/boundary="([^"]+)"/)?.[1];
        const bBoundary = b.match(/boundary="([^"]+)"/)?.[1];
        expect(aBoundary).toBeDefined();
        expect(bBoundary).toBeDefined();
        // Different calls -> different boundaries (Date.now() advances OR random differs)
        expect(aBoundary).not.toBe(bBoundary);
    });

    test('plain-text body without HTML tags stays single-part text/plain', () => {
        const raw = decodeRawEmail(buildRawEmail({
            to: 'a@example.com',
            subject: 'Test',
            body: 'just plain text\nno tags here',
        }));
        expect(raw).not.toContain('multipart/alternative');
        expect(raw).toContain('Content-Type: text/plain; charset="UTF-8"');
    });
});
