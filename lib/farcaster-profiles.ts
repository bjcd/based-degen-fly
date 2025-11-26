export interface FarcasterProfile {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  walletAddress: string
}

// Cache to avoid repeated API calls (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

interface CachedProfile {
  profile: FarcasterProfile | null
  timestamp: number
}

const profileCache = new Map<string, CachedProfile>()

/**
 * Fetch Farcaster profile data for a wallet address
 * Returns null if no Farcaster profile found
 */
export async function fetchFarcasterProfile(walletAddress: string): Promise<FarcasterProfile | null> {
  // Check cache first
  const cached = profileCache.get(walletAddress)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.profile
  }

  // Fetch via server API
  try {
    const response = await fetch('/api/fc/users-by-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addresses: [walletAddress] }),
    })

    if (!response.ok) {
      profileCache.set(walletAddress, { profile: null, timestamp: Date.now() })
      return null
    }

    const { result } = await response.json()
    const addressData = result.find((r: any) => 
      r.address.toLowerCase() === walletAddress.toLowerCase()
    )

    if (!addressData || !addressData.users || addressData.users.length === 0) {
      profileCache.set(walletAddress, { profile: null, timestamp: Date.now() })
      return null
    }

    // Use the first user found
    const user = addressData.users[0]
    const profile: FarcasterProfile = {
      fid: user.fid,
      username: user.username || 'unknown',
      displayName: user.username || 'Unknown User',
      pfpUrl: user.pfp || 'https://via.placeholder.com/150',
      walletAddress: walletAddress,
    }

    profileCache.set(walletAddress, { profile, timestamp: Date.now() })
    return profile

  } catch (error) {
    console.error('Error fetching Farcaster profile:', error)
    profileCache.set(walletAddress, { profile: null, timestamp: Date.now() })
    return null
  }
}

/**
 * Batch fetch multiple Farcaster profiles
 */
export async function fetchFarcasterProfiles(
  walletAddresses: string[]
): Promise<Map<string, FarcasterProfile | null>> {
  const results = new Map<string, FarcasterProfile | null>()
  
  // Filter out cached addresses
  const uncachedAddresses: string[] = []
  
  walletAddresses.forEach(address => {
    const cached = profileCache.get(address)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      results.set(address, cached.profile)
    } else {
      uncachedAddresses.push(address)
    }
  })
  
  if (uncachedAddresses.length === 0) {
    return results
  }
  
  // Batch fetch uncached addresses
  try {
    const response = await fetch('/api/fc/users-by-address', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ addresses: uncachedAddresses }),
    })

    if (!response.ok) {
      uncachedAddresses.forEach(address => {
        results.set(address, null)
        profileCache.set(address, { profile: null, timestamp: Date.now() })
      })
      return results
    }

    const { result } = await response.json()
    
    uncachedAddresses.forEach(address => {
      const addressData = result.find((r: any) => 
        r.address.toLowerCase() === address.toLowerCase()
      )
      
      if (!addressData || !addressData.users || addressData.users.length === 0) {
        results.set(address, null)
        profileCache.set(address, { profile: null, timestamp: Date.now() })
      } else {
        const user = addressData.users[0]
        const profile: FarcasterProfile = {
          fid: user.fid,
          username: user.username || 'unknown',
          displayName: user.username || 'Unknown User',
          pfpUrl: user.pfp || 'https://via.placeholder.com/150',
          walletAddress: address,
        }
        
        results.set(address, profile)
        profileCache.set(address, { profile, timestamp: Date.now() })
      }
    })
    
  } catch (error) {
    console.error('Error batch fetching Farcaster profiles:', error)
    uncachedAddresses.forEach(address => {
      results.set(address, null)
      profileCache.set(address, { profile: null, timestamp: Date.now() })
    })
  }
  
  return results
}

