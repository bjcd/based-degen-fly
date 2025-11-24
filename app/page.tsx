"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

type Trait = {
  id: number
  name: string
  description: string[]
  icon: string
  unlocked: boolean // For future: can be based on player progress
}

type ActiveTraitEffects = {
  speedMultiplier: number
  degenMultiplier: number // Changed from pointsMultiplier to degenMultiplier
  canDestroyObstacles: boolean
  swordCooldown: number // Added sword cooldown
  durabilityHits: number
  hitsAbsorbed: number
  hasShield: boolean
  shieldActive: boolean
  shieldCooldown: number
  accelerationBoost: number
  gravityReduction: number
  showPreview: boolean
  hasCompanion: boolean
  companionCooldown: number // Added companion cooldown
  hatSpawnBoost: number // Changed from coinSpawnBoost
  canShootLasers: boolean
  laserCooldown: number
  hasChainLightning: boolean
  lightningCooldown: number
  hasLaserEyes: boolean // Added
  hasLightningEyes: boolean // Added
  rewardMultiplier: number // Added
  gravityModifier: number // Added
  hasHolographicDisplay: boolean // Added
}

const TRAITS: Trait[] = [
  {
    id: 0,
    name: "Sword",
    description: ["Destroy small obstacles", "+10% speed", "10s cooldown"], // Added cooldown info
    icon: "⚔️",
    unlocked: true,
  },
  {
    id: 1,
    name: "Gold Teeth",
    description: ["2x $DEGEN rewards", "+5% speed"], // Updated description
    icon: "🦷",
    unlocked: true,
  },
  {
    id: 2,
    name: "Aura",
    description: ["Shield absorbs 1 hit", "Only on walls", "Regenerates in 10s"], // Clarified behavior
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
    description: ["Auto-collect hats", "+25% hat spawn", "5s cooldown"], // Added cooldown info
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
    description: ["Can take 3 hits", "-10% speed"],
    icon: "🥇",
    unlocked: true,
  },
  {
    id: 8,
    name: "Diamond Hands",
    description: ["Can take 4 hits", "-15% speed", "Immune to small obstacles"],
    icon: "💎",
    unlocked: true,
  },
  {
    id: 9,
    name: "Shoulder Pads",
    description: ["Can take 4 hits", "+10% speed"], // Changed from damage reduction to hits
    icon: "🦾",
    unlocked: true,
  },
  {
    id: 10,
    name: "Laser Eyes",
    description: ["Shoot lasers", "Auto-aim", "5s cooldown"], // Updated cooldown to 5s
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

const traitDefinitions = [
  {
    id: 0,
    name: "Sword",
    description: "Destroy small obstacles",
    emoji: "🗡️",
    unlocked: true,
  },
  {
    id: 1,
    name: "Gold Teeth",
    description: "2x $DEGEN rewards",
    emoji: "🦷",
    unlocked: true,
  },
  {
    id: 2,
    name: "Aura",
    description: "Shield absorbs 1 hit (rechargeable)",
    emoji: "🛡️",
    unlocked: true,
  },
  {
    id: 3,
    name: "Holographic Display",
    description: "See next obstacle preview",
    emoji: "📡",
    unlocked: true,
  },
  {
    id: 4,
    name: "Floating Companion Orb",
    description: "Auto-collects hats (5s cooldown)",
    emoji: "🔮",
    unlocked: true,
  },
  {
    id: 5,
    name: "Bronze Hands",
    description: "Absorb 2 hits, +5% speed",
    emoji: "👊",
    unlocked: true,
  },
  {
    id: 6,
    name: "Gold Hands",
    description: "Absorb 3 hits, -10% speed",
    emoji: "✊",
    unlocked: true,
  },
  {
    id: 7,
    name: "Jetpack",
    description: "-40% gravity",
    emoji: "🚀",
    unlocked: true,
  },
  {
    id: 8,
    name: "Diamond Hands",
    description: "Absorb 4 hits, pass small obstacles, -15% speed",
    emoji: "💎",
    unlocked: true,
  },
  {
    id: 9,
    name: "Shoulder Pads",
    description: "Absorb 4 hits",
    emoji: "🏈",
    unlocked: true,
  },
  {
    id: 10,
    name: "Laser Eyes",
    description: "Destroy next obstacle (10s cooldown)",
    emoji: "👁️",
    unlocked: true,
  },
  {
    id: 11,
    name: "Lightning Eyes",
    description: "Destroy all visible obstacles (10s cooldown)",
    emoji: "⚡",
    unlocked: true,
  },
]

export default function CopterGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<any>({}) // Declare gameRef
  const gameLoopRef = useRef<any>(null) // Declare gameLoopRef
  const [gameState, setGameState] = useState<"menu" | "traits" | "playing" | "gameover">("menu")
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [selectedTraits, setSelectedTraits] = useState<number[]>([])
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 800, height: 500 })

  useEffect(() => {
    const updateCanvasSize = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (viewportWidth < 768) {
        // Mobile: use full viewport dimensions for immersive gameplay
        const width = viewportWidth
        const height = viewportHeight
        setCanvasDimensions({ width, height })
      } else {
        // Desktop: use standard size with 16:10 aspect ratio
        setCanvasDimensions({ width: 800, height: 500 })
      }
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)

    return () => window.removeEventListener("resize", updateCanvasSize)
  }, [])

  useEffect(() => {
    const savedHighScore = localStorage.getItem("copterHighScore")
    if (savedHighScore) setHighScore(Number.parseInt(savedHighScore))
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const getGameConstants = () => {
      const effects = gameRef.current.traitEffects
      const baseGravity = 0.3 // Reduced from 0.5 for slower fall
      const baseThrust = -6 // Reduced from -8 for gentler acceleration
      const baseSpeed = 2.5 // Reduced from 3 for slower overall speed
      const OBSTACLE_WIDTH = 60

      return {
        GRAVITY: effects ? baseGravity * (1 - effects.gravityModifier) : baseGravity,
        THRUST: effects ? baseThrust * (1 + effects.accelerationBoost) : baseThrust,
        OBSTACLE_SPEED: effects ? baseSpeed * effects.speedMultiplier : baseSpeed,
        COPTER_SIZE: 30,
        OBSTACLE_WIDTH,
        GAP_SIZE: 180,
        CANVAS_HEIGHT: canvasDimensions.height,
        CANVAS_WIDTH: canvasDimensions.width,
      }
    }

    const resetGame = () => {
      const traitEffects = calculateTraitEffects(selectedTraits)
      const totalHits = (traitEffects.durabilityHits || 0) + (traitEffects.hitsAbsorbed || 0) + 1 // +1 for base hit
      gameRef.current = {
        copter: { x: 100, y: canvasDimensions.height / 2, velocity: 0 },
        obstacles: [],
        hats: [],
        score: 0,
        distance: 0,
        frame: 0,
        isPressed: false,
        traitEffects,
        hitsRemaining: totalHits, // Total hits from all traits
        lastShieldRegen: 0,
        lastSwordUse: 0,
        lastLaserShot: 0,
        lastLightningShot: 0,
        lastCompanionCollect: 0,
        lasersActive: [],
        lightningActive: [],
        companionTarget: null,
      }
    }

    const drawCopter = () => {
      const { x, y } = gameRef.current.copter
      const effects = gameRef.current.traitEffects
      const { CANVAS_HEIGHT, COPTER_SIZE } = getGameConstants()

      // Fallback image if not found
      const characterImg = new Image()
      characterImg.src = "/images/screenshot-202025-11-24-20at-2013.png"
      ctx.drawImage(characterImg, x - 15, y - 15, 60, 60)

      // Draw trait visual effects around the character

      // Aura Shield
      if (effects?.hasShield && effects.shieldActive) {
        ctx.strokeStyle = "rgba(56, 189, 248, 0.7)"
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(x + 15, y + 15, 35, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(x + 15, y + 15, 40, 0, Math.PI * 2)
        ctx.stroke()
      }

      // Companion Orb floating beside character
      if (effects?.hasCompanion) {
        const companionX = x + 50 + Math.sin(gameRef.current.frame * 0.05) * 10
        const companionY = y + Math.cos(gameRef.current.frame * 0.08) * 15

        // Orb glow
        const gradient = ctx.createRadialGradient(companionX, companionY, 0, companionX, companionY, 12)
        gradient.addColorStop(0, "rgba(168, 85, 247, 0.8)")
        gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.4)")
        gradient.addColorStop(1, "rgba(168, 85, 247, 0)")
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(companionX, companionY, 12, 0, Math.PI * 2)
        ctx.fill()

        // Orb core
        ctx.fillStyle = "rgba(196, 181, 253, 1)"
        ctx.beginPath()
        ctx.arc(companionX, companionY, 6, 0, Math.PI * 2)
        ctx.fill()

        // If collecting a hat, show motion trail
        if (gameRef.current.companionTarget) {
          const target = gameRef.current.companionTarget // Define target here
          ctx.strokeStyle = "rgba(168, 85, 247, 0.5)"
          ctx.lineWidth = 2
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.moveTo(companionX, companionY)
          ctx.lineTo(target.x, target.y)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }

      if (effects?.hasLaserEyes && gameRef.current.lasersActive.length > 0) {
        gameRef.current.lasersActive.forEach((laser) => {
          const laserGradient = ctx.createLinearGradient(x + 20, y + 10, laser.x, laser.y)
          laserGradient.addColorStop(0, "rgba(239, 68, 68, 0.9)")
          laserGradient.addColorStop(0.5, "rgba(239, 68, 68, 0.6)")
          laserGradient.addColorStop(1, "rgba(239, 68, 68, 0.2)")

          ctx.strokeStyle = laserGradient
          ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(x + 20, y + 10)
          ctx.lineTo(laser.x, laser.y)
          ctx.stroke()

          // Inner laser beam
          ctx.strokeStyle = "rgba(254, 202, 202, 0.8)"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x + 20, y + 10)
          ctx.lineTo(laser.x, laser.y)
          ctx.stroke()
        })
      }

      if (effects?.hasLightningEyes && gameRef.current.lightningActive.length > 0) {
        gameRef.current.lightningActive.forEach((lightning) => {
          // Draw jagged lightning bolt
          ctx.strokeStyle = "rgba(250, 204, 21, 0.9)"
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(x + 20, y + 10)

          const segments = 8
          for (let i = 1; i <= segments; i++) {
            const segmentX = x + 20 + ((lightning.points[0].x - x - 20) * i) / segments
            const segmentY = y + 10 + ((lightning.points[0].y - y - 10) * i) / segments + (Math.random() - 0.5) * 20
            ctx.lineTo(segmentX, segmentY)
          }
          ctx.lineTo(lightning.points[0].x, lightning.points[0].y)
          ctx.stroke()

          // Inner glow
          ctx.strokeStyle = "rgba(254, 240, 138, 0.6)"
          ctx.lineWidth = 1
          ctx.stroke()
        })
      }

      // Jetpack flame
      if (effects?.gravityModifier < 0 && gameRef.current.isPressed) {
        const flameHeight = 15 + Math.random() * 5
        const flameGradient = ctx.createLinearGradient(x + 15, y + 30, x + 15, y + 30 + flameHeight)
        flameGradient.addColorStop(0, "rgba(251, 146, 60, 0.9)")
        flameGradient.addColorStop(0.5, "rgba(234, 88, 12, 0.7)")
        flameGradient.addColorStop(1, "rgba(234, 88, 12, 0)")

        ctx.fillStyle = flameGradient
        ctx.beginPath()
        ctx.moveTo(x + 10, y + 30)
        ctx.lineTo(x + 15, y + 30 + flameHeight)
        ctx.lineTo(x + 20, y + 30)
        ctx.fill()
      }

      // Sword indicator
      if (effects?.canDestroyObstacles) {
        const timeSinceLastSword = gameRef.current.frame - gameRef.current.lastSwordUse
        const swordReady = timeSinceLastSword >= effects.swordCooldown
        if (swordReady) {
          ctx.fillStyle = "rgba(147, 197, 253, 0.8)"
          ctx.font = "bold 20px monospace"
          ctx.fillText("🗡️", x + 35, y - 5)
        }
      }
    }

    const drawHats = () => {
      gameRef.current.hats.forEach((hat) => {
        if (hat.collected) return

        ctx.fillStyle = "#7c3aed"
        ctx.beginPath()
        ctx.ellipse(hat.x, hat.y + 12, 12, 4, 0, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#a855f7"
        ctx.fillRect(hat.x - 10, hat.y, 20, 12)

        ctx.fillStyle = "#22c55e"
        ctx.beginPath()
        ctx.arc(hat.x - 5, hat.y + 5, 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#ec4899"
        ctx.beginPath()
        ctx.arc(hat.x + 5, hat.y + 5, 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = "#fbbf24"
        ctx.fillRect(hat.x - 2, hat.y + 8, 4, 2)
      })
    }

    const drawObstacles = () => {
      const { obstacles, traitEffects } = gameRef.current
      const { CANVAS_HEIGHT } = getGameConstants()

      obstacles.forEach((obstacle) => {
        if (obstacle.isSmall) {
          // Small obstacle (30% chance) - a small wall in the middle
          ctx.fillStyle = "rgba(120, 113, 108, 0.9)"
          const wallHeight = 80
          const wallY = obstacle.topHeight + (obstacle.gap - wallHeight) / 2
          ctx.fillRect(obstacle.x, wallY, 60, wallHeight)
          ctx.strokeStyle = "rgba(68, 64, 60, 0.5)"
          ctx.lineWidth = 2
          ctx.strokeRect(obstacle.x, wallY, 60, wallHeight)
        } else {
          // Normal obstacle - top and bottom walls with gap
          ctx.fillStyle = "rgba(120, 113, 108, 0.9)"
          ctx.fillRect(obstacle.x, 0, 60, obstacle.topHeight)
          ctx.strokeStyle = "rgba(68, 64, 60, 0.5)"
          ctx.lineWidth = 2
          ctx.strokeRect(obstacle.x, 0, 60, obstacle.topHeight)

          ctx.fillStyle = "rgba(120, 113, 108, 0.9)"
          ctx.fillRect(
            obstacle.x,
            obstacle.topHeight + obstacle.gap,
            60,
            CANVAS_HEIGHT - obstacle.topHeight - obstacle.gap,
          )
          ctx.strokeStyle = "rgba(68, 64, 60, 0.5)"
          ctx.lineWidth = 2
          ctx.strokeRect(
            obstacle.x,
            obstacle.topHeight + obstacle.gap,
            60,
            CANVAS_HEIGHT - obstacle.topHeight - obstacle.gap,
          )
        }
      })

      if (traitEffects?.hasHolographicDisplay && obstacles.length > 0) {
        const { CANVAS_WIDTH } = getGameConstants()
        const nextObstacles = obstacles.filter((obs) => obs.x > CANVAS_WIDTH * 0.75).slice(0, 2)

        nextObstacles.forEach((obstacle) => {
          const previewX = CANVAS_WIDTH * 0.8 + (obstacle.x - CANVAS_WIDTH * 0.75) * 0.3
          const scale = 0.3

          ctx.fillStyle = "rgba(56, 189, 248, 0.3)"

          if (obstacle.isSmall) {
            const wallHeight = 80
            const wallY = obstacle.topHeight + (obstacle.gap - wallHeight) / 2
            ctx.fillRect(previewX, wallY * scale, 60 * scale, wallHeight * scale)
            ctx.strokeStyle = "rgba(56, 189, 248, 0.6)"
            ctx.lineWidth = 1
            ctx.strokeRect(previewX, wallY * scale, 60 * scale, wallHeight * scale)
          } else {
            ctx.fillRect(
              previewX,
              obstacle.topHeight * scale,
              60 * scale,
              (CANVAS_HEIGHT - obstacle.topHeight - obstacle.gap) * scale * 0.2,
            )
            ctx.fillRect(
              previewX,
              (obstacle.topHeight + obstacle.gap) * scale,
              60 * scale,
              (CANVAS_HEIGHT - obstacle.topHeight - obstacle.gap) * scale,
            )

            ctx.strokeStyle = "rgba(56, 189, 248, 0.6)"
            ctx.lineWidth = 1
            ctx.strokeRect(
              previewX,
              obstacle.topHeight * scale,
              60 * scale,
              (CANVAS_HEIGHT - obstacle.topHeight - obstacle.gap) * scale * 0.2,
            )
            ctx.strokeRect(
              previewX,
              (obstacle.topHeight + obstacle.gap) * scale,
              60 * scale,
              (CANVAS_HEIGHT - obstacle.topHeight - obstacle.gap) * scale,
            )
          }
        })
      }
    }

    const drawLasers = () => {
      const { copter, lasersActive } = gameRef.current
      const { COPTER_SIZE } = getGameConstants()

      lasersActive.forEach((laser) => {
        const age = gameRef.current.frame - laser.frame
        if (age > 20) return

        const alpha = 1 - age / 20
        ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(copter.x + COPTER_SIZE, copter.y + 10)
        ctx.lineTo(laser.x, laser.y)
        ctx.stroke()

        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`
        ctx.beginPath()
        ctx.arc(laser.x, laser.y, 8, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    const drawLightning = () => {
      const { lightningActive } = gameRef.current

      lightningActive.forEach((lightning) => {
        const age = gameRef.current.frame - lightning.frame
        if (age > 30) return

        const alpha = 1 - age / 30
        ctx.strokeStyle = `rgba(251, 191, 36, ${alpha})`
        ctx.lineWidth = 2

        for (let i = 0; i < lightning.points.length - 1; i++) {
          ctx.beginPath()
          ctx.moveTo(lightning.points[i].x, lightning.points[i].y)
          ctx.lineTo(lightning.points[i + 1].x, lightning.points[i + 1].y)
          ctx.stroke()
        }
      })
    }

    const drawBackground = () => {
      const { CANVAS_HEIGHT, CANVAS_WIDTH } = getGameConstants()

      const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
      gradient.addColorStop(0, "#f9a8d4")
      gradient.addColorStop(1, "#fda4af")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      ctx.strokeStyle = "rgba(255, 255, 255, 0.15)"
      ctx.lineWidth = 1
      for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(CANVAS_WIDTH, i)
        ctx.stroke()
      }
    }

    const checkCollision = (): boolean => {
      const { copter, obstacles, traitEffects } = gameRef.current
      const { CANVAS_HEIGHT, COPTER_SIZE, OBSTACLE_WIDTH } = getGameConstants()

      // Check if copter is out of bounds vertically
      if (copter.y < 0 || copter.y + COPTER_SIZE > CANVAS_HEIGHT) {
        return true
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
            // Check if Diamond Hands can pass through small obstacles
            // Assuming Diamond Hands is trait ID 8
            if (obstacle.isSmall && traitEffects?.durabilityHits && traitEffects.durabilityHits >= 4) {
              continue // Pass through, no collision registered
            }

            // Sword destroys small obstacles (Trait ID 0)
            if (obstacle.isSmall && traitEffects?.canDestroyObstacles && selectedTraits.includes(0)) {
              const timeSinceLastSword = gameRef.current.frame - gameRef.current.lastSwordUse
              if (timeSinceLastSword >= traitEffects.swordCooldown) {
                obstacles.splice(i, 1)
                gameRef.current.lastSwordUse = gameRef.current.frame
                return false // Obstacle destroyed, continue game
              }
            }

            // Check shield (Aura - Trait ID 2)
            if (traitEffects?.hasShield && traitEffects.shieldActive) {
              gameRef.current.traitEffects = { ...traitEffects, shieldActive: false } // Use shield, deactivate
              gameRef.current.lastShieldRegen = gameRef.current.frame // Start regen timer
              gameRef.current.hitsRemaining--
              obstacles.splice(i, 1)
              return false // Hit absorbed by shield, continue game
            }

            // Check durability hits (Bronze/Gold/Diamond Hands - Traits 6, 7, 8)
            if (traitEffects?.durabilityHits && traitEffects.durabilityHits > 0) {
              gameRef.current.traitEffects = {
                ...traitEffects,
                durabilityHits: traitEffects.durabilityHits - 1,
              }
              gameRef.current.hitsRemaining = traitEffects.durabilityHits - 1
              obstacles.splice(i, 1)
              return false // Hit absorbed by hands, continue game
            }

            // Check hits absorbed (Shoulder Pads - Trait ID 9)
            if (traitEffects?.hitsAbsorbed && traitEffects.hitsAbsorbed > 0) {
              gameRef.current.traitEffects = {
                ...traitEffects,
                hitsAbsorbed: traitEffects.hitsAbsorbed - 1,
              }
              gameRef.current.hitsRemaining = traitEffects.hitsAbsorbed - 1
              obstacles.splice(i, 1)
              return false // Hit absorbed by shoulder pads, continue game
            }

            // If no other protection, it's a direct hit leading to game over
            return true
          }
        }
      }

      return false
    }

    const checkHatCollection = () => {
      const { copter, hats, traitEffects } = gameRef.current
      const hatReward = traitEffects?.rewardMultiplier || 1

      for (let i = hats.length - 1; i >= 0; i--) {
        const hat = hats[i]
        const dx = copter.x + 15 - hat.x
        const dy = copter.y + 15 - hat.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 25) {
          gameRef.current.score += Math.round(hatReward) // Ensure score is integer
          hats.splice(i, 1)
          gameRef.current.companionTarget = null
        }
      }

      if (traitEffects?.hasCompanion && hats.length > 0) {
        const timeSinceLastCollect = gameRef.current.frame - gameRef.current.lastCompanionCollect
        const companionCooldown = traitEffects.companionCooldown || 300 // Use actual cooldown from effects

        if (timeSinceLastCollect >= companionCooldown) {
          const closestHat = hats.reduce(
            (closest, hat) => {
              const dx = copter.x - hat.x
              const dy = copter.y - hat.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              return dist < closest.dist ? { hat, dist } : closest
            },
            { hat: null, dist: Number.POSITIVE_INFINITY },
          )

          if (closestHat.hat && closestHat.dist < 300) {
            gameRef.current.companionTarget = closestHat.hat
            gameRef.current.score += Math.round(hatReward)
            const hatIndex = hats.indexOf(closestHat.hat)
            if (hatIndex > -1) hats.splice(hatIndex, 1)
            gameRef.current.lastCompanionCollect = gameRef.current.frame

            // Clear companion target after a short duration to simulate movement
            setTimeout(() => {
              gameRef.current.companionTarget = null
            }, 500)
          }
        }
      }
    }

    const gameLoop = () => {
      if (gameState !== "playing") return

      const game = gameRef.current
      const { GRAVITY, THRUST, OBSTACLE_SPEED, COPTER_SIZE, GAP_SIZE, CANVAS_HEIGHT, CANVAS_WIDTH } = getGameConstants()
      const effects = game.traitEffects

      // Apply thrust if screen is touched/held
      if (game.isPressed) {
        game.copter.velocity = THRUST
      }

      // Apply gravity
      game.copter.velocity += GRAVITY
      game.copter.y += game.copter.velocity

      // Constrain copter to canvas bounds
      if (game.copter.y < 0) game.copter.y = 0
      if (game.copter.y + COPTER_SIZE > CANVAS_HEIGHT) game.copter.y = CANVAS_HEIGHT - COPTER_SIZE

      // Update distance and score
      game.distance += OBSTACLE_SPEED
      const metersDistance = Math.floor(game.distance / 10)
      setDistance(metersDistance)

      // Shield regeneration logic
      if (effects?.hasShield && !effects.shieldActive && game.frame - game.lastShieldRegen > 600) {
        // 600 frames = 10 seconds at 60fps
        effects.shieldActive = true
      }

      // Laser Eye logic
      if (effects?.hasLaserEyes && selectedTraits.includes(10)) {
        const timeSinceLastLaser = game.frame - game.lastLaserShot
        const laserCooldown = effects.laserCooldown || 600 // Default to 10 seconds

        if (timeSinceLastLaser >= laserCooldown && game.obstacles.length > 0) {
          // Find the next obstacle in front of the copter
          const nextObstacle = game.obstacles.find((obs) => obs.x > game.copter.x)
          if (nextObstacle) {
            // Calculate target point for laser (center of the obstacle's gap)
            const targetX = nextObstacle.x + 60 / 2
            const targetY = nextObstacle.topHeight + nextObstacle.gap / 2

            game.lasersActive = [{ x: targetX, y: targetY, frame: game.frame }]

            // Remove laser effect after a short duration
            setTimeout(() => {
              game.lasersActive = game.lasersActive.filter((l) => l.frame !== game.frame)
            }, 200)

            // Remove the obstacle that was targeted by the laser
            const obstacleIndex = game.obstacles.indexOf(nextObstacle)
            if (obstacleIndex > -1) {
              game.obstacles.splice(obstacleIndex, 1)
            }
            game.lastLaserShot = game.frame // Reset laser cooldown timer
          }
        }
      }

      // Lightning Eye logic
      if (effects?.hasLightningEyes && selectedTraits.includes(11)) {
        const timeSinceLastLightning = game.frame - game.lastLightningShot
        const lightningCooldown = effects.lightningCooldown || 600 // Default to 10 seconds

        if (timeSinceLastLightning >= lightningCooldown && game.obstacles.length > 0) {
          // Find all obstacles currently visible on screen
          const visibleObstacles = game.obstacles.filter(
            (obs) => obs.x > game.copter.x && obs.x < game.copter.x + CANVAS_WIDTH,
          )

          if (visibleObstacles.length > 0) {
            // Generate lightning path points targeting the center of visible obstacles
            const lightningPoints = visibleObstacles.reduce((acc, obs) => {
              acc.push({ x: obs.x + 60 / 2, y: obs.topHeight + obs.gap / 2 })
              return acc
            }, [])

            // Add lightning effect
            game.lightningActive = [
              {
                points: lightningPoints,
                frame: game.frame,
              },
            ]

            // Remove lightning effect after a short duration
            setTimeout(() => {
              game.lightningActive = game.lightningActive.filter((l) => l.frame !== game.frame)
            }, 300)

            // Remove all targeted obstacles
            visibleObstacles.forEach((obs) => {
              const obstacleIndex = game.obstacles.indexOf(obs)
              if (obstacleIndex > -1) {
                game.obstacles.splice(obstacleIndex, 1)
              }
            })

            game.lastLightningShot = game.frame // Reset lightning cooldown timer
          }
        }
      }

      // Clean up old laser and lightning effects
      game.lasersActive = game.lasersActive.filter((laser) => game.frame - laser.frame <= 20)
      game.lightningActive = game.lightningActive.filter((lightning) => game.frame - lightning.frame <= 30)

      // Generate obstacles and hats
      if (game.frame % 120 === 0) {
        // Spawn new obstacle every 2 seconds (120 frames at 60fps)
        const topHeight = 50 + Math.random() * (CANVAS_HEIGHT - GAP_SIZE - 100)
        const isSmall = Math.random() < 0.3 // 30% chance for small walls
        game.obstacles.push({
          x: CANVAS_WIDTH,
          topHeight,
          gap: GAP_SIZE,
          isSmall,
        })

        // Hat spawning logic, adjusted for hatSpawnBoost
        if (Math.random() < 0.1 + (effects?.hatSpawnBoost || 0)) {
          game.hats.push({
            x: CANVAS_WIDTH + 30, // Start slightly off-screen to the right
            y: topHeight + GAP_SIZE / 2,
            collected: false,
          })
        }
      }

      // Move obstacles and hats to the left
      game.obstacles = game.obstacles.filter((obstacle) => {
        obstacle.x -= OBSTACLE_SPEED
        return obstacle.x > -60 // Keep obstacles that are still on screen
      })

      game.hats = game.hats.filter((hat) => {
        hat.x -= OBSTACLE_SPEED
        return hat.x > -30 // Keep hats that are still on screen
      })

      checkHatCollection() // Check if any hats were collected

      if (checkCollision()) {
        // Check if the collision is with a laser or lightning effect
        // This logic might need refinement if lasers/lightning can also cause collisions
        // For now, assuming direct obstacle collision is the game over condition.

        setGameState("gameover")
        const finalScore = game.score + metersDistance
        if (finalScore > highScore) {
          setHighScore(finalScore)
          localStorage.setItem("copterHighScore", finalScore.toString())
        }
        return // Stop the game loop
      }

      game.frame++ // Increment frame counter

      // Drawing the game scene
      drawBackground()
      drawObstacles()
      drawHats()
      drawCopter()
      drawLasers()
      drawLightning()

      // Display score and distance
      ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
      ctx.font = "bold 20px monospace"
      ctx.fillText(`Distance: ${metersDistance}m`, 20, 35)
      ctx.fillText(`$DEGEN: ${game.score}`, 20, 60)

      // Display trait-related UI elements
      let yOffset = 85
      const currentEffects = gameRef.current.traitEffects // Re-fetch for current state

      // Hits Remaining UI
      if (currentEffects && (currentEffects.durabilityHits > 0 || currentEffects.hitsAbsorbed > 0)) {
        ctx.fillStyle = "rgba(249, 115, 22, 0.9)" // Orange for hit points
        ctx.fillText(`❤️ Hits: ${gameRef.current.hitsRemaining}`, 20, yOffset)
        ctx.fillStyle = "rgba(30, 41, 59, 0.9)" // Reset color
        yOffset += 25
      }

      // Shield UI
      if (currentEffects?.hasShield) {
        const shieldStatus = currentEffects.shieldActive ? "ACTIVE" : "RECHARGING"
        const shieldColor = currentEffects.shieldActive ? "rgba(56, 189, 248, 0.9)" : "rgba(239, 68, 68, 0.9)"
        ctx.fillStyle = shieldColor
        ctx.fillText(`🛡️ Shield: ${shieldStatus}`, 20, yOffset)
        ctx.fillStyle = "rgba(30, 41, 59, 0.9)" // Reset color
        yOffset += 25
      }

      // Sword Cooldown UI
      if (currentEffects?.canDestroyObstacles && selectedTraits.includes(0)) {
        const timeSinceLastSword = game.frame - game.lastSwordUse
        const swordCooldown = currentEffects.swordCooldown || 600
        const swordSecondsLeft = Math.max(0, Math.ceil((swordCooldown - timeSinceLastSword) / 60))

        if (swordSecondsLeft > 0) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)" // Red for cooldown
          ctx.fillText(`🗡️ Sword: ${swordSecondsLeft}s`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)" // Reset color
          yOffset += 25
        } else {
          ctx.fillStyle = "rgba(34, 197, 94, 0.9)" // Green for ready
          ctx.fillText(`🗡️ Sword: READY`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)" // Reset color
          yOffset += 25
        }
      }

      // Laser Cooldown UI
      if (currentEffects?.hasLaserEyes && selectedTraits.includes(10)) {
        const timeSinceLastLaser = game.frame - game.lastLaserShot
        const laserCooldown = currentEffects.laserCooldown || 600
        const laserSecondsLeft = Math.max(0, Math.ceil((laserCooldown - timeSinceLastLaser) / 60))

        if (laserSecondsLeft > 0) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)" // Red for cooldown
          ctx.fillText(`👁️ Laser: ${laserSecondsLeft}s`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)" // Reset color
          yOffset += 25
        } else {
          ctx.fillStyle = "rgba(34, 197, 94, 0.9)" // Green for ready
          ctx.fillText(`👁️ Laser: READY`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)" // Reset color
          yOffset += 25
        }
      }

      // Lightning Cooldown UI
      if (currentEffects?.hasLightningEyes && selectedTraits.includes(11)) {
        const timeSinceLastLightning = game.frame - game.lastLightningShot
        const lightningCooldown = currentEffects.lightningCooldown || 600
        const lightningSecondsLeft = Math.max(0, Math.ceil((lightningCooldown - timeSinceLastLightning) / 60))

        if (lightningSecondsLeft > 0) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)" // Red for cooldown
          ctx.fillText(`⚡ Lightning: ${lightningSecondsLeft}s`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)" // Reset color
          yOffset += 25
        } else {
          ctx.fillStyle = "rgba(34, 197, 94, 0.9)" // Green for ready
          ctx.fillText(`⚡ Lightning: READY`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)" // Reset color
          yOffset += 25
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    // Start game loop if gameState is 'playing'
    if (gameState === "playing") {
      resetGame() // Initialize game state and effects
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    // Cleanup function to cancel animation frame when component unmounts or gameState changes
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, highScore, selectedTraits, canvasDimensions]) // Re-run effect if these dependencies change

  const toggleTrait = (traitId: number) => {
    setSelectedTraits((prev) => {
      if (prev.includes(traitId)) {
        return prev.filter((id) => id !== traitId)
      } else if (prev.length < 4) {
        return [...prev, traitId]
      }
      return prev
    })
  }

  // Refactored calculateTraitEffects to accept trait IDs and return ActiveTraitEffects
  const calculateTraitEffects = (traitIds: number[]): ActiveTraitEffects => {
    const effects: ActiveTraitEffects = {
      speedMultiplier: 1.15, // Base speed increased
      accelerationBoost: 0,
      gravityModifier: 0,
      hatSpawnBoost: 0,
      degenMultiplier: 1,
      hasShield: false,
      canDestroyObstacles: false, // Renamed from hasSword for clarity
      swordCooldown: 600, // Default 10 seconds
      durabilityHits: 0,
      hitsAbsorbed: 0,
      hasLaserEyes: false,
      laserCooldown: 600, // Default 10 seconds
      hasLightningEyes: false,
      lightningCooldown: 600, // Default 10 seconds
      hasHolographicDisplay: false,
      hasCompanion: false,
      companionCooldown: 300, // Default 5 seconds
      shieldActive: false, // Shield starts active if hasShield is true
      shieldCooldown: 0,
      showPreview: false, // Not directly used, but kept for potential future use
      hasChainLightning: false, // Redundant with hasLightningEyes, can be removed
      rewardMultiplier: 1,
      gravityReduction: 0,
    }

    traitIds.forEach((id) => {
      switch (id) {
        case 0: // Sword
          effects.canDestroyObstacles = true
          effects.speedMultiplier += 0.1
          effects.swordCooldown = 600 // 10 seconds at 60fps
          break
        case 1: // Gold Teeth
          effects.degenMultiplier = 2
          effects.speedMultiplier += 0.05
          effects.rewardMultiplier = 1.5 // Increased reward multiplier
          break
        case 2: // Aura
          effects.hasShield = true
          effects.shieldActive = true // Shield starts active
          break
        case 3: // Jetpack
          effects.accelerationBoost += 0.3
          effects.gravityReduction += 0.4 // Changed to -40% gravity
          effects.gravityModifier = -0.4 // Changed to -40% gravity
          break
        case 4: // Holographic Display
          effects.showPreview = true
          effects.hasHolographicDisplay = true
          break
        case 5: // Companion Orb
          effects.hasCompanion = true
          effects.hatSpawnBoost += 0.25
          effects.companionCooldown = 300 // 5 seconds at 60fps
          break
        case 6: // Bronze Hands - 2 hits
          effects.durabilityHits += 2
          effects.speedMultiplier -= 0.05
          break
        case 7: // Gold Hands - 3 hits
          effects.durabilityHits += 3
          effects.speedMultiplier -= 0.1
          break
        case 8: // Diamond Hands - 4 hits
          effects.durabilityHits += 4
          effects.speedMultiplier -= 0.15
          break
        case 9: // Shoulder Pads - 4 hits
          effects.hitsAbsorbed += 4
          effects.speedMultiplier += 0.1
          break
        case 10: // Laser Eyes
          effects.hasLaserEyes = true
          effects.laserCooldown = 600 // 10 seconds at 60fps
          break
        case 11: // Lightning Eyes
          effects.hasLightningEyes = true
          effects.lightningCooldown = 600 // 10 seconds at 60fps
          effects.speedMultiplier += 0.2
          break
      }
    })

    return effects
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    if (gameState === "playing") {
      gameRef.current.isPressed = true
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault()
    if (gameState === "playing") {
      gameRef.current.isPressed = false
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    gameRef.current.isPressed = true
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    gameRef.current.isPressed = false
  }

  const startGame = () => {
    setScore(0)
    setDistance(0)
    setGameState("playing")
  }

  const finalScore = score + distance

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-pink-200 to-pink-300 md:p-4">
      <div className="flex w-full max-w-4xl flex-col items-center gap-4">
        {gameState === "menu" && (
          <div className="flex flex-col items-center gap-4 sm:gap-6 rounded-xl bg-white/90 p-4 sm:p-8 shadow-2xl backdrop-blur mx-4">
            <h1 className="text-3xl sm:text-6xl font-bold text-purple-600 text-center">Flying Game</h1>
            <p className="text-sm sm:text-lg text-gray-600 text-center max-w-md">
              Fly through obstacles, collect hats, and rack up $DEGEN tokens!
            </p>
            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setGameState("traits")}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
              >
                Start Game
              </Button>
              {highScore > 0 && (
                <div className="text-center text-sm sm:text-lg text-gray-700">
                  High Score: <span className="font-bold text-purple-600">{highScore} $DEGEN</span>
                </div>
              )}
            </div>
          </div>
        )}

        {gameState === "traits" && (
          <div className="flex flex-col items-center gap-4 sm:gap-6 rounded-xl bg-white/90 p-3 sm:p-8 shadow-2xl backdrop-blur w-full max-w-3xl mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-xl sm:text-4xl font-bold text-purple-600">Select Traits (Max 4)</h2>
            <p className="text-xs sm:text-base text-gray-600 text-center">
              Choose up to 4 traits to customize your flying character
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 w-full">
              {TRAITS.filter((t) => t.unlocked).map((trait) => {
                const isSelected = selectedTraits.includes(trait.id)
                return (
                  <button
                    key={trait.id}
                    onClick={() => toggleTrait(trait.id)}
                    disabled={!trait.unlocked}
                    className={`flex flex-col items-center gap-1 sm:gap-2 rounded-lg border-2 p-2 sm:p-4 transition-all ${
                      isSelected
                        ? "border-purple-600 bg-purple-100 scale-95"
                        : trait.unlocked
                          ? "border-gray-300 bg-white hover:border-purple-400 hover:bg-purple-50"
                          : "border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-xl sm:text-3xl">{trait.icon}</span>
                    <span className="text-xs sm:text-sm font-semibold text-center leading-tight">{trait.name}</span>
                    <div className="text-[10px] sm:text-xs text-gray-600 text-center space-y-0.5">
                      {trait.description.map((desc, i) => (
                        <p key={i} className="leading-tight">
                          {desc}
                        </p>
                      ))}
                    </div>
                    {!trait.unlocked && <span className="text-xs text-gray-400">🔒 Locked</span>}
                  </button>
                )
              })}
            </div>
            <div className="text-xs sm:text-base text-gray-600">Selected: {selectedTraits.length}/4 traits</div>
            <Button
              onClick={() => {
                setGameState("playing")
              }}
              size="lg"
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm sm:text-lg px-4 sm:px-8 py-3 sm:py-6 w-full sm:w-auto"
            >
              Start Flying!
            </Button>
          </div>
        )}

        {gameState === "playing" && (
          <div className="relative w-full h-screen md:h-auto md:flex md:flex-col md:items-center md:gap-4">
            {/* HUD overlay positioned at top on mobile */}
            <div className="absolute top-0 left-0 right-0 z-10 flex flex-wrap justify-center gap-2 rounded-b-lg md:rounded-lg bg-white/90 p-2 sm:p-4 shadow-lg backdrop-blur md:relative md:w-full">
              <div className="text-xs sm:text-lg font-bold text-purple-600">Distance: {distance}m</div>
              <div className="text-xs sm:text-lg font-bold text-green-600">$DEGEN: {score}</div>
              {gameRef.current.traitEffects && (
                <>
                  {(gameRef.current.traitEffects.durabilityHits > 0 ||
                    gameRef.current.traitEffects.hitsAbsorbed > 0) && (
                    <div className="text-xs sm:text-base font-bold text-orange-600">
                      ❤️ Hits: {gameRef.current.hitsRemaining}
                    </div>
                  )}
                  {gameRef.current.traitEffects.hasShield && (
                    <div className="text-xs sm:text-base font-bold text-blue-600">
                      🛡️ {gameRef.current.traitEffects.shieldActive ? "Active" : "Recharging"}
                    </div>
                  )}
                </>
              )}
            </div>
            <canvas
              ref={canvasRef}
              width={canvasDimensions.width}
              height={canvasDimensions.height}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="w-full h-full md:h-auto md:rounded-lg md:shadow-2xl cursor-pointer touch-none"
            />
            {/* Instruction text at bottom on mobile */}
            <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] sm:text-sm text-white md:text-gray-700 drop-shadow-lg md:drop-shadow-none md:relative">
              Touch and hold to fly up, release to fall
            </p>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="flex flex-col items-center gap-3 sm:gap-6 rounded-xl bg-white/90 p-4 sm:p-8 shadow-2xl backdrop-blur mx-4">
            <h2 className="text-2xl sm:text-5xl font-bold text-red-600">Game Over!</h2>
            <div className="flex flex-col gap-2 text-center">
              <p className="text-base sm:text-2xl text-gray-700">
                Distance: <span className="font-bold text-purple-600">{distance}m</span>
              </p>
              <p className="text-base sm:text-2xl text-gray-700">
                $DEGEN Earned: <span className="font-bold text-green-600">{score}</span>
              </p>
              <p className="text-sm sm:text-xl text-gray-700">
                High Score: <span className="font-bold text-purple-600">{highScore} $DEGEN</span>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                onClick={() => {
                  setGameState("playing")
                }}
                size="lg"
                className="bg-purple-600 hover:bg-purple-700 text-white text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
              >
                Play Again
              </Button>
              <Button
                onClick={() => {
                  setGameState("traits")
                }}
                size="lg"
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 text-base sm:text-lg px-6 sm:px-8 py-4 sm:py-6 w-full sm:w-auto"
              >
                Change Traits
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
