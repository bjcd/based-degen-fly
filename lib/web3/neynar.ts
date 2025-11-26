// Neynar API integration for Farcaster user data
const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || ""

export interface NeynarUser {
  fid: number
  username?: string
  display_name?: string
  custody_address?: string
  verifications?: string[]
}

// Get FID from Farcaster SDK context or URL params
export async function getFIDFromContext(): Promise<number | null> {
  if (typeof window === "undefined") return null
  
  // Method 1: Try Farcaster SDK if available (for miniapp/frame)
  try {
    // Use the centralized Farcaster utilities
    const { getFarcasterContext, getFidFromUrl } = await import("@/lib/farcaster")
    const context = await getFarcasterContext()
    if (context?.fid) {
      console.log(`✅ Found FID ${context.fid} from Farcaster SDK`)
      return context.fid
    }
  } catch (error) {
    // SDK not available or not in miniapp, continue to other methods
    console.log("ℹ️ Farcaster SDK not available or not in miniapp context")
  }
  
  // Method 2: Try URL params (Farcaster passes ?fid=12345 in frames, or for testing)
  try {
    const { getFidFromUrl } = await import("@/lib/farcaster")
    const urlFid = getFidFromUrl()
    if (urlFid) {
      console.log(`✅ Found FID ${urlFid} from URL params`)
      console.log(`💡 Tip: Add ?fid=YOUR_FID to URL to test (e.g., ?fid=12345)`)
      return urlFid
    }
  } catch (error) {
    // Fallback to manual URL parsing
    const params = new URLSearchParams(window.location.search)
    const urlFid = params.get("fid")
    if (urlFid) {
      const fid = parseInt(urlFid, 10)
      if (fid && !isNaN(fid)) {
        console.log(`✅ Found FID ${fid} from URL params`)
        return fid
      }
    }
  }
  
  console.log("⚠️ No FID found. Options:")
  console.log("   1. Add ?fid=YOUR_FID to URL for testing")
  console.log("   2. When in Farcaster frame/miniapp, FID comes from SDK automatically")
  
  return null
}

// Get user data from Neynar API using FID (returns wallet addresses)
export async function getUserDataByFID(fid: number): Promise<NeynarUser | null> {
  if (!NEYNAR_API_KEY) {
    console.log("⚠️ No Neynar API key found")
    return null
  }

  try {
    // Neynar API v2: Get user by FID
    const url = `https://api.neynar.com/v2/farcaster/user?fid=${fid}`
    
    const response = await fetch(url, {
      headers: {
        "api_key": NEYNAR_API_KEY,
        "accept": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log("📦 Neynar API response:", data)
      
      // The API returns { result: { user: {...} } }
      const user = data.result?.user || data.user
      
      if (user?.fid) {
        console.log(`✅ Found user data for FID ${fid}`)
        return {
          fid: user.fid,
          username: user.username,
          display_name: user.display_name,
          custody_address: user.custody_address,
          verifications: user.verifications || [],
        }
      }
    } else {
      const errorText = await response.text()
      console.error("❌ Neynar API error:", response.status, response.statusText, errorText)
    }
  } catch (error) {
    console.error("❌ Error fetching user data from Neynar:", error)
  }

  return null
}

// Verify if wallet address matches user's custody address or verifications
export function verifyWalletMatchesUser(walletAddress: string, user: NeynarUser): boolean {
  const walletLower = walletAddress.toLowerCase()
  const custodyMatch = user.custody_address?.toLowerCase() === walletLower
  const verificationMatch = user.verifications?.some(v => v.toLowerCase() === walletLower) || false
  return custodyMatch || verificationMatch
}

// Cache FID lookup
export function getCachedFID(): number | null {
  const cacheKey = `fid_cache_context`
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try {
      const { fid, timestamp } = JSON.parse(cached)
      // Cache valid for 1 hour
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return fid
      }
    } catch (e) {
      // Invalid cache
    }
  }
  return null
}

export function cacheFID(fid: number) {
  const cacheKey = `fid_cache_context`
  localStorage.setItem(cacheKey, JSON.stringify({
    fid,
    timestamp: Date.now(),
  }))
}

// Cache user data
export function getCachedUserData(fid: number): NeynarUser | null {
  const cacheKey = `neynar_user_${fid}`
  const cached = localStorage.getItem(cacheKey)
  if (cached) {
    try {
      const { user, timestamp } = JSON.parse(cached)
      // Cache valid for 1 hour
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        return user
      }
    } catch (e) {
      // Invalid cache
    }
  }
  return null
}

export function cacheUserData(user: NeynarUser) {
  const cacheKey = `neynar_user_${user.fid}`
  localStorage.setItem(cacheKey, JSON.stringify({
    user,
    timestamp: Date.now(),
  }))
}

// Get user data from Neynar API using wallet address
export async function getUserDataByAddress(address: string): Promise<NeynarUser | null> {
  if (!NEYNAR_API_KEY) {
    console.log("⚠️ No Neynar API key found")
    return null
  }

  if (!address) {
    return null
  }

  try {
    // Neynar API v2: Get user by address (custody or verified)
    const url = `https://api.neynar.com/v2/farcaster/user/by_verification?address=${address.toLowerCase()}`
    
    const response = await fetch(url, {
      headers: {
        "api_key": NEYNAR_API_KEY,
        "accept": "application/json",
      },
    })

    if (response.ok) {
      const data = await response.json()
      console.log("📦 Neynar API response (by address):", data)
      
      // The API returns { result: { user: {...} } }
      const user = data.result?.user || data.user
      
      if (user?.fid) {
        console.log(`✅ Found user data for address ${address}`)
        return {
          fid: user.fid,
          username: user.username,
          display_name: user.display_name,
          custody_address: user.custody_address,
          verifications: user.verifications || [],
        }
      }
    } else {
      const errorText = await response.text()
      console.error("❌ Neynar API error (by address):", response.status, response.statusText, errorText)
    }
  } catch (error) {
    console.error("❌ Error fetching user data from Neynar by address:", error)
  }

  return null
}
