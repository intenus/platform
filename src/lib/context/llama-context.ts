/**
 * DefiLlama API Context for LLM
 * Reference: https://api-docs.defillama.com/llms.txt
 * Focus: Swap/DEX endpoints for Sui chain
 */

export const LLAMA_API_CONTEXT = `DefiLlama API – Complete LLM Integration Guide
=====================================================

## Overview

This document provides comprehensive guidance for LLMs to interact with ALL DefiLlama APIs.
Includes API-Plan-only endpoints (marked with 🔒) and free endpoints, with full parameters and responses.

## Base URLs

**Main Pro API** (Most endpoints)
- Base URL: \`https://pro-api.llama.fi\`
- Used for: TVL data, protocols, prices, yields, user metrics, fees

**Bridge API**
- Base URL: \`https://bridges.llama.fi\`
- Used for: Cross-chain bridge data and transactions

## Authentication

**For Pro Endpoints (🔒) on pro-api.llama.fi:**
API key is inserted between base URL and endpoint:
\`\`\`
https://pro-api.llama.fi/<YOUR_API_KEY>/<ENDPOINT>
\`\`\`

**For Free Endpoints and Other Base URLs:**
No authentication required - use endpoints directly:
\`\`\`
https://bridges.llama.fi/<ENDPOINT>
\`\`\`

**Examples:**
\`\`\`bash
# Pro endpoints (requires API key in URL)
GET https://pro-api.llama.fi/abc123key/yields/pools

# Bridge endpoints (no key needed)
GET https://bridges.llama.fi/bridges
\`\`\`

===============================================================================
SECTION 1: TVL & PROTOCOL DATA
===============================================================================

## Core TVL Endpoints

1. **GET /api/protocols**
   Base: \`https://pro-api.llama.fi\`
   Purpose: List all protocols with current TVL
   Parameters: None
   Response:
   \`\`\`json
   [{
     "id": "2269",
     "name": "Aave",
     "symbol": "AAVE",
     "category": "Lending",
     "chains": ["Ethereum", "Polygon"],
     "tvl": 5200000000,
     "chainTvls": {"Ethereum": 3200000000},
     "change_1h": 0.5,
     "change_1d": 2.3,
     "change_7d": -1.2,
     "mcap": 1500000000
   }]
   \`\`\`

2. **GET /api/protocol/{protocol}**
   Base: \`https://pro-api.llama.fi\`
   Purpose: Detailed protocol data including historical TVL
   Parameters:
     - protocol (path, required): Protocol slug (e.g., "aave", "uniswap")
   Response:
   \`\`\`json
   {
     "id": "2269",
     "name": "Aave",
     "symbol": "AAVE",
     "category": "Lending",
     "chains": ["Ethereum", "Polygon"],
     "description": "Decentralized lending protocol",
     "logo": "https://...",
     "url": "https://aave.com",
     "twitter": "AaveAave",
     "chainTvls": {
       "Ethereum": {"tvl": [{"date": 1640995200, "totalLiquidityUSD": 3200000000}]},
       "Polygon": {"tvl": [{"date": 1640995200, "totalLiquidityUSD": 2000000000}]}
     },
     "tvl": [{"date": 1640995200, "totalLiquidityUSD": 5200000000}],
     "currentChainTvls": {"Ethereum": 3200000000},
     "mcap": 1500000000,
     "raises": [{"date": "2020-10-01", "amount": 25000000}],
     "metrics": {
       "fees": {"24h": 234567, "7d": 1645234},
       "revenue": {"24h": 123456, "7d": 864192}
     }
   }
   \`\`\`

3. **GET /api/tvl/{protocol}**
   Base: \`https://pro-api.llama.fi\`
   Purpose: Simple endpoint returning only current TVL number
   Parameters:
     - protocol (path, required): Protocol slug
   Response: \`4962012809.795062\`

4. 🔒 **GET /api/tokenProtocols/{symbol}**
   Base: \`https://pro-api.llama.fi\`
   Purpose: Shows which protocols hold a specific token
   Parameters:
     - symbol (path, required): Token symbol (e.g., "usdt", "dai")
   Response:
   \`\`\`json
   [{
     "name": "Aave",
     "category": "Lending",
     "amountUsd": {
       "coingecko:tether": 1234567.89,
       "coingecko:usdt-avalanche": 98765.43
     }
   }]
   \`\`\`

5. 🔒 **GET /api/inflows/{protocol}/{timestamp}**
   Base: \`https://pro-api.llama.fi\`
   Purpose: Daily capital flows for a protocol
   Parameters:
     - protocol (path, required): Protocol slug
     - timestamp (path, required): Unix timestamp at 00:00 UTC
   Response:
   \`\`\`json
   {
     "outflows": -160563462.23,
     "inflows": 145234567.89,
     "oldTokens": {
       "date": 1700005031,
       "tvl": {"USDC": 27302168.77, "WETH": 138751.92}
     },
     "currentTokens": {
       "date": 1752771743,
       "tvl": {"USDC": 23936602.85, "WETH": 125432.11}
     }
   }
   \`\`\`

## Chain TVL Data

6. **GET /api/v2/chains**
   Base: \`https://pro-api.llama.fi\`
   Purpose: Current TVL of all chains
   Parameters: None
   Response:
   \`\`\`json
   [{
     "gecko_id": "ethereum",
     "tvl": 50000000000,
     "tokenSymbol": "ETH",
     "cmcId": "1027",
     "name": "Ethereum",
     "chainId": 1
   }]
   \`\`\`

7. **GET /api/v2/historicalChainTvl**
   Base: \`https://pro-api.llama.fi\`
   Purpose: Historical TVL for all chains
   Parameters: None
   Response:
   \`\`\`json
   [{
     "date": 1640995200,
     "tvl": {"Ethereum": 150000000000, "BSC": 20000000000}
   }]
   \`\`\`

8. **GET /api/v2/historicalChainTvl/{chain}**
   Base: \`https://pro-api.llama.fi\`
   Purpose: Historical TVL for specific chain
   Parameters:
     - chain (path, required): Chain name (e.g., "Ethereum")
   Response:
   \`\`\`json
   [{
     "date": 1640995200,
     "tvl": 150000000000
   }]
   \`\`\``;