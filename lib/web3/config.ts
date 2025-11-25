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

// Alchemy RPC as third fallback (if API key is provided)
const alchemyApiKey = process.env.ALCHEMY_API_KEY
const alchemyMainnetUrl = alchemyApiKey ? `https://base-mainnet.g.alchemy.com/v2/${alchemyApiKey}` : null
const alchemySepoliaUrl = alchemyApiKey ? `https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}` : null

// Build transport for Base mainnet: primary -> fallback -> Alchemy (if available)
const mainnetUrls = [
  { url: isMainnet ? primaryRpcUrl : "https://mainnet.base.org", timeout: 10000, retryCount: 1 },
  { url: isMainnet ? fallbackRpcUrl : "https://base-rpc.publicnode.com", timeout: 10000, retryCount: 1 },
]
if (alchemyMainnetUrl) {
  mainnetUrls.push({ url: alchemyMainnetUrl, timeout: 10000, retryCount: 1 })
}
const mainnetTransport = fallback(
  mainnetUrls.map(({ url, timeout, retryCount }) =>
    http(url, { timeout, retryCount })
  )
)

// Build transport for Base Sepolia: primary -> fallback -> Alchemy (if available)
const sepoliaUrls = [
  { url: isMainnet ? "https://sepolia.base.org" : primaryRpcUrl, timeout: 10000, retryCount: 1 },
  { url: isMainnet ? "https://base-sepolia-rpc.publicnode.com" : fallbackRpcUrl, timeout: 10000, retryCount: 1 },
]
if (alchemySepoliaUrl) {
  sepoliaUrls.push({ url: alchemySepoliaUrl, timeout: 10000, retryCount: 1 })
}
const sepoliaTransport = fallback(
  sepoliaUrls.map(({ url, timeout, retryCount }) =>
    http(url, { timeout, retryCount })
  )
)

export const config = createConfig({
  chains: [base, baseSepolia], // Include both chains so wallet can switch
  connectors: [
    miniAppConnector(), // Farcaster wallet connector - MUST be first for auto-connect
    injected(),
  ],
  transports: {
    [base.id]: mainnetTransport,
    [baseSepolia.id]: sepoliaTransport,
  },
  ssr: true,
})

console.log("🔧 Wagmi config:", {
  chainId: selectedChain.id,
  chainName: selectedChain.name,
  isMainnet,
  primaryRpcUrl,
  fallbackRpcUrl,
  alchemyEnabled: !!alchemyApiKey,
})

// NFT Contract (Based Degen)
export const NFT_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0xE7c0f3beD50675521E0ecd24d2bb66f2480237a8") as `0x${string}`

// Game Rewards Contract
export const GAME_REWARDS_CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_GAME_REWARDS_ADDRESS || "0x0152B904AEbA835F2A14B834056b2c76d11CBC56") as `0x${string}`

// DEGEN Token Address
export const DEGEN_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_DEGEN_TOKEN_ADDRESS || "") as `0x${string}` | undefined

export const CHAIN_ID = chainId

