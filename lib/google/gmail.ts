/**
 * Gmail integration — server-side helpers.
 *
 * Functions for listing, reading, drafting, and sending emails.
 * Auth is handled transparently via lib/google/oauth.ts.
 */
import { google } from 'googleapis';
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
    draft: { to: string; subject: string; body: string; cc?: string; bcc?: string },
): Promise<DraftResult> {
    const auth = await getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const raw = buildRawEmail(draft);

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
    email: { to: string; subject: string; body: string; cc?: string; bcc?: string },
): Promise<SendResult> {
    const auth = await getAuthenticatedClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    const raw = buildRawEmail(email);

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

function buildRawEmail(email: {
    to: string;
    subject: string;
    body: string;
    cc?: string;
    bcc?: string;
}): string {
    const lines = [
        `To: ${email.to}`,
        email.cc ? `Cc: ${email.cc}` : '',
        email.bcc ? `Bcc: ${email.bcc}` : '',
        'Content-Type: text/plain; charset="UTF-8"',
        'MIME-Version: 1.0',
        `Subject: ${email.subject}`,
        '',
        email.body,
    ]
        .filter(Boolean)
        .join('\r\n');

    return Buffer.from(lines).toString('base64url');
}

function getHeader(
    headers: { name?: string | null; value?: string | null }[] | undefined,
    name: string,
): string {
    return headers?.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';
}

function toGmailMessage(msg: any): GmailMessage {
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
