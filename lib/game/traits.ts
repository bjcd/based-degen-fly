import type { Trait, ActiveTraitEffects } from "./types"

export const TRAITS: Trait[] = [
  {
    id: 0,
    name: "Sword",
    description: ["Destroy small obstacles", "+10% speed", "10s cooldown"],
    icon: "⚔️",
    unlocked: true,
  },
  {
    id: 1,
    name: "Gold Teeth",
    description: ["Can take 2 hits", "+20% speed"],
    icon: "🦷",
    unlocked: true,
  },
  {
    id: 2,
    name: "Aura",
    description: ["Shield absorbs 1 hit", "Only on walls", "Regenerates in 10s"],
    icon: "🛡️",
    unlocked: true,
  },
  {
    id: 3,
    name: "Jetpack",
    description: ["+30% acceleration", "-40% gravity"],
    icon: "🚀",
    unlocked: true,
  },
  {
    id: 4,
    name: "Holographic Display",
    description: ["Preview obstacles", "Mini-map ahead"],
    icon: "📡",
    unlocked: true,
  },
  {
    id: 5,
    name: "Companion Orb",
    description: ["Auto-collect hats", "+25% hat spawn", "5s cooldown"],
    icon: "🔮",
    unlocked: true,
  },
  {
    id: 6,
    name: "Bronze Hands",
    description: ["Can take 2 hits", "-5% speed"],
    icon: "🥉",
    unlocked: true,
  },
  {
    id: 7,
    name: "Gold Hands",
    description: ["2x $DEGEN rewards", "-10% speed"],
    icon: "🥇",
    unlocked: true,
  },
  {
    id: 8,
    name: "Diamond Hands",
    description: ["Can take 4 hits", "Immune to small obstacles"],
    icon: "💎",
    unlocked: true,
  },
  {
    id: 9,
    name: "Shoulder Pads",
    description: ["Can take 4 hits", "+10% speed"],
    icon: "🦾",
    unlocked: true,
  },
  {
    id: 10,
    name: "Laser Eyes",
    description: ["Shoot lasers", "Auto-aim", "5s cooldown"],
    icon: "👁️",
    unlocked: true,
  },
  {
    id: 11,
    name: "Lightning Eyes",
    description: ["Chain lightning", "5s cooldown", "+20% speed"],
    icon: "⚡",
    unlocked: true,
  },
]

import {
  SWORD_COOLDOWN,
  LASER_COOLDOWN,
  LIGHTNING_COOLDOWN,
  COMPANION_COOLDOWN,
} from "./constants"

export function calculateTraitEffects(traitIds: number[]): ActiveTraitEffects {
  const effects: ActiveTraitEffects = {
    speedMultiplier: 1.15, // Base speed increased
    accelerationBoost: 0,
    gravityModifier: 0,
    hatSpawnBoost: 0,
    degenMultiplier: 1,
    hasShield: false,
    canDestroyObstacles: false,
    swordCooldown: SWORD_COOLDOWN,
    durabilityHits: 0,
    hitsAbsorbed: 0,
    hasLaserEyes: false,
    laserCooldown: LASER_COOLDOWN,
    hasLightningEyes: false,
    lightningCooldown: LIGHTNING_COOLDOWN,
    hasHolographicDisplay: false,
    hasCompanion: false,
    companionCooldown: COMPANION_COOLDOWN,
    shieldActive: false,
    shieldCooldown: 0,
    showPreview: false,
    hasChainLightning: false,
    rewardMultiplier: 1,
    gravityReduction: 0,
    canShootLasers: false,
  }

  traitIds.forEach((id) => {
    switch (id) {
      case 0: // Sword
        effects.canDestroyObstacles = true
        effects.speedMultiplier += 0.1
        effects.swordCooldown = SWORD_COOLDOWN
        break
      case 1: // Gold Teeth
        effects.durabilityHits += 2
        effects.speedMultiplier += 0.2
        break
      case 2: // Aura
        effects.hasShield = true
        effects.shieldActive = true
        break
      case 3: // Jetpack
        effects.accelerationBoost += 0.3
        effects.gravityReduction += 0.4
        effects.gravityModifier = -0.4
        break
      case 4: // Holographic Display
        effects.showPreview = true
        effects.hasHolographicDisplay = true
        break
      case 5: // Companion Orb
        effects.hasCompanion = true
        effects.hatSpawnBoost += 0.25
        effects.companionCooldown = COMPANION_COOLDOWN
        break
      case 6: // Bronze Hands - 2 hits
        effects.durabilityHits += 2
        effects.speedMultiplier -= 0.05
        break
      case 7: // Gold Hands
        effects.degenMultiplier = 2
        effects.speedMultiplier -= 0.1
        effects.rewardMultiplier = 1.5
        break
      case 8: // Diamond Hands - 4 hits
        effects.durabilityHits += 4
        // Removed speed penalty
        break
      case 9: // Shoulder Pads - 4 hits
        effects.hitsAbsorbed += 4
        effects.speedMultiplier += 0.1
        break
      case 10: // Laser Eyes
        effects.hasLaserEyes = true
        effects.laserCooldown = LASER_COOLDOWN
        break
      case 11: // Lightning Eyes
        effects.hasLightningEyes = true
        effects.lightningCooldown = LIGHTNING_COOLDOWN
        effects.speedMultiplier += 0.2
        break
    }
  })

  return effects
}

