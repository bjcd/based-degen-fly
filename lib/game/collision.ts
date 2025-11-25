import type { Copter, Obstacle, GameConstants, ActiveTraitEffects } from "./types"
import { COPTER_SIZE } from "./constants"

export function checkCollision(
  copter: Copter,
  obstacles: Obstacle[],
  constants: GameConstants,
  traitEffects: ActiveTraitEffects | null,
  selectedTraits: number[],
  frame: number,
  lastSwordUse: number,
): { collided: boolean; obstacleIndex?: number } {
  const { CANVAS_HEIGHT, COPTER_SIZE, OBSTACLE_WIDTH } = constants

  // Check if copter is out of bounds vertically
  if (copter.y < 0 || copter.y + COPTER_SIZE > CANVAS_HEIGHT) {
    return { collided: true }
  }

  for (let i = 0; i < obstacles.length; i++) {
    const obstacle = obstacles[i]

    if (copter.x < obstacle.x + OBSTACLE_WIDTH && copter.x + COPTER_SIZE > obstacle.x) {
      let collided = false

      if (obstacle.isSmall) {
        // For small obstacles, check if copter hits the middle wall
        const wallHeight = 80
        const wallY = obstacle.topHeight + (obstacle.gap - wallHeight) / 2
        if (copter.y + COPTER_SIZE > wallY && copter.y < wallY + wallHeight) {
          collided = true
        }
      } else {
        // For normal obstacles, check top and bottom walls
        if (copter.y < obstacle.topHeight || copter.y + COPTER_SIZE > obstacle.topHeight + obstacle.gap) {
          collided = true
        }
      }

      if (collided) {
        // Check if Diamond Hands can pass through small obstacles (must have Diamond Hands trait selected)
        // For Diamond Hands, small obstacles are completely transparent - no collision at all
        if (obstacle.isSmall && selectedTraits.includes(8)) {
          continue // Pass through completely, no collision registered, no hit taken
        }

        // Sword destroys obstacles (both small and normal walls) - Trait ID 0
        if (traitEffects?.canDestroyObstacles && selectedTraits.includes(0)) {
          const timeSinceLastSword = frame - lastSwordUse
          if (timeSinceLastSword >= (traitEffects.swordCooldown || 600)) {
            return { collided: false, obstacleIndex: i } // Obstacle destroyed, player passes through
          }
        }

        // For normal obstacles (top/bottom walls), always return collision
        // Protection (shield/durability) will be handled in engine.ts
        return { collided: true, obstacleIndex: i }
      }
    }
  }

  return { collided: false }
}

export function checkHatCollection(
  copter: Copter,
  hats: Array<{ x: number; y: number; collected: boolean }>,
  traitEffects: ActiveTraitEffects | null,
): { collected: boolean; hatIndex?: number; score?: number } {
  const hatReward = traitEffects?.rewardMultiplier || 1

  for (let i = hats.length - 1; i >= 0; i--) {
    const hat = hats[i]
    if (hat.collected) continue

    const dx = copter.x + COPTER_SIZE / 2 - hat.x
    const dy = copter.y + COPTER_SIZE / 2 - hat.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Hat size is approximately 40px, so collection distance should account for that
    if (distance < (COPTER_SIZE / 2) + 20) {
      return { collected: true, hatIndex: i, score: Math.round(hatReward) }
    }
  }

  return { collected: false }
}

