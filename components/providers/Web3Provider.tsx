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
          await new Promise(resolve => setTimeout(resolve, 1500))
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
          connectorNames: connectors.map(c => c.name),
          isConnected 
        })
        
        if (isInMiniApp && connectors.length > 0) {
          // Find Farcaster connector - check multiple possible IDs
          const farcasterConnector = connectors.find(c => {
            const id = c.id.toLowerCase()
            const name = (c.name || '').toLowerCase()
            return id === 'farcasterminiapp' || 
                   id === 'farcaster' ||
                   id.includes('farcaster') ||
                   name.includes('farcaster')
          })
          
          if (farcasterConnector) {
            if (!isConnected) {
              console.log("🔄 Attempting Farcaster auto-connect...", { 
                connectorId: farcasterConnector.id,
                connectorName: farcasterConnector.name 
              })
              try {
                // Use a small delay to ensure connector is fully ready
                await new Promise(resolve => setTimeout(resolve, 200))
                await connect({ connector: farcasterConnector })
                console.log("✅ Farcaster auto-connect successful")
              } catch (connectError: any) {
                console.warn("⚠️ Farcaster auto-connect failed:", connectError)
                // Retry once after a delay
                setTimeout(async () => {
                  try {
                    await connect({ connector: farcasterConnector })
                    console.log("✅ Farcaster auto-connect successful (retry)")
                  } catch (retryError) {
                    console.warn("⚠️ Farcaster auto-connect retry failed:", retryError)
                  }
                }, 1000)
              }
            } else {
              console.log("✅ Already connected via Farcaster")
            }
          } else {
            console.warn("⚠️ No Farcaster connector found. Available connectors:", 
              connectors.map(c => ({ id: c.id, name: c.name }))
            )
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

    // Add a small delay to ensure connectors are fully initialized
    const timeoutId = setTimeout(attemptAutoConnect, 300)
    return () => clearTimeout(timeoutId)
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
              
              // Automatically prompt user to add miniapp if not already added
              try {
                await sdk.actions.addMiniApp();
                console.log('✅ Miniapp add prompt shown successfully');
              } catch (addError: any) {
                // Handle errors gracefully - app might already be added or user rejected
                if (addError?.name === 'RejectedByUser') {
                  console.log('ℹ️ User rejected adding miniapp (or already added)');
                } else if (addError?.name === 'InvalidDomainManifestJson') {
                  console.warn('⚠️ Domain mismatch - cannot add miniapp:', addError);
                } else {
                  console.log('ℹ️ Miniapp may already be added or error occurred:', addError?.message || addError);
                }
                // Continue anyway - this is not a critical error
              }
              
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

