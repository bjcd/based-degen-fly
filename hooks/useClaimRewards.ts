import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from "wagmi"
import { GAME_REWARDS_CONTRACT_ADDRESS, CHAIN_ID } from "@/lib/web3/config"
import { GAME_REWARDS_ABI } from "@/lib/web3/abi"

export function useClaimRewards() {
  const { address, chainId: currentChainId } = useAccount()
  const { switchChain } = useSwitchChain()
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [transactionStartTime, setTransactionStartTime] = useState<number | null>(null)

  const { 
    writeContract, 
    data: hash, 
    isPending, 
    error: writeError, 
    reset: resetWrite,
    status: writeStatus 
  } = useWriteContract({
    onSuccess: (hash) => {
      console.log("✅ writeContract onSuccess callback - hash:", hash)
      setTransactionStartTime(null)
    },
    onError: (error) => {
      console.error("❌ writeContract onError callback:", error)
      setTransactionStartTime(null)
      setIsClaiming(false)
      if (error.message?.includes("User rejected") || error.message?.includes("rejected")) {
        setError("Transaction rejected")
      } else {
        setError(error.message || "Transaction failed")
      }
    },
  })
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  // Monitor if transaction hash is generated (means wallet accepted it)
  useEffect(() => {
    if (hash) {
      console.log("✅ Transaction hash received:", hash)
      setTransactionStartTime(null) // Clear timeout since we got a hash
    }
  }, [hash])

  // Monitor if transaction is pending (wallet modal is open)
  useEffect(() => {
    if (isPending) {
      console.log("⏳ Transaction pending - wallet modal should be open")
    } else if (transactionStartTime && !hash && !writeError) {
      console.log("⚠️ isPending is false but no hash/error - wallet may have closed without response")
    }
  }, [isPending, transactionStartTime, hash, writeError])

  // Monitor writeStatus
  useEffect(() => {
    console.log("📊 writeContract status:", writeStatus, { isPending, hash: !!hash, error: !!writeError })
  }, [writeStatus, isPending, hash, writeError])

  // Timeout detection: if transaction doesn't get submitted within 30 seconds
  useEffect(() => {
    if (!transactionStartTime || hash || writeError) {
      return // No timeout needed if we have a hash, error, or no transaction started
    }

    const checkTimeout = setInterval(() => {
      if (!hash && !writeError && transactionStartTime) {
        const elapsed = Date.now() - transactionStartTime
        // Check if isPending changed to false without getting a hash/error
        if (!isPending && elapsed > 5000) {
          console.warn("⚠️ Wallet closed without response - isPending is false but no hash/error after 5s")
          setError("Transaction was not submitted. The wallet may have closed without confirming. Please try again.")
          setIsClaiming(false)
          setTransactionStartTime(null)
          clearInterval(checkTimeout)
        } else if (elapsed > 30000) {
          console.warn("⚠️ Transaction timeout - no hash or error after 30s")
          setError("Transaction timeout - the wallet modal may not have opened or the transaction was not submitted. Please try again or check your wallet connection.")
          setIsClaiming(false)
          setTransactionStartTime(null)
          clearInterval(checkTimeout)
        }
      } else {
        clearInterval(checkTimeout)
      }
    }, 1000) // Check every second

    return () => clearInterval(checkTimeout)
  }, [transactionStartTime, hash, writeError, isPending])

  // Handle transaction success
  useEffect(() => {
    if (isSuccess) {
      setIsClaiming(false)
      setError(null)
      setSuccessMessage("Rewards claimed successfully! 🎉")
    }
  }, [isSuccess])

  // Handle transaction errors (including user rejection)
  useEffect(() => {
    if (writeError) {
      console.error("❌ Transaction error:", writeError)
      setTransactionStartTime(null) // Clear timeout since we got an error
      setIsClaiming(false)
      // Check if user rejected the transaction
      if (writeError.message?.includes("User rejected") || writeError.message?.includes("rejected")) {
        setError("Transaction rejected")
      } else if (writeError.message?.includes("Extension context invalidated") || writeError.message?.includes("context invalidated")) {
        setError("Wallet extension was reloaded. Please refresh the page and try again.")
      } else if (writeError.message?.includes("429") || writeError.message?.includes("Too Many Requests")) {
        setError("Network is busy. Please wait a moment and try again.")
      } else if (writeError.message?.includes("execution reverted") || writeError.message?.includes("revert")) {
        // Contract execution error - might be missing function or invalid parameters
        const errorMsg = writeError.message.includes("_submitScore") || writeError.message.includes("submitScore")
          ? "Contract error: Score submission function not found. Please check your contract version."
          : writeError.message || "Transaction reverted. Check contract function exists."
        setError(errorMsg)
      } else {
        setError(writeError.message || "Transaction failed")
      }
      setSuccessMessage(null)
    }
  }, [writeError])

  const claimRewards = async (hatsCollected: number) => {
    if (!address) {
      setError("Please connect your wallet")
      return
    }

    // Reset previous states
    setIsClaiming(true)
    setError(null)
    setSuccessMessage(null)
    resetWrite()

    try {
      // Ensure we're on the correct chain
      if (currentChainId && currentChainId !== CHAIN_ID) {
        console.log(`🔄 Switching chain from ${currentChainId} to ${CHAIN_ID}`)
        try {
          await switchChain({ chainId: CHAIN_ID })
          // Wait a bit for chain switch to complete
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (switchError) {
          console.error("Failed to switch chain:", switchError)
          setError("Please switch to the correct network")
          setIsClaiming(false)
          return
        }
      }
      // Generate a unique nonce (using timestamp + random)
      const newNonce = Date.now() + Math.floor(Math.random() * 1000000)

      // Get signature from backend
      const response = await fetch("/api/claim-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          hatsCollected,
          nonce: newNonce,
          chainId: CHAIN_ID,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to get signature" }))
        throw new Error(errorData.error || "Failed to get signature from backend")
      }

      const { signature } = await response.json()

      console.log("📝 Calling claimRewards with:", {
        address: GAME_REWARDS_CONTRACT_ADDRESS,
        hatsCollected,
        nonce: newNonce,
        signature: signature.substring(0, 20) + "...",
        chainId: CHAIN_ID,
      })

      // Call contract - writeContract returns void, errors are handled via writeError
      // Note: In Wagmi v2, writeContract doesn't throw - errors come via writeError state
      console.log("📤 Calling writeContract...")
      setTransactionStartTime(Date.now()) // Start timeout timer
      writeContract({
        address: GAME_REWARDS_CONTRACT_ADDRESS,
        abi: GAME_REWARDS_ABI,
        functionName: "claimRewards",
        args: [BigInt(hatsCollected), signature as `0x${string}`, BigInt(newNonce)],
      })
      console.log("✅ writeContract called - wallet modal should open")
    } catch (err) {
      console.error("❌ Error claiming rewards:", err)
      setError(err instanceof Error ? err.message : "Failed to claim rewards")
      setIsClaiming(false)
      setSuccessMessage(null)
    }
  }

  return {
    claimRewards,
    isClaiming: isClaiming || isPending || isConfirming,
    isSuccess,
    error,
    successMessage,
    hash,
  }
}

