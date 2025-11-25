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
    attributes,
    metadataKeys: Object.keys(metadata),
  })

  attributes.forEach((attr) => {
    const traitType = String(attr.trait_type || "")
    const traitValue = String(attr.value || "")
    
    // Try matching by trait_type first, then by value
    let traitId = TRAIT_MAPPING[traitType]
    if (traitId === undefined) {
      traitId = TRAIT_MAPPING[traitValue]
    }

    console.log("🔎 Checking trait:", {
      traitType,
      traitValue,
      found: traitId !== undefined,
      traitId,
    })

    if (traitId !== undefined) {
      traits.push(traitId)
    }
  })

  console.log("✅ Parsed traits:", traits)
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


