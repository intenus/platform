/**
 * DefiLlama API Context for LLM
 * Reference: https://api-docs.defillama.com/llms.txt
 * Focus: Swap/DEX endpoints for Sui chain
 */

export const LLAMA_API_CONTEXT = `
# DefiLlama API Reference (Swap/DEX Focus)

## Base URL
https://api.llama.fi

## Key Endpoints for Swap Operations

### 1. Chain Overview
GET /v2/chains
- Returns list of all chains including Sui
- Sui data includes: tvl, tokenSymbol, cmcId

### 2. DEX Volume Data
GET /overview/dexs/Sui
- Get aggregated DEX volume for Sui chain
- Query params: excludeTotalDataChart, excludeTotalDataChartBreakdown
- Returns: daily/total volume, top protocols

### 3. Protocol Information
GET /protocols
- Get all DeFi protocols
- Filter by: chain=Sui, category=Dexs
- Returns: name, tvl, category, description, url

### 4. Token Prices
GET /prices/current/{tokens}
- Example: /prices/current/sui,usd-coin,tether
- Returns: price, symbol, timestamp, confidence

### 5. Yield Pools (optional)
GET /yields?chain=Sui
- Get yield opportunities on Sui
- Useful for informing users about alternatives

## Rate Limits
- Free tier: ~300 calls/5min
- Use caching (5min TTL recommended)

## Error Handling
- 429: Rate limit exceeded → retry with backoff
- 404: Resource not found
- 500: API error → fallback to cached data

## Usage in Tools
Use this API to:
- Fetch current token prices for swap quotes
- Get DEX protocol info for routing recommendations
- Check historical volume for market context
`;
