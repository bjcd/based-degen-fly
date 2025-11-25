import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { GAME_REWARDS_CONTRACT_ADDRESS, CHAIN_ID } from "@/lib/web3/config"
import { GAME_REWARDS_ABI } from "@/lib/web3/abi"

export function useSubmitScore() {
  const { address } = useAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const { writeContract, data: hash, isPending, error: writeError, reset: resetWrite } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setIsSubmitting(false)
      setError(null)
      setSuccessMessage("Score submitted successfully! 🎉")
    }
  }, [isSuccess])

  // Handle transaction errors (including user rejection)
  useEffect(() => {
    if (writeError) {
      setIsSubmitting(false)
      // Check if user rejected the transaction
      if (writeError.message?.includes("User rejected") || writeError.message?.includes("rejected")) {
        setError("Transaction rejected")
      } else {
        setError(writeError.message || "Transaction failed")
      }
      setSuccessMessage(null)
    }
  }, [writeError])

  const submitScore = async (score: number) => {
    if (!address) {
      setError("Please connect your wallet")
      return
    }

    // Reset previous states
    setIsSubmitting(true)
    setError(null)
    setSuccessMessage(null)
    resetWrite()

    try {
      // Generate a unique nonce (using timestamp + random)
      const newNonce = Date.now() + Math.floor(Math.random() * 1000000)

      // Get signature from backend
      const response = await fetch("/api/score-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          score,
          nonce: newNonce,
          chainId: CHAIN_ID,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to get signature" }))
        throw new Error(errorData.error || "Failed to get signature from backend")
      }

      const { signature } = await response.json()

      // Call contract
      writeContract({
        address: GAME_REWARDS_CONTRACT_ADDRESS,
        abi: GAME_REWARDS_ABI,
        functionName: "submitScore",
        args: [BigInt(score), signature as `0x${string}`, BigInt(newNonce)],
      })
    } catch (err) {
      console.error("Error submitting score:", err)
      setError(err instanceof Error ? err.message : "Failed to submit score")
      setIsSubmitting(false)
      setSuccessMessage(null)
    }
  }

  return {
    submitScore,
    isSubmitting: isSubmitting || isPending || isConfirming,
    isSuccess,
    error,
    successMessage,
    hash,
  }
}


