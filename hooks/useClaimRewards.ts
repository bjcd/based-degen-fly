import { useState, useEffect } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from "wagmi"
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

  // Monitor writeStatus and detect when wallet closes without response
  useEffect(() => {
    console.log("📊 writeContract status:", writeStatus, { isPending, hash: !!hash, error: !!writeError })
    
    // If status changes from pending to idle without hash/error, wallet closed without response
    if (writeStatus === 'idle' && transactionStartTime && !hash && !writeError && !isPending) {
      const elapsed = Date.now() - transactionStartTime
      if (elapsed > 2000) { // Give it 2 seconds to avoid false positives
        console.warn("⚠️ Wallet closed without response - status is idle but no hash/error")
        setError("Transaction was cancelled or the wallet closed without confirming. Please try again.")
        setIsClaiming(false)
        setTransactionStartTime(null)
      }
    }
  }, [writeStatus, isPending, hash, writeError, transactionStartTime])

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

  const claimRewards = async (hatsCollected: number, distance: number) => {
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

      // Get signature from backend (includes both hatsCollected and distance)
      const response = await fetch("/api/claim-signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address,
          hatsCollected,
          distance,
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
        distance,
        nonce: newNonce,
        signature: signature.substring(0, 20) + "...",
        chainId: CHAIN_ID,
      })
      
      // Validate inputs
      if (!distance || distance <= 0) {
        console.error("❌ Invalid distance:", distance)
        setError("Invalid distance value. Please try playing again.")
        setIsClaiming(false)
        return
      }
      
      if (!hatsCollected || hatsCollected <= 0) {
        console.error("❌ Invalid hatsCollected:", hatsCollected)
        setError("Invalid score value. Please try playing again.")
        setIsClaiming(false)
        return
      }

      // Pre-flight check: Validate contract address and basic parameters
      if (!GAME_REWARDS_CONTRACT_ADDRESS || GAME_REWARDS_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        console.error("❌ Invalid contract address")
        setError("Invalid contract address configured")
        setIsClaiming(false)
        return
      }
      
      if (!signature || signature.length !== 132) { // 0x + 130 hex chars
        console.error("❌ Invalid signature format")
        setError("Invalid signature from backend")
        setIsClaiming(false)
        return
      }
      
      // Check if contract is paused
      try {
        const { createPublicClient, http } = await import('viem')
        const { base } = await import('wagmi/chains')
        const publicClient = createPublicClient({
          chain: base,
          transport: http(),
        })
        
        const isPaused = await publicClient.readContract({
          address: GAME_REWARDS_CONTRACT_ADDRESS,
          abi: GAME_REWARDS_ABI,
          functionName: 'paused',
        })
        
        if (isPaused) {
          console.error("❌ Contract is paused")
          setError("Contract is currently paused. Please try again later.")
          setIsClaiming(false)
          return
        }
        
        // Try to simulate the transaction to catch revert reasons
        try {
          await publicClient.simulateContract({
            account: address,
            address: GAME_REWARDS_CONTRACT_ADDRESS,
            abi: GAME_REWARDS_ABI,
            functionName: 'claimRewards',
            args: [BigInt(hatsCollected), BigInt(distance), signature as `0x${string}`, BigInt(newNonce)],
          })
          console.log("✅ Transaction simulation passed")
        } catch (simError: any) {
          console.error("❌ Transaction simulation failed:", simError)
          
          // Extract the actual revert reason if available
          let errorMsg = "Transaction would fail"
          if (simError?.cause?.data?.errorName) {
            errorMsg = simError.cause.data.errorName
          } else if (simError?.cause?.data?.message) {
            errorMsg = simError.cause.data.message
          } else if (simError?.shortMessage) {
            errorMsg = simError.shortMessage
          } else if (simError?.message) {
            errorMsg = simError.message
          }
          
          // Check for common errors
          if (errorMsg.includes("Invalid signature") || errorMsg.includes("signature")) {
            errorMsg = "Invalid signature. Make sure the contract is the latest version with distance parameter."
          } else if (errorMsg.includes("No rewards available") || errorMsg.includes("tokenCount")) {
            errorMsg = "No rewards available. Check if DEGEN token is configured in the contract."
          } else if (errorMsg.includes("function") && errorMsg.includes("revert")) {
            // Check if this is a function signature mismatch (old contract)
            const errorString = JSON.stringify(simError)
            if (errorString.includes("hatsCollected, bytes signature") && !errorString.includes("distance")) {
              errorMsg = "Contract version mismatch: The deployed contract is the old version without the distance parameter. Please deploy the new contract."
            } else {
              errorMsg = `Contract revert: ${errorMsg}. The contract may be an old version without the distance parameter.`
            }
          }
          
          setError(`Transaction would fail: ${errorMsg}`)
          setIsClaiming(false)
          return
        }
      } catch (checkError) {
        console.warn("⚠️ Could not validate contract state:", checkError)
        // Continue anyway - might be network issue
      }
      
      console.log("✅ Pre-flight checks passed")

      // Call contract - writeContract returns void, errors are handled via writeError
      // Note: In Wagmi v2, writeContract doesn't throw - errors come via writeError state
      console.log("📤 Calling writeContract...")
      setTransactionStartTime(Date.now()) // Start timeout timer
      writeContract({
        address: GAME_REWARDS_CONTRACT_ADDRESS,
        abi: GAME_REWARDS_ABI,
        functionName: "claimRewards",
        args: [BigInt(hatsCollected), BigInt(distance), signature as `0x${string}`, BigInt(newNonce)],
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

