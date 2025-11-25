import { Button } from "@/components/ui/button"
import { TRAITS } from "@/lib/game/traits"
import type { Trait } from "@/lib/game/types"

type TraitSelectorProps = {
  selectedTraits: number[]
  onTraitToggle: (traitId: number) => void
  onStart: () => void
  ownedTraits?: number[]
  requiresWallet?: boolean
  loadingTraits?: boolean
}

export function TraitSelector({ selectedTraits, onTraitToggle, onStart, ownedTraits, requiresWallet, loadingTraits }: TraitSelectorProps) {
  // Show all unlocked traits
  const availableTraits = TRAITS.filter((t) => t.unlocked)
  const isTraitOwned = (traitId: number) => {
    // If wallet not required, all unlocked traits are available
    if (!requiresWallet) return true
    // If wallet required but no owned traits, allow all unlocked traits (for non-NFT users)
    if (requiresWallet && (!ownedTraits || ownedTraits.length === 0)) return true
    // If wallet required and has owned traits, only allow owned traits
    return ownedTraits.includes(traitId)
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 rounded-xl bg-white/90 p-3 sm:p-8 shadow-2xl backdrop-blur w-full max-w-3xl mx-4 max-h-screen overflow-y-auto">
      <h2 className="text-xl sm:text-4xl font-bold text-purple-600">Power Traits</h2>
      {loadingTraits && (
        <p className="text-xs sm:text-base text-purple-600 text-center">
          🔄 Loading your Power traits...
        </p>
      )}
      {!loadingTraits && requiresWallet && ownedTraits && ownedTraits.length === 0 && (
        <p className="text-xs sm:text-base text-purple-600 text-center">
          Select up to 4 Power traits to use in the game
        </p>
      )}
      {!loadingTraits && requiresWallet && ownedTraits && ownedTraits.length > 0 && (
        <p className="text-xs sm:text-base text-purple-600 text-center">
          ✓ {selectedTraits.length} Power trait{selectedTraits.length !== 1 ? "s" : ""} active
        </p>
      )}
      {!loadingTraits && !requiresWallet && (
        <p className="text-xs sm:text-base text-purple-600 text-center">
          Select up to 4 Power traits to use in the game
        </p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
        {availableTraits.map((trait) => {
          const isSelected = selectedTraits.includes(trait.id)
          const isOwned = isTraitOwned(trait.id)
          return (
            <button
              key={trait.id}
              onClick={() => onTraitToggle(trait.id)}
              disabled={!isOwned}
              className={`relative flex flex-col items-center gap-1 sm:gap-2 rounded-lg border-2 p-2 sm:p-4 transition-all ${
                isSelected
                  ? "border-purple-600 bg-gradient-to-br from-purple-100 to-pink-100 shadow-lg ring-2 ring-purple-400 hover:scale-95"
                  : isOwned
                    ? "border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50 hover:shadow-md hover:scale-105"
                    : "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
              }`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-1 right-1 bg-purple-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
              <span className="text-xl sm:text-3xl">{trait.icon}</span>
              <span className={`text-xs sm:text-sm font-semibold text-center leading-tight ${
                isSelected ? "text-purple-700" : "text-purple-600"
              }`}>
                {trait.name}
              </span>
              <div className="text-[10px] sm:text-xs text-gray-600 text-center space-y-0.5">
                {trait.description.map((desc, i) => (
                  <p key={i} className="leading-tight">
                    {desc}
                  </p>
                ))}
              </div>
              {!isOwned && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <span>🔒</span>
                  <span>Locked</span>
                </span>
              )}
              {isOwned && !isSelected && (
                <span className="text-xs text-purple-500 font-medium mt-1">
                  Click to activate
                </span>
              )}
              {isOwned && isSelected && (
                <span className="text-xs text-purple-600 font-medium mt-1">
                  Click to deactivate
                </span>
              )}
            </button>
          )
        })}
      </div>
      <Button
        onClick={onStart}
        size="lg"
        className="bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-lg px-4 sm:px-8 py-3 sm:py-6 w-full sm:w-auto"
      >
        Start Flying!
      </Button>
    </div>
  )
}

