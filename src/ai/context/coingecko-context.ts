/**
 * CoinGecko API Context for LLM
 * Reference: https://docs.coingecko.com/docs/building-with-ai
 * Focus: Token prices and market data
 */

export const COINGECKO_API_CONTEXT = `
# CoinGecko API - Free Guide for Spot Price & Trading

## Overview
CoinGecko free API provides essential endpoints to get current spot prices and basic historical data for crypto trading and market monitoring.

**Free tier limits:**
- 30 requests/minute
- 10,000 requests/month
- No API key required for free tier

## Base URL
\\\`\\\`\\\`
https://api.coingecko.com/api/v3
\\\`\\\`\\\`

## Simple Price APIs (Free)

### 1. Get Current Price by Coin ID
**GET** \`/simple/price\`

Get current price of one or multiple coins.

\\\`\\\`\\\`bash
# Example: Bitcoin and Ethereum price in USD
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd

# With additional market cap and volume
https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true
\\\`\\\`\\\`

**Parameters:**
- \`ids\` (required): List of coin IDs (bitcoin, ethereum, ...)
- \`vs_currencies\` (required): Currency units (usd, eur, btc, eth, ...)
- \`include_market_cap\`: true/false
- \`include_24hr_vol\`: true/false
- \`include_24hr_change\`: true/false

**Response:**
\\\`\\\`\\\`json
{
  "bitcoin": {
    "usd": 43250.50,
    "usd_market_cap": 847329485729,
    "usd_24h_vol": 15728394756,
    "usd_24h_change": 2.35
  },
  "ethereum": {
    "usd": 2650.75,
    "usd_market_cap": 318764928374,
    "usd_24h_vol": 8394857293,
    "usd_24h_change": -1.45
  }
}
\\\`\\\`\\\`

### 2. Get Price by Contract Address
**GET** \`/simple/token_price/{id}\`

Get token price by contract address.

\\\`\\\`\\\`bash
# Example: USDT on Ethereum
https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=0xdac17f958d2ee523a2206206994597c13d831ec7&vs_currencies=usd
\\\`\\\`\\\`

### 3. Supported Currencies List
**GET** \`/simple/supported_vs_currencies\`

\\\`\\\`\\\`bash
https://api.coingecko.com/api/v3/simple/supported_vs_currencies
\\\`\\\`\\\`

## Market Data APIs (Free)

### 1. Coins List with Market Data
**GET** \`/coins/markets\`

Get list of coins with complete market information.

\\\`\\\`\\\`bash
# Top 100 coins by market cap
https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1

# Specific coins
https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&order=market_cap_desc
\\\`\\\`\\\`

**Parameters:**
- \`vs_currency\` (required): usd, eur, btc, etc.
- \`ids\`: List of coin IDs
- \`category\`: Category (defi, dex, layer-1, etc.)
- \`order\`: market_cap_desc, volume_desc, id_asc, etc.
- \`per_page\`: 1-250 (default 100)
- \`page\`: Page number (default 1)
- \`sparkline\`: true/false (7-day mini chart)
- \`price_change_percentage\`: 1h,24h,7d,14d,30d,200d,1y

**Response:**
\\\`\\\`\\\`json
[
  {
    "id": "bitcoin",
    "symbol": "btc",
    "name": "Bitcoin",
    "image": "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    "current_price": 43250.50,
    "market_cap": 847329485729,
    "market_cap_rank": 1,
    "fully_diluted_valuation": 908267305000,
    "total_volume": 15728394756,
    "high_24h": 44120,
    "low_24h": 42890,
    "price_change_24h": 995.50,
    "price_change_percentage_24h": 2.35,
    "market_cap_change_24h": 19485729475,
    "circulating_supply": 19593431,
    "total_supply": 21000000,
    "max_supply": 21000000,
    "ath": 69045,
    "ath_change_percentage": -37.38,
    "ath_date": "2021-11-10T14:24:11.849Z",
    "atl": 67.81,
    "atl_change_percentage": 63686.44,
    "atl_date": "2013-07-06T00:00:00.000Z",
    "last_updated": "2024-12-01T12:34:56.789Z"
  }
]
\\\`\\\`\\\`

### 2. Top Gainers & Losers
**GET** \`/coins/top_gainers_losers\`

\\\`\\\`\\\`bash
https://api.coingecko.com/api/v3/coins/top_gainers_losers?vs_currency=usd&duration=24h
\\\`\\\`\\\`

## Historical Data APIs (Free with limits)

### 1. Price History by Days
**GET** \`/coins/{id}/market_chart\`

\\\`\\\`\\\`bash
# Bitcoin price last 7 days
https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=7

# Bitcoin price last 30 days
https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=30
\\\`\\\`\\\`

**Parameters:**
- \`vs_currency\` (required): usd, eur, btc, etc.
- \`days\` (required): 1, 7, 14, 30, 90, 180, 365, max
- \`interval\`: daily (auto-selected based on time range)

**Response:**
\\\`\\\`\\\`json
{
  "prices": [
    [1701417600000, 43250.50],
    [1701504000000, 43180.25]
  ],
  "market_caps": [
    [1701417600000, 847329485729],
    [1701504000000, 845951732847]
  ],
  "total_volumes": [
    [1701417600000, 15728394756],
    [1701504000000, 16892847593]
  ]
}
\\\`\\\`\\\`

### 2. OHLC Data (Open/High/Low/Close)
**GET** \`/coins/{id}/ohlc\`

\\\`\\\`\\\`bash
# Bitcoin OHLC last 7 days
https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=7
\\\`\\\`\\\`

**Response:**
\\\`\\\`\\\`json
[
  [1701417600000, 43100, 44200, 42900, 43250.50],
  [1701504000000, 43250, 43500, 42800, 43180.25]
]
\\\`\\\`\\\`

## Search & Discovery APIs (Free)

### 1. Search Coins
**GET** \`/search\`

\\\`\\\`\\\`bash
https://api.coingecko.com/api/v3/search?query=bitcoin
\\\`\\\`\\\`

### 2. Trending Coins
**GET** \`/search/trending\`

\\\`\\\`\\\`bash
https://api.coingecko.com/api/v3/search/trending
\\\`\\\`\\\`

### 3. All Coins List
**GET** \`/coins/list\`

\\\`\\\`\\\`bash
# List of all coin IDs
https://api.coingecko.com/api/v3/coins/list

# Include platform info
https://api.coingecko.com/api/v3/coins/list?include_platform=true
\\\`\\\`\\\`

## Exchange Data (Basic Free)

### 1. Exchange List
**GET** \`/exchanges\`

\\\`\\\`\\\`bash
https://api.coingecko.com/api/v3/exchanges?per_page=100
\\\`\\\`\\\`

### 2. Exchange Tickers
**GET** \`/exchanges/{id}/tickers\`

\\\`\\\`\\\`bash
# Binance tickers
https://api.coingecko.com/api/v3/exchanges/binance/tickers?page=1
\\\`\\\`\\\`

## Practical Trading Examples

### Real-time Price Tracking (every 30 seconds)
\\\`\\\`\\\`javascript
// JavaScript example
async function getSpotPrices() {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=usd&include_24hr_change=true'
  );
  const data = await response.json();
  
  console.log('BTC:', data.bitcoin.usd, 'Change:', data.bitcoin.usd_24h_change + '%');
  console.log('ETH:', data.ethereum.usd, 'Change:', data.ethereum.usd_24h_change + '%');
  console.log('BNB:', data.binancecoin.usd, 'Change:', data.binancecoin.usd_24h_change + '%');
}

// Call every 30 seconds (respecting rate limits)
setInterval(getSpotPrices, 30000);
\\\`\\\`\\\`

### Portfolio Tracking
\\\`\\\`\\\`python
# Python example
import requests
import time

def track_portfolio():
    coins = ['bitcoin', 'ethereum', 'solana']
    url = f"https://api.coingecko.com/api/v3/simple/price"
    
    params = {
        'ids': ','.join(coins),
        'vs_currencies': 'usd',
        'include_market_cap': 'true',
        'include_24hr_vol': 'true',
        'include_24hr_change': 'true'
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    for coin in coins:
        if coin in data:
            price = data[coin]['usd']
            change = data[coin]['usd_24h_change']
            print(f"{coin}: \${price} ({change:+.2f}%)")

# Run every 60 seconds
while True:
    track_portfolio()
    time.sleep(60)
\\\`\\\`\\\`

## Rate Limits & Best Practices

### Free tier limits:
- **30 requests/minute**
- **10,000 requests/month**
- No caching, each request counts toward limit

### Best Practices:
1. **Cache data**: Store results and only call API when needed
2. **Batch requests**: Get multiple coins in one request instead of separate requests
3. **Respect rate limits**: Set minimum 2-second delay between requests
4. **Error handling**: Handle HTTP errors and implement retry logic
5. **Use appropriate endpoints**: Use \`/simple/price\` for basic prices, \`/coins/markets\` for complete data

### Example with Rate Limiting:
\\\`\\\`\\\`python
import time
import requests

class CoinGeckoAPI:
    def __init__(self):
        self.base_url = "https://api.coingecko.com/api/v3"
        self.last_request_time = 0
        self.min_interval = 2  # 2 seconds between requests
    
    def _rate_limit(self):
        elapsed = time.time() - self.last_request_time
        if elapsed < self.min_interval:
            time.sleep(self.min_interval - elapsed)
        self.last_request_time = time.time()
    
    def get_price(self, coin_ids, vs_currency='usd'):
        self._rate_limit()
        url = f"{self.base_url}/simple/price"
        params = {
            'ids': ','.join(coin_ids) if isinstance(coin_ids, list) else coin_ids,
            'vs_currencies': vs_currency,
            'include_24hr_change': True
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"API Error: {e}")
            return None
\\\`\\\`\\\`

## Popular Coin IDs

\\\`\\\`\\\`json
{
  "bitcoin": "btc",
  "ethereum": "eth", 
  "binancecoin": "bnb",
  "solana": "sol",
  "cardano": "ada",
  "polkadot": "dot",
  "chainlink": "link",
  "litecoin": "ltc",
  "polygon": "matic",
  "avalanche-2": "avax",
  "uniswap": "uni",
  "wrapped-bitcoin": "wbtc",
  "tether": "usdt",
  "usd-coin": "usdc",
  "binance-usd": "busd"
}
\\\`\\\`\\\`

## Useful Resources

- **API Docs**: https://docs.coingecko.com/
- **Status Page**: https://status.coingecko.com/
- **Pricing**: https://www.coingecko.com/en/api/pricing
- **Support**: https://support.coingecko.com/

---

*Note: These are basic free APIs. For advanced features like on-chain data, derivatives, NFT data, or higher rate limits, upgrade to paid tiers.*
`;
