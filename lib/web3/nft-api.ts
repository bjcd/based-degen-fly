// Use Alchemy NFT API for efficient NFT ownership queries
// This avoids rate limiting from too many blockchain requests

const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || ""
const BASE_SEPOLIA_NETWORK = "base-sepolia"

// Alternative: Use a public NFT API service
// Options: Alchemy (free tier), Moralis, OpenSea API, etc.

export interface NFTMetadata {
  name?: string
  description?: string
  image?: string
  attributes?: Array<{
    trait_type?: string
    value?: string | number
  }>
}

export interface OwnedNFT {
  tokenId: string
  tokenUri?: string
  metadata?: NFTMetadata
}

// Get owned NFTs - smart approach: check FID first, then fallback to search
export async function getOwnedNFTs(
  ownerAddress: string,
  contractAddress: string
): Promise<OwnedNFT[]> {
  console.log("🔍 getOwnedNFTs called", { ownerAddress, contractAddress })
  
  // Check full cache first
  const cacheKey = `nft_cache_${ownerAddress}_${contractAddress}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      // Cache valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        console.log("📦 Using cached NFT data", data)
        return data
      }
    } catch (e) {
      // Invalid cache, continue
    }
  }
  
  // Step 1: Get FID from Farcaster context (SDK or URL params)
  // Then use Neynar API to get wallet addresses and verify match
  const { 
    getFIDFromContext, 
    getCachedFID, 
    cacheFID,
    getUserDataByFID,
    getCachedUserData,
    cacheUserData,
    verifyWalletMatchesUser
  } = await import("./neynar")
  
  // Get FID from context (URL params or SDK)
  let fid = getCachedFID()
  if (!fid) {
    fid = await getFIDFromContext()
    if (fid) {
      cacheFID(fid)
    }
  }
  
  if (fid) {
    console.log(`🎯 Found FID ${fid}, checking NFT ownership...`)
    
    // Try to get user data from Neynar API (for wallet verification)
    // But if it fails, we can still check NFT ownership directly
    let userData = getCachedUserData(fid)
    if (!userData) {
      userData = await getUserDataByFID(fid)
      if (userData) {
        cacheUserData(userData)
      }
    }
    
    // If we have user data, verify wallet match
    // If not, we'll still check NFT ownership (for testing/development)
    let shouldCheckOwnership = true
    if (userData) {
      const walletMatches = verifyWalletMatchesUser(ownerAddress, userData)
      if (!walletMatches) {
        console.log(`⚠️ Wallet ${ownerAddress} does not match FID ${fid} user data`)
        console.log(`   Custody: ${userData.custody_address}, Verifications: ${userData.verifications?.join(", ")}`)
        // Still check ownership in case they own the NFT but wallet doesn't match (testing scenario)
        console.log(`   Continuing to check NFT ownership anyway...`)
      } else {
        console.log(`✅ Wallet ${ownerAddress} matches FID ${fid} user data`)
      }
    } else {
      console.log(`⚠️ Could not fetch user data for FID ${fid} (Neynar API may be unavailable)`)
      console.log(`   Checking NFT ownership directly (token ID = FID)...`)
    }
    
    // Check if user owns the NFT with token ID = FID
    if (shouldCheckOwnership) {
      try {
        const { createPublicClient, http } = await import("viem")
        const { baseSepolia } = await import("viem/chains")
        
        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org"),
        })

        const owner = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: [
            {
              inputs: [{ name: "tokenId", type: "uint256" }],
              name: "ownerOf",
              outputs: [{ name: "", type: "address" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          functionName: "ownerOf",
          args: [BigInt(fid)],
        })

        if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
          console.log(`✅ User owns token ${fid} (their FID)!`)
          const nfts: OwnedNFT[] = [{ tokenId: fid.toString() }]
          
          // Cache the result
          localStorage.setItem(cacheKey, JSON.stringify({
            data: nfts,
            timestamp: Date.now(),
          }))
          
          return nfts
        } else {
          console.log(`❌ User does not own token ${fid} (owned by ${owner})`)
        }
      } catch (error: any) {
        // Check if error is "token doesn't exist" (ERC721: invalid token ID)
        // Error signature 0x7e273289 = ERC721InvalidTokenId
        const isTokenNotExist = 
          error?.message?.includes("0x7e273289") ||
          error?.message?.includes("invalid token ID") ||
          error?.message?.includes("ERC721InvalidTokenId") ||
          error?.signature === "0x7e273289"
        
        if (isTokenNotExist) {
          console.log(`ℹ️ Token ID ${fid} does not exist in the contract`)
        } else {
          console.error(`❌ Error checking ownership of token ${fid}:`, error)
        }
        // Continue to fallback search
      }
    }
  } else {
    console.log("⚠️ No FID found in context (URL params or SDK)")
  }
  
  // Step 2: Fallback - search for any other Based Degen NFTs they own
  console.log("🔄 FID token not owned, searching for other NFTs...")

  try {
    // Try Alchemy API first if API key is available
    if (ALCHEMY_API_KEY) {
      const url = `https://${BASE_SEPOLIA_NETWORK}.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTs?owner=${ownerAddress}&contractAddresses[]=${contractAddress}&withMetadata=true`
      console.log("🔑 Using Alchemy API...")
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log("📦 Alchemy API response:", data)
        const nfts: OwnedNFT[] = (data.ownedNfts || []).map((nft: any) => ({
          tokenId: nft.tokenId,
          tokenUri: nft.tokenUri?.raw || nft.tokenUri?.gateway,
          metadata: nft.metadata,
        }))
        
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          data: nfts,
          timestamp: Date.now(),
        }))
        
        console.log(`✅ Found ${nfts.length} NFT(s) via Alchemy API`)
        return nfts
      } else {
        console.error("❌ Alchemy API error:", response.status, response.statusText)
      }
    } else {
      console.log("⚠️ No Alchemy API key found, trying Transfer events...")
    }

    // Fallback: Try using a public RPC with getLogs to find Transfer events
    // This is more efficient than checking every token ID
    console.log("🔄 Trying Transfer events fallback...")
    
    try {
      // Use viem to query Transfer events
      const { createPublicClient, http, parseAbiItem } = await import("viem")
      const { baseSepolia } = await import("viem/chains")
      
      const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org"
      console.log(`🔗 Connecting to RPC: ${rpcUrl}`)
      
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(rpcUrl),
      })

      // Query Transfer events where 'to' is the owner
      const transferEvent = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)")
      
      console.log("📡 Querying Transfer events (incoming)...")
      // Get current block number to limit the range
      const currentBlock = await publicClient.getBlockNumber()
      // Query only last 100k blocks to avoid "exceeds max block range" error
      const fromBlock = currentBlock > 100000n ? currentBlock - 100000n : 0n
      
      console.log(`📊 Querying blocks ${fromBlock} to ${currentBlock}`)
      
      const logs = await publicClient.getLogs({
        address: contractAddress as `0x${string}`,
        event: transferEvent,
        args: {
          to: ownerAddress as `0x${string}`,
        },
        fromBlock,
        toBlock: currentBlock,
      })
      console.log(`📥 Found ${logs.length} incoming Transfer events`)

      // Get unique token IDs from Transfer events
      const tokenIds = new Set<string>()
      logs.forEach((log) => {
        if (log.args.tokenId !== undefined) {
          tokenIds.add(log.args.tokenId.toString())
        }
      })

      // Also check for outgoing transfers to remove tokens that were transferred away
      console.log("📡 Querying Transfer events (outgoing)...")
      const outgoingLogs = await publicClient.getLogs({
        address: contractAddress as `0x${string}`,
        event: transferEvent,
        args: {
          from: ownerAddress as `0x${string}`,
        },
        fromBlock,
        toBlock: currentBlock,
      })
      console.log(`📤 Found ${outgoingLogs.length} outgoing Transfer events`)

      outgoingLogs.forEach((log) => {
        if (log.args.tokenId !== undefined) {
          tokenIds.delete(log.args.tokenId.toString())
        }
      })

      const nfts: OwnedNFT[] = Array.from(tokenIds).map((tokenId) => ({
        tokenId,
      }))

      console.log(`🎯 Final token IDs after filtering: ${Array.from(tokenIds).join(", ")}`)

      if (nfts.length > 0) {
        // Cache the result
        localStorage.setItem(cacheKey, JSON.stringify({
          data: nfts,
          timestamp: Date.now(),
        }))
        
        console.log(`✅ Found ${nfts.length} NFT(s) via Transfer events`)
        return nfts
      } else {
        console.log("⚠️ No NFTs found via Transfer events")
      }
    } catch (error) {
      console.error("❌ Error with Transfer events fallback:", error)
    }

    // Final fallback: Comprehensive token ID range search
    // This is RPC-intensive but necessary when other methods fail
    console.log("🔄 Starting comprehensive token ID range search...")
    try {
      const { createPublicClient, http } = await import("viem")
      const { baseSepolia } = await import("viem/chains")
      
      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org"),
      })

      // Search ranges in batches
      // Start with lower ranges (most common) and expand if needed
      const searchRanges = [
        { start: 0, end: 1000, batchSize: 50 },
        { start: 1000, end: 5000, batchSize: 50 },
        { start: 5000, end: 10000, batchSize: 50 },
        { start: 10000, end: 20000, batchSize: 50 },
        { start: 20000, end: 50000, batchSize: 100 }, // Larger batches for higher ranges
        { start: 50000, end: 100000, batchSize: 100 },
      ]

      for (const range of searchRanges) {
        console.log(`🔍 Checking token ID range ${range.start}-${range.end} (batch size: ${range.batchSize})...`)
        
        for (let startId = range.start; startId < range.end; startId += range.batchSize) {
          const endId = Math.min(startId + range.batchSize, range.end)
          const tokenIdsToCheck = Array.from(
            { length: endId - startId },
            (_, i) => BigInt(startId + i)
          )
          
          // Check ownership sequentially to avoid rate limiting
          const ownedTokenIds: string[] = []
          
          for (const tokenId of tokenIdsToCheck) {
            try {
              const owner = await publicClient.readContract({
                address: contractAddress as `0x${string}`,
                abi: [
                  {
                    inputs: [{ name: "tokenId", type: "uint256" }],
                    name: "ownerOf",
                    outputs: [{ name: "", type: "address" }],
                    stateMutability: "view",
                    type: "function",
                  },
                ],
                functionName: "ownerOf",
                args: [tokenId],
              })
              
              if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
                ownedTokenIds.push(tokenId.toString())
              }
            } catch (error: any) {
              // Handle rate limiting - wait longer and retry
              if (error?.status === 429 || error?.message?.includes("429") || error?.message?.includes("rate limit")) {
                console.log("⏳ Rate limited, waiting 5 seconds...")
                await new Promise(resolve => setTimeout(resolve, 5000))
                // Retry once
                try {
                  const owner = await publicClient.readContract({
                    address: contractAddress as `0x${string}`,
                    abi: [
                      {
                        inputs: [{ name: "tokenId", type: "uint256" }],
                        name: "ownerOf",
                        outputs: [{ name: "", type: "address" }],
                        stateMutability: "view",
                        type: "function",
                      },
                    ],
                    functionName: "ownerOf",
                    args: [tokenId],
                  })
                  if (owner.toLowerCase() === ownerAddress.toLowerCase()) {
                    ownedTokenIds.push(tokenId.toString())
                  }
                } catch {
                  // Skip this token if retry fails
                }
              }
              // Token doesn't exist or other error, continue
            }
            
            // Delay between each request to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200))
          }
          
          if (ownedTokenIds.length > 0) {
            console.log(`✅ Found ${ownedTokenIds.length} NFT(s) via comprehensive search: ${ownedTokenIds.join(", ")}`)
            
            const nfts: OwnedNFT[] = ownedTokenIds.map((tokenId) => ({ tokenId }))
            
            // Cache the result
            localStorage.setItem(cacheKey, JSON.stringify({
              data: nfts,
              timestamp: Date.now(),
            }))
            
            return nfts
          }
          
          // Longer delay between batches to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
      
      console.log("⚠️ No NFTs found after comprehensive search")
    } catch (error) {
      console.error("❌ Error with comprehensive search:", error)
    }

    console.log("⚠️ No NFTs found via any method")
    return []
  } catch (error) {
    console.error("❌ Error fetching NFTs:", error)
    return []
  }
}

// Helper to cache a found token ID
export function cacheTokenId(ownerAddress: string, contractAddress: string, tokenId: string) {
  const tokenIdCacheKey = `nft_tokenid_${ownerAddress}_${contractAddress}`
  localStorage.setItem(tokenIdCacheKey, tokenId)
  console.log(`💾 Cached token ID: ${tokenId}`)
}

// Alternative: Use Base's public API if available
export async function getOwnedNFTsBaseAPI(
  ownerAddress: string,
  contractAddress: string
): Promise<OwnedNFT[]> {
  try {
    // Base Sepolia might have a public API, but for now we'll use a smarter blockchain approach
    // This is a placeholder for future Base API integration
    return []
  } catch (error) {
    console.error("❌ Error with Base API:", error)
    return []
  }
}

