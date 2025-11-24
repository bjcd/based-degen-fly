"use client"

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
  hasShield: boolean
  shieldActive: boolean
  shieldCooldown: number
  accelerationBoost: number
  gravityReduction: number
  showPreview: boolean
  hasCompanion: boolean
  companionCooldown: number // Added companion cooldown
  hatSpawnBoost: number // Changed from coinSpawnBoost
  hitsAbsorbed: number
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
  const [gameState, setGameState] = useState<"menu" | "traits" | "playing" | "gameover">("menu")
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState(0)
  const [highScore, setHighScore] = useState(0)
  const [selectedTraits, setSelectedTraits] = useState<number[]>([])

  const gameLoopRef = useRef<number>()
  const gameRef = useRef({
    copter: { x: 100, y: 250, velocity: 0 },
    obstacles: [] as { x: number; topHeight: number; gap: number; isSmall?: boolean }[],
    hats: [] as { x: number; y: number; collected: boolean }[],
    score: 0,
    distance: 0,
    frame: 0,
    isPressed: false,
    traitEffects: null as ActiveTraitEffects | null,
    hitsRemaining: 1,
    lastShieldRegen: 0,
    lastSwordUse: 0, // Added sword cooldown tracking
    lastLaserShot: 0,
    lastLightningShot: 0,
    lastCompanionCollect: 0, // Added companion cooldown tracking
    lasersActive: [] as { x: number; y: number }[], // Track active lasers
    lightningActive: [] as { x: number; y: number }[], // Track active lightning
    companionTarget: null as { x: number; y: number } | null, // Track companion movement
  })

  const calculateTraitEffects = (traitIds: number[]): ActiveTraitEffects => {
    const effects: ActiveTraitEffects = {
      speedMultiplier: 1.05, // Base speed increased by 5%
      degenMultiplier: 1,
      canDestroyObstacles: false,
      swordCooldown: 600, // 10 seconds at 60fps
      durabilityHits: 0, // Start at 0, will be additive
      hasShield: false,
      shieldActive: false,
      shieldCooldown: 0,
      accelerationBoost: 0,
      gravityReduction: 0,
      showPreview: false,
      hasCompanion: false,
      companionCooldown: 300,
      hatSpawnBoost: 0,
      hitsAbsorbed: 0,
      canShootLasers: false,
      laserCooldown: 600, // 10 seconds at 60fps
      hasChainLightning: false,
      lightningCooldown: 600, // 10 seconds at 60fps
      hasLaserEyes: false,
      hasLightningEyes: false,
      rewardMultiplier: 1,
      gravityModifier: 0,
      hasHolographicDisplay: false,
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
          effects.shieldActive = true
          break
        case 3: // Jetpack
          effects.accelerationBoost += 0.3
          effects.gravityReduction += 0.4 // Changed to -40% gravity
          effects.gravityModifier = -0.4 // Changed to -40% gravity
          break
        case 4: // Holographic Display
          effects.showPreview = true
          effects.hasHolographicDisplay = true // Added
          break
        case 5: // Companion Orb
          effects.hasCompanion = true
          effects.hatSpawnBoost += 0.25
          effects.companionCooldown = 300 // 5 seconds at 60fps
          break
        case 6: // Bronze Hands - 2 hits
          effects.durabilityHits += 2 // Fixed to 2 hits
          effects.speedMultiplier -= 0.05
          break
        case 7: // Gold Hands - 3 hits
          effects.durabilityHits += 3 // Fixed to 3 hits
          effects.speedMultiplier -= 0.1 // Changed to -10% speed
          break
        case 8: // Diamond Hands - 4 hits
          effects.durabilityHits += 4 // Fixed to 4 hits
          effects.speedMultiplier -= 0.15 // Changed to -15% speed
          break
        case 9: // Shoulder Pads - 4 hits
          effects.hitsAbsorbed += 4
          effects.speedMultiplier += 0.1
          break
        case 10: // Laser Eyes
          effects.canShootLasers = true
          effects.hasLaserEyes = true // Added
          effects.laserCooldown = 600 // 10 seconds at 60fps
          break
        case 11: // Lightning Eyes
          effects.hasChainLightning = true
          effects.hasLightningEyes = true // Added
          effects.lightningCooldown = 600 // 10 seconds at 60fps
          effects.speedMultiplier += 0.2
          break
      }
    })

    return effects
  }

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
      const baseGravity = 0.5
      const baseThrust = -8
      const baseSpeed = 3

      return {
        GRAVITY: effects ? baseGravity * (1 - effects.gravityModifier) : baseGravity,
        THRUST: effects ? baseThrust * (1 + effects.accelerationBoost) : baseThrust,
        OBSTACLE_SPEED: effects ? baseSpeed * effects.speedMultiplier : baseSpeed,
        COPTER_SIZE: 30,
        OBSTACLE_WIDTH: 60,
        GAP_SIZE: 180,
        CANVAS_HEIGHT: 500,
        CANVAS_WIDTH: 800,
      }
    }

    const resetGame = () => {
      const traitEffects = calculateTraitEffects(selectedTraits)
      const totalHits = traitEffects.durabilityHits + traitEffects.hitsAbsorbed + 1 // +1 for base hit
      gameRef.current = {
        copter: { x: 100, y: 250, velocity: 0 },
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
          const target = gameRef.current.companionTarget
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
            const segmentX = x + 20 + ((lightning.x - x - 20) * i) / segments
            const segmentY = y + 10 + ((lightning.y - y - 10) * i) / segments + (Math.random() - 0.5) * 20
            ctx.lineTo(segmentX, segmentY)
          }
          ctx.lineTo(lightning.x, lightning.y)
          ctx.stroke()

          // Inner glow
          ctx.strokeStyle = "rgba(254, 240, 138, 0.6)"
          ctx.lineWidth = 1
          ctx.stroke()
        })
      }

      if (effects?.gravityModifier < 0 && gameRef.current.isPressed) {
        const flameHeight = 15 + Math.random() * 5
        const flameGradient = ctx.createLinearGradient(x + 15, y + 55, x + 15, y + 55 + flameHeight)
        flameGradient.addColorStop(0, "rgba(251, 146, 60, 0.9)")
        flameGradient.addColorStop(0.5, "rgba(234, 88, 12, 0.7)")
        flameGradient.addColorStop(1, "rgba(234, 88, 12, 0)")

        ctx.fillStyle = flameGradient
        ctx.beginPath()
        ctx.moveTo(x + 10, y + 55)
        ctx.lineTo(x + 15, y + 55 + flameHeight)
        ctx.lineTo(x + 20, y + 55)
        ctx.fill()
      }

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

      obstacles.forEach((obstacle) => {
        // Top obstacle
        ctx.fillStyle = obstacle.isSmall ? "rgba(134, 239, 172, 0.8)" : "rgba(120, 113, 108, 0.9)"
        ctx.fillRect(obstacle.x, 0, 60, obstacle.topHeight)
        ctx.strokeStyle = "rgba(68, 64, 60, 0.5)"
        ctx.lineWidth = 2
        ctx.strokeRect(obstacle.x, 0, 60, obstacle.topHeight)

        // Bottom obstacle
        ctx.fillStyle = obstacle.isSmall ? "rgba(134, 239, 172, 0.8)" : "rgba(120, 113, 108, 0.9)"
        ctx.fillRect(obstacle.x, obstacle.topHeight + obstacle.gap, 60, 500 - obstacle.topHeight - obstacle.gap)
        ctx.strokeStyle = "rgba(68, 64, 60, 0.5)"
        ctx.lineWidth = 2
        ctx.strokeRect(obstacle.x, obstacle.topHeight + obstacle.gap, 60, 500 - obstacle.topHeight - obstacle.gap)
      })

      if (traitEffects?.hasHolographicDisplay && obstacles.length > 0) {
        const nextObstacles = obstacles.filter((obs) => obs.x > 600).slice(0, 2)

        nextObstacles.forEach((obstacle) => {
          const previewX = 650 + (obstacle.x - 600) * 0.3
          const scale = 0.3

          ctx.fillStyle = "rgba(56, 189, 248, 0.3)"
          ctx.fillRect(
            previewX,
            obstacle.topHeight * scale,
            60 * scale,
            (500 - obstacle.topHeight - obstacle.gap) * scale * 0.2,
          )
          ctx.fillRect(
            previewX,
            (obstacle.topHeight + obstacle.gap) * scale,
            60 * scale,
            (500 - obstacle.topHeight - obstacle.gap) * scale,
          )

          ctx.strokeStyle = "rgba(56, 189, 248, 0.6)"
          ctx.lineWidth = 1
          ctx.strokeRect(
            previewX,
            obstacle.topHeight * scale,
            60 * scale,
            (500 - obstacle.topHeight - obstacle.gap) * scale * 0.2,
          )
          ctx.strokeRect(
            previewX,
            (obstacle.topHeight + obstacle.gap) * scale,
            60 * scale,
            (500 - obstacle.topHeight - obstacle.gap) * scale,
          )
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
        ctx.lineTo(laser.targetX, laser.targetY)
        ctx.stroke()

        ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`
        ctx.beginPath()
        ctx.arc(laser.targetX, laser.targetY, 8, 0, Math.PI * 2)
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

    const checkCollision = () => {
      const { copter, obstacles, traitEffects } = gameRef.current
      const { CANVAS_HEIGHT, COPTER_SIZE, OBSTACLE_WIDTH } = getGameConstants()

      if (copter.y < 0 || copter.y + 20 > CANVAS_HEIGHT) {
        return true
      }

      for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i]
        const isInObstacleX = copter.x + COPTER_SIZE > obstacle.x && copter.x < obstacle.x + OBSTACLE_WIDTH

        if (isInObstacleX) {
          const isHittingTop = copter.y < obstacle.topHeight
          const isHittingBottom = copter.y + 20 > obstacle.topHeight + obstacle.gap

          if (isHittingTop || isHittingBottom) {
            // Sword destroys small obstacles
            if (obstacle.isSmall && traitEffects?.canDestroyObstacles && selectedTraits.includes(0)) {
              const timeSinceLastSword = gameRef.current.frame - gameRef.current.lastSwordUse
              if (timeSinceLastSword >= traitEffects.swordCooldown) {
                obstacles.splice(i, 1)
                gameRef.current.lastSwordUse = gameRef.current.frame
                continue
              }
            }

            // Diamond hands can pass through small obstacles without damage or points
            if (obstacle.isSmall && selectedTraits.includes(8)) {
              continue
            }

            // 1. Aura Shield (1 hit)
            if (traitEffects?.hasShield && traitEffects.shieldActive) {
              traitEffects.shieldActive = false
              gameRef.current.lastShieldRegen = gameRef.current.frame
              gameRef.current.hitsRemaining--
              return false // Hit absorbed, continue game
            }

            // 2. Shoulder Pads (4 hits)
            if (traitEffects?.hitsAbsorbed && traitEffects.hitsAbsorbed > 0) {
              traitEffects.hitsAbsorbed--
              gameRef.current.hitsRemaining--
              return false // Hit absorbed, continue game
            }

            // 3. Bronze/Gold/Diamond Hands (2/3/4 hits)
            if (traitEffects?.durabilityHits && traitEffects.durabilityHits > 0) {
              traitEffects.durabilityHits--
              gameRef.current.hitsRemaining--
              return false // Hit absorbed, continue game
            }

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
          gameRef.current.score += hatReward
          hats.splice(i, 1)
          gameRef.current.companionTarget = null
        }
      }

      if (traitEffects?.hasCompanion && hats.length > 0) {
        const timeSinceLastCollect = gameRef.current.frame - gameRef.current.lastCompanionCollect
        const companionCooldown = 5 * 60 // 5 seconds at 60fps

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
            gameRef.current.score += hatReward
            const hatIndex = hats.indexOf(closestHat.hat)
            if (hatIndex > -1) hats.splice(hatIndex, 1)
            gameRef.current.lastCompanionCollect = gameRef.current.frame

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
      const constants = getGameConstants()
      const effects = game.traitEffects

      if (game.isPressed) {
        game.copter.velocity = constants.THRUST
      }
      game.copter.velocity += constants.GRAVITY
      game.copter.y += game.copter.velocity

      game.distance += constants.OBSTACLE_SPEED
      const metersDistance = Math.floor(game.distance / 10)
      setDistance(metersDistance)

      if (effects?.hasShield && !effects.shieldActive && game.frame - game.lastShieldRegen > 600) {
        effects.shieldActive = true
      }

      if (effects?.hasLaserEyes && selectedTraits.includes(10)) {
        const timeSinceLastLaser = game.frame - game.lastLaserShot
        const laserCooldown = 10 * 60 // 10 seconds

        if (timeSinceLastLaser >= laserCooldown && game.obstacles.length > 0) {
          const nextObstacle = game.obstacles.find((obs) => obs.x > game.copter.x)
          if (nextObstacle) {
            game.lasersActive = [{ x: nextObstacle.x + 30, y: nextObstacle.topHeight + nextObstacle.gap / 2 }]
            setTimeout(() => {
              game.lasersActive = []
            }, 200)

            const obstacleIndex = game.obstacles.indexOf(nextObstacle)
            if (obstacleIndex > -1) {
              game.obstacles.splice(obstacleIndex, 1)
            }
            game.lastLaserShot = game.frame
          }
        }
      }

      if (effects?.hasLightningEyes && selectedTraits.includes(11)) {
        const timeSinceLastLightning = game.frame - game.lastLightningShot
        const lightningCooldown = 10 * 60 // 10 seconds

        if (timeSinceLastLightning >= lightningCooldown && game.obstacles.length > 0) {
          const visibleObstacles = game.obstacles.filter((obs) => obs.x > game.copter.x && obs.x < game.copter.x + 800)

          if (visibleObstacles.length > 0) {
            game.lightningActive = visibleObstacles.map((obs) => ({
              x: obs.x + 30,
              y: obs.topHeight + obs.gap / 2,
            }))

            setTimeout(() => {
              game.lightningActive = []
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

      game.lasersActive = game.lasersActive.filter((laser) => game.frame - laser.frame <= 20)
      game.lightningActive = game.lightningActive.filter((lightning) => game.frame - lightning.frame <= 30)

      // Generate obstacles
      if (game.frame % 150 === 0) {
        const topHeight = Math.random() * (constants.CANVAS_HEIGHT - constants.GAP_SIZE - 100) + 50
        const isSmall = Math.random() < 0.3
        game.obstacles.push({
          x: constants.CANVAS_WIDTH,
          topHeight,
          gap: constants.GAP_SIZE,
          isSmall,
        })
      }

      const hatSpawnRate = effects?.hatSpawnBoost ? 200 - 200 * effects.hatSpawnBoost : 200
      if (game.frame % Math.floor(hatSpawnRate) === 50) {
        const hatY = Math.random() * (constants.CANVAS_HEIGHT - 100) + 50
        game.hats.push({
          x: constants.CANVAS_WIDTH,
          y: hatY,
          collected: false,
        })
      }

      game.obstacles = game.obstacles.filter((obstacle) => {
        obstacle.x -= constants.OBSTACLE_SPEED
        return obstacle.x > -constants.OBSTACLE_WIDTH
      })

      game.hats = game.hats.filter((hat) => {
        hat.x -= constants.OBSTACLE_SPEED
        return hat.x > -30
      })

      checkHatCollection()

      if (checkCollision()) {
        setGameState("gameover")
        const finalScore = game.score + metersDistance
        if (finalScore > highScore) {
          setHighScore(finalScore)
          localStorage.setItem("copterHighScore", finalScore.toString())
        }
        return
      }

      game.frame++

      drawBackground()
      drawObstacles()
      drawHats()
      drawCopter()

      ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
      ctx.font = "bold 20px monospace"
      ctx.fillText(`Distance: ${metersDistance}m`, 20, 35)
      ctx.fillText(`$DEGEN: ${game.score}`, 20, 60)

      let yOffset = 85

      if (effects && effects.durabilityHits >= 1) {
        ctx.fillText(`Hits: ${game.hitsRemaining}`, 20, yOffset)
        yOffset += 25
      }

      if (effects?.hitsAbsorbed && selectedTraits.includes(9)) {
        ctx.fillText(`Shoulder: ${effects.hitsAbsorbed}/4`, 20, yOffset)
        yOffset += 25
      }

      if (effects?.hasShield) {
        const shieldStatus = effects.shieldActive ? "READY" : "RECHARGING"
        ctx.fillStyle = effects.shieldActive ? "rgba(56, 189, 248, 0.9)" : "rgba(239, 68, 68, 0.9)"
        ctx.fillText(`Shield: ${shieldStatus}`, 20, yOffset)
        ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
        yOffset += 25
      }

      if (effects?.canDestroyObstacles && selectedTraits.includes(0)) {
        const timeSinceLastSword = game.frame - game.lastSwordUse
        const swordCooldown = effects.swordCooldown
        const swordSecondsLeft = Math.max(0, Math.ceil((swordCooldown - timeSinceLastSword) / 60))

        if (swordSecondsLeft > 0) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
          ctx.fillText(`Sword: ${swordSecondsLeft}s`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
          yOffset += 25
        } else {
          ctx.fillStyle = "rgba(34, 197, 94, 0.9)"
          ctx.fillText(`Sword: READY`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
          yOffset += 25
        }
      }

      if (effects?.hasLaserEyes && selectedTraits.includes(10)) {
        const timeSinceLastLaser = game.frame - game.lastLaserShot
        const laserCooldown = 10 * 60
        const laserSecondsLeft = Math.max(0, Math.ceil((laserCooldown - timeSinceLastLaser) / 60))

        if (laserSecondsLeft > 0) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
          ctx.fillText(`Laser: ${laserSecondsLeft}s`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
          yOffset += 25
        } else {
          ctx.fillStyle = "rgba(34, 197, 94, 0.9)"
          ctx.fillText(`Laser: READY`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
          yOffset += 25
        }
      }

      if (effects?.hasLightningEyes && selectedTraits.includes(11)) {
        const timeSinceLastLightning = game.frame - game.lastLightningShot
        const lightningCooldown = 10 * 60
        const lightningSecondsLeft = Math.max(0, Math.ceil((lightningCooldown - timeSinceLastLightning) / 60))

        if (lightningSecondsLeft > 0) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
          ctx.fillText(`Lightning: ${lightningSecondsLeft}s`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
          yOffset += 25
        } else {
          ctx.fillStyle = "rgba(34, 197, 94, 0.9)"
          ctx.fillText(`Lightning: READY`, 20, yOffset)
          ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
          yOffset += 25
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    if (gameState === "playing") {
      resetGame()
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, highScore, selectedTraits])

  const handlePointerDown = () => {
    if (gameState === "playing") {
      gameRef.current.isPressed = true
    }
  }

  const handlePointerUp = () => {
    if (gameState === "playing") {
      gameRef.current.isPressed = false
    }
  }

  const startGame = () => {
    setScore(0)
    setDistance(0)
    setGameState("playing")
  }

  const finalScore = score + distance

  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-900 p-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="rounded-lg border-4 border-purple-600 shadow-2xl"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />

        {gameState === "menu" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-stone-900/95 backdrop-blur-sm">
            <h1 className="mb-2 font-mono text-6xl font-bold text-purple-500">COPTER</h1>
            <p className="mb-8 font-mono text-xl text-pink-400">Funky Cave Runner</p>
            <div className="mb-8 text-center">
              <p className="mb-4 font-mono text-lg text-stone-300">🚁 Touch and hold to fly up</p>
              <p className="mb-4 font-mono text-lg text-stone-300">⬇️ Release to fall down</p>
              <p className="mb-4 font-mono text-lg text-yellow-400">🎩 Collect hats for bonus points!</p>
              <p className="font-mono text-lg text-stone-300">🎯 Avoid obstacles and go far!</p>
            </div>
            {highScore > 0 && <p className="mb-6 font-mono text-xl text-amber-400">High Score: {highScore}</p>}
            <Button
              size="lg"
              onClick={() => setGameState("traits")}
              className="bg-purple-600 font-mono text-lg hover:bg-purple-700"
            >
              SELECT TRAITS
            </Button>
          </div>
        )}

        {gameState === "traits" && (
          <div className="absolute inset-0 overflow-y-auto rounded-lg bg-stone-900/95 p-6 backdrop-blur-sm">
            <h2 className="mb-2 text-center font-mono text-3xl font-bold text-purple-500">SELECT TRAITS</h2>
            <p className="mb-6 text-center font-mono text-sm text-stone-400">
              Choose up to 4 traits ({selectedTraits.length}/4 selected)
            </p>
            <div className="mb-6 grid grid-cols-2 gap-3">
              {TRAITS.filter((t) => t.unlocked).map((trait) => {
                const isSelected = selectedTraits.includes(trait.id)
                return (
                  <button
                    key={trait.id}
                    onClick={() => toggleTrait(trait.id)}
                    className={`rounded-lg border-2 p-3 text-left transition-all ${
                      isSelected
                        ? "border-purple-500 bg-purple-900/50"
                        : "border-stone-700 bg-stone-800/50 hover:border-stone-500"
                    }`}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-2xl">{trait.icon}</span>
                      <span className="font-mono text-sm font-bold text-purple-300">{trait.name}</span>
                    </div>
                    {trait.description.map((desc, i) => (
                      <p key={i} className="font-mono text-xs text-stone-400">
                        • {desc}
                      </p>
                    ))}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-center gap-4">
              <Button onClick={() => setGameState("menu")} variant="outline" className="font-mono">
                BACK
              </Button>
              <Button onClick={startGame} className="bg-purple-600 font-mono hover:bg-purple-700">
                START GAME
              </Button>
            </div>
          </div>
        )}

        {gameState === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg bg-stone-900/95 backdrop-blur-sm">
            <h2 className="mb-4 font-mono text-5xl font-bold text-red-500">GAME OVER</h2>
            <p className="mb-2 font-mono text-xl text-stone-200">Distance: {distance}m</p>
            <p className="mb-2 font-mono text-xl text-yellow-400">Hat Bonus: {score} pts</p>
            <p className="mb-4 font-mono text-2xl text-purple-400">Total: {finalScore}</p>
            <p className="mb-8 font-mono text-xl text-amber-400">Best: {highScore}</p>
            <div className="flex gap-4">
              <Button onClick={() => setGameState("traits")} variant="outline" className="font-mono">
                CHANGE TRAITS
              </Button>
              <Button size="lg" onClick={startGame} className="bg-purple-600 font-mono text-lg hover:bg-purple-700">
                TRY AGAIN
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
