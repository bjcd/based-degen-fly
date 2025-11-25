import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { useNFTBalance, useTokenOwnershipBatch, useTokenURIs } from "@/lib/web3/hooks-simple"
import { fetchNFTMetadata, parseNFTTraits } from "@/lib/web3/traits"

// Try checking a range of token IDs (e.g., 0-10000)
// Adjust MAX_TOKEN_ID based on your collection size
const MAX_TOKEN_ID = 10000
const BATCH_SIZE = 50 // Check 50 tokens at a time

export function useNFTTraits() {
  const { address, isConnected } = useAccount()
  const { data: balance, isLoading: balanceLoading } = useNFTBalance(address)
  const [ownedTraits, setOwnedTraits] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [checkedRange, setCheckedRange] = useState({ start: 0, end: BATCH_SIZE })

  // Generate token IDs to check (in batches)
  const tokenIdsToCheck = Array.from(
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
      console.log("🔍 Loading NFT traits...", {
        isConnected,
        address,
        balanceLoading,
        balance: balance?.result ? Number(balance.result) : 0,
        checkedRange,
        ownedTokenIdsCount: ownedTokenIds.length,
        tokenURIsCount: tokenURIs.length,
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

      // If no NFTs found, try checking more token IDs
      if (!balance?.result || Number(balance.result) === 0) {
        // Continue checking more token IDs if we haven't reached the max
        if (checkedRange.end < MAX_TOKEN_ID && !ownershipResult.isLoading) {
          console.log(`⏳ No NFTs found yet, checking next batch: ${checkedRange.end} to ${checkedRange.end + BATCH_SIZE}`)
          setCheckedRange((prev) => ({
            start: prev.end,
            end: Math.min(prev.end + BATCH_SIZE, MAX_TOKEN_ID),
          }))
          setLoading(true)
          return
        } else {
          console.log("❌ No NFTs found after checking range")
          setOwnedTraits([])
          setLoading(false)
          return
        }
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
            } else {
              console.log(`❌ No metadata for NFT ${index + 1}`)
            }
          })

          console.log("🎮 Final combined traits:", Array.from(allTraits))
          setOwnedTraits(Array.from(allTraits))
          setLoading(false)
        } catch (error) {
          console.error("❌ Error loading NFT traits:", error)
          setOwnedTraits([])
          setLoading(false)
        }
      } else if (ownedTokenIds.length === 0 && !ownershipResult.isLoading) {
        // No owned tokens in this batch, check next batch
        if (checkedRange.end < MAX_TOKEN_ID) {
          console.log(`⏳ No owned tokens in this batch, checking next: ${checkedRange.end} to ${checkedRange.end + BATCH_SIZE}`)
          setCheckedRange((prev) => ({
            start: prev.end,
            end: Math.min(prev.end + BATCH_SIZE, MAX_TOKEN_ID),
          }))
          setLoading(true)
        } else {
          console.log("❌ No NFTs found after checking all ranges")
          setOwnedTraits([])
          setLoading(false)
        }
      } else {
        setLoading(true)
      }
    }

    loadTraits()
  }, [
    isConnected,
    address,
    balanceLoading,
    balance?.result,
    checkedRange,
    ownershipResult.isLoading,
    ownedTokenIds.length,
    tokenURIsResult.isLoading,
    tokenURIs.length,
  ])

  return {
    ownedTraits,
    loading: loading || balanceLoading || ownershipResult.isLoading,
    hasNFTs: ownedTokenIds.length > 0,
    nftCount: ownedTokenIds.length,
  }
}



