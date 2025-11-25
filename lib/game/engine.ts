import type {
  GameRef,
  GameConstants,
  Obstacle,
  Hat,
  Laser,
  Lightning,
} from "./types"
import { applyGravity, applyThrust, updatePosition } from "./physics"
import { checkCollision, checkHatCollection } from "./collision"
import {
  OBSTACLE_SPAWN_INTERVAL,
  SMALL_OBSTACLE_CHANCE,
  BASE_HAT_SPAWN_CHANCE,
  SHIELD_REGEN_TIME,
} from "./constants"

export function updateGameState(
  game: GameRef,
  constants: GameConstants,
  selectedTraits: number[],
): { gameOver: boolean; distance: number; score: number } {
  const { GRAVITY, THRUST, OBSTACLE_SPEED } = constants
  const effects = game.traitEffects

  // Apply thrust if screen is touched/held
  if (game.isPressed) {
    applyThrust(game.copter, THRUST)
  }

  // Apply gravity
  applyGravity(game.copter, GRAVITY)
  
  // Update position (but don't constrain yet - check collision first)
  game.copter.y += game.copter.velocity
  
  // Check collision BEFORE constraining (so walls can kill properly)
  const collisionResult = checkCollision(
    game.copter,
    game.obstacles,
    constants,
    effects,
    selectedTraits,
    game.frame,
    game.lastSwordUse,
  )
  
  // Handle collision first (before constraining position)
  if (collisionResult.collided) {
    // Handle collision with shield or durability
    if (effects?.hasShield && effects.shieldActive) {
      effects.shieldActive = false
      game.lastShieldRegen = game.frame
      game.hitsRemaining--
      if (collisionResult.obstacleIndex !== undefined) {
        game.obstacles.splice(collisionResult.obstacleIndex, 1)
      }
      // Constrain position after handling collision
      if (game.copter.y < 0) game.copter.y = 0
      if (game.copter.y + constants.COPTER_SIZE > constants.CANVAS_HEIGHT) {
        game.copter.y = constants.CANVAS_HEIGHT - constants.COPTER_SIZE
      }
      game.frame++
      return { gameOver: false, distance: game.distance, score: game.score }
    }

    if (effects?.durabilityHits && effects.durabilityHits > 0) {
      effects.durabilityHits -= 1
      game.hitsRemaining = effects.durabilityHits
      if (collisionResult.obstacleIndex !== undefined) {
        game.obstacles.splice(collisionResult.obstacleIndex, 1)
      }
      // Constrain position after handling collision
      if (game.copter.y < 0) game.copter.y = 0
      if (game.copter.y + constants.COPTER_SIZE > constants.CANVAS_HEIGHT) {
        game.copter.y = constants.CANVAS_HEIGHT - constants.COPTER_SIZE
      }
      game.frame++
      return { gameOver: false, distance: game.distance, score: game.score }
    }

    if (effects?.hitsAbsorbed && effects.hitsAbsorbed > 0) {
      effects.hitsAbsorbed -= 1
      game.hitsRemaining = effects.hitsAbsorbed
      if (collisionResult.obstacleIndex !== undefined) {
        game.obstacles.splice(collisionResult.obstacleIndex, 1)
      }
      // Constrain position after handling collision
      if (game.copter.y < 0) game.copter.y = 0
      if (game.copter.y + constants.COPTER_SIZE > constants.CANVAS_HEIGHT) {
        game.copter.y = constants.CANVAS_HEIGHT - constants.COPTER_SIZE
      }
      game.frame++
      return { gameOver: false, distance: game.distance, score: game.score }
    }

    // No protection - game over
    return { gameOver: true, distance: game.distance, score: game.score }
  }
  
  // No collision - constrain copter to canvas bounds normally
  if (game.copter.y < 0) game.copter.y = 0
  if (game.copter.y + constants.COPTER_SIZE > constants.CANVAS_HEIGHT) {
    game.copter.y = constants.CANVAS_HEIGHT - constants.COPTER_SIZE
  }

  // Update distance and score
  game.distance += OBSTACLE_SPEED

  // Shield regeneration logic
  if (effects?.hasShield && !effects.shieldActive && game.frame - game.lastShieldRegen > SHIELD_REGEN_TIME) {
    effects.shieldActive = true
  }

  // Laser Eye logic
  if (effects?.hasLaserEyes && selectedTraits.includes(10)) {
    const timeSinceLastLaser = game.frame - game.lastLaserShot
    const laserCooldown = effects.laserCooldown || 600

    if (timeSinceLastLaser >= laserCooldown && game.obstacles.length > 0) {
      // Find the next obstacle in front of the copter that's visible on screen
      const nextObstacle = game.obstacles.find(
        (obs) => obs.x > game.copter.x && obs.x < game.copter.x + constants.CANVAS_WIDTH,
      )
      if (nextObstacle) {
        const targetX = nextObstacle.x + 60 / 2
        const targetY = nextObstacle.topHeight + nextObstacle.gap / 2

        game.lasersActive = [{ x: targetX, y: targetY, frame: game.frame }]

        setTimeout(() => {
          game.lasersActive = game.lasersActive.filter((l) => l.frame !== game.frame)
        }, 200)

        const obstacleIndex = game.obstacles.indexOf(nextObstacle)
        if (obstacleIndex > -1) {
          game.obstacles.splice(obstacleIndex, 1)
        }
        game.lastLaserShot = game.frame
      }
    }
  }

  // Lightning Eye logic
  if (effects?.hasLightningEyes && selectedTraits.includes(11)) {
    const timeSinceLastLightning = game.frame - game.lastLightningShot
    const lightningCooldown = effects.lightningCooldown || 600

    if (timeSinceLastLightning >= lightningCooldown && game.obstacles.length > 0) {
      const visibleObstacles = game.obstacles.filter(
        (obs) => obs.x > game.copter.x && obs.x < game.copter.x + constants.CANVAS_WIDTH,
      )

      if (visibleObstacles.length > 0) {
        const lightningPoints = visibleObstacles.reduce((acc, obs) => {
          acc.push({ x: obs.x + 60 / 2, y: obs.topHeight + obs.gap / 2 })
          return acc
        }, [] as Array<{ x: number; y: number }>)

        game.lightningActive = [
          {
            points: lightningPoints,
            frame: game.frame,
          },
        ]

        setTimeout(() => {
          game.lightningActive = game.lightningActive.filter((l) => l.frame !== game.frame)
        }, 300)

        visibleObstacles.forEach((obs) => {
          const obstacleIndex = game.obstacles.indexOf(obs)
          if (obstacleIndex > -1) {
            game.obstacles.splice(obstacleIndex, 1)
          }
        })

        game.lastLightningShot = game.frame
      }
    }
  }

  // Clean up old laser and lightning effects
  game.lasersActive = game.lasersActive.filter((laser) => game.frame - laser.frame <= 20)
  game.lightningActive = game.lightningActive.filter((lightning) => game.frame - lightning.frame <= 30)

  // Generate obstacles and hats
  if (game.frame % OBSTACLE_SPAWN_INTERVAL === 0) {
    const topHeight = 50 + Math.random() * (constants.CANVAS_HEIGHT - constants.GAP_SIZE - 100)
    const isSmall = Math.random() < SMALL_OBSTACLE_CHANCE
    game.obstacles.push({
      x: constants.CANVAS_WIDTH,
      topHeight,
      gap: constants.GAP_SIZE,
      isSmall,
    })

    // Hat spawning logic
    if (Math.random() < BASE_HAT_SPAWN_CHANCE + (effects?.hatSpawnBoost || 0)) {
      game.hats.push({
        x: constants.CANVAS_WIDTH + 30,
        y: topHeight + constants.GAP_SIZE / 2,
        collected: false,
      })
    }
  }

  // Move obstacles and hats to the left
  game.obstacles = game.obstacles.filter((obstacle) => {
    obstacle.x -= OBSTACLE_SPEED
    return obstacle.x > -60
  })

  game.hats = game.hats.filter((hat) => {
    hat.x -= OBSTACLE_SPEED
    return hat.x > -30
  })

  // Check hat collection
  const hatResult = checkHatCollection(game.copter, game.hats, effects)
  if (hatResult.collected && hatResult.hatIndex !== undefined && hatResult.score !== undefined) {
    game.score += hatResult.score
    game.hats.splice(hatResult.hatIndex, 1)
    game.companionTarget = null
  }

  // Companion auto-collect
  if (effects?.hasCompanion && game.hats.length > 0) {
    const timeSinceLastCollect = game.frame - game.lastCompanionCollect
    const companionCooldown = effects.companionCooldown || 300

    if (timeSinceLastCollect >= companionCooldown) {
      const closestHat = game.hats.reduce(
        (closest, hat) => {
          const dx = game.copter.x - hat.x
          const dy = game.copter.y - hat.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          return dist < closest.dist ? { hat, dist } : closest
        },
        { hat: null as Hat | null, dist: Number.POSITIVE_INFINITY },
      )

      if (closestHat.hat && closestHat.dist < 300) {
        game.companionTarget = closestHat.hat
        const hatReward = effects?.rewardMultiplier || 1
        game.score += Math.round(hatReward)
        const hatIndex = game.hats.indexOf(closestHat.hat)
        if (hatIndex > -1) game.hats.splice(hatIndex, 1)
        game.lastCompanionCollect = game.frame

        // Keep target visible longer to show the grappling hook effect
        setTimeout(() => {
          game.companionTarget = null
        }, 1000) // Increased from 500ms to 1000ms for better visibility
      }
    }
  }


  if (collisionResult.obstacleIndex !== undefined) {
    // Sword destroyed obstacle
    game.lastSwordUse = game.frame
    game.obstacles.splice(collisionResult.obstacleIndex, 1)
  }

  game.frame++

  return { gameOver: false, distance: game.distance, score: game.score }
}

