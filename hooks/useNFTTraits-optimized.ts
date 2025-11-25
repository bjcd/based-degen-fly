import { useEffect, useState } from "react"
import { useAccount } from "wagmi"
import { useNFTBalance } from "@/lib/web3/hooks-simple"
import { getOwnedNFTs } from "@/lib/web3/nft-api"
import { NFT_CONTRACT_ADDRESS } from "@/lib/web3/config"
import { parseNFTTraits, type NFTMetadata } from "@/lib/web3/traits"

export function useNFTTraitsOptimized() {
  const { address, isConnected } = useAccount()
  const balanceResult = useNFTBalance(address)
  const balance = balanceResult.data
  const balanceLoading = balanceResult.isLoading
  const [ownedTraits, setOwnedTraits] = useState<number[]>([])
  const [nftImageUrl, setNftImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Debug: Log hook state
  console.log("🔍 useNFTTraitsOptimized state:", {
    isConnected,
    address,
    balance,
    balanceLoading,
    hasLoaded,
    ownedTraitsCount: ownedTraits.length,
  })

  useEffect(() => {
    async function loadTraits() {
      console.log("🚀 loadTraits called")
      
      if (!isConnected || !address) {
        console.log("❌ Not connected or no address")
        setOwnedTraits([])
        setNftImageUrl(null)
        setLoading(false)
        return
      }

      if (balanceLoading) {
        console.log("⏳ Balance still loading...")
        setLoading(true)
        return
      }

      // balance is now the data directly (BigInt from useReadContract)
      const balanceValue = balance !== undefined && balance !== null ? Number(balance) : 0
      
      console.log(`💰 Balance value: ${balanceValue}`, {
        balance,
        balanceType: typeof balance,
      })
      
      if (balanceValue === 0) {
        console.log("❌ Balance is 0, no NFTs", { balance })
        setOwnedTraits([])
        setNftImageUrl(null)
        setLoading(false)
        return
      }

      console.log(`🔍 Loading traits for ${balanceValue} NFT(s)...`)
      console.log(`📍 Address: ${address}, Contract: ${NFT_CONTRACT_ADDRESS}`)

      try {
        // Use API to get owned NFTs (much faster, no rate limiting)
        console.log("🌐 Fetching NFTs via API...")
        const ownedNFTs = await getOwnedNFTs(address, NFT_CONTRACT_ADDRESS)
        console.log(`📦 Received ${ownedNFTs.length} NFT(s) from API`)

        if (ownedNFTs.length === 0) {
          console.log("⚠️ No NFTs found via API/events")
          console.log("💡 Tip: Add Alchemy API key to .env.local for faster results")
          setOwnedTraits([])
          setNftImageUrl(null)
          setLoading(false)
          return
        }

        // Parse traits from all NFTs
        const allTraits = new Set<number>()
        let firstImageUrl: string | null = null

        // Fetch metadata for each NFT
        for (const nft of ownedNFTs) {
          let metadata: NFTMetadata | null = null
          
          if (nft.metadata) {
            metadata = nft.metadata as NFTMetadata
          } else if (nft.tokenUri) {
            // Fetch metadata from tokenURI
            try {
              let metadataUrl = nft.tokenUri
              if (metadataUrl.startsWith("ipfs://")) {
                metadataUrl = `https://ipfs.io/ipfs/${metadataUrl.replace("ipfs://", "")}`
              }

              console.log(`📥 Fetching metadata from: ${metadataUrl}`)
              const response = await fetch(metadataUrl)
              if (response.ok) {
                metadata = await response.json() as NFTMetadata
                console.log(`✅ Got metadata for token ${nft.tokenId}:`, metadata)
              } else {
                console.error(`❌ Failed to fetch metadata: ${response.status}`)
              }
            } catch (error) {
              console.error("❌ Error fetching metadata from tokenURI:", error)
            }
          } else {
            // No tokenURI, need to get it from contract
            try {
              const { createPublicClient, http } = await import("viem")
              const { baseSepolia } = await import("viem/chains")
              
              const publicClient = createPublicClient({
                chain: baseSepolia,
                transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org"),
              })

              const tokenURI = await publicClient.readContract({
                address: NFT_CONTRACT_ADDRESS as `0x${string}`,
                abi: [
                  {
                    inputs: [{ name: "tokenId", type: "uint256" }],
                    name: "tokenURI",
                    outputs: [{ name: "", type: "string" }],
                    stateMutability: "view",
                    type: "function",
                  },
                ],
                functionName: "tokenURI",
                args: [BigInt(nft.tokenId)],
              })

              console.log(`📥 Got tokenURI for ${nft.tokenId}: ${tokenURI}`)
              
              let metadataUrl = tokenURI
              if (metadataUrl.startsWith("ipfs://")) {
                metadataUrl = `https://ipfs.io/ipfs/${metadataUrl.replace("ipfs://", "")}`
              }

              const response = await fetch(metadataUrl)
              if (response.ok) {
                metadata = await response.json() as NFTMetadata
                console.log(`✅ Got metadata for token ${nft.tokenId}:`, metadata)
              }
            } catch (error) {
              console.error(`❌ Error getting tokenURI for ${nft.tokenId}:`, error)
            }
          }

          if (metadata) {
            const traits = parseNFTTraits(metadata)
            console.log(`🎯 Parsed traits for token ${nft.tokenId}:`, traits)
            traits.forEach((traitId) => allTraits.add(traitId))

            // Get first NFT image
            if (!firstImageUrl && metadata.image) {
              let imageUrl = metadata.image
              if (imageUrl.startsWith("ipfs://")) {
                imageUrl = `https://ipfs.io/ipfs/${imageUrl.replace("ipfs://", "")}`
              }
              firstImageUrl = imageUrl
            }
          }
        }

        console.log("🎮 Final combined traits:", Array.from(allTraits))
        setOwnedTraits(Array.from(allTraits))
        setNftImageUrl(firstImageUrl)
        setLoading(false)
        setHasLoaded(true) // Mark as loaded to prevent re-running
      } catch (error) {
        console.error("❌ Error loading NFT traits:", error)
        setOwnedTraits([])
        setNftImageUrl(null)
        setLoading(false)
        setHasLoaded(true) // Mark as loaded even on error to prevent infinite retries
      }
    }

    // Only run once when conditions are met, or if address/connection changes
    console.log("🔍 useEffect conditions check:", {
      isConnected,
      hasAddress: !!address,
      balanceLoading,
      balance,
      balanceDefined: balance !== undefined,
      balanceGTZero: balance !== undefined ? balance > 0n : false,
      hasLoaded,
      shouldLoad: isConnected && address && !balanceLoading && balance !== undefined && balance > 0n && !hasLoaded,
    })

    if (isConnected && address && !balanceLoading && balance !== undefined && balance > 0n && !hasLoaded) {
      console.log("✅ Conditions met, calling loadTraits()")
      loadTraits()
    } else if (!isConnected || !address) {
      console.log("❌ Wallet not connected or no address, clearing traits")
      setOwnedTraits([])
      setNftImageUrl(null)
      setLoading(false)
      setHasLoaded(false)
    } else if (balance === 0n || balance === undefined) {
      console.log("⚠️ Balance is 0 or undefined, clearing traits")
      setOwnedTraits([])
      setNftImageUrl(null)
      setLoading(false)
      setHasLoaded(false)
    }
  }, [isConnected, address, balanceLoading, balance, hasLoaded])

  return {
    ownedTraits,
    nftImageUrl,
    loading: loading || balanceLoading,
    hasNFTs: ownedTraits.length > 0,
    nftCount: balance ? Number(balance) : 0,
  }
}

