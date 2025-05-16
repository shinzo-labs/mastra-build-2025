import { BACKEND_URL } from './config'

export type Transaction = {
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

// --- Etherscan Rate Limiter (Frontend) ---
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

function rateLimitedFetchTokenBalance(request: any, BACKEND_URL: string) {
  return new Promise<any>((resolve, reject) => {
    etherscanQueue.push(() => {
      fetch(`${BACKEND_URL}/etherscan/getTokenBalance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
        .then(async response => {
          if (response.status === 401) return resolve({ balance: '0', decimals: 0, error: 'Unauthorized' })
          const data = await response.json()
          resolve(data.error ? { balance: '0', decimals: 0, error: data.error } : { balance: data.body.balance, decimals: data.body.decimals })
        })
        .catch(error => {
          console.error('Error in getTokenBalance:', error)
          resolve({ balance: '0', decimals: 0, error: 'Error fetching token balance' })
        })
    })
    processEtherscanQueue()
  })
}

const etherscanService = {
  async getTxHistory(request: {
    address: string
    chainId: number
    page: number
    offset: number
    startBlock: number
    endBlock?: number
    sort: string
  }): Promise<{
    txHistory: Transaction[]
    error?: string
  }> {
    try {
      const response = await fetch(`${BACKEND_URL}/etherscan/getTxHistory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })

      if (response.status === 401) return { txHistory: [], error: 'Unauthorized' }

      const data = await response.json()
      return data.error ? { txHistory: [], error: data.error } : { txHistory: data.body.txHistory }
    } catch (error) {
      console.error('Error in getTxHistory:', error)
      return { txHistory: [], error: 'Error fetching tx history' }
    }
  },
  async getTokenBalance(request: {
    address: string
    chainId: number
    tokenAddress: string
  }): Promise<{ balance: string, decimals: number, error?: string }> {
    return rateLimitedFetchTokenBalance(request, BACKEND_URL)
  },
  async buildContractABIMappingAndExtractTokens(request: { txs: Transaction[], chainId: number }): Promise<{ abiMap: Record<string, any[]>, tokenAddresses: string[] }> {
    try {
      const response = await fetch(`${BACKEND_URL}/etherscan/buildContractABIMappingAndExtractTokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      if (!response.ok) return { abiMap: {}, tokenAddresses: [] }
      const data = await response.json()
      return { abiMap: data.body.abiMap, tokenAddresses: data.body.tokenAddresses || [] }
    } catch (error) {
      console.error('Error in extractTokenAddresses:', error)
      return { abiMap: {}, tokenAddresses: [] }
    }
  }
}

const infuraService = {
  async callContract(request: {
    to: string
    data: string
    from?: string
    value?: string
    gas?: string
    gasPrice?: string
    chainId: number
    blockTag?: string
  }): Promise<{ result: string, error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/infura/callContract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      if (response.status === 401) return { result: '', error: 'Unauthorized' }
      const data = await response.json()
      return data.error ? { result: '', error: data.error } : { result: data.body.result }
    } catch (error) {
      console.error('Error in callContract:', error)
      return { result: '', error: 'Error calling contract' }
    }
  },
  async getNativeGasBalance(request: { address: string, chainId: number }): Promise<{ balance: string, error?: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/infura/getNativeGasBalance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      if (!response.ok) return { balance: '0', error: 'Request failed' }
      const data = await response.json()
      return data.error ? { balance: '0', error: data.error } : { balance: data.body.balance }
    } catch (error) {
      console.error('Error in getNativeGasBalance:', error)
      return { balance: '0', error: 'Error fetching native gas balance' }
    }
  }
}

export async function queryFinancialAdvisor({ instructions, messages }: { instructions: string, messages: { role: string, content: string }[] }): Promise<{ result: string, error?: string }> {
  try {
    const response = await fetch(`${BACKEND_URL}/financialAdvisor/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instructions, messages })
    })
    if (!response.ok) return { result: '', error: 'Request failed' }
    const data = await response.json()
    if (data.error) return { result: '', error: data.error }
    return { result: data.body }
  } catch (error) {
    return { result: '', error: 'Error querying financial advisor' }
  }
}

export { etherscanService, infuraService }
