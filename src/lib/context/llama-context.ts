/**
 * DefiLlama API Context for LLM
 * Reference: https://api-docs.defillama.com/llms.txt
 * Focus: Swap/DEX endpoints for Sui chain
 */

export const LLAMA_API_CONTEXT = `# DeFiLlama API Complete LLM Context for DEX Applications

## Overview
This document provides comprehensive context for LLMs to interact with DeFiLlama APIs specifically for DEX (Decentralized Exchange) applications requiring price, yield, and chain data.

## Base URLs and Authentication

### Main API Endpoints
- **Primary API**: \`https://api.llama.fi\`
- **Coins API**: \`https://coins.llama.fi\`
- **Stablecoins API**: \`https://stablecoins.llama.fi\`
- **Yields API**: \`https://yields.llama.fi\`
- **Free endpoints**: No authentication required

## Core Endpoints for DEX Applications

### 1. TOKEN PRICES (Essential for DEX)

#### Get Current Token Prices
\`\`\`
GET https://coins.llama.fi/prices/current/{coins}
\`\`\`
**Purpose**: Retrieve real-time token prices for DEX trading pairs
**Parameters**:
- \`coins\` (path, required): Comma-separated tokens defined as \`{chain}:{address}\`
- \`searchWidth\` (query, optional): Time range to find price data, defaults to 6 hours

**Token Format Examples**:
- \`ethereum:0xdF574c24545E5FfEcb9a659c229253D4111d87e1\`
- \`bsc:0x762539b45a1dcce3d36d080f74d1aed37844b878\`
- \`coingecko:ethereum\` (using CoinGecko ID)
- \`arbitrum:0x4277f8f2c384827b5273592ff7cebd9f2c1ac258\`

**Response Format**:
\`\`\`json
{
  "coins": {
    "ethereum:0xdF574c24545E5FfEcb9a659c229253D4111d87e1": {
      "decimals": 8,
      "price": 0.022053735051098835,
      "symbol": "cDAI",
      "timestamp": 1648680149,
      "confidence": 0.99
    }
  }
}
\`\`\`

#### Get Historical Token Prices
\`\`\`
GET https://coins.llama.fi/prices/historical/{timestamp}/{coins}
\`\`\`
**Purpose**: Retrieve token prices at specific historical timestamp
**Parameters**:
- \`timestamp\` (path, required): UNIX timestamp
- \`coins\` (path, required): Comma-separated token list
- \`searchWidth\` (query, optional): Time range to find price data

#### Get Token Price Charts
\`\`\`
GET https://coins.llama.fi/chart/{coins}
\`\`\`
**Purpose**: Get token prices at regular intervals for charts
**Parameters**:
- \`coins\` (path, required): Comma-separated tokens
- \`start\` (query, optional): Unix timestamp of earliest data point
- \`end\` (query, optional): Unix timestamp of latest data point
- \`span\` (query, optional): Number of data points returned
- \`period\` (query, optional): Duration between data points (default 24h)
- \`searchWidth\` (query, optional): Time range to find price data

**Response Format**:
\`\`\`json
{
  "coins": {
    "ethereum:0xdF574c24545E5FfEcb9a659c229253D4111d87e1": {
      "decimals": 8,
      "confidence": 0.99,
      "prices": [
        {
          "timestamp": 1666790570,
          "price": 0.984519
        }
      ],
      "symbol": "HUSD"
    }
  }
}
\`\`\`

#### Get Price Percentage Changes
\`\`\`
GET https://coins.llama.fi/percentage/{coins}
\`\`\`
**Purpose**: Get percentage change in price over time
**Parameters**:
- \`coins\` (path, required): Comma-separated tokens
- \`timestamp\` (query, optional): Timestamp of data point (defaults to now)
- \`lookForward\` (query, optional): Look forward from timestamp (default false)
- \`period\` (query, optional): Duration for comparison (default 24h)

### 2. DEX VOLUME DATA

#### DEX Overview
\`\`\`
GET https://api.llama.fi/overview/dexs
\`\`\`
**Purpose**: List all DEXs with volume summaries and historical data
**Parameters**:
- \`excludeTotalDataChart\` (query, optional): Exclude aggregated chart
- \`excludeTotalDataChartBreakdown\` (query, optional): Exclude breakdown chart

**Response Format**:
\`\`\`json
{
  "protocols": [
    {
      "name": "Uniswap",
      "displayName": "Uniswap V3",
      "total24h": 1500000000,
      "total7d": 10000000000,
      "change_1d": 5.2,
      "change_7d": -2.1,
      "chains": ["Ethereum", "Polygon"]
    }
  ],
  "totalDataChart": [
    [1640995200, 2500000000]
  ],
  "allChains": ["Ethereum", "BSC", "Polygon"]
}
\`\`\`

#### DEX Data by Chain
\`\`\`
GET https://api.llama.fi/overview/dexs/{chain}
\`\`\`
**Purpose**: Get DEX volume data filtered by specific chain

#### DEX Protocol Summary
\`\`\`
GET https://api.llama.fi/summary/dexs/{protocol}
\`\`\`
**Purpose**: Get detailed volume data for specific DEX protocol

### 3. YIELD FARMING DATA

#### All Yield Pools
\`\`\`
GET https://yields.llama.fi/pools
\`\`\`
**Purpose**: Retrieve latest data for all yield farming pools
**Response Format**:
\`\`\`json
{
  "status": "success",
  "data": [
    {
      "pool": "747c1d2a-c668-4682-b9f9-296708a3dd90",
      "chain": "Ethereum",
      "project": "Aave",
      "symbol": "USDC",
      "tvlUsd": 1500000000,
      "apy": 5.2,
      "apyBase": 3.1,
      "apyReward": 2.1,
      "rewardTokens": ["COMP", "AAVE"],
      "underlyingTokens": ["USDC"],
      "poolMeta": "Lending pool"
    }
  ]
}
\`\`\`

## Token Address Formats

### Supported Chains and Formats
- **Ethereum**: \`ethereum:0x{address}\`
- **BSC**: \`bsc:0x{address}\`
- **Polygon**: \`polygon:0x{address}\`
- **Arbitrum**: \`arbitrum:0x{address}\`
- **Avalanche**: \`avax:0x{address}\`
- **Fantom**: \`fantom:0x{address}\`
- **Optimism**: \`optimism:0x{address}\`
- **CoinGecko ID**: \`coingecko:{coin_id}\`

### Common Token Examples
- **USDC (Ethereum)**: \`ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48\`
- **USDT (Ethereum)**: \`ethereum:0xdAC17F958D2ee523a2206206994597C13D831ec7\`
- **WETH (Ethereum)**: \`ethereum:0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\`
- **USDC (Polygon)**: \`polygon:0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174\`
- **Bitcoin**: \`coingecko:bitcoin\`
- **Ethereum**: \`coingecko:ethereum\`
- **SUI**: \`coingecko:sui\`

## Rate Limits and Best Practices

### Rate Limits
- Free tier: 300 requests per 5 minutes
- No API key required for public endpoints

### Best Practices
1. **Batch requests**: Combine multiple tokens in single price requests
2. **Cache frequently used data**: Store chain lists, protocol metadata
3. **Handle errors gracefully**: Implement retry logic for failed requests
4. **Validate inputs**: Check token address formats before API calls
5. **Use appropriate endpoints**: Choose most specific endpoint for your needs

## Integration Examples

### JavaScript/Node.js
\`\`\`javascript
// Get current SUI price
const response = await fetch('https://coins.llama.fi/prices/current/coingecko:sui');
const data = await response.json();
const suiPrice = data.coins['coingecko:sui'].price;

// Get DEX volume overview
const dexResponse = await fetch('https://api.llama.fi/overview/dexs');
const dexData = await dexResponse.json();

// Get multiple token prices
const tokens = 'ethereum:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48,coingecko:ethereum';
const pricesResponse = await fetch(\`https://coins.llama.fi/prices/current/\${tokens}\`);
\`\`\`

### Data Freshness
- **Token Prices**: Updated every 1-2 minutes
- **TVL Data**: Updated hourly
- **Volume Data**: Updated continuously
- **Yield Data**: Updated hourly
- **Chain Data**: Updated hourly

This comprehensive context provides LLMs with all necessary information to effectively interact with DeFiLlama APIs for DEX applications, covering price data, volume metrics, yield farming, and chain analytics.`;
