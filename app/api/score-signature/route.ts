import { NextRequest, NextResponse } from "next/server"
import { keccak256, encodePacked } from "viem"
import { privateKeyToAccount } from "viem/accounts"

const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY

if (!VERIFIER_PRIVATE_KEY) {
  console.warn("⚠️ VERIFIER_PRIVATE_KEY not set - score signatures will fail")
}

export async function POST(request: NextRequest) {
  try {
    if (!VERIFIER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Verifier not configured" },
        { status: 500 }
      )
    }

    const { address, score, nonce, chainId } = await request.json()
    // Note: 'score' parameter is actually distance in meters

    if (!address || !score || !nonce || !chainId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Create message hash (same as contract expects)
    // Contract does: keccak256(abi.encodePacked(msg.sender, distance, nonce, block.chainid))
    const messageHash = keccak256(
      encodePacked(
        ["address", "uint256", "uint256", "uint256"],
        [address as `0x${string}`, BigInt(score), BigInt(nonce), BigInt(chainId)]
      )
    )

    // Contract expects: keccak256("\x19Ethereum Signed Message:\n32" + messageHash)
    const verifierAccount = privateKeyToAccount(VERIFIER_PRIVATE_KEY as `0x${string}`)
    
    const signature = await verifierAccount.signMessage({
      message: {
        raw: messageHash,
      },
    })

    return NextResponse.json({ signature })
  } catch (error) {
    console.error("Error signing score:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign" },
      { status: 500 }
    )
  }
}


