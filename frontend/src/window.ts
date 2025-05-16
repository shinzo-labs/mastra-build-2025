import { ExternalProvider } from "@ethersproject/providers"

interface ExtendedExternalProvider extends ExternalProvider {
  on(event: string, callback: (...args: any[]) => void): void
  removeListener(event: string, callback: (...args: any[]) => void): void
}

declare global {
  interface Window {
    ethereum: ExtendedExternalProvider
  }
}
