import { Button } from "@/components/ui/button"
import { WalletButton } from "@/components/web3/WalletButton"
import { useGlobalHighScore } from "@/hooks/useGlobalHighScore"
import { useTotalDistributed } from "@/hooks/useTotalDistributed"
import { useUsernameFromAddress } from "@/hooks/useUsernameFromAddress"
import type { GameState } from "@/lib/game/types"
import { sdk } from "@farcaster/miniapp-sdk"
import { useState, useEffect } from "react"

type MenuProps = {
  highScore: number
  onStart: () => void
}

export function Menu({ highScore, onStart }: MenuProps) {
  const { globalHighScore, highScoreHolder, isLoading: isLoadingScore } = useGlobalHighScore()
  const { username, pfpUrl, isLoading: isLoadingUsername } = useUsernameFromAddress(highScoreHolder)
  const { totalDistributed, isLoading: isLoadingTotal } = useTotalDistributed()
  const [isInFarcaster, setIsInFarcaster] = useState(false)

  useEffect(() => {
    const checkFarcaster = async () => {
      try {
        const inMiniApp = await sdk.isInMiniApp()
        setIsInFarcaster(inMiniApp)
      } catch (error) {
        console.warn("⚠️ Error checking Farcaster environment:", error)
        setIsInFarcaster(false)
      }
    }
    checkFarcaster()
  }, [])

  const handleMintClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isInFarcaster) {
      try {
        console.log("🚀 Opening Based Degen mini app...")
        await sdk.actions.openMiniApp({
          url: 'https://farcaster.xyz/miniapps/JGXqJLzLcSNz/the-based-degens'
        })
        // Navigation successful - this app will close
        console.log("✅ Mini app opened successfully")
      } catch (error) {
        console.error("❌ Error opening mini app:", error)
        // Fallback to regular link
        console.log("🔄 Falling back to window.open...")
        window.open('https://farcaster.xyz/miniapps/JGXqJLzLcSNz/the-based-degens', '_blank')
      }
    } else {
      console.log("🌐 Not in Farcaster, using window.open...")
      window.open('https://farcaster.xyz/miniapps/JGXqJLzLcSNz/the-based-degens', '_blank')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 rounded-xl bg-white/90 p-4 sm:p-8 shadow-2xl backdrop-blur mx-4">
      <img
        src="/logo.png"
        alt="Based Degen Sky Logo"
        className="w-32 sm:w-48 h-auto mb-2"
      />
      <h1 className="text-3xl sm:text-6xl font-bold text-purple-600 text-center">Based Degen Sky</h1>
      <p className="text-sm sm:text-lg text-gray-600 text-center max-w-md">
        <strong>Fly through obstacles, collect hats, and rack up DEGEN tokens!</strong> Real DEGEN rewards requires a Based Degen NFT.{" "}
        <button
          onClick={handleMintClick}
          className="text-purple-600 hover:text-purple-700 underline font-semibold bg-transparent border-none p-0 cursor-pointer"
        >
          Mint one
        </button>
        {" "}or buy on{" "}
        <a
          href="https://opensea.io/collection/the-based-degens/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-600 hover:text-purple-700 underline font-semibold"
        >
          secondary market
        </a>
        .
      </p>
      <div className="flex flex-col gap-3 w-full sm:w-auto items-center">
        <WalletButton />
        <Button
          onClick={onStart}
          size="lg"
          className="bg-purple-600 hover:bg-purple-700 text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
        >
          Start Game
        </Button>
        <div className="flex flex-col gap-2 text-center text-sm sm:text-lg w-full">
          {highScore > 0 && (
            <div className="text-gray-700">
              Personal best score: <span className="font-bold text-purple-600">{highScore}m</span>
            </div>
          )}
          {!isLoadingScore && globalHighScore > 0 && (
            <div className="text-gray-700">
              🏆 Champion score: <span className="font-bold text-purple-600">{globalHighScore}m</span>
              {isLoadingUsername ? (
                <span className="text-gray-500 text-xs ml-1">(loading...)</span>
              ) : username ? (
                <span className="text-purple-600 font-semibold ml-1 inline-flex items-center gap-1.5">
                  (
                  {pfpUrl && (
                    <img 
                      src={pfpUrl} 
                      alt={username}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                  )}
                  @{username})
                </span>
              ) : highScoreHolder ? (
                <span className="text-gray-500 text-xs ml-1">({highScoreHolder.slice(0, 6)}...{highScoreHolder.slice(-4)})</span>
              ) : null}
            </div>
          )}
          {!isLoadingTotal && (
            <div className="text-gray-700">
              🎩 Total DEGEN earned: <span className="font-bold text-purple-600">{totalDistributed > 0 ? totalDistributed.toFixed(2) : "0.00"} $DEGEN</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

