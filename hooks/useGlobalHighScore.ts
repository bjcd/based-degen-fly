import { useReadContract } from "wagmi"
import { GAME_REWARDS_CONTRACT_ADDRESS } from "@/lib/web3/config"
import { GAME_REWARDS_ABI } from "@/lib/web3/abi"

export function useGlobalHighScore() {
  const { data: globalHighScore, isLoading, error } = useReadContract({
    address: GAME_REWARDS_CONTRACT_ADDRESS,
    abi: GAME_REWARDS_ABI,
    functionName: "getGlobalHighScore",
  })

  const { data: highScoreHolder } = useReadContract({
    address: GAME_REWARDS_CONTRACT_ADDRESS,
    abi: GAME_REWARDS_ABI,
    functionName: "getGlobalHighScoreHolder",
  })

  return {
    globalHighScore: globalHighScore ? Number(globalHighScore) : 0,
    highScoreHolder: highScoreHolder as `0x${string}` | undefined,
    isLoading,
    error,
  }
}


