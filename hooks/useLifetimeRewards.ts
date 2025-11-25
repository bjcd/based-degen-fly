import { useReadContract } from "wagmi"
import { useAccount } from "wagmi"
import { GAME_REWARDS_CONTRACT_ADDRESS, DEGEN_TOKEN_ADDRESS } from "@/lib/web3/config"
import { GAME_REWARDS_ABI } from "@/lib/web3/abi"

export function useLifetimeRewards() {
  const { address } = useAccount()

  const { data: lifetimeRewards, isLoading, error } = useReadContract({
    address: GAME_REWARDS_CONTRACT_ADDRESS,
    abi: GAME_REWARDS_ABI,
    functionName: "getLifetimeRewards",
    args: address && DEGEN_TOKEN_ADDRESS ? [address, DEGEN_TOKEN_ADDRESS] : undefined,
    query: {
      enabled: !!address && !!DEGEN_TOKEN_ADDRESS,
    },
  })

  // Convert from wei to DEGEN (18 decimals)
  const lifetimeRewardsDEGEN = lifetimeRewards
    ? Number(lifetimeRewards) / 1e18
    : 0

  // Debug logging
  if (address) {
    console.log("🔍 useLifetimeRewards:", {
      address,
      DEGEN_TOKEN_ADDRESS,
      lifetimeRewards,
      lifetimeRewardsDEGEN,
      isLoading,
      error,
    })
  }

  return {
    lifetimeRewards: lifetimeRewardsDEGEN,
    isLoading,
    error,
  }
}

