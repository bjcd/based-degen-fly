"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { WagmiProvider } from "wagmi"
import { config } from "@/lib/web3/config"
import { useState, useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

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
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}

