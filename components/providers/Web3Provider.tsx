"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider, useConnect, useAccount } from "wagmi"
import { config } from "@/lib/web3/config"
import { useState, useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

// Inner component to handle auto-connect (must be inside WagmiProvider)
function AutoConnect() {
  const { isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const [hasAttempted, setHasAttempted] = useState(false)
  const [sdkReady, setSdkReady] = useState(false)

  // Wait for SDK to be ready
  useEffect(() => {
    const checkSDK = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp()
        if (isInMiniApp) {
          // Wait a bit more for SDK to fully initialize
          await new Promise(resolve => setTimeout(resolve, 1000))
          setSdkReady(true)
        } else {
          // Not in miniapp, no need to auto-connect
          setSdkReady(true)
        }
      } catch (error) {
        console.warn("⚠️ SDK check failed:", error)
        setSdkReady(true) // Continue anyway
      }
    }
    checkSDK()
  }, [])

  // Attempt auto-connect once SDK is ready
  useEffect(() => {
    if (!sdkReady || hasAttempted || isConnected) return

    const attemptAutoConnect = async () => {
      try {
        const isInMiniApp = await sdk.isInMiniApp()
        console.log("🔍 Auto-connect check:", { 
          isInMiniApp, 
          connectorsCount: connectors.length,
          connectorIds: connectors.map(c => c.id),
          isConnected 
        })
        
        if (isInMiniApp && connectors.length > 0) {
          // Find Farcaster connector (could be first or have specific ID)
          const farcasterConnector = connectors.find(c => 
            c.id === 'farcasterMiniApp' || 
            c.id === 'farcaster' ||
            c.name?.toLowerCase().includes('farcaster')
          ) || connectors[0] // Fallback to first connector
          
          if (farcasterConnector && !isConnected) {
            console.log("🔄 Attempting Farcaster auto-connect...", { 
              connectorId: farcasterConnector.id,
              connectorName: farcasterConnector.name 
            })
            try {
              await connect({ connector: farcasterConnector })
              console.log("✅ Farcaster auto-connect successful")
            } catch (connectError) {
              console.warn("⚠️ Farcaster auto-connect failed:", connectError)
            }
          } else {
            console.log("⚠️ No Farcaster connector found or already connected")
          }
        } else {
          console.log("📱 Not in Farcaster miniapp or no connectors available")
        }
      } catch (error) {
        console.warn("⚠️ Auto-connect check failed:", error)
      } finally {
        setHasAttempted(true)
      }
    }

    attemptAutoConnect()
  }, [sdkReady, isConnected, connectors, connect, hasAttempted])

  return null
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [isReady, setIsReady] = useState(false)

  // CRITICAL: Call sdk.actions.ready() in root provider to dismiss splash screen
  // Must wait for SDK to be available, poll if needed
  useEffect(() => {
    const initFarcaster = async () => {
      if (typeof window === "undefined") {
        setIsReady(true);
        return;
      }

      // Poll for SDK to be ready (check if we're in miniapp)
      // Try up to 20 times with 100ms delay (2 seconds total)
      let attempts = 0;
      const maxAttempts = 20;
      const pollInterval = 100;

      const checkAndInitSDK = async (): Promise<void> => {
        try {
          const isInMiniApp = await sdk.isInMiniApp();

          if (isInMiniApp) {
            // We're in a miniapp! Call ready() immediately
            try {
              await sdk.actions.ready();
              console.log('✅ Farcaster SDK ready() called - splash screen hidden');
              setIsReady(true);
              return;
            } catch (sdkError) {
              console.warn('⚠️ Farcaster SDK ready() failed:', sdkError);
              setIsReady(true);
              return;
            }
          } else {
            attempts++;
            if (attempts < maxAttempts) {
              setTimeout(checkAndInitSDK, pollInterval);
            } else {
              console.log('📱 Farcaster SDK not detected - running in web mode');
              setIsReady(true);
            }
          }
        } catch (error) {
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkAndInitSDK, pollInterval);
          } else {
            console.log('📱 Farcaster SDK not detected - running in web mode');
            setIsReady(true);
          }
        }
      };

      checkAndInitSDK();
    };

    initFarcaster();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

