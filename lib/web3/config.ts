import { createConfig, http, fallback } from "wagmi"
import { injected } from "wagmi/connectors"
import { baseSepolia } from "wagmi/chains"
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector"

const primaryRpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org"
const fallbackRpcUrl = process.env.NEXT_PUBLIC_RPC_URL_ALT || "https://base-sepolia-rpc.publicnode.com"

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
  chains: [baseSepolia],
  connectors: [
    miniAppConnector(), // Farcaster wallet connector - MUST be first for auto-connect
    injected(),
  ],
  transports: {
    [baseSepolia.id]: transport,
  },
  ssr: true,
})

console.log("🔧 Wagmi config:", {
  chainId: baseSepolia.id,
  chainName: baseSepolia.name,
  primaryRpcUrl,
  fallbackRpcUrl,
})

// NFT Contract (Based Degen)
export const NFT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xE7c0f3beD50675521E0ecd24d2bb66f2480237a8") as `0x${string}`

// Game Rewards Contract
export const GAME_REWARDS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_GAME_REWARDS_ADDRESS || "0x0152B904AEbA835F2A14B834056b2c76d11CBC56") as `0x${string}`

// DEGEN Token Address (Base Sepolia)
export const DEGEN_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_DEGEN_TOKEN_ADDRESS || "") as `0x${string}` | undefined

export const CHAIN_ID = Number.parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532")

