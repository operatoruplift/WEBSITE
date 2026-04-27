import { NextResponse } from 'next/server';
import { getGoldPrice, getGoldBalance, getGoldTransactions } from '@/lib/oro-grail';
import { withRequestMeta, errorResponse } from '@/lib/apiHelpers';

export async function GET(request: Request) {
  const meta = withRequestMeta(request, 'gold');
  try {
    const [price, balance, transactions] = await Promise.all([
      getGoldPrice(),
      getGoldBalance(),
      getGoldTransactions(),
    ]);

    return NextResponse.json({ price, balance, transactions }, { headers: meta.headers });
  } catch (err) {
    return errorResponse(err, meta);
  }
}
