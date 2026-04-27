import { NextResponse } from 'next/server';
import { preflight } from '@/lib/webacy-risk';
import { withRequestMeta, errorResponse, validationError } from '@/lib/apiHelpers';

export async function POST(request: Request) {
  const meta = withRequestMeta(request, 'risk');
  try {
    const body = await request.json();
    const { type, params } = body;

    if (!type || !params) {
      return validationError('type and params required', 'Pass type and params in the JSON body.', meta, {
        missing: [!type && 'type', !params && 'params'].filter(Boolean),
      });
    }

    const result = await preflight({ type, params });
    return NextResponse.json(result, { headers: meta.headers });
  } catch (err) {
    return errorResponse(err, meta);
  }
}
