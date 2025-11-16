/**
 * DefiLlama API Context for LLM
 * Reference: https://api-docs.defillama.com/llms.txt
 * Focus: Sui chain DEX applications
 */

export const LLAMA_API_CONTEXT = `# DeFiLlama API Context for Sui DEX Applications

## Overview
This document provides LLM context for interacting with DeFiLlama APIs specifically for Sui chain DEX applications.

## Base URLs
- **Primary API**: \`https://api.llama.fi\`
- **Coins API**: \`https://coins.llama.fi\`
- **Free endpoints**: No authentication required

## Core Endpoints

### 1. TOKEN PRICES

#### Get Current Token Prices
\`\`\`
GET https://coins.llama.fi/prices/current/{coins}
\`\`\`
**Parameters**:
- \`coins\`: Comma-separated tokens as \`{chain}:{address}\` or \`coingecko:{id}\`
- \`searchWidth\`: Time range to find price data (default 6 hours)

**Sui Token Format**:
- \`coingecko:sui\`

**Response**:
\`\`\`json
{
  "coins": {
    "coingecko:sui": {
      "decimals": 9,
      "price": 2.45,
      "symbol": "SUI",
      "timestamp": 1648680149,
      "confidence": 0.99
    }
  }
}
\`\`\`

#### Historical Prices
\`\`\`
GET https://coins.llama.fi/prices/historical/{timestamp}/{coins}
\`\`\`

#### Price Charts
\`\`\`
GET https://coins.llama.fi/chart/{coins}
\`\`\`
**Parameters**:
- \`start\`, \`end\`: Unix timestamps
- \`span\`: Number of data points
- \`period\`: Duration between points (default 24h)

#### Price Changes
\`\`\`
GET https://coins.llama.fi/percentage/{coins}
\`\`\`
**Parameters**:
- \`period\`: Duration for comparison (default 24h)

### 2. DEX VOLUME DATA

#### DEX Overview
\`\`\`
GET https://api.llama.fi/overview/dexs
\`\`\`

#### Sui DEX Data
\`\`\`
GET https://api.llama.fi/overview/dexs/sui
\`\`\`

## Rate Limits
- Free tier: 300 requests per 5 minutes

## Integration Example
\`\`\`javascript
// Get SUI price
const response = await fetch('https://coins.llama.fi/prices/current/coingecko:sui');
const data = await response.json();
const suiPrice = data.coins['coingecko:sui'].price;

// Get Sui DEX data
const dexResponse = await fetch('https://api.llama.fi/overview/dexs/sui');
const dexData = await dexResponse.json();
\`\`\`

## Data Freshness
- Token Prices: Updated every 1-2 minutes
- Volume Data: Updated continuously`;
