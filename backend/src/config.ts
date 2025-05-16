import dotenv from 'dotenv'
dotenv.config()

export const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info'
export const PORT = process.env.PORT ?? '8000'
export const RPC_API_KEY = process.env.RPC_API_KEY ?? ''
export const RPC_API_SECRET = process.env.RPC_API_SECRET ?? ''
export const TZ = process.env.TZ ?? ''
export const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY ?? ''
export const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY ?? ''
