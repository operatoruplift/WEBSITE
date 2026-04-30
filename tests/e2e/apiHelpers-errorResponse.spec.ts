import { test, expect } from '@playwright/test';
import { errorResponse, validationError, withRequestMeta } from '@/lib/apiHelpers';

/**
 * Unit tests for errorResponse + validationError in lib/apiHelpers.ts.
 *
 * These two helpers produce every error response from /api/* routes.
 * A regression in either changes the shape of every chat-UI error
 * card, breaking the calm-copy contract documented in the error
 * envelope spec.
 *
 * Run:
 *   pnpm exec playwright test tests/e2e/apiHelpers-errorResponse.spec.ts --reporter=list
 */

function makeMeta(route = 'test.route') {
    const req = new Request('https://x.test/api/' + route);
    return withRequestMeta(req, route);
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
    return await res.json() as Record<string, unknown>;
}

test.describe('errorResponse', () => {
    test('returns NextResponse with X-Request-Id from meta.headers', async () => {
        const meta = makeMeta();
        const res = errorResponse(new Error('boom'), meta);
        expect(res.headers.get('x-request-id')).toBe(meta.requestId);
    });

    test('classifies plain Error as "unknown" → status 500', async () => {
        const meta = makeMeta();
        const res = errorResponse(new Error('something went wrong'), meta);
        expect(res.status).toBe(500);
        const body = await readJson(res);
        expect(body.errorClass).toBe('unknown');
    });

    test('errorClass override wins over auto-classification', async () => {
        const meta = makeMeta();
        const res = errorResponse(new Error('x'), meta, { errorClass: 'provider_unavailable' });
        expect(res.status).toBe(503);
        const body = await readJson(res);
        expect(body.errorClass).toBe('provider_unavailable');
    });

    test('httpHint >= 400 wins over the taxonomy default', async () => {
        const meta = makeMeta();
        // unknown taxonomy → 500. httpHint 422 should win.
        const res = errorResponse(new Error('bad input'), meta, { httpHint: 422 });
        expect(res.status).toBe(422);
    });

    test('httpHint < 400 is ignored (taxonomy default wins)', async () => {
        const meta = makeMeta();
        // 200 isn't a real "error" hint; statusFor strips it.
        const res = errorResponse(new Error('x'), meta, { httpHint: 200 });
        expect(res.status).toBe(500);
    });

    test('body has the documented envelope fields', async () => {
        const meta = makeMeta();
        const res = errorResponse(new Error('detail string'), meta);
        const body = await readJson(res);
        expect(body).toHaveProperty('errorClass');
        expect(body).toHaveProperty('reason');
        expect(body).toHaveProperty('recovery');
        expect(body).toHaveProperty('message');
        expect(body).toHaveProperty('nextAction');
        expect(body.requestId).toBe(meta.requestId);
        expect(body.timestamp).toBe(meta.startedAt);
    });

    test('details opts attaches a "details" field on the body', async () => {
        const meta = makeMeta();
        const res = errorResponse(new Error('x'), meta, { details: { provider: 'photon', op: 'send' } });
        const body = await readJson(res);
        expect(body.details).toEqual({ provider: 'photon', op: 'send' });
    });

    test('details omitted ⇒ no "details" key in body', async () => {
        const meta = makeMeta();
        const res = errorResponse(new Error('x'), meta);
        const body = await readJson(res);
        expect('details' in body).toBe(false);
    });

    test('non-Error input is coerced to its string form', async () => {
        const meta = makeMeta();
        const res = errorResponse('plain string error', meta);
        expect(res.status).toBe(500);
        // The string is in the envelope's message/detail field.
        const body = await readJson(res);
        const text = JSON.stringify(body);
        expect(text).toContain('plain string error');
    });

    test('null/undefined error coerces to "unknown" message', async () => {
        const meta = makeMeta();
        const res = errorResponse(undefined, meta);
        expect(res.status).toBe(500);
        const body = await readJson(res);
        const text = JSON.stringify(body);
        expect(text).toContain('unknown');
    });
});

test.describe('validationError', () => {
    test('returns NextResponse with status 400', () => {
        const meta = makeMeta();
        const res = validationError('Field x required', 'Pass x in the body.', meta);
        expect(res.status).toBe(400);
    });

    test('attaches X-Request-Id from meta.headers', () => {
        const meta = makeMeta();
        const res = validationError('msg', 'next', meta);
        expect(res.headers.get('x-request-id')).toBe(meta.requestId);
    });

    test('body has documented validation envelope shape', async () => {
        const meta = makeMeta();
        const res = validationError('Field x required', 'Pass x in the body.', meta);
        const body = await readJson(res);
        expect(body.error).toBe('Field x required');
        expect(body.errorClass).toBe('unknown');
        expect(body.reason).toBe('input_invalid');
        expect(body.recovery).toBe('retry');
        expect(body.message).toBe('Field x required');
        expect(body.nextAction).toBe('Pass x in the body.');
        expect(body.requestId).toBe(meta.requestId);
        expect(body.timestamp).toBe(meta.startedAt);
    });

    test('details opts attaches a "details" field', async () => {
        const meta = makeMeta();
        const res = validationError('x', 'next', meta, { missing: ['name', 'email'] });
        const body = await readJson(res);
        expect(body.details).toEqual({ missing: ['name', 'email'] });
    });

    test('details omitted ⇒ no "details" key', async () => {
        const meta = makeMeta();
        const res = validationError('x', 'next', meta);
        const body = await readJson(res);
        expect('details' in body).toBe(false);
    });

    test('message and nextAction are not transformed', async () => {
        const meta = makeMeta();
        const message = 'Multi-line\nmessage with "quotes" and special chars: <>';
        const nextAction = 'Try again, then hit /docs.';
        const res = validationError(message, nextAction, meta);
        const body = await readJson(res);
        expect(body.message).toBe(message);
        expect(body.nextAction).toBe(nextAction);
    });
});
