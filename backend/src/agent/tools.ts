import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { COINMARKETCAP_API_KEY } from "../config"

import {
  callContract
} from '../handlers/infura'

// Helper function for making API requests to CoinMarketCap
async function makeApiRequest(endpoint: string, params: any = {}) {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      queryParams.append(key, value?.toString() || '')
    }
  })

  const url = `https://pro-api.coinmarketcap.com${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY,
    }
  })

  if (!response.ok) {
    throw new Error(`Error fetching data from CoinMarketCap: ${response.statusText}`)
  }

  return await response.json()
}

// Wrapper function to handle common endpoint patterns
async function handleEndpoint(apiCall: () => Promise<any>) {
  try {
    return await apiCall()
  } catch (error: any) {
    return {
      error: error.message,
      status: error.status || 403
    }
  }
}

export const cryptoCategories = createTool({
  id: "cryptoCategories",
  description: "Returns information about all coin categories available on CoinMarketCap.",
  inputSchema: z.object({
    start: z.number().optional(),
    limit: z.number().optional(),
    id: z.string().optional(),
    slug: z.string().optional(),
    symbol: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
       await makeApiRequest('/v1/cryptocurrency/categories', params)
    )
  }
)

export const cryptoCategory = createTool({
  id: "cryptoCategory",
  description: "Returns information about a single coin category on CoinMarketCap.",
  inputSchema: z.object({
    id: z.string().optional(),
    slug: z.string().optional(),
    symbol: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
       await makeApiRequest('/v1/cryptocurrency/category', params)
    )
  }
)

export const cryptoCurrencyMap = createTool({
  id: "cryptoCurrencyMap",
  description: "Returns a mapping of all cryptocurrencies to unique CoinMarketCap IDs.",
  inputSchema: z.object({
    listing_status: z.string().optional(),
    start: z.number().optional(),
    limit: z.number().optional(),
    sort: z.string().optional(),
    symbol: z.string().optional(),
    aux: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
       await makeApiRequest('/v1/cryptocurrency/map', params)
    )
  }
)

export const cryptoCurrencyMetadata = createTool({
  id: "cryptoCurrencyMetadata",
  description: "Returns all static metadata for one or more cryptocurrencies including logo, description, and website URLs.",
  inputSchema: z.object({
    symbol: z.string().optional(),
    id: z.string().optional(),
    slug: z.string().optional(),
    address: z.string().optional(),
    aux: z.string().optional(),
    skip_invalid: z.boolean().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
       await makeApiRequest('/v1/cryptocurrency/info', params)
    )
  }
)

export const allCryptocurrencyListings = createTool({
  id: "allCryptocurrencyListings",
  description: "Returns a paginated list of all active cryptocurrencies with latest market data.",
  inputSchema: z.object({
    start: z.number().optional(),
    limit: z.number().min(1).max(5000).optional(),
    price_min: z.number().optional(),
    price_max: z.number().optional(),
    market_cap_min: z.number().optional(),
    market_cap_max: z.number().optional(),
    volume_24h_min: z.number().optional(),
    volume_24h_max: z.number().optional(),
    circulating_supply_min: z.number().optional(),
    circulating_supply_max: z.number().optional(),
    percent_change_24h_min: z.number().optional(),
    percent_change_24h_max: z.number().optional(),
    convert: z.string().optional(),
    convert_id: z.string().optional(),
    sort: z.enum(['market_cap', 'name', 'symbol', 'date_added', 'price', 'circulating_supply', 'total_supply', 'max_supply', 'num_market_pairs', 'volume_24h', 'percent_change_1h', 'percent_change_24h', 'percent_change_7d']).optional(),
    sort_dir: z.enum(['asc', 'desc']).optional(),
    aux: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
       await makeApiRequest('/v1/cryptocurrency/listings/latest', params)
    )
  }
)

export const cryptoQuotesLatest = createTool({
  id: "cryptoQuotesLatest",
  description: "Returns the latest market quote for one or more cryptocurrencies.",
  inputSchema: z.object({
    id: z.string().optional(),
    slug: z.string().optional(),
    symbol: z.string().optional(),
    convert: z.string().optional(),
    convert_id: z.string().optional(),
    aux: z.string().optional(),
    skip_invalid: z.boolean().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
       await makeApiRequest('/v2/cryptocurrency/quotes/latest', params)
    )
  }
)

export const dexInfo = createTool({
  id: "dexInfo",
  description: "Returns all static metadata for one or more decentralised exchanges.",
  inputSchema: z.object({
    id: z.string().optional(),
    aux: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
       await makeApiRequest('/v4/dex/listings/info', params)
    )
  }
)

export const dexListingsLatest = createTool({
  id: "dexListingsLatest",
  description: "Returns a paginated list of all decentralised cryptocurrency exchanges including the latest aggregate market data.",
  inputSchema: z.object({
    start: z.string().optional(),
    limit: z.string().optional(),
    sort: z.enum(['name', 'volume_24h', 'market_share', 'num_markets']).optional(),
    sort_dir: z.enum(['desc', 'asc']).optional(),
      id: z.string().optional(),
        aux: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
       await makeApiRequest('/v4/dex/listings/quotes', params)
    )
  }
)

export const dexListingsQuotes = createTool({
  id: "dexListingsQuotes",
  description: "Returns a paginated list of all decentralised cryptocurrency exchanges including the latest aggregate market data.",
  inputSchema: z.object({
    start: z.string().optional(),
    limit: z.string().optional(),
    sort: z.enum(['name', 'volume_24h', 'market_share', 'num_markets']).optional(),
    sort_dir: z.enum(['desc', 'asc']).optional(),
    type: z.enum(['all', 'orderbook', 'swap', 'aggregator']).optional(),
    aux: z.string().optional(),
    convert_id: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
       await makeApiRequest('/v4/dex/listings/quotes', params)
    )
  }
)

export const dexNetworksList = createTool({
  id: "dexNetworksList",
  description: "Returns a list of all networks to unique CoinMarketCap ids.",
  inputSchema: z.object({
    start: z.string().optional(),
    limit: z.string().optional(),
    sort: z.enum(['id', 'name']).optional(),
    sort_dir: z.enum(['desc', 'asc']).optional(),
    aux: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v4/dex/networks/list', params)
    )
  }
)

export const dexSpotPairsLatest = createTool({
  id: "dexSpotPairsLatest",
  description: "Returns a paginated list of all active dex spot pairs with latest market data.",
  inputSchema: z.object({
    network_id: z.string().optional(),
    network_slug: z.string().optional(),
    dex_id: z.string().optional(),
    dex_slug: z.string().optional(),
    base_asset_id: z.string().optional(),
    base_asset_symbol: z.string().optional(),
    base_asset_contract_address: z.string().optional(),
    base_asset_ucid: z.string().optional(),
    quote_asset_id: z.string().optional(),
    quote_asset_symbol: z.string().optional(),
    quote_asset_contract_address: z.string().optional(),
    quote_asset_ucid: z.string().optional(),
    scroll_id: z.string().optional(),
    limit: z.string().optional(),
    liquidity_min: z.string().optional(),
    liquidity_max: z.string().optional(),
    volume_24h_min: z.string().optional(),
    volume_24h_max: z.string().optional(),
    no_of_transactions_24h_min: z.string().optional(),
    no_of_transactions_24h_max: z.string().optional(),
    percent_change_24h_min: z.string().optional(),
    percent_change_24h_max: z.string().optional(),
    sort: z.enum(['name', 'date_added', 'price', 'volume_24h', 'percent_change_1h', 'percent_change_24h', 'liquidity', 'fully_diluted_value', 'no_of_transactions_24h']).optional(),
    sort_dir: z.enum(['desc', 'asc']).optional(),
    aux: z.string().optional(),
    reverse_order: z.string().optional(),
    convert_id: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v4/dex/spot-pairs/latest', params)
    )
  }
)

export const dexPairsQuotesLatest = createTool({
  id: "dexPairsQuotesLatest",
  description: "Returns the latest market quote for 1 or more spot pairs.",
  inputSchema: z.object({
    contract_address: z.string().optional(),
    network_id: z.string().optional(),
    network_slug: z.string().optional(),
    aux: z.string().optional(),
    convert_id: z.string().optional(),
    skip_invalid: z.string().optional(),
    reverse_order: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v4/dex/pairs/quotes/latest', params)
    )
  }
)

export const dexPairsOhlcvLatest = createTool({
  id: "dexPairsOhlcvLatest",
  description: "Returns the latest OHLCV market values for one or more spot pairs for the current UTC day.",
  inputSchema: z.object({
    contract_address: z.string().optional(),
    network_id: z.string().optional(),
    network_slug: z.string().optional(),
    aux: z.string().optional(),
    convert_id: z.string().optional(),
    skip_invalid: z.string().optional(),
    reverse_order: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v4/dex/pairs/ohlcv/latest', params)
    )
  }
)

export const dexPairsOhlcvHistorical = createTool({
  id: "dexPairsOhlcvHistorical",
  description: "Returns historical OHLCV data along with market cap for any spot pairs using time interval parameters.",
  inputSchema: z.object({
    contract_address: z.string().optional(),
    network_id: z.string().optional(),
    network_slug: z.string().optional(),
    time_period: z.enum(['daily', 'hourly', '1m', '5m', '15m', '30m', '4h', '8h', '12h', 'weekly', 'monthly']).optional(),
    time_start: z.string().optional(),
    time_end: z.string().optional(),
    count: z.string().optional(),
    interval: z.enum(['1m', '5m', '15m', '30m', '1h', '4h', '8h', '12h', 'daily', 'weekly', 'monthly']).optional(),
    aux: z.string().optional(),
    convert_id: z.string().optional(),
    skip_invalid: z.string().optional(),
    reverse_order: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v4/dex/pairs/ohlcv/historical', params)
    )
  }
)

export const dexPairsTradeLatest = createTool({
  id: "dexPairsTradeLatest",
  description: "Returns up to the latest 100 trades for 1 spot pair.",
  inputSchema: z.object({
    contract_address: z.string().optional(),
    network_id: z.string().optional(),
    network_slug: z.string().optional(),
    aux: z.string().optional(),
    convert_id: z.string().optional(),
    skip_invalid: z.string().optional(),
    reverse_order: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v4/dex/pairs/trade/latest', params)
    )
  }
)

export const exchangeAssets = createTool({
  id: "exchangeAssets",
  description: "Returns the assets/token holdings of an exchange.",
  inputSchema: z.object({
    id: z.string().optional(),
    slug: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v1/exchange/assets', params)
    )
  }
)

export const exchangeInfo = createTool({
  id: "exchangeInfo",
  description: "Returns metadata for one or more exchanges.",
  inputSchema: z.object({
    id: z.string().optional(),
    slug: z.string().optional(),
    aux: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v1/exchange/info', params)
    )
  }
)

export const exchangeMap = createTool({
  id: "exchangeMap",
  description: "Returns a mapping of all exchanges to unique CoinMarketCap IDs.",
  inputSchema: z.object({
    listing_status: z.string().optional(),
    slug: z.string().optional(),
    start: z.number().optional(),
    limit: z.number().optional(),
    sort: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v1/exchange/map', params)
    )
  }
)

export const globalMetricsLatest = createTool({
  id: "globalMetricsLatest",
  description: "Returns the latest global cryptocurrency market metrics.",
  inputSchema: z.object({
    convert: z.string().optional(),
    convert_id: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v1/global-metrics/quotes/latest', params)
    )
  }
)

export const cmc100IndexHistorical = createTool({
  id: "cmc100IndexHistorical",
  description: "Returns an interval of historic CoinMarketCap 100 Index values based on the interval parameter.",
  inputSchema: z.object({
    time_start: z.string().optional(),
    time_end: z.string().optional(),
    count: z.string().optional(),
    interval: z.enum(['5m', '15m', 'daily']).optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v3/index/cmc100-historical', params)
    )
  }
)

export const cmc100IndexLatest = createTool({
  id: "cmc100IndexLatest",
  description: "Returns the lastest CoinMarketCap 100 Index value, constituents, and constituent weights.",
  inputSchema: z.object({}),
  execute: async () =>
    handleEndpoint(async () =>
      await makeApiRequest('/v3/index/cmc100-latest')
    )
  }
)

export const fearAndGreedLatest = createTool({
  id: "fearAndGreedLatest",
  description: "Returns the latest CMC Crypto Fear and Greed Index value.",
  inputSchema: z.object({}),
  execute: async () =>
    handleEndpoint(async () =>
      await makeApiRequest('/v3/fear-and-greed/latest')
    )
  }
)

export const fearAndGreedHistorical = createTool({
  id: "fearAndGreedHistorical",
  description: "Returns historical CMC Crypto Fear and Greed Index values.",
  inputSchema: z.object({
    start: z.number().min(1).optional(),
    limit: z.number().min(1).max(500).optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v3/fear-and-greed/historical', params)
    )
  }
)

export const fiatMap = createTool({
  id: "fiatMap",
  description: "Returns a mapping of all supported fiat currencies to unique CoinMarketCap IDs.",
  inputSchema: z.object({
    start: z.number().optional(),
    limit: z.number().optional(),
    sort: z.string().optional(),
    include_metals: z.boolean().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v1/fiat/map', params)
    )
  }
)

export const getPostmanCollection = createTool({
  id: "getPostmanCollection",
  description: "Returns a Postman collection for the CoinMarketCap API.",
  inputSchema: z.object({}),
  execute: async () =>
    handleEndpoint(async () =>
      await makeApiRequest('/v1/tools/postman')
    )
  }
)

export const priceConversion = createTool({
  id: "priceConversion",
  description: "Convert an amount of one cryptocurrency or fiat currency into one or more different currencies.",
  inputSchema: z.object({
    amount: z.number(),
    id: z.string().optional(),
    symbol: z.string().optional(),
    time: z.string().optional(),
    convert: z.string().optional(),
    convert_id: z.string().optional()
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await makeApiRequest('/v2/tools/price-conversion', params)
    )
  }
)

export const keyInfo = createTool({
  id: "keyInfo",
  description: "Returns API key details and usage stats.",
  inputSchema: z.object({}),
  execute: async () =>
    handleEndpoint(async () =>
      await makeApiRequest('/v1/key/info')
    )
  }
)

export const callContractTool = createTool({
  id: "callContract",
  description: "Calls a contract function",
  inputSchema: z.object({
    to: z.string(),
    data: z.string(),
    from: z.string().optional(),
    value: z.string().optional(),
    gas: z.string().optional(),
    gasPrice: z.string().optional(),
    chainId: z.number().default(1),
    blockTag: z.string().default('latest')
  }),
  execute: async (params) =>
    handleEndpoint(async () =>
      await callContract(params.context)
    )
  }
)

export default {
  callContractTool,
  cryptoCategories,
  cryptoCategory,
  cryptoCurrencyMap,
  cryptoCurrencyMetadata,
  allCryptocurrencyListings,
  cryptoQuotesLatest,
  dexInfo,
  dexListingsLatest,
  dexListingsQuotes,
  dexNetworksList,
  dexSpotPairsLatest,
  dexPairsQuotesLatest,
  dexPairsOhlcvLatest,
  dexPairsOhlcvHistorical,
  dexPairsTradeLatest,
  exchangeAssets,
  exchangeInfo,
  exchangeMap,
  globalMetricsLatest,
  cmc100IndexHistorical,
  cmc100IndexLatest,
  fearAndGreedLatest,
  fearAndGreedHistorical,
  fiatMap,
  getPostmanCollection,
  priceConversion,
  keyInfo
}
