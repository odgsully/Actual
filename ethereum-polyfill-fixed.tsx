'use client'

import { useEffect } from 'react'

// Extend the Window interface to include ethereum
declare global {
  interface Window {
    ethereum?: {
      selectedAddress?: string;
      isMetaMask: boolean;
      request: (args: any) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
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