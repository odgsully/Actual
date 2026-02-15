'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function EthereumPolyfill() {
  useEffect(() => {
    // Create a safe mock for window.ethereum on mobile devices
    if (typeof window !== 'undefined' && !window.ethereum) {
      window.ethereum = {
        selectedAddress: undefined,
        isMetaMask: false,
        request: async () => {
          throw new Error('Ethereum provider not available')
        },
        on: () => {},
        removeListener: () => {},
      }
    }
  }, [])

  return null
}