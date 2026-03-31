import { NextResponse } from 'next/server';
import { getGoldPrice, getGoldBalance, getGoldTransactions } from '@/lib/oro-grail';

export async function GET() {
  try {
    const [price, balance, transactions] = await Promise.all([
      getGoldPrice(),
      getGoldBalance(),
      getGoldTransactions(),
    ]);

    return NextResponse.json({ price, balance, transactions });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
