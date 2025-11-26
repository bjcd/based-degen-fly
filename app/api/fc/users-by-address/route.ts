import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { addresses } = await req.json() as { addresses: string[] }

    // Normalize to lowercase and remove duplicates
    const addrs = [...new Set(addresses.map(a => a.toLowerCase()))]

    if (addrs.length === 0) {
      return Response.json({ result: [] }, {
        headers: { "Cache-Control": "public, max-age=60" }
      })
    }

    if (!process.env.NEXT_PUBLIC_NEYNAR_API_KEY) {
      return Response.json({ result: [] }, {
        headers: { "Cache-Control": "public, max-age=60" }
      })
    }

    let users: any[] = []

    // ✅ CORRECT ENDPOINT: bulk-by-address (NOT by_verification)
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${addrs.join(',')}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'api_key': process.env.NEXT_PUBLIC_NEYNAR_API_KEY!,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Neynar API error: ${response.status} ${errorText}`)
    }

    const neynarResponse = await response.json()
    console.log('📦 Neynar bulk-by-address response:', JSON.stringify(neynarResponse).substring(0, 500))

    // Convert Neynar response format
    // The API returns an object where keys are addresses and values are arrays of users
    for (const [address, userArray] of Object.entries(neynarResponse)) {
      if (Array.isArray(userArray)) {
        users.push(...userArray)
      }
    }
    
    console.log(`✅ Found ${users.length} users from Neynar API`)

    // Build lookup map by address (checks both custody and verified addresses)
    const byAddr = new Map<string, { fid: number; username: string | null; pfp: string | null }[]>()

    for (const u of users ?? []) {
      const entry = {
        fid: u.fid,
        username: u.username ?? null,
        pfp: u.pfp_url ?? null
      }

      // Check both custody address and verified addresses
      const custody = u.custody_address?.toLowerCase()
      const verified = (u.verified_addresses?.eth_addresses ?? []).map((x: string) => x.toLowerCase())

      for (const a of [custody, ...verified].filter(Boolean) as string[]) {
        const arr = byAddr.get(a) ?? []
        arr.push(entry)
        byAddr.set(a, arr)
      }
    }

    // Return result for each requested address
    const result = addrs.map(a => ({
      address: a,
      users: byAddr.get(a) ?? []
    }))

    return Response.json({ result }, {
      headers: { "Cache-Control": "public, max-age=60" }
    })

  } catch (error) {
    console.error('Error in /api/fc/users-by-address:', error)
    return Response.json({ result: [] }, {
      headers: { "Cache-Control": "public, max-age=60" }
    })
  }
}

