import { useReadContract, useReadContracts } from "wagmi"
import { NFT_CONTRACT_ADDRESS } from "./config"
import { ERC721_ABI } from "./abi"
import { useAccount } from "wagmi"

export function useNFTBalance(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount()
  const ownerAddress = address || connectedAddress

  const result = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: ERC721_ABI,
    functionName: "balanceOf",
    args: ownerAddress ? [ownerAddress] : undefined,
    query: {
      enabled: !!ownerAddress,
    },
  })

  if (result.error) {
    console.error("❌ Error fetching NFT balance:", result.error)
  }
  if (result.data) {
    console.log("✅ NFT Balance:", Number(result.data))
  }

  return result
}

export function useOwnedTokenIds(address?: `0x${string}`, balance?: bigint) {
  const { address: connectedAddress } = useAccount()
  const ownerAddress = address || connectedAddress

  const tokenIndices = balance
    ? Array.from({ length: Number(balance) }, (_, i) => i)
    : []

  const contracts = tokenIndices.map((index) => ({
    address: NFT_CONTRACT_ADDRESS,
    abi: ERC721_ABI,
    functionName: "tokenOfOwnerByIndex" as const,
    args: [ownerAddress!, BigInt(index)] as const,
  }))

  const result = useReadContracts({
    contracts: contracts.length > 0 ? contracts : [],
    query: {
      enabled: !!ownerAddress && tokenIndices.length > 0,
    },
  })

  if (result.error) {
    console.error("❌ Error fetching token IDs:", result.error)
  }
  if (result.data) {
    const tokenIds = result.data
      .map((r) => (r.status === "success" ? Number(r.result) : null))
      .filter((id): id is number => id !== null)
    console.log("✅ Token IDs:", tokenIds)
  }

  return result
}

export function useTokenURIs(tokenIds: bigint[]) {
  const contracts = tokenIds.map((tokenId) => ({
    address: NFT_CONTRACT_ADDRESS,
    abi: ERC721_ABI,
    functionName: "tokenURI" as const,
    args: [tokenId] as const,
  }))

  const result = useReadContracts({
    contracts: contracts.length > 0 ? contracts : [],
    query: {
      enabled: tokenIds.length > 0,
    },
  })

  if (result.error) {
    console.error("❌ Error fetching token URIs:", result.error)
  }
  if (result.data) {
    const uris = result.data
      .map((r) => (r.status === "success" ? r.result : null))
      .filter((uri): uri is string => uri !== null)
    console.log("✅ Token URIs:", uris)
  }

  return result
}


