"use client"

import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs sm:text-sm text-gray-700">
          Connected: <span className="font-mono text-purple-600">{address.slice(0, 6)}...{address.slice(-4)}</span>
        </div>
        <Button
          onClick={() => disconnect()}
          variant="outline"
          size="sm"
          className="text-xs sm:text-sm"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  const injectedConnector = connectors.find((c) => c.id === "injected" || c.id === "metaMask")

  if (!injectedConnector) {
    return (
      <div className="text-xs sm:text-sm text-red-600 text-center">
        No wallet found. Please install MetaMask or another injected wallet.
      </div>
    )
  }

  return (
    <Button
      onClick={() => connect({ connector: injectedConnector })}
      disabled={isPending}
      className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm px-4 sm:px-6 py-2 sm:py-3"
    >
      {isPending ? "Connecting..." : "Connect Wallet"}
    </Button>
  )
}

