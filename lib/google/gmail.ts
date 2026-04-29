/**
 * Gmail integration, server-side helpers.
 *
 * Functions for listing, reading, drafting, and sending emails.
 * Auth is handled transparently via lib/google/oauth.ts.
 */
import { google, gmail_v1 } from 'googleapis';
import { getAuthenticatedClient } from './oauth';

export interface GmailMessage {
    id: string;
    threadId: string;
    from: string;
    to: string;
    subject: string;
    snippet: string;
    date: string;
    body?: string;
}

export interface DraftResult {
    draftId: string;
    messageId: string;
    threadId: string;
}

export interface SendResult {
    messageId: string;
    threadId: string;
    labelIds: string[];
}

/** List recent messages matching a query (default: inbox, last 20). */
export async function listMessages(
    userId: string,
    query: string = 'in:inbox',
    maxResults: number = 20,
): Promise<GmailMessage[]> {
    const auth = await getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
    });

    const ids = res.data.messages ?? [];
    if (ids.length === 0) return [];

    // Batch-fetch message headers (not full body for list view)
    const messages = await Promise.all(
        ids.slice(0, maxResults).map(async ({ id }) => {
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: id!,
                format: 'metadata',
                metadataHeaders: ['From', 'To', 'Subject', 'Date'],
            });
            return toGmailMessage(msg.data);
        }),
    );

    return messages;
}

/** Read a single message by ID (includes body). */
export async function readMessage(
    userId: string,
    messageId: string,
): Promise<GmailMessage> {
    const auth = await getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const msg = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
    });

    const result = toGmailMessage(msg.data);

    // Extract text body
    const parts = msg.data.payload?.parts ?? [];
    const textPart =
        parts.find((p) => p.mimeType === 'text/plain') ??
        (msg.data.payload?.mimeType === 'text/plain' ? msg.data.payload : null);

    if (textPart?.body?.data) {
        result.body = Buffer.from(textPart.body.data, 'base64url').toString('utf-8');
    }

    return result;
}

/** Create a draft email. Returns the draft ID so it can be sent separately. */
export async function createDraft(
    userId: string,
    draft: { to: string; subject: string; body: string; html?: string; cc?: string; bcc?: string },
): Promise<DraftResult> {
    const auth = await getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const fromAddr = await getFromAddress(gmail);
    const raw = buildRawEmail({ ...draft, from: fromAddr });

    const res = await gmail.users.drafts.create({
        userId: 'me',
        requestBody: {
            message: { raw },
        },
    });

    return {
        draftId: res.data.id ?? '',
        messageId: res.data.message?.id ?? '',
        threadId: res.data.message?.threadId ?? '',
    };
}

/** Send a draft by its draft ID. */
export async function sendDraft(
    userId: string,
    draftId: string,
): Promise<SendResult> {
    const auth = await getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const res = await gmail.users.drafts.send({
        userId: 'me',
        requestBody: { id: draftId },
    });

    return {
        messageId: res.data.id ?? '',
        threadId: res.data.threadId ?? '',
        labelIds: res.data.labelIds ?? [],
    };
}

/** Send an email directly (no draft step). */
export async function sendEmail(
    userId: string,
    email: { to: string; subject: string; body: string; html?: string; cc?: string; bcc?: string },
): Promise<SendResult> {
    const auth = await getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const fromAddr = await getFromAddress(gmail);
    const raw = buildRawEmail({ ...email, from: fromAddr });

    const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
    });

    return {
        messageId: res.data.id ?? '',
        threadId: res.data.threadId ?? '',
        labelIds: res.data.labelIds ?? [],
    };
}

// ---- internal helpers ----

/**
 * Resolve the authenticated user's primary email so we can write an
 * explicit From header. Gmail fills From automatically when it's
 * missing, but some receiving servers flag messages without one.
 * Cached per-process via the authenticated client.
 */
async function getFromAddress(gmail: ReturnType<typeof google.gmail>): Promise<string | null> {
    try {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        return profile.data.emailAddress ?? null;
    } catch {
        return null;
    }
}

/**
 * Detect whether a body string contains HTML markup. Keeps the
 * heuristic loose on purpose, the LLM's "professional clean HTML"
 * output usually has <html>, <body>, <p>, or <div>, and we'd rather
 * false-positive into multipart/alternative than false-negative into
 * a plain-text send that shows raw tags.
 */
export function looksLikeHtml(body: string): boolean {
    return /<\s*(html|body|p|div|table|a\s|br\s*\/?|ul|ol|li|h[1-6]|strong|em|span)\b/i.test(body);
}

/** Quick-and-safe text fallback derived from HTML. Strips tags + collapses whitespace. */
export function htmlToText(html: string): string {
    return html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

/**
 * Encode a header value per RFC 2047 when it has non-ASCII bytes.
 * Gmail's REST API rewrites ASCII subjects fine, but emojis and
 * accented characters need `=?UTF-8?B?...?=` or the recipient sees
 * `???` and some strict MTAs (e.g. Proofpoint) bounce the message.
 */
export function encodeHeader(value: string): string {
    if (/^[\x20-\x7e]*$/.test(value)) return value;
    const b64 = Buffer.from(value, 'utf8').toString('base64');
    return `=?UTF-8?B?${b64}?=`;
}

export function buildRawEmail(email: {
    to: string;
    subject: string;
    body: string;
    html?: string;
    cc?: string;
    bcc?: string;
    from?: string | null;
}): string {
    const hasExplicitHtml = Boolean(email.html);
    const bodyIsHtml = !hasExplicitHtml && looksLikeHtml(email.body);
    const htmlPart = hasExplicitHtml ? email.html! : bodyIsHtml ? email.body : null;
    const textPart = htmlPart
        ? (hasExplicitHtml ? (email.body && !looksLikeHtml(email.body) ? email.body : htmlToText(htmlPart)) : htmlToText(htmlPart))
        : email.body;

    const headers: string[] = [
        `To: ${email.to}`,
        email.from ? `From: ${email.from}` : '',
        email.cc ? `Cc: ${email.cc}` : '',
        email.bcc ? `Bcc: ${email.bcc}` : '',
        `Subject: ${encodeHeader(email.subject)}`,
        'MIME-Version: 1.0',
    ].filter(Boolean);

    let message: string;
    if (htmlPart) {
        // multipart/alternative, clients render the HTML part when they
        // can, fall back to the text part otherwise. Spec-compliant
        // boundary with double newlines between parts.
        const boundary = `ou-mail-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
        message = [
            headers.join('\r\n'),
            '',
            `--${boundary}`,
            'Content-Type: text/plain; charset="UTF-8"',
            'Content-Transfer-Encoding: 7bit',
            '',
            textPart,
            '',
            `--${boundary}`,
            'Content-Type: text/html; charset="UTF-8"',
            'Content-Transfer-Encoding: 7bit',
            '',
            htmlPart,
            '',
            `--${boundary}--`,
        ].join('\r\n');
    } else {
        headers.push('Content-Type: text/plain; charset="UTF-8"');
        headers.push('Content-Transfer-Encoding: 7bit');
        message = [headers.join('\r\n'), '', textPart].join('\r\n');
    }

    return Buffer.from(message, 'utf8').toString('base64url');
}

function getHeader(
    headers: { name?: string | null; value?: string | null }[] | undefined,
    name: string,
): string {
    return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function toGmailMessage(msg: gmail_v1.Schema$Message): GmailMessage {
    const headers = msg.payload?.headers ?? [];
    return {
        id: msg.id ?? '',
        threadId: msg.threadId ?? '',
        from: getHeader(headers, 'From'),
        to: getHeader(headers, 'To'),
        subject: getHeader(headers, 'Subject'),
        snippet: msg.snippet ?? '',
        date: getHeader(headers, 'Date'),
    };
}
