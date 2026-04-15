import { NextResponse } from 'next/server';
import { getProviderStatus } from '@/lib/llm';

export async function GET() {
    return NextResponse.json(getProviderStatus());
}
