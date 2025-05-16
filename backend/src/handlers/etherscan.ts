import * as yup from 'yup'
import { logger } from '../logger'
import axios from 'axios'
import { ETHERSCAN_API_KEY } from '../config'
import { callContract } from './infura'
import { Interface } from 'ethers'

type Transaction = {
  blockNumber: string
  blockHash: string
  timeStamp: string
  hash: string
  nonce: string
  transactionIndex: string
  from: string
  to: string
  value: string
  gas: string
  gasPrice: string
  input: string
  methodId: string
  functionName: string
  contractAddress: string
  cumulativeGasUsed: string
  txreceipt_status: string
  gasUsed: string
  confirmations: string
  isError: string
}

type Response<T> = {
  response: T
  error?: boolean
  status?: number
}

const getLatestBlock = async (chainId: number) => {
  const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=proxy&action=eth_blockNumber&apikey=${ETHERSCAN_API_KEY}`
  const { data } = await axios.get(url)
  if (!data || !data.result) throw new Error('Invalid Etherscan response')
  // result is hex string
  return parseInt(data.result, 16)
}

export const getTxHistorySchema = yup.object({
  address: yup.string().required(),
  chainId: yup.number().default(1), // mainnet
  page: yup.number().default(1),
  offset: yup.number().default(1000), // max for free tier
  startBlock: yup.number().default(0),
  endBlock: yup.number().notRequired(),
  sort: yup.string().default('asc')
}).required()

export const getTxHistory = async (request: yup.InferType<typeof getTxHistorySchema>): Promise<Response<{ txHistory: Transaction[] }>> => {
  try {
    logger.info({ request })
    const { address, chainId, page, offset, sort } = request
    let { startBlock, endBlock } = request
    if (!endBlock) endBlock = await getLatestBlock(chainId)
    let txHistory: any[] = []
    let keepFetching = true
    while (keepFetching) {
      const url = `https://api.etherscan.io/v2/api?module=account&action=txlist&chainid=${chainId}&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=${sort}&apikey=${ETHERSCAN_API_KEY}`
      const { data } = await rateLimitedAxiosGet(url)
      if (!data || !data.result || !Array.isArray(data.result)) throw new Error('Invalid Etherscan response')
      const txs = data.result
      txHistory = txHistory.concat(txs)
      if (txs.length < offset) {
        keepFetching = false
      } else {
        const lastBlock = Number(txs[txs.length - 1]?.blockNumber)
        if (!lastBlock) break
        startBlock = lastBlock - 1
      }
    }
    logger.info({ txHistoryLength: txHistory.length })
    return {
      response: { txHistory },
      status: 200
    }
  } catch (error: any) {
    logger.error({ message: error.message, error: true })
    return {
      response: { txHistory: [] },
      error: true,
      status: 500
    }
  }
}

export const getTokenBalanceSchema = yup.object({
  address: yup.string().required(),
  chainId: yup.number().default(1), // mainnet
  tokenAddress: yup.string().required()
}).required()

export const getTokenBalance = async (request: yup.InferType<typeof getTokenBalanceSchema>): Promise<Response<{ balance: string, decimals: number }>> => {
  try {
    logger.info({ request })
    const { address, chainId, tokenAddress } = request

    const url = `https://api.etherscan.io/v2/api?module=account&action=tokenbalance&chainid=${chainId}&address=${address}&contractaddress=${tokenAddress}&tag=latest&apikey=${ETHERSCAN_API_KEY}`
    const { data } = await rateLimitedAxiosGet(url)
    if (!data || !data.result) throw new Error('Invalid Etherscan response')
    const rawBalance = data.result

    // Call contract to get decimals
    // ERC20 decimals() selector: 0x313ce567
    const { response: decimalsResp, error: decimalsError } = await callContract({
      to: tokenAddress,
      data: '0x313ce567',
      chainId,
      blockTag: 'latest'
    })
    let decimals = 18
    if (!decimalsError && decimalsResp.result && decimalsResp.result !== '0x') {
      // Parse hex to int
      decimals = parseInt(decimalsResp.result, 16)
    }
    // Safe division to floating point string
    let balance = '0'
    if (rawBalance && !isNaN(Number(rawBalance)) && decimals >= 0) {
      // Use BigInt for safe division
      try {
        const divisor = BigInt(10) ** BigInt(decimals)
        const whole = BigInt(rawBalance) / divisor
        const fraction = BigInt(rawBalance) % divisor
        // Pad fraction with leading zeros
        let fractionStr = fraction.toString().padStart(decimals, '0')
        // Remove trailing zeros
        fractionStr = fractionStr.replace(/0+$/, '')
        balance = fractionStr.length > 0 ? `${whole.toString()}.${fractionStr}` : whole.toString()
      } catch (e) {
        balance = rawBalance
      }
    }
    return {
      response: { balance, decimals },
      status: 200
    }
  } catch (error: any) {
    logger.error({ message: error.message, error: true })
    return {
      response: { balance: '0', decimals: 0 },
      error: true,
      status: 500
    }
  }
}

// --- Etherscan Rate Limiter ---
const ETHERSCAN_RATE_LIMIT = 5 // per second
const ETHERSCAN_INTERVAL = 1000 / ETHERSCAN_RATE_LIMIT
let etherscanQueue: (() => void)[] = []
let etherscanActive = false

function processEtherscanQueue() {
  if (etherscanActive || etherscanQueue.length === 0) return
  etherscanActive = true
  const next = etherscanQueue.shift()
  if (next) next()
  setTimeout(() => {
    etherscanActive = false
    processEtherscanQueue()
  }, ETHERSCAN_INTERVAL)
}

function rateLimitedAxiosGet(url: string) {
  return new Promise<any>((resolve, reject) => {
    etherscanQueue.push(() => {
      axios.get(url).then(resolve).catch(reject)
    })
    processEtherscanQueue()
  })
}

export const getContractABISchema = yup.object({
  contractAddress: yup.string().required(),
  chainId: yup.number().default(1)
}).required()

export const getContractABI = async (request: yup.InferType<typeof getContractABISchema>): Promise<Response<{ abi: any[] }>> => {
  try {
    logger.info({ request })
    const { contractAddress, chainId } = request
    const url = `https://api.etherscan.io/v2/api?chainid=${chainId}&module=contract&action=getabi&address=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`
    const { data } = await rateLimitedAxiosGet(url)
    if (!data || !data.result) throw new Error('Invalid Etherscan response')
    let abi: any[] = []
    try {
      abi = JSON.parse(data.result)
    } catch (e) {
      throw new Error('Failed to parse ABI JSON')
    }
    return {
      response: { abi },
      status: 200
    }
  } catch (error: any) {
    logger.error({ message: error.message, error: true })
    return {
      response: { abi: [] },
      error: true,
      status: 500
    }
  }
}

const txSchema = yup.object({
  to: yup.string(),
  input: yup.string(),
  functionName: yup.string()
  // add other fields as needed
})

export const buildContractABIMappingAndExtractTokensSchema = yup.object({
  txs: yup.array().of(txSchema).required(),
  chainId: yup.number().required()
}).required()

export const buildContractABIMappingAndExtractTokens = async (request: yup.InferType<typeof buildContractABIMappingAndExtractTokensSchema>): Promise<Response<{ abiMap: Record<string, any[]>, tokenAddresses: string[] }>> => {
  try {
    logger.info({ request })
    const { txs, chainId } = request
    const contractAddresses = Array.from(new Set(
      txs.map(tx => tx.to?.toLowerCase()).filter((a): a is string => !!a)
    ))
    const abiMap: Record<string, any[]> = {}
    for (const address of contractAddresses) {
      const { response, error } = await getContractABI({ contractAddress: address, chainId })
      if (!error && response.abi && response.abi.length > 0) {
        abiMap[address] = response.abi
      }
    }
    // Now, for each tx, try to decode input and extract address args
    const tokenAddresses: string[] = []
    for (const tx of txs) {
      const abi = abiMap[tx.to?.toLowerCase() || '']
      if (!abi) continue
      try {
        const iface = new Interface(abi)
        const data = tx.input
        const method = tx.functionName?.split('(')[0]
        if (!method || !data) continue
        const fn = iface.getFunction(method)
        if (!fn) continue
        const decoded = iface.decodeFunctionData(fn, data)
        // Find all address args
        fn.inputs.forEach((input: any, idx: number) => {
          if (input.type === 'address') {
            const addr = decoded[idx]
            if (typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr)) {
              tokenAddresses.push(addr.toLowerCase())
            }
          }
        })
      } catch (e) {
        // ignore decoding errors
      }
    }
    return {
      response: { abiMap, tokenAddresses: Array.from(new Set(tokenAddresses)) },
      status: 200
    }
  } catch (error: any) {
    logger.error({ message: error.message, error: true })
    return {
      response: { abiMap: {}, tokenAddresses: [] },
      error: true,
      status: 500
    }
  }
}
