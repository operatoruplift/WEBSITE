// Oro GRAIL API integration
// Enables gold-backed digital asset transactions for agents

export interface GoldBalance {
  balanceOz: number;
  balanceUsd: number;
  lastUpdated: string;
}

export interface GoldTransaction {
  id: string;
  type: 'buy' | 'sell' | 'round_up' | 'dca' | 'cashback';
  amountOz: number;
  amountUsd: number;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface GoldPriceData {
  pricePerOz: number;
  change24h: number;
  high24h: number;
  low24h: number;
}

const GRAIL_API_BASE = process.env.NEXT_PUBLIC_ORO_GRAIL_API_URL || 'https://api.grail.oro.com/v1';

/** Get current gold spot price */
export async function getGoldPrice(): Promise<GoldPriceData> {
  // Demo data until API key is configured
  return {
    pricePerOz: 3284.50,
    change24h: 1.2,
    high24h: 3301.00,
    low24h: 3265.80,
  };
}

/** Get user's tokenized gold balance */
export async function getGoldBalance(): Promise<GoldBalance> {
  return {
    balanceOz: 0.0847,
    balanceUsd: 278.24,
    lastUpdated: new Date().toISOString(),
  };
}

/** Get transaction history */
export async function getGoldTransactions(): Promise<GoldTransaction[]> {
  return [
    { id: '1', type: 'dca', amountOz: 0.015, amountUsd: 49.27, timestamp: '2026-03-30T10:00:00Z', status: 'completed' },
    { id: '2', type: 'round_up', amountOz: 0.003, amountUsd: 9.85, timestamp: '2026-03-29T14:30:00Z', status: 'completed' },
    { id: '3', type: 'cashback', amountOz: 0.001, amountUsd: 3.28, timestamp: '2026-03-28T09:00:00Z', status: 'completed' },
    { id: '4', type: 'dca', amountOz: 0.015, amountUsd: 49.27, timestamp: '2026-03-23T10:00:00Z', status: 'completed' },
  ];
}
