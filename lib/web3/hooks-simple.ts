import { useReadContract, useReadContracts } from "wagmi"
import { NFT_CONTRACT_ADDRESS } from "./config"
import { ERC721_ABI } from "./abi"
import { useAccount } from "wagmi"

export function useNFTBalance(address?: `0x${string}`) {
  const { address: connectedAddress } = useAccount()
  const ownerAddress = address || connectedAddress

  console.log("🔍 useNFTBalance called:", {
    ownerAddress,
    contractAddress: NFT_CONTRACT_ADDRESS,
    enabled: !!ownerAddress,
  })

  const result = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: ERC721_ABI,
    functionName: "balanceOf",
    args: ownerAddress ? [ownerAddress] : undefined,
    query: {
      enabled: !!ownerAddress,
    },
  })

  console.log("💰 useNFTBalance result:", {
    data: result.data,
    isLoading: result.isLoading,
    error: result.error,
    status: result.status,
  })

  if (result.error) {
    console.error("❌ Error fetching NFT balance:", result.error)
  }

  return result
}

// Check if an address owns a specific token ID
export function useTokenOwnership(tokenId: bigint, ownerAddress?: `0x${string}`) {
  const { address: connectedAddress } = useAccount()
  const owner = ownerAddress || connectedAddress

  return useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: ERC721_ABI,
    functionName: "ownerOf",
    args: [tokenId],
    query: {
      enabled: !!owner && !!tokenId,
      select: (data) => {
        return data?.toLowerCase() === owner?.toLowerCase()
      },
    },
  })
}

// Get token URI for a specific token ID
export function useTokenURI(tokenId: bigint) {
  return useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi: ERC721_ABI,
    functionName: "tokenURI",
    args: [tokenId],
    query: {
      enabled: !!tokenId,
    },
  })
}

// Check ownership and get URI for multiple token IDs
export function useTokenOwnershipBatch(tokenIds: bigint[], ownerAddress?: `0x${string}`) {
  const { address: connectedAddress } = useAccount()
  const owner = ownerAddress || connectedAddress

  const contracts = tokenIds.map((tokenId) => ({
    address: NFT_CONTRACT_ADDRESS,
    abi: ERC721_ABI,
    functionName: "ownerOf" as const,
    args: [tokenId] as const,
  }))

  const result = useReadContracts({
    contracts: contracts.length > 0 ? contracts : [],
    query: {
      enabled: !!owner && tokenIds.length > 0,
    },
  })

  // Filter to only tokens owned by the address
  const ownedTokenIds: bigint[] = []
  if (result.data && owner) {
    result.data.forEach((r, index) => {
      const tokenId = tokenIds[index]
      if (r.status === "success") {
        const ownerAddress = r.result as `0x${string}`
        const isOwner = ownerAddress?.toLowerCase() === owner.toLowerCase()
        if (isOwner) {
          ownedTokenIds.push(tokenId)
        }
        // Removed excessive logging - only log errors
      } else if (r.status === "error") {
        // Token might not exist (reverted), which is fine - no need to log
      }
    })
  }

  // Removed excessive logging

  return {
    ...result,
    ownedTokenIds,
  }
}

// Get token URIs for multiple token IDs
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

  // Removed excessive logging - only log errors
  if (result.error) {
    console.error("❌ Error fetching token URIs:", result.error)
  }

  return result
}

