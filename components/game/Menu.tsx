import { Button } from "@/components/ui/button"
import { WalletButton } from "@/components/web3/WalletButton"
import { useGlobalHighScore } from "@/hooks/useGlobalHighScore"
import type { GameState } from "@/lib/game/types"

type MenuProps = {
  highScore: number
  onStart: () => void
}

export function Menu({ highScore, onStart }: MenuProps) {
  const { globalHighScore, isLoading } = useGlobalHighScore()

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 rounded-xl bg-white/90 p-4 sm:p-8 shadow-2xl backdrop-blur mx-4">
      <h1 className="text-3xl sm:text-6xl font-bold text-purple-600 text-center">Based Degen Sky</h1>
      <p className="text-sm sm:text-lg text-gray-600 text-center max-w-md">
        <strong>Fly through obstacles, collect hats, and rack up DEGEN tokens!</strong> Real DEGEN rewards requires a Based Degen NFT. Mint one or buy on secondary market.
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
        <div className="flex flex-col gap-2 text-center text-sm sm:text-lg">
          {highScore > 0 && (
            <div className="text-gray-700">
              Your High Score: <span className="font-bold text-purple-600">{highScore}m</span>
            </div>
          )}
          {!isLoading && globalHighScore > 0 && (
            <div className="text-gray-700">
              🌍 Global Record: <span className="font-bold text-purple-600">{globalHighScore}m</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

