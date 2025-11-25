import { NextRequest, NextResponse } from "next/server"
import { keccak256, encodePacked, toHex } from "viem"
import { privateKeyToAccount } from "viem/accounts"

// This is a placeholder - you should use environment variables
const VERIFIER_PRIVATE_KEY = process.env.VERIFIER_PRIVATE_KEY

if (!VERIFIER_PRIVATE_KEY) {
  console.warn("⚠️ VERIFIER_PRIVATE_KEY not set - claim signatures will fail")
}

export async function POST(request: NextRequest) {
  try {
    if (!VERIFIER_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Verifier not configured" },
        { status: 500 }
      )
    }

    const { address, hatsCollected, nonce, chainId } = await request.json()

    if (!address || !hatsCollected || !nonce || !chainId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      )
    }

    // Create message hash (same as contract expects)
    // Contract does: keccak256(abi.encodePacked(msg.sender, hatsCollected, nonce, block.chainid))
    const messageHash = keccak256(
      encodePacked(
        ["address", "uint256", "uint256", "uint256"],
        [address as `0x${string}`, BigInt(hatsCollected), BigInt(nonce), BigInt(chainId)]
      )
    )

    // Contract expects: keccak256("\x19Ethereum Signed Message:\n32" + messageHash)
    // We need to sign the messageHash with the Ethereum message prefix
    const verifierAccount = privateKeyToAccount(VERIFIER_PRIVATE_KEY as `0x${string}`)
    
    // viem's signMessage with raw expects the final hash, but we need to sign the messageHash
    // So we'll use the account's sign method directly
    const signature = await verifierAccount.signMessage({
      message: {
        raw: messageHash,
      },
    })

    return NextResponse.json({ signature })
  } catch (error) {
    console.error("Error signing claim:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign" },
      { status: 500 }
    )
  }
}

