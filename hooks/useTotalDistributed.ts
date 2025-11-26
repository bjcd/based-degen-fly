import { useReadContract } from "wagmi"
import { GAME_REWARDS_CONTRACT_ADDRESS, DEGEN_TOKEN_ADDRESS } from "@/lib/web3/config"
import { GAME_REWARDS_ABI } from "@/lib/web3/abi"
import { useEffect } from "react"

export function useTotalDistributed() {
  const { data: totalDistributed, isLoading, error } = useReadContract({
    address: GAME_REWARDS_CONTRACT_ADDRESS,
    abi: GAME_REWARDS_ABI,
    functionName: "getTotalDistributed",
    args: DEGEN_TOKEN_ADDRESS ? [DEGEN_TOKEN_ADDRESS] : undefined,
    query: {
      enabled: !!DEGEN_TOKEN_ADDRESS,
    },
  })

  // Debug logging
  useEffect(() => {
    if (totalDistributed !== undefined) {
      console.log("🔍 useTotalDistributed:", {
        DEGEN_TOKEN_ADDRESS,
        totalDistributedRaw: totalDistributed?.toString(),
        totalDistributedNumber: totalDistributed ? Number(totalDistributed) : 0,
        totalDistributedDEGEN: totalDistributed ? Number(totalDistributed) / 1e18 : 0,
        isLoading,
        error,
      })
    }
  }, [totalDistributed, isLoading, error, DEGEN_TOKEN_ADDRESS])

  // Convert from wei to DEGEN (18 decimals)
  const totalDistributedDEGEN = totalDistributed
    ? Number(totalDistributed) / 1e18
    : 0

  return {
    totalDistributed: totalDistributedDEGEN,
    isLoading,
    error,
  }
}

