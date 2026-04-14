# Idea Context — Prediction Market on Solana

## Domain
Prediction markets / information markets / event contracts on Solana

## Landscape

### Direct Competitors
| Name | URL | Status | Strength | Weakness |
|------|-----|--------|----------|----------|
| Drift Protocol (BET) | drift.trade | Live | Existing DeFi userbase, cross-margining with perps | Prediction markets are a side feature |
| Jupiter Prediction Markets | jup.ag | Live | Largest Solana DEX, massive distribution | Late entrant, markets are an add-on |
| Monaco Protocol | github.com/MonacoProtocol | Live | Fully on-chain, composable, open-source | Low adoption (27 stars), depends on frontends |
| Hedgehog Markets | hedgehog.markets | Quiet | Novel no-loss parimutuel model | Small TVL, limited markets |
| Hxro Network | hxro.com | Pivot | Institutional-grade architecture | Pivoted multiple times, unclear focus |
| Capitola | Colosseum winner | Beta | Meta-aggregator across prediction platforms | Aggregator, not a market maker |

### Substitutes
| Name | Approach | Why Users Stay |
|------|----------|---------------|
| Polymarket | Polygon-based, dominant volume | Liquidity moat, brand recognition, election cycle momentum |
| Kalshi | CFTC-regulated centralized exchange | Regulatory legitimacy, institutional trust |
| Manifold Markets | Play-money prediction markets | Zero financial risk, instant market creation, social features |
| Metaculus | Reputation-based forecasting (no money) | Intellectual community, no financial risk |

### Dead Projects
| Name | Why Failed |
|------|-----------|
| Augur | High gas costs, complex UX, slow oracle resolution, liquidity death spiral |
| Veil | Built on broken Augur infrastructure + regulatory concerns |
| Frontrunner | Sports-only too narrow, team went quiet |
| Gnosis/Omen | Gnosis pivoted to chain infrastructure, Omen had negligible volume |

### Assessment
- **Crowdedness:** crowded (cross-chain), moderate (Solana-native)
- **Moat type:** Network effects (liquidity) + AI data advantage
- **Differentiation:** AI-native prediction market with agent-based market making, chat-native trading, and multi-agent governance (futarchy-style decision-making inside swarms)

## Recommended Angles
1. AI-native prediction market (LLM pricing + resolution + chat interface)
2. Cross-margined prediction + perps (build before Hyperliquid HIP-4)
3. Micro-prediction markets for agent governance (futarchy inside multi-agent swarms)
