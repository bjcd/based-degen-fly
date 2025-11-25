import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { useNFTBalance, useTokenOwnershipBatch, useTokenURIs } from "@/lib/web3/hooks-simple"
import { fetchNFTMetadata, parseNFTTraits } from "@/lib/web3/traits"

// Try checking a range of token IDs (e.g., 0-20000)
// Adjust MAX_TOKEN_ID based on your collection size
const MAX_TOKEN_ID = 20000
const BATCH_SIZE = 100 // Check 100 tokens at a time (increased for faster checking)

export function useNFTTraits() {
  const { address, isConnected } = useAccount()
  const { data: balance, isLoading: balanceLoading } = useNFTBalance(address)
  const [ownedTraits, setOwnedTraits] = useState<number[]>([])
  const [nftImageUrl, setNftImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [cachedTokenId, setCachedTokenId] = useState<bigint | null>(null)
  const [checkedRange, setCheckedRange] = useState({ start: 0, end: BATCH_SIZE })

  // If we have a cached token ID, use it directly
  const tokenIdsToCheck = cachedTokenId
    ? [cachedTokenId]
    : Array.from(
        { length: checkedRange.end - checkedRange.start },
        (_, i) => BigInt(checkedRange.start + i)
      )

  // Check ownership of current batch
  const ownershipResult = useTokenOwnershipBatch(tokenIdsToCheck, address)
  const ownedTokenIds = ownershipResult.ownedTokenIds || []

  // Get URIs for owned tokens
  const tokenURIsResult = useTokenURIs(ownedTokenIds)
  const tokenURIs = tokenURIsResult.data
    ?.map((result) => (result.status === "success" ? (result.result as string) : null))
    .filter((uri): uri is string => uri !== null && uri.length > 0) || []

  useEffect(() => {
    async function loadTraits() {
      const balanceValue = balance?.data ? Number(balance.data) : 0
      console.log("🔍 Loading NFT traits...", {
        isConnected,
        address,
        balanceLoading,
        balance: balanceValue,
        balanceData: balance?.data,
        checkedRange,
        ownershipLoading: ownershipResult.isLoading,
        ownedTokenIdsCount: ownedTokenIds.length,
        ownedTokenIds,
        tokenURIsLoading: tokenURIsResult.isLoading,
        tokenURIsCount: tokenURIs.length,
        ownershipData: ownershipResult.data,
      })

      if (!isConnected || !address) {
        console.log("❌ Not connected or no address")
        setOwnedTraits([])
        setLoading(false)
        return
      }

      // Wait for balance to load
      if (balanceLoading) {
        console.log("⏳ Waiting for balance...")
        setLoading(true)
        return
      }

      // If we found NFTs but haven't loaded their URIs yet, wait
      if (ownedTokenIds.length > 0 && tokenURIs.length === 0 && tokenURIsResult.isLoading) {
        console.log("⏳ Waiting for token URIs...", { ownedTokenIds })
        setLoading(true)
        return
      }

      // If we have token URIs, fetch metadata
      if (tokenURIs.length > 0) {
        console.log("📝 Fetching metadata from URIs:", tokenURIs)

        try {
          // Fetch metadata for all NFTs
          const metadataPromises = tokenURIs.map((uri) => fetchNFTMetadata(uri))
          const metadataResults = await Promise.all(metadataPromises)

          console.log("📦 Metadata results:", metadataResults)

          // Parse traits from all NFTs and combine them
          const allTraits = new Set<number>()
          metadataResults.forEach((metadata, index) => {
            if (metadata) {
              console.log(`🎯 Parsing traits from NFT ${index + 1}:`, metadata)
              const traits = parseNFTTraits(metadata)
              console.log(`✅ Found traits:`, traits)
              traits.forEach((traitId) => allTraits.add(traitId))
              
              // Extract and cache NFT image URL
              if (metadata.image) {
                let imageUrl = metadata.image
                if (imageUrl.startsWith("ipfs://")) {
                  imageUrl = `https://ipfs.io/ipfs/${imageUrl.replace("ipfs://", "")}`
                }
                setNftImageUrl(imageUrl)
              }
            } else {
              console.log(`❌ No metadata for NFT ${index + 1}`)
            }
          })

          // Cache the found token ID to avoid re-searching
          if (ownedTokenIds.length > 0 && !cachedTokenId) {
            setCachedTokenId(ownedTokenIds[0])
            console.log(`💾 Cached token ID: ${ownedTokenIds[0]}`)
          }

          console.log("🎮 Final combined traits:", Array.from(allTraits))
          setOwnedTraits(Array.from(allTraits))
          setLoading(false)
          return
        } catch (error) {
          console.error("❌ Error loading NFT traits:", error)
          setOwnedTraits([])
          setLoading(false)
          return
        }
      }

      // If balance shows NFTs but we haven't found any yet, keep checking
      // But if we've checked a lot and balance is 0, stop
      if (ownedTokenIds.length === 0 && !ownershipResult.isLoading) {
        // If we have a balance > 0, keep searching even if we've checked many ranges
        // The token might be outside the initial range
        if (balanceValue > 0 && checkedRange.end < MAX_TOKEN_ID * 2) {
          console.log(`⏳ Balance shows ${balanceValue} NFT(s) but not found yet. Checking next batch: ${checkedRange.end} to ${checkedRange.end + BATCH_SIZE}`)
          setCheckedRange((prev) => ({
            start: prev.end,
            end: Math.min(prev.end + BATCH_SIZE, MAX_TOKEN_ID * 2),
          }))
          setLoading(true)
          return
        } else if (checkedRange.end >= MAX_TOKEN_ID && balanceValue === 0) {
          console.log("❌ No NFTs found after checking all ranges and balance is 0")
          setOwnedTraits([])
          setLoading(false)
          return
        } else if (checkedRange.end >= MAX_TOKEN_ID * 2) {
          console.log("❌ No NFTs found after checking extended range")
          setOwnedTraits([])
          setLoading(false)
          return
        } else {
          console.log(`⏳ No owned tokens in this batch, checking next: ${checkedRange.end} to ${checkedRange.end + BATCH_SIZE}`)
          setCheckedRange((prev) => ({
            start: prev.end,
            end: Math.min(prev.end + BATCH_SIZE, MAX_TOKEN_ID * 2),
          }))
          setLoading(true)
          return
        }
      }

      // Still loading
      setLoading(true)
    }

    loadTraits()
  }, [
    isConnected,
    address,
    balanceLoading,
    balance?.data,
    checkedRange,
    cachedTokenId,
    ownershipResult.isLoading,
    ownedTokenIds.length,
    tokenURIsResult.isLoading,
    tokenURIs.length,
  ])

  return {
    ownedTraits,
    nftImageUrl,
    loading: loading || balanceLoading || ownershipResult.isLoading,
    hasNFTs: ownedTokenIds.length > 0,
    nftCount: ownedTokenIds.length,
  }
}

