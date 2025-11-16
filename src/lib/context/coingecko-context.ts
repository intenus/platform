/**
 * CoinGecko API Context for LLM
 * Reference: https://docs.coingecko.com/docs/building-with-ai
 * Focus: Token prices and market data
 */

export const COINGECKO_API_CONTEXT = `
# CoinGecko API Reference

## Overview
CoinGecko provides real-time cryptocurrency price and market data.
For AI applications, use their llms.txt optimized endpoints.

## Key Endpoints

### 1. Simple Price
GET /api/v3/simple/price
- Params: ids, vs_currencies
- Example: ?ids=sui&vs_currencies=usd
- Returns: { sui: { usd: 2.17 } }

### 2. Coin Data
GET /api/v3/coins/{id}
- Get detailed coin information
- Includes: price, market_cap, volume, price_change_24h

### 3. Coin Markets
GET /api/v3/coins/markets
- Params: vs_currency, ids
- Returns list with market data

## Popular Coin IDs for Sui Ecosystem
- sui: SUI token
- usd-coin: USDC
- tether: USDT
- weth: Wrapped Ether

## Rate Limits
- Free: 10-50 calls/minute
- Use for price verification when Llama API is unavailable

## Best Practices
- Cache price data (1-5min TTL)
- Use CoinGecko as fallback when Llama API fails
- Prefer Llama for Sui-specific data, CoinGecko for cross-chain prices

## Usage in Tools
Use CoinGecko to:
- Verify prices from multiple sources
- Get 24h price changes for market context
- Fallback when Llama API is down
`;
