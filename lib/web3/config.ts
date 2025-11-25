import { createConfig, http, fallback } from "wagmi"
import { injected } from "wagmi/connectors"
import { base, baseSepolia } from "wagmi/chains"
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector"

// Determine which chain to use based on environment variable
const chainId = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "8453")
const isMainnet = chainId === 8453 // Base mainnet chain ID

const selectedChain = isMainnet ? base : baseSepolia

const primaryRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || (isMainnet ? "https://mainnet.base.org" : "https://sepolia.base.org")
const fallbackRpcUrl = process.env.NEXT_PUBLIC_RPC_URL_ALT || (isMainnet ? "https://base-rpc.publicnode.com" : "https://base-sepolia-rpc.publicnode.com")

const transport = fallback([
  http(primaryRpcUrl, {
    timeout: 10000,
    retryCount: 1,
  }),
  http(fallbackRpcUrl, {
    timeout: 10000,
    retryCount: 1,
  }),
])

export const config = createConfig({
  chains: [selectedChain],
  connectors: [
    miniAppConnector(), // Farcaster wallet connector - MUST be first for auto-connect
    injected(),
  ],
  transports: {
    [selectedChain.id]: transport,
  },
  ssr: true,
})

console.log("🔧 Wagmi config:", {
  chainId: selectedChain.id,
  chainName: selectedChain.name,
  isMainnet,
  primaryRpcUrl,
  fallbackRpcUrl,
})

// NFT Contract (Based Degen)
export const NFT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xE7c0f3beD50675521E0ecd24d2bb66f2480237a8") as `0x${string}`

// Game Rewards Contract
export const GAME_REWARDS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_GAME_REWARDS_ADDRESS || "0x0152B904AEbA835F2A14B834056b2c76d11CBC56") as `0x${string}`

// DEGEN Token Address
export const DEGEN_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_DEGEN_TOKEN_ADDRESS || "") as `0x${string}` | undefined

export const CHAIN_ID = chainId

