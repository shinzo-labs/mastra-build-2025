// App.tsx
import { useCallback, useEffect, useState } from 'react'
import { jwtDecode } from "jwt-decode"
import { Box, Tab, Tabs } from '@mui/material'
import { Compass, PenSquare } from 'lucide-react'
import { LoginButton } from '../components/LoginButton'
import { blockchainService } from '../backendService'
import { colors } from '../theme'
import CreatePage from './Create'
import ExplorePage from './Explore'
import ViewPage from './View'
import { NetworkList } from '../types'

interface JWTPayload {
  exp: number
  iat: number
  uuid: string
  walletAddress: string
}

const isValidPage = (path: string) => {
  return ['view', 'explore', 'create'].includes(path.slice(1))
}

const getInitialState = () => {
  const path = window.location.pathname

  if (!isValidPage(path)) return { tab: 'create', uuid: null }

  return {
    tab: path.slice(1),
    uuid: path.startsWith('/view/') ? path.split('/')[2] : null
  }
}

export const App = () => {
  const initialState = getInitialState()

  const [currentTab, setCurrentTab] = useState<string>(initialState.tab)
  const [viewDashboardUuid, setViewDashboardUuid] = useState<string | null>(initialState.uuid)
  const [authToken, setAuthToken] = useState<string | null>(
    document.cookie.replace(/(?:(?:^|.*\s*)auth_token\s*\=\s*([^]*).*$)|^.*$/, "$1")
  )
  const [userUuid, setUserUuid] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [networks, setNetworks] = useState<NetworkList>({})

  const fetchNetworks = useCallback(async () => {
    try {
      const networkList = await blockchainService.getNetworks()
      setNetworks(networkList)
    } catch (error) {
      console.error('Error fetching networks:', error)
    }
  }, [])

  const handleLogin = (token: string) => {
    if (!token) return

    try {
      setAuthToken(token)

      const decoded = jwtDecode<JWTPayload>(token)
      setUserUuid(decoded.uuid)
    } catch (error) {
      console.error('Error decoding login token:', error)
    }
  }

  const navigateToView = (uuid: string) => {
    setViewDashboardUuid(uuid)
    setCurrentTab('view')
    window.history.pushState({}, '', `/view/${uuid}`)
  }

  useEffect(() => {
    if (authToken) {
      try {
        const decoded = jwtDecode<JWTPayload>(authToken)
        setWalletAddress(decoded.walletAddress)
        setUserUuid(decoded.uuid)
        fetchNetworks()
      } catch (error) {
        console.error('Error decoding token:', error)
        setAuthToken(null)
        setWalletAddress(null)
        setUserUuid(null)
        document.cookie = 'auth_token= path=/ expires=Thu, 01 Jan 1970 00:00:01 GMT'
      }
    } else {
      setWalletAddress(null)
      setUserUuid(null)
    }
  }, [authToken, fetchNetworks])

  useEffect(() => {
    const handleDisconnect = () => {
      document.cookie = 'auth_token= path=/ expires=Thu, 01 Jan 1970 00:00:01 GMT'
      setAuthToken(null)
      setWalletAddress(null)
      setUserUuid(null)
    }

    if (window.ethereum) window.ethereum.on('disconnect', handleDisconnect)

    return () => {
      if (window.ethereum) window.ethereum.removeListener('disconnect', handleDisconnect)
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path.startsWith('/view/')) {
        const uuid = path.split('/')[2]
        setViewDashboardUuid(uuid)
        setCurrentTab('view')
      } else {
        const page = path.slice(1)
        setCurrentTab(isValidPage(page) ? page : 'create')
        setViewDashboardUuid(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (currentTab !== 'view') window.history.pushState({}, '', `/${currentTab}`)
  }, [currentTab])

  const renderPage = () => {
    switch (currentTab) {
      case 'create':
        return <CreatePage userUuid={userUuid} networks={networks} />
      case 'explore':
        return <ExplorePage userUuid={userUuid} onSelectDashboard={navigateToView} />
      case 'view':
        return viewDashboardUuid
          ? <ViewPage userUuid={userUuid} dashboardUuid={viewDashboardUuid} />
          : null
      default:
        return <CreatePage userUuid={userUuid} networks={networks} />
    }
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'  // Prevent scrolling
      }}
    >
      <Box padding={1} display="flex" justifyContent="space-between" alignItems="center">
        <Tabs
          value={currentTab === 'view' ? false : currentTab}
          onChange={(_, newValue) => setCurrentTab(newValue)}
          textColor="inherit"
          variant="fullWidth"
          sx={{
            flex: 1,
            bgcolor: colors.background.paper,
            maxWidth: '300px',
          }}
        >
          <Tab label="Create" value="create" icon={<PenSquare />} />
          <Tab label="Explore" value="explore" icon={<Compass />} />
        </Tabs>
        <Box ml={2}>
          <LoginButton onLogin={handleLogin} address={walletAddress} />
        </Box>
      </Box>
        {renderPage()}
    </Box>
  )
}
