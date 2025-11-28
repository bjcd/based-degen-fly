// Map NFT traits to game trait IDs
// This will need to be adjusted based on your actual NFT trait structure
export type NFTTrait = {
  trait_type: string
  value: string | number
}

export type NFTMetadata = {
  name?: string
  description?: string
  image?: string
  attributes?: NFTTrait[]
  traits?: NFTTrait[]
}

// Map NFT trait names/values to game trait IDs
// Adjust this mapping based on your actual NFT contract traits
const TRAIT_MAPPING: Record<string, number> = {
  // Example mappings - adjust based on your NFT contract
  Sword: 0,
  "Gold Teeth": 1,
  Aura: 2,
  Jetpack: 3,
  "Holographic Display": 4,
  "Companion Orb": 5,
  "Floating Companion Orb": 5, // Alternative name
  "Bronze Hands": 6,
  "Gold Hands": 7,
  "Diamond Hands": 8,
  "Shoulder Pads": 9,
  "Laser Eyes": 10,
  "Lightning Eyes": 11,
}

export function parseNFTTraits(metadata: NFTMetadata): number[] {
  const traits: number[] = []
  const attributes = metadata.attributes || metadata.traits || []

  console.log("🔍 Parsing traits from metadata:", {
    totalAttributes: attributes.length,
    attributes,
    metadataKeys: Object.keys(metadata),
  })

  const unmatchedTraits: string[] = []

  // Create case-insensitive lookup map
  const caseInsensitiveMapping: Record<string, number> = {}
  Object.keys(TRAIT_MAPPING).forEach(key => {
    caseInsensitiveMapping[key.toLowerCase()] = TRAIT_MAPPING[key]
  })

  attributes.forEach((attr) => {
    const traitType = String(attr.trait_type || "")
    const traitValue = String(attr.value || "")
    
    // Try matching by trait_type first (case-insensitive), then by value (case-insensitive)
    let traitId = caseInsensitiveMapping[traitType.toLowerCase()]
    if (traitId === undefined) {
      traitId = caseInsensitiveMapping[traitValue.toLowerCase()]
    }

    if (traitId !== undefined) {
      // Find the original key name for display
      const originalKey = Object.keys(TRAIT_MAPPING).find(k => TRAIT_MAPPING[k] === traitId)
      console.log("✅ Matched trait:", {
        traitType,
        traitValue,
        traitId,
        traitName: originalKey,
      })
      traits.push(traitId)
    } else {
      unmatchedTraits.push(`${traitType}: ${traitValue}`)
      console.log("⚠️ Unmatched trait (not in TRAIT_MAPPING):", {
        traitType,
        traitValue,
        availableMappings: Object.keys(TRAIT_MAPPING),
      })
    }
  })

  console.log("✅ Parsed traits:", {
    matched: traits,
    matchedCount: traits.length,
    unmatched: unmatchedTraits,
    unmatchedCount: unmatchedTraits.length,
    totalAttributes: attributes.length,
  })
  
  if (unmatchedTraits.length > 0) {
    console.log("💡 Tip: Add these traits to TRAIT_MAPPING if they should be recognized:", unmatchedTraits)
  }

  return traits
}

export async function fetchNFTMetadata(tokenURI: string): Promise<NFTMetadata | null> {
  try {
    // Handle IPFS URLs
    let url = tokenURI
    if (tokenURI.startsWith("ipfs://")) {
      url = `https://ipfs.io/ipfs/${tokenURI.replace("ipfs://", "")}`
    } else if (!tokenURI.startsWith("http")) {
      url = `https://ipfs.io/ipfs/${tokenURI}`
    }

    console.log("🌐 Fetching metadata from:", url)

    const response = await fetch(url)
    if (!response.ok) {
      console.error("❌ Failed to fetch metadata:", response.status, response.statusText)
      return null
    }

    const data = await response.json()
    console.log("📦 Raw metadata:", data)
    return data as NFTMetadata
  } catch (error) {
    console.error("❌ Error fetching NFT metadata:", error)
    return null
  }
}


