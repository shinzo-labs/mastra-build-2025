import * as yup from 'yup'
import { logger } from '../logger'
import { RPC_API_KEY, RPC_API_SECRET } from '../config'
import axios from 'axios'

const NETWORK_ALIASES: Record<number, string> = {
  1: 'mainnet',
  11155111: 'sepolia',
  17000: 'holesky',
  42161: 'arbitrum-mainnet',
  421614: 'arbitrum-sepolia',
  43114: 'avalanche-mainnet',
  43113: 'avalanche-fuji',
  8453: 'base-mainnet',
  84532: 'base-sepolia',
  81457: 'blast-mainnet',
  168587773: 'blast-sepolia',
  56: 'bsc-mainnet',
  97: 'bsc-testnet',
  42220: 'celo-mainnet',
  44787: 'celo-alfajores',
  137: 'polygon-mainnet',
  80002: 'polygon-amoy',
  10: 'optimism-mainnet',
  11155420: 'optimism-sepolia',
  59144: 'linea-mainnet',
  59141: 'linea-sepolia',
  5000: 'mantle-mainnet',
  5003: 'mantle-sepolia',
  534352: 'scroll-mainnet',
  534351: 'scroll-sepolia',
  1923: 'swellchain-mainnet',
  1924: 'swellchain-testnet',
  130: 'unichain-mainnet',
  1301: 'unichain-sepolia',
  324: 'zksync-mainnet',
  300: 'zksync-sepolia'
}

type Response<T> = {
  response: T
  error?: boolean
  status?: number
}

export const callContractSchema = yup.object({
  to: yup.string().required(),
  data: yup.string().required(),
  from: yup.string().notRequired(),
  value: yup.string().notRequired(),
  gas: yup.string().notRequired(),
  gasPrice: yup.string().notRequired(),
  chainId: yup.number().required(),
  blockTag: yup.string().default('latest')
}).required()

export const callContract = async (request: yup.InferType<typeof callContractSchema>): Promise<Response<{ result: string }>> => {
  try {
    logger.info({ request })
    const { to, data, from, value, gas, gasPrice, chainId, blockTag } = request
    const network = NETWORK_ALIASES[chainId] || 'mainnet'
    const url = `https://${network}.infura.io/v3/${RPC_API_KEY}`
    const params: any = { to, data }
    if (from) params.from = from
    if (value) params.value = value
    if (gas) params.gas = gas
    if (gasPrice) params.gasPrice = gasPrice
    const rpcBody = {
      jsonrpc: '2.0',
      method: 'eth_call',
      params: [params, blockTag || 'latest'],
      id: 1
    }

    const { data: resp } = await axios.post(url, rpcBody, {
      auth: { username: '', password: RPC_API_SECRET },
      headers: { 'Content-Type': 'application/json' }
    })

    if (resp.error) throw new Error(resp.error.message || 'eth_call error')
    return { response: { result: resp.result }, status: 200 }
  } catch (error: any) {
    logger.error({ message: error.message, error: true })
    return { response: { result: '' }, error: true, status: 500 }
  }
}

export const getNativeGasBalanceSchema = yup.object({
  address: yup.string().required(),
  chainId: yup.number().required()
}).required()

export const getNativeGasBalance = async (request: yup.InferType<typeof getNativeGasBalanceSchema>): Promise<Response<{ balance: string }>> => {
  try {
    logger.info({ request })
    const { address, chainId } = request
    const network = NETWORK_ALIASES[chainId] || 'mainnet'
    const url = `https://${network}.infura.io/v3/${RPC_API_KEY}`
    const rpcBody = {
      jsonrpc: '2.0',
      method: 'eth_getBalance',
      params: [address, 'latest'],
      id: 1
    }
    const { data: resp } = await axios.post(url, rpcBody, {
      auth: { username: '', password: RPC_API_SECRET },
      headers: { 'Content-Type': 'application/json' }
    })
    if (resp.error) throw new Error(resp.error.message || 'eth_getBalance error')
    // resp.result is hex string in wei
    return { response: { balance: resp.result }, status: 200 }
  } catch (error: any) {
    logger.error({ message: error.message, error: true })
    return { response: { balance: '0' }, error: true, status: 500 }
  }
}
