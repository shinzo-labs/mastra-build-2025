import { useState, useCallback } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material'
import { X } from 'lucide-react'
import { ethers } from 'ethers'
import { LOGIN_MESSAGE } from '../config'
import { userService } from '../backendService'
import { shortenAddress } from '../utils'

interface LoginButtonProps {
  onLogin: (token: string, uuid: string) => void
  address: string | null
}

export const LoginButton = ({ onLogin, address: connectedAddress }: LoginButtonProps) => {
  const [loading, setLoading] = useState(false)
  const [showLogout, setShowLogout] = useState(false)

  const handleLogin = useCallback(async () => {
    if (connectedAddress) {
      setShowLogout(true)
      return
    }

    try {
      setLoading(true)
      const provider = new ethers.BrowserProvider(window.ethereum as ethers.Eip1193Provider)
      const accounts = await provider.send('eth_requestAccounts', [])
      const currentAccount = accounts[0].toLowerCase()
      const signer = await provider.getSigner()

      const message = LOGIN_MESSAGE + currentAccount
      const signature = await signer.signMessage(message)
      const data = await userService.login(message, signature)

      if (!data.body) throw new Error('No body')
      if (data.error) throw new Error('Login failed')

      document.cookie = `auth_token=${data.body.token} path=/ secure samesite=strict`
      onLogin(data.body.token, data.body.uuid)
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }, [onLogin, connectedAddress])

  const handleLogout = useCallback(() => {
    document.cookie = 'auth_token= path=/ expires=Thu, 01 Jan 1970 00:00:01 GMT'
    onLogin('', '')
    setShowLogout(false)
  }, [onLogin])

  return (
    <>
      <Button
        variant="contained"
        onClick={handleLogin}
        disabled={loading}
        sx={{ minWidth: 120 }}
      >
        {
          loading
            ? <CircularProgress size={24} />
            : connectedAddress
              ? shortenAddress(connectedAddress)
              : 'Connect Wallet'
        }
      </Button>
      <Dialog
        open={showLogout}
        onClose={() => setShowLogout(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Disconnect Wallet
          <IconButton
            onClick={() => setShowLogout(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <X />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          Would you like to disconnect?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogout(false)}>No</Button>
          <Button onClick={handleLogout} variant="contained" color="primary">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
