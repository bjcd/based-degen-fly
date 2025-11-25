import { Button } from "@/components/ui/button"
import { useClaimRewards } from "@/hooks/useClaimRewards"
import { useLifetimeRewards } from "@/hooks/useLifetimeRewards"
import { useSubmitScore } from "@/hooks/useSubmitScore"
import { useGlobalHighScore } from "@/hooks/useGlobalHighScore"
import { useState, useEffect } from "react"

type GameOverProps = {
  distance: number
  score: number
  highScore: number
  hasNFTs: boolean
  onPlayAgain: () => void
  onChangeTraits: () => void
}

// Calculate reward preview (score * reward per hat)
// Note: score already includes trait multipliers (e.g., 2x for Gold Teeth)
// Default: 1 DEGEN per score point (1e18 wei)
function calculateRewardPreview(score: number): number {
  const rewardPerHat = process.env.NEXT_PUBLIC_DEGEN_REWARD_PER_HAT 
    ? BigInt(process.env.NEXT_PUBLIC_DEGEN_REWARD_PER_HAT)
    : BigInt("1000000000000000000") // 1 DEGEN (18 decimals) default
  
  // Score already includes multipliers, so multiply by reward per hat
  const totalWei = BigInt(Math.floor(score)) * rewardPerHat
  // Convert to DEGEN (divide by 1e18)
  const degenAmount = Number(totalWei) / 1e18
  return Math.round(degenAmount * 100) / 100 // Round to 2 decimals
}

export function GameOver({ distance, score, highScore, hasNFTs, onPlayAgain, onChangeTraits }: GameOverProps) {
  const isNewRecord = distance >= highScore
  const rewardPreview = calculateRewardPreview(score)
  const { claimRewards, isClaiming, isSuccess, error, successMessage } = useClaimRewards()
  const { submitScore, isSubmitting, isSuccess: isScoreSubmitted, error: scoreError, successMessage: scoreSuccessMessage } = useSubmitScore()
  const { lifetimeRewards } = useLifetimeRewards()
  const { globalHighScore } = useGlobalHighScore()
  const [hasClaimed, setHasClaimed] = useState(false)
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false)

  // Reset claim state when score changes (new game)
  useEffect(() => {
    setHasClaimed(false)
    setHasSubmittedScore(false)
  }, [score])

  // Update hasClaimed when claim succeeds
  useEffect(() => {
    if (isSuccess) {
      setHasClaimed(true)
      setHasSubmittedScore(true) // Score is automatically submitted when claiming
    }
  }, [isSuccess])

  // Update hasSubmittedScore when score submission succeeds
  useEffect(() => {
    if (isScoreSubmitted) {
      setHasSubmittedScore(true)
    }
  }, [isScoreSubmitted])

  const handleClaim = async () => {
    if (score > 0 && hasNFTs && !isClaiming && !hasClaimed) {
      await claimRewards(score)
    }
  }

  const handleSubmitScore = async () => {
    if (score > 0 && !isSubmitting && !hasSubmittedScore) {
      await submitScore(score)
    }
  }

  return (
    <div className="relative flex flex-col items-center gap-6 sm:gap-8 rounded-3xl bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 p-8 sm:p-12 shadow-2xl backdrop-blur-xl mx-4 border-2 border-purple-300/50 overflow-hidden max-w-lg w-full">
      {/* Animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-shimmer pointer-events-none" />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full">
        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl sm:text-5xl font-black bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
            GAME OVER
          </h2>
          {isNewRecord && (
            <div className="mt-2 text-lg sm:text-xl font-bold text-yellow-300 animate-pulse">
              🏆 NEW RECORD! 🏆
            </div>
          )}
        </div>

        {/* Stats cards with Gen-Z style */}
        <div className="grid grid-cols-1 gap-4 w-full">
          {/* Distance card */}
          <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border-2 border-purple-400/30 hover:border-pink-400/50 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-purple-300/80 uppercase tracking-wider font-semibold mb-1">
                  Distance Traveled
                </p>
                <p className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                  {distance}m
                </p>
              </div>
              <div className="text-4xl sm:text-5xl">🚀</div>
            </div>
          </div>

          {/* $DEGEN card */}
          <div className="relative bg-black/40 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border-2 border-purple-400/30 hover:border-pink-400/50 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-purple-300/80 uppercase tracking-wider font-semibold mb-1">
                  {hasNFTs ? "$DEGEN Earned" : "$DEGEN Preview"}
                </p>
                <p className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300">
                  {hasNFTs ? score : rewardPreview}
                </p>
                {!hasNFTs && (
                  <p className="text-xs sm:text-sm text-purple-300/70 mt-2 font-medium">
                    {score} points earned
                  </p>
                )}
                {/* Total Lifetime Rewards */}
                {hasNFTs && (
                  <p className="text-xs sm:text-sm text-purple-400/70 mt-2 font-medium">
                    {lifetimeRewards > 0 
                      ? `Total Claimed: ${lifetimeRewards.toFixed(2)} $DEGEN`
                      : "Total Claimed: 0 $DEGEN"
                    }
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-3">
                <div className="text-4xl sm:text-5xl">💰</div>
                {/* Claim button or NFT message */}
                {hasNFTs && score > 0 ? (
                  <div className="flex flex-col items-end gap-2 w-full">
                    {successMessage ? (
                      <div className="bg-purple-900/60 backdrop-blur-sm rounded-xl p-3 border-2 border-purple-400/50 text-center w-full">
                        <p className="text-purple-200 font-bold text-sm">
                          ✅ {successMessage}
                        </p>
                      </div>
                    ) : error ? (
                      <div className="bg-red-900/60 backdrop-blur-sm rounded-xl p-3 border-2 border-red-400/50 text-center w-full">
                        <p className="text-red-200 font-bold text-sm">
                          ❌ {error}
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={handleClaim}
                        disabled={isClaiming || hasClaimed}
                        size="lg"
                        className="relative z-20 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base sm:text-lg px-6 py-4 w-full rounded-xl shadow-2xl hover:shadow-purple-500/50 transition-all hover:scale-105 border-2 border-purple-300/70 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse pointer-events-auto"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isClaiming ? (
                            <>⏳ Claiming...</>
                          ) : hasClaimed ? (
                            <>✅ Claimed</>
                          ) : (
                            <>💰 CLAIM {score} $DEGEN</>
                          )}
                        </span>
                      </Button>
                    )}
                  </div>
                ) : !hasNFTs ? (
                  <div className="flex flex-col items-end gap-2 w-full">
                    <div className="bg-purple-900/60 backdrop-blur-sm rounded-xl p-3 border-2 border-purple-400/50 text-center w-full">
                      <p className="text-purple-200 font-semibold text-sm leading-tight">
                        🔒 Mint a Based Degen to claim
                      </p>
                      <p className="text-purple-300/80 text-xs mt-1">
                        Would earn {rewardPreview} $DEGEN
                      </p>
                    </div>
                    {/* Submit Score button for non-NFT players */}
                    {scoreSuccessMessage ? (
                      <div className="bg-purple-900/60 backdrop-blur-sm rounded-xl p-3 border-2 border-purple-400/50 text-center w-full">
                        <p className="text-purple-200 font-bold text-sm">
                          ✅ {scoreSuccessMessage}
                        </p>
                      </div>
                    ) : scoreError ? (
                      <div className="bg-red-900/60 backdrop-blur-sm rounded-xl p-3 border-2 border-red-400/50 text-center w-full">
                        <p className="text-red-200 font-bold text-sm">
                          ❌ {scoreError}
                        </p>
                      </div>
                    ) : (
                      <Button
                        onClick={handleSubmitScore}
                        disabled={isSubmitting || hasSubmittedScore || score === 0}
                        size="lg"
                        className="relative z-20 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-sm sm:text-base px-4 py-3 w-full rounded-xl shadow-lg hover:shadow-purple-500/50 transition-all hover:scale-105 border-2 border-purple-300/70 disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {isSubmitting ? (
                            <>⏳ Submitting...</>
                          ) : hasSubmittedScore ? (
                            <>✅ Score Submitted</>
                          ) : (
                            <>📊 Submit Score Onchain (Free)</>
                          )}
                        </span>
                      </Button>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* High Score card */}
          <div className="relative bg-gradient-to-br from-yellow-900/40 to-orange-900/40 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border-2 border-yellow-400/50 hover:border-yellow-300/70 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-yellow-300/80 uppercase tracking-wider font-semibold mb-1">
                  Your High Score
                </p>
                <p className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                  {highScore}m
                </p>
                {globalHighScore > 0 && (
                  <p className="text-xs sm:text-sm text-yellow-200/70 mt-2 font-medium">
                    Global Record: {globalHighScore}m
                  </p>
                )}
              </div>
              <div className="text-4xl sm:text-5xl">👑</div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Button
            onClick={onPlayAgain}
            size="lg"
            className="relative bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 flex-1 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 border-2 border-purple-400/50"
          >
            <span className="relative z-10">Play Again 🔥</span>
          </Button>
          <Button
            onClick={onChangeTraits}
            size="lg"
            variant="outline"
            className="relative bg-black/40 backdrop-blur-sm border-2 border-purple-400/50 text-purple-300 hover:bg-purple-900/40 hover:text-purple-200 font-bold text-base sm:text-lg px-8 sm:px-10 py-6 sm:py-7 flex-1 rounded-xl transition-all hover:scale-105"
          >
            Power Traits ⚙️
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  )
}
