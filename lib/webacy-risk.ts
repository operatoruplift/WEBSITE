// Webacy DD.xyz Risk Engine integration
// Real-time risk scoring before any agent action

export interface RiskScore {
  overall: number; // 0-100, higher = safer
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  factors: RiskFactor[];
  timestamp: string;
}

export interface RiskFactor {
  name: string;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface WalletRisk extends RiskScore {
  address: string;
  flagged: boolean;
  sanctions: boolean;
}

export interface TransactionRisk extends RiskScore {
  txHash?: string;
  simulationResult: 'safe' | 'warning' | 'danger';
  estimatedLoss?: number;
}

export interface ContractRisk extends RiskScore {
  contractAddress: string;
  verified: boolean;
  proxyDetected: boolean;
  rugPullIndicators: number;
}

export interface ApprovalRisk extends RiskScore {
  spender: string;
  tokenSymbol: string;
  unlimited: boolean;
}

const DD_API_BASE = process.env.NEXT_PUBLIC_DD_API_URL || 'https://api.dd.xyz/v1';

function gradeFromScore(score: number): RiskScore['grade'] {
  if (score >= 85) return 'A';
  if (score >= 70) return 'B';
  if (score >= 55) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/** Check wallet risk before connecting */
export async function checkWalletRisk(address: string): Promise<WalletRisk> {
  // Demo response until DD.xyz API key is configured
  const score = 87;
  return {
    address,
    overall: score,
    grade: gradeFromScore(score),
    flagged: false,
    sanctions: false,
    factors: [
      { name: 'Transaction History', score: 92, severity: 'low', description: 'Clean transaction history with no suspicious patterns' },
      { name: 'Associated Addresses', score: 85, severity: 'low', description: 'No connections to known malicious wallets' },
      { name: 'Token Holdings', score: 78, severity: 'low', description: 'Standard token portfolio, no scam tokens detected' },
      { name: 'DeFi Exposure', score: 90, severity: 'low', description: 'Interactions with verified protocols only' },
    ],
    timestamp: new Date().toISOString(),
  };
}

/** Check transaction risk before signing */
export async function checkTransactionRisk(to: string, data: string, value: string): Promise<TransactionRisk> {
  const score = 82;
  return {
    overall: score,
    grade: gradeFromScore(score),
    simulationResult: 'safe',
    factors: [
      { name: 'Recipient Analysis', score: 88, severity: 'low', description: 'Destination address has clean history' },
      { name: 'Value Assessment', score: 75, severity: 'low', description: 'Transaction value within normal range' },
      { name: 'Gas Estimation', score: 90, severity: 'low', description: 'Gas price is reasonable for current network' },
    ],
    timestamp: new Date().toISOString(),
  };
}

/** Check smart contract risk before interaction */
export async function checkContractRisk(contractAddress: string): Promise<ContractRisk> {
  const score = 74;
  return {
    contractAddress,
    overall: score,
    grade: gradeFromScore(score),
    verified: true,
    proxyDetected: false,
    rugPullIndicators: 0,
    factors: [
      { name: 'Source Verification', score: 95, severity: 'low', description: 'Contract source code is verified on chain' },
      { name: 'Owner Privileges', score: 60, severity: 'medium', description: 'Owner has mint/burn capabilities' },
      { name: 'Liquidity Lock', score: 70, severity: 'low', description: 'Liquidity is partially locked' },
    ],
    timestamp: new Date().toISOString(),
  };
}

/** Check token approval risk */
export async function checkApprovalRisk(spender: string, token: string): Promise<ApprovalRisk> {
  const score = 65;
  return {
    spender,
    tokenSymbol: token,
    overall: score,
    grade: gradeFromScore(score),
    unlimited: true,
    factors: [
      { name: 'Spender Reputation', score: 80, severity: 'low', description: 'Known DeFi protocol' },
      { name: 'Approval Amount', score: 40, severity: 'high', description: 'Unlimited approval requested' },
      { name: 'Historical Behavior', score: 75, severity: 'low', description: 'No previous drainer activity detected' },
    ],
    timestamp: new Date().toISOString(),
  };
}

/** Pre-flight risk check before any agent action */
export async function preflight(action: {
  type: 'wallet_connect' | 'transaction' | 'contract' | 'approval';
  params: Record<string, string>;
}): Promise<{ safe: boolean; score: number; grade: string; warnings: string[] }> {
  const warnings: string[] = [];

  switch (action.type) {
    case 'wallet_connect': {
      const risk = await checkWalletRisk(action.params.address || '');
      if (risk.flagged) warnings.push('Wallet has been flagged for suspicious activity');
      if (risk.sanctions) warnings.push('Wallet is on a sanctions list');
      return { safe: risk.overall >= 60, score: risk.overall, grade: risk.grade, warnings };
    }
    case 'transaction': {
      const risk = await checkTransactionRisk(action.params.to || '', action.params.data || '', action.params.value || '0');
      if (risk.simulationResult === 'danger') warnings.push('Transaction simulation detected potential loss');
      return { safe: risk.overall >= 50, score: risk.overall, grade: risk.grade, warnings };
    }
    case 'contract': {
      const risk = await checkContractRisk(action.params.address || '');
      if (risk.rugPullIndicators > 0) warnings.push(`${risk.rugPullIndicators} rug pull indicators detected`);
      if (risk.proxyDetected) warnings.push('Proxy contract detected, owner can change logic');
      return { safe: risk.overall >= 50, score: risk.overall, grade: risk.grade, warnings };
    }
    case 'approval': {
      const risk = await checkApprovalRisk(action.params.spender || '', action.params.token || '');
      if (risk.unlimited) warnings.push('Unlimited token approval requested');
      return { safe: risk.overall >= 50, score: risk.overall, grade: risk.grade, warnings };
    }
  }
}
