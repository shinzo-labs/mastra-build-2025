import ReactDOM from 'react-dom/client'
import { App } from './App/App'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { theme } from './theme'

const rootElement = document.getElementById("root") as HTMLElement
const root = ReactDOM.createRoot(rootElement)

root.render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
)
