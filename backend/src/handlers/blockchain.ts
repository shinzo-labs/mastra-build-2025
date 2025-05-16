import * as yup from 'yup'
import { ethers } from 'ethers'
import { logger } from '../logger'
import { RPC_API_KEY, RPC_API_SECRET } from '../config'

const NETWORK_ENDPOINTS = {
    arbitrum: {
        mainnet: 'https://arbitrum-mainnet.infura.io/v3/',
        sepolia: 'https://arbitrum-sepolia.infura.io/v3/'
    },
    avalanche: {
        mainnet: 'https://avalanche-mainnet.infura.io/v3/',
        fuji: 'https://avalanche-fuji.infura.io/v3/'
    },
    base: {
        mainnet: 'https://base-mainnet.infura.io/v3/',
        sepolia: 'https://base-sepolia.infura.io/v3/'
    },
    blast: {
        mainnet: 'https://blast-mainnet.infura.io/v3/',
        sepolia: 'https://blast-sepolia.infura.io/v3/'
    },
    bsc: {
        mainnet: 'https://bsc-mainnet.infura.io/v3/',
        testnet: 'https://bsc-testnet.infura.io/v3/'
    },
    celo: {
        mainnet: 'https://celo-mainnet.infura.io/v3/',
        alfajores: 'https://celo-alfajores.infura.io/v3/'
    },
    ethereum: {
        mainnet: 'https://mainnet.infura.io/v3/',
        sepolia: 'https://sepolia.infura.io/v3/',
        holesky: 'https://holesky.infura.io/v3/'
    },
    linea: {
        mainnet: 'https://linea-mainnet.infura.io/v3/',
        sepolia: 'https://linea-sepolia.infura.io/v3/'
    },
    mantle: {
        mainnet: 'https://mantle-mainnet.infura.io/v3/',
        sepolia: 'https://mantle-sepolia.infura.io/v3/'
    },
    opbnb: {
        mainnet: 'https://opbnb-mainnet.infura.io/v3/',
        testnet: 'https://opbnb-testnet.infura.io/v3/'
    },
    optimism: {
        mainnet: 'https://optimism-mainnet.infura.io/v3/',
        sepolia: 'https://optimism-sepolia.infura.io/v3/'
    },
    palm: {
        mainnet: 'https://palm-mainnet.infura.io/v3/',
        testnet: 'https://palm-testnet.infura.io/v3/'
    },
    polygon: {
        mainnet: 'https://polygon-mainnet.infura.io/v3/',
        amoy: 'https://polygon-amoy.infura.io/v3/'
    },
    scroll: {
        mainnet: 'https://scroll-mainnet.infura.io/v3/',
        sepolia: 'https://scroll-sepolia.infura.io/v3/'
    },
    starknet: {
        mainnet: 'https://starknet-mainnet.infura.io/v3/',
        sepolia: 'https://starknet-sepolia.infura.io/v3/'
    },
    swellchain: {
        mainnet: 'https://swellchain-mainnet.infura.io/v3/',
        testnet: 'https://swellchain-testnet.infura.io/v3/'
    },
    unichain: {
        mainnet: 'https://unichain-mainnet.infura.io/v3/',
        sepolia: 'https://unichain-sepolia.infura.io/v3/'
    },
    zksync: {
        mainnet: 'https://zksync-mainnet.infura.io/v3/',
        sepolia: 'https://zksync-sepolia.infura.io/v3/'
    }
} as const

type Network = keyof typeof NETWORK_ENDPOINTS
type NetworkEnv = keyof (typeof NETWORK_ENDPOINTS)[keyof typeof NETWORK_ENDPOINTS]
type BlockchainRequest = {
  address: string
  functionSignature: string
  network: string
  networkEnv: string
  params: any[]
}

const NETWORKS = Object.keys(NETWORK_ENDPOINTS)
const NETWORK_ENVS = [
    'mainnet',
    'sepolia',
    'holesky',
    'testnet',
    'alfajores',
    'amoy'
]

const getRPCUrl = (network: Network, networkEnv: NetworkEnv) => {
  const endpoint = NETWORK_ENDPOINTS[network][networkEnv]
  if (!endpoint) {
    throw new Error(`Invalid network: ${String(network)} or networkEnv: ${String(networkEnv)}`)
  }
  return `https://:${RPC_API_SECRET}@${endpoint.replace('https://', '')}${RPC_API_KEY}`
}

export const callBlockchainSchema = yup.object({
  address: yup.string()
    .required()
    .matches(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  functionSignature: yup.string()
    .required()
    .matches(/^[a-zA-Z_][a-zA-Z0-9_]*\(.*\)$/, 'Invalid function signature'),
  network: yup.string()
    .required()
    .oneOf(NETWORKS, 'Invalid network'),
  networkEnv: yup.string()
    .required()
    .oneOf(NETWORK_ENVS, 'Invalid network environment'),
  params: yup.array()
    .required()
    .of(yup.mixed())
}).required()

export const callBlockchain = async (userUuid: string, request: BlockchainRequest) => {
  try {
    const rpcUrl = getRPCUrl(request.network as Network, request.networkEnv as NetworkEnv)
    const provider = new ethers.JsonRpcProvider(rpcUrl)

    const iface = new ethers.Interface([`function ${request.functionSignature}`])

    const functionName = request.functionSignature.split('(')[0]
    
    const data = iface.encodeFunctionData(functionName, request.params)

    let result: string | number = await provider.call({ to: request.address, data })

    logger.trace({ result, functionSignature: request.functionSignature, uintRegex: /returns\s*uint\d*/.test(request.functionSignature) })

    "balanceOf(address) view returns (uint256)"
    if (/returns\s*\(\s*uint\d*/.test(request.functionSignature)) {
      result = parseInt(result)
    }

    return { response: result, status: 200 }
  } catch (error: any) {
    logger.error({ message: 'Blockchain call error', error })
    return {
      response: error.message,
      error: true,
      status: 500
    }
  }
}

export const getNetworkList = () => {
  const networks: Record<string, string[]> = {};
 
  for (const [network, envs] of Object.entries(NETWORK_ENDPOINTS)) {
    networks[network] = Object.keys(envs);
  }

  return {
    response: networks,
    status: 200
  };
};

export const listBlockchainsSchema = yup.object().required()

export const listBlockchains = async (userUuid: string, request: any) => {
  try {
    const networks = getNetworkList()
    return {
      response: networks.response,
      status: 200
    }
  } catch (error) {
    logger.error({ message: 'Network list error', error })
    return {
      response: 'Error getting network list',
      error: true,
      status: 500
    }
  }
}
