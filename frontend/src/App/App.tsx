// App.tsx
import { useState, useEffect, useRef } from 'react'
import { Box, TextField, Button, MenuItem, Select, InputLabel, FormControl, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Typography, SelectChangeEvent, Checkbox, FormControlLabel } from '@mui/material'
import { colors, spacing } from '../theme'
import { etherscanService, Transaction, queryFinancialAdvisor } from '../backendService'
import { HelpOutline } from '@mui/icons-material'
import IconButton from '@mui/material/IconButton'

const advisorInstructions = 'You are a crypto financial advisor. You are given a list of transactions from a wallet address. You are to analyze the transactions and provide a summary of the wallet\'s activity, especially any unusual trades or operations. Use the tools provided to you to help you analyze the transactions, such as callContract to get more details about known contracts, or dexListingsQuotes for data on blockchain DEXes.'

const NETWORKS = [
  { name: 'Ethereum Mainnet', chainId: 1 },
  { name: 'Sepolia Testnet', chainId: 11155111 },
  { name: 'Holesky Testnet', chainId: 17000 },
  { name: 'Arbitrum One Mainnet', chainId: 42161 },
  { name: 'Arbitrum Sepolia Testnet', chainId: 421614 },
  { name: 'Avalanche C-Chain', chainId: 43114 },
  { name: 'Avalanche Fuji Testnet', chainId: 43113 },
  { name: 'Base Mainnet', chainId: 8453 },
  { name: 'Base Sepolia Testnet', chainId: 84532 },
  { name: 'Blast Mainnet', chainId: 81457 },
  { name: 'Blast Sepolia Testnet', chainId: 168587773 },
  { name: 'BNB Smart Chain Mainnet', chainId: 56 },
  { name: 'BNB Smart Chain Testnet', chainId: 97 },
  { name: 'Celo Mainnet', chainId: 42220 },
  { name: 'Celo Alfajores Testnet', chainId: 44787 },
  { name: 'Polygon Mainnet', chainId: 137 },
  { name: 'Polygon Amoy Testnet', chainId: 80002 },
  { name: 'OP Mainnet', chainId: 10 },
  { name: 'OP Sepolia Testnet', chainId: 11155420 },
  { name: 'Linea Mainnet', chainId: 59144 },
  { name: 'Linea Sepolia Testnet', chainId: 59141 },
  { name: 'Mantle Mainnet', chainId: 5000 },
  { name: 'Mantle Sepolia Testnet', chainId: 5003 },
  { name: 'Scroll Mainnet', chainId: 534352 },
  { name: 'Scroll Sepolia Testnet', chainId: 534351 },
  { name: 'Swellchain Mainnet', chainId: 1923 },
  { name: 'Swellchain Testnet', chainId: 1924 },
  { name: 'Unichain Mainnet', chainId: 130 },
  { name: 'Unichain Sepolia Testnet', chainId: 1301 },
  { name: 'zkSync Mainnet', chainId: 324 },
  { name: 'zkSync Sepolia Testnet', chainId: 300 }
]

export const App = () => {
  const [address, setAddress] = useState('')
  const [chainId, setChainId] = useState(1)
  const [txs, setTxs] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [contracts, setContracts] = useState<string[]>([])
  const [contractBalances, setContractBalances] = useState<Record<string, { status: 'loading' | 'success' | 'error', balance: string, decimals: string, count: number }>>({})
  const [contractsReady, setContractsReady] = useState(false)
  const [contractMap, setContractMap] = useState<Record<string, number>>({})
  const [nativeBalance, setNativeBalance] = useState<string>('')
  const [nativeBalanceError, setNativeBalanceError] = useState<string>('')
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState('')
  const chatWindowRef = useRef<HTMLDivElement>(null)
  const [sendFullInput, setSendFullInput] = useState(false)
  const [contractABIs, setContractABIs] = useState<Record<string, any>>({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setTxs([])
    try {
      const { txHistory, error } = await etherscanService.getTxHistory({
        address,
        chainId,
        page: 1,
        offset: 100,
        startBlock: 0,
        sort: 'desc'
      })
      if (error) setError('Failed to fetch transactions')
      else setTxs(txHistory)
    } catch (err) {
      setError('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!address || txs.length === 0) return
    setContractsReady(false)
    setNativeBalance('')
    setNativeBalanceError('')
    // Fetch native gas balance
    import('../backendService').then(({ infuraService }) => {
      infuraService.getNativeGasBalance({ address, chainId })
        .then(res => {
          if (res.error) setNativeBalanceError('Failed to fetch native gas balance')
          else setNativeBalance(res.balance)
        })
        .catch(() => setNativeBalanceError('Failed to fetch native gas balance'))
    })
    // Find all unique contract addresses (to or from, not the main address)
    const localContractMap: Record<string, number> = {}
    txs.forEach(tx => {
      if (tx.to && tx.to.toLowerCase() !== address.toLowerCase()) {
        localContractMap[tx.to.toLowerCase()] = (localContractMap[tx.to.toLowerCase()] || 0) + 1
      }
      if (tx.from && tx.from.toLowerCase() !== address.toLowerCase()) {
        localContractMap[tx.from.toLowerCase()] = (localContractMap[tx.from.toLowerCase()] || 0) + 1
      }
    })
    etherscanService.buildContractABIMappingAndExtractTokens({ txs, chainId })
      .then(data => {
        // Normalize ABI map keys to lowercase
        const normalizedAbiMap = Object.fromEntries(
          Object.entries(data.abiMap || {}).map(([k, v]) => [k.toLowerCase(), v])
        )
        const extraTokens: string[] = data.tokenAddresses || []
        extraTokens.forEach(addr => {
          if (!localContractMap[addr]) localContractMap[addr] = 0
        })
        const uniqueContracts = Object.keys(localContractMap)
        setContracts(uniqueContracts)
        setContractMap({ ...localContractMap })
        setContractBalances({})
        setContractsReady(true)
        setContractABIs(normalizedAbiMap)
      })
      .catch(() => {
        const uniqueContracts = Object.keys(localContractMap)
        setContracts(uniqueContracts)
        setContractMap({ ...localContractMap })
        setContractBalances({})
        setContractsReady(true)
      })
  }, [address, chainId, txs])

  useEffect(() => {
    if (!contractsReady) return
    contracts.forEach(contract => {
      setContractBalances(prev => ({ ...prev, [contract]: { status: 'loading', balance: '', decimals: '', count: 0 } }))
      etherscanService.getTokenBalance({ address, chainId, tokenAddress: contract })
        .then(res => {
          if (res.error) {
            // Remove contract from contracts and contractMap
            setContracts(prev => prev.filter(c => c !== contract))
            setContractMap(prev => {
              const newMap = { ...prev }
              delete newMap[contract]
              return newMap
            })
            setContractBalances(prev => {
              const newBalances = { ...prev }
              delete newBalances[contract]
              return newBalances
            })
          } else {
            setContractBalances(prev => ({
              ...prev,
              [contract]: { status: 'success', balance: res.balance, decimals: String(res.decimals), count: contractMap[contract] || 0 }
            }))
          }
        })
        .catch(() => {
          // Remove contract from contracts and contractMap
          setContracts(prev => prev.filter(c => c !== contract))
          setContractMap(prev => {
            const newMap = { ...prev }
            delete newMap[contract]
            return newMap
          })
          setContractBalances(prev => {
            const newBalances = { ...prev }
            delete newBalances[contract]
            return newBalances
          })
        })
    })
  }, [contracts, contractsReady, address, chainId, contractMap])

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
    }
  }, [chatMessages, chatLoading])

  return (
    <Box sx={{ height: '100vh', bgcolor: colors.background.default, p: 4 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Shinzo AI - Crypto Financial Advisor</Typography>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
        <TextField
          label="Address"
          value={address}
          onChange={e => setAddress(e.target.value)}
          size="small"
          sx={{ minWidth: 350 }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Network</InputLabel>
          <Select
            value={String(chainId)}
            label="Network"
            onChange={e => setChainId(Number(e.target.value))}
          >
            {NETWORKS.map(n => (
              <MenuItem key={n.chainId} value={String(n.chainId)}>{n.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button type="submit" variant="contained" disabled={loading || !address}>Submit</Button>
      </form>
      {/* Financial Advisor Chat Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 4, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Financial Advisor Chat</Typography>
        <Paper
          sx={{
            height: 600,
            overflowY: 'auto',
            p: 2,
            mb: 2,
            bgcolor: colors.background.paper,
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${colors.background.input}`
          }}
          ref={chatWindowRef}
        >
          {chatMessages.length === 0 && (
            <Typography color="textSecondary" sx={{ textAlign: 'center', mt: 10 }}>
              Start a conversation with your crypto financial advisor about this address and its transactions.
            </Typography>
          )}
          {chatMessages.map((msg, i) => (
            <Box key={i} sx={{ mb: 2, alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <Paper
                sx={{
                  p: spacing.md,
                  bgcolor: msg.role === 'user' ? colors.background.input : colors.primary.main,
                  color: msg.role === 'user' ? colors.text.primary : colors.background.default,
                  borderRadius: 2,
                  boxShadow: 'none',
                  minWidth: 80
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: msg.role === 'user' ? 600 : 400, mb: 0.5 }}>
                  {msg.role === 'user' ? 'You' : 'Advisor'}
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-line', wordBreak: 'break-word' }}>{msg.content}</Typography>
              </Paper>
            </Box>
          ))}
          {chatLoading && <Box sx={{ textAlign: 'center', mt: 2 }}><CircularProgress size={24} /></Box>}
        </Paper>
        <Box sx={{ display: 'flex', width: 600, mt: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type your message..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSendChat()
              }
            }}
            disabled={chatLoading || !address || txs.length === 0}
            sx={{
              bgcolor: colors.background.input,
              color: colors.text.primary,
              '& .MuiInputBase-root': {
                bgcolor: colors.background.input,
                color: colors.text.primary
              }
            }}
          />
          <Button
            variant="contained"
            sx={{ ml: 2 }}
            disabled={chatLoading || !chatInput.trim() || !address || txs.length === 0}
            onClick={handleSendChat}
          >
            Send
          </Button>
          <Button
            variant="outlined"
            sx={{ ml: 2 }}
            disabled={chatLoading || chatMessages.length === 0}
            onClick={() => {
              setChatMessages([])
              setChatInput('')
              setChatError('')
              setChatLoading(false)
            }}
          >
            Reset Chat
          </Button>
        </Box>
        <Box sx={{ width: 600, mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <FormControlLabel
            control={<Checkbox checked={sendFullInput} onChange={e => setSendFullInput(e.target.checked)} color="primary" />}
            label="Send Full Transaction Input"
          />
        </Box>
        {chatError && <Typography color="error" sx={{ mt: 1 }}>{chatError}</Typography>}
      </Box>
      {/* End Financial Advisor Chat Section */}
      {/* Native Gas Balance Section */}
      {txs.length > 0 && (
        <Box sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Native Gas Balance</Typography>
          {nativeBalanceError ? (
            <Typography color="error">{nativeBalanceError}</Typography>
          ) : nativeBalance ? (
            <Typography>{Number(nativeBalance) / 1e18} ETH</Typography>
          ) : (
            <Typography>Loading...</Typography>
          )}
        </Box>
      )}
      {loading && <CircularProgress sx={{ mt: 2 }} />}
      {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      {txs.length > 0 && (
        <>
          <Typography variant="h6" sx={{ mt: 4, mb: 1 }}>Transaction History</Typography>
          <TableContainer component={Paper} sx={{ mt: 0, maxHeight: 600 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Block</TableCell>
                  <TableCell>Hash</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Gas</TableCell>
                  <TableCell>Gas Price</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Function</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell align="center">Info</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {txs.map(tx => (
                  <TableRow key={tx.hash} sx={{ bgcolor: tx.isError === '1' ? 'rgba(255,0,0,0.05)' : 'inherit' }}>
                    <TableCell>{tx.blockNumber}</TableCell>
                    <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.hash}</TableCell>
                    <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.from}</TableCell>
                    <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.to || tx.contractAddress}</TableCell>
                    <TableCell>{tx.value === '0' ? '0' : Number(tx.value) / 1e18}</TableCell>
                    <TableCell>{tx.gas}</TableCell>
                    <TableCell>{Number(tx.gasPrice) / 1e9} Gwei</TableCell>
                    <TableCell>{tx.txreceipt_status === '1' ? 'Success' : tx.isError === '1' ? 'Failed' : 'Pending'}</TableCell>
                    <TableCell sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.functionName || tx.methodId}</TableCell>
                    <TableCell>{tx.timeStamp ? new Date(Number(tx.timeStamp) * 1000).toLocaleString() : ''}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleClarifyRow('Blockchain Transaction', { ...tx, abi: contractABIs[tx.to?.toLowerCase()] })}
                        sx={{ color: colors.primary.main }}
                      >
                        <HelpOutline />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
      {contracts.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Token Balances (ERC Contracts)</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Address</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Balance</TableCell>
                  <TableCell>Decimals</TableCell>
                  <TableCell># of txs with main address</TableCell>
                  <TableCell align="center">Info</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contracts.map(contract => (
                  <TableRow key={contract}>
                    <TableCell sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{contract}</TableCell>
                    <TableCell>{contractBalances[contract]?.status === 'loading' ? 'Loading...' : contractBalances[contract]?.status === 'error' ? 'Error' : 'Success'}</TableCell>
                    <TableCell>{contractBalances[contract]?.balance}</TableCell>
                    <TableCell>{contractBalances[contract]?.decimals}</TableCell>
                    <TableCell>{contractMap[contract]}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => handleClarifyRow('Token Balance', { address: contract, ...contractBalances[contract], count: contractMap[contract], abi: contractABIs[contract.toLowerCase()] })}
                        sx={{ color: colors.primary.main }}
                      >
                        <HelpOutline />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  )

  // --- Chat send handler ---
  function handleSendChat() {
    if (!chatInput.trim()) return
    const userMsg = { role: 'user' as const, content: chatInput.trim() }
    // Prepare txs for system message based on sendFullInput
    const txsForMessage = sendFullInput ? txs : txs.map(({ input, ...rest }) => rest)
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    setChatError('')
    queryFinancialAdvisor({
      instructions: advisorInstructions,
      messages: [
        { role: 'system', content: `Current address: ${address}, chainId: ${chainId}. Recent transactions: ${JSON.stringify(txsForMessage)}. Token balances: ${JSON.stringify(contractBalances)}.` },
        ...chatMessages,
        userMsg,
      ]
    }).then(res => {
      if (res.error) setChatError(res.error)
      else setChatMessages(prev => [...prev, { role: 'assistant', content: res.result }])
      setChatLoading(false)
    })
  }

  function handleClarifyRow(type: string, data: any) {
    const txsForMessage = sendFullInput ? txs : txs.map(({ input, ...rest }) => rest)
    const clarifyMsg = `Can you please research the following data point, and clarify anything unique about it relative to the other data points in the data set? Use the tools available to you to determine any \n\nType: ${type}\nData Point to Research: ${JSON.stringify(data, null, 2)}\nComplete Data Set: ${type === 'Blockchain Transaction' ? JSON.stringify(txsForMessage, null, 2) : JSON.stringify(contractBalances, null, 2)}\nContract ABI: ${data.abi ? JSON.stringify(data.abi, null, 2) : ''}`
    setChatMessages(prev => [...prev, { role: 'user', content: 'Can you please clarify the attached data point? <Attached>'}])
    setChatInput('')
    setChatLoading(true)
    setChatError('')
    queryFinancialAdvisor({
      instructions: advisorInstructions,
      messages: [
        { role: 'system', content: `Current address: ${address}, chainId: ${chainId}.` },
        ...chatMessages,
        { role: 'user' as const, content: clarifyMsg },
      ]
    }).then(res => {
      if (res.error) setChatError(res.error)
      else setChatMessages(prev => [...prev, { role: 'assistant', content: res.result }])
      setChatLoading(false)
    })
  }
}
