import type { GameRef, GameConstants, ActiveTraitEffects } from "./types"

// Preload character image
let characterImage: HTMLImageElement | null = null
let characterImageLoaded = false
const preloadCharacterImage = () => {
  if (!characterImage) {
    characterImage = new Image()
    characterImage.onload = () => {
      characterImageLoaded = true
      console.log("✅ Character image loaded")
    }
    characterImage.onerror = () => {
      console.warn("❌ Character image failed to load")
      characterImageLoaded = false
    }
    characterImage.src = "/images/BD-Default.png"
  }
  return characterImage
}

// Preload hat image
let hatImage: HTMLImageElement | null = null
let hatImageLoaded = false
const preloadHatImage = () => {
  if (!hatImage) {
    hatImage = new Image()
    hatImage.onload = () => {
      hatImageLoaded = true
      console.log("✅ Hat image loaded")
    }
    hatImage.onerror = () => {
      console.warn("❌ Hat image failed to load")
      hatImageLoaded = false
    }
    hatImage.src = "/images/collect-hat.png"
  }
  return hatImage
}

// Preload images immediately when module loads
if (typeof window !== "undefined") {
  preloadCharacterImage()
  preloadHatImage()
}

export function drawBackground(ctx: CanvasRenderingContext2D, constants: GameConstants): void {
  const { CANVAS_HEIGHT, CANVAS_WIDTH } = constants

  // Light purple gradient: purple-600 via purple-400 to purple-600
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT)
  gradient.addColorStop(0, "#9333ea") // purple-600
  gradient.addColorStop(0.5, "#a855f7") // purple-500
  gradient.addColorStop(1, "#9333ea") // purple-600
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
  ctx.lineWidth = 1
  for (let i = 0; i < CANVAS_HEIGHT; i += 50) {
    ctx.beginPath()
    ctx.moveTo(0, i)
    ctx.lineTo(CANVAS_WIDTH, i)
    ctx.stroke()
  }
}

export function drawCopter(
  ctx: CanvasRenderingContext2D,
  game: GameRef,
  constants: GameConstants,
): void {
  const { x, y } = game.copter
  const effects = game.traitEffects
  const { COPTER_SIZE } = constants

  // Character image with fallback
  const characterImg = preloadCharacterImage()
  
  // Draw character (fallback to rectangle if image not loaded)
  // Maintain aspect ratio to prevent distortion
  // Check if image is loaded and ready (more lenient check)
  if (characterImg && characterImg.complete && characterImg.naturalWidth > 0 && characterImg.naturalHeight > 0) {
    const aspectRatio = characterImg.naturalWidth / characterImg.naturalHeight
    let drawWidth = COPTER_SIZE
    let drawHeight = COPTER_SIZE
    
    // Maintain aspect ratio
    if (aspectRatio > 1) {
      // Image is wider than tall
      drawHeight = COPTER_SIZE / aspectRatio
    } else {
      // Image is taller than wide
      drawWidth = COPTER_SIZE * aspectRatio
    }
    
    const offsetX = (COPTER_SIZE - drawWidth) / 2
    const offsetY = (COPTER_SIZE - drawHeight) / 2
    ctx.drawImage(characterImg, x + offsetX, y + offsetY, drawWidth, drawHeight)
  } else {
    // Fallback: draw a simple character shape
    ctx.fillStyle = "#8b5cf6"
    ctx.fillRect(x, y, COPTER_SIZE, COPTER_SIZE)
    ctx.fillStyle = "#a78bfa"
    ctx.beginPath()
    ctx.arc(x + COPTER_SIZE / 2, y + COPTER_SIZE / 2, COPTER_SIZE / 2, 0, Math.PI * 2)
    ctx.fill()
  }

  // Aura Shield (adjusted for larger character)
  if (effects?.hasShield && effects.shieldActive) {
    const centerX = x + COPTER_SIZE / 2
    const centerY = y + COPTER_SIZE / 2
    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(centerX, centerY, COPTER_SIZE / 2 + 20, 0, Math.PI * 2)
    ctx.stroke()

    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, COPTER_SIZE / 2 + 25, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Companion Orb (adjusted for larger character)
  if (effects?.hasCompanion) {
    const companionX = x + COPTER_SIZE + 20 + Math.sin(game.frame * 0.05) * 10
    const companionY = y + Math.cos(game.frame * 0.08) * 15

    const gradient = ctx.createRadialGradient(companionX, companionY, 0, companionX, companionY, 12)
    gradient.addColorStop(0, "rgba(168, 85, 247, 0.8)")
    gradient.addColorStop(0.5, "rgba(168, 85, 247, 0.4)")
    gradient.addColorStop(1, "rgba(168, 85, 247, 0)")
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(companionX, companionY, 12, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = "rgba(196, 181, 253, 1)"
    ctx.beginPath()
    ctx.arc(companionX, companionY, 6, 0, Math.PI * 2)
    ctx.fill()

    if (game.companionTarget) {
      const target = game.companionTarget
      const dx = target.x - companionX
      const dy = target.y - companionY
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      // Animated pulsing effect
      const pulsePhase = (game.frame * 0.2) % (Math.PI * 2)
      const pulseIntensity = 0.7 + Math.sin(pulsePhase) * 0.3
      
      // Draw glowing outer line (shadow/glow effect)
      ctx.strokeStyle = `rgba(255, 215, 0, ${0.6 * pulseIntensity})` // Bright gold
      ctx.lineWidth = 8
      ctx.shadowBlur = 15
      ctx.shadowColor = "rgba(255, 215, 0, 0.8)"
      ctx.beginPath()
      ctx.moveTo(companionX, companionY)
      ctx.lineTo(target.x, target.y)
      ctx.stroke()
      
      // Draw main grappling hook line (thick and bright)
      ctx.strokeStyle = `rgba(255, 165, 0, ${0.9 * pulseIntensity})` // Orange
      ctx.lineWidth = 5
      ctx.shadowBlur = 10
      ctx.shadowColor = "rgba(255, 165, 0, 0.6)"
      ctx.beginPath()
      ctx.moveTo(companionX, companionY)
      ctx.lineTo(target.x, target.y)
      ctx.stroke()
      
      // Draw inner bright line
      ctx.strokeStyle = `rgba(255, 255, 255, ${pulseIntensity})` // White
      ctx.lineWidth = 2
      ctx.shadowBlur = 5
      ctx.shadowColor = "rgba(255, 255, 255, 0.5)"
      ctx.beginPath()
      ctx.moveTo(companionX, companionY)
      ctx.lineTo(target.x, target.y)
      ctx.stroke()
      
      // Reset shadow
      ctx.shadowBlur = 0
      ctx.shadowColor = "transparent"
      
      // Draw grappling hook at the end (near the hat)
      const hookSize = 15
      const hookX = target.x
      const hookY = target.y
      const angle = Math.atan2(dy, dx)
      
      // Draw hook shape (curved hook pointing back toward companion)
      ctx.strokeStyle = `rgba(255, 215, 0, ${pulseIntensity})`
      ctx.fillStyle = `rgba(255, 165, 0, ${0.8 * pulseIntensity})`
      ctx.lineWidth = 4
      ctx.shadowBlur = 10
      ctx.shadowColor = "rgba(255, 215, 0, 0.8)"
      
      ctx.beginPath()
      // Main hook body
      ctx.arc(hookX, hookY, hookSize, angle - Math.PI / 2, angle + Math.PI / 2, false)
      // Hook tip pointing back
      ctx.lineTo(
        hookX - Math.cos(angle) * hookSize * 1.5,
        hookY - Math.sin(angle) * hookSize * 1.5
      )
      ctx.stroke()
      ctx.fill()
      
      // Draw hook tip highlight
      ctx.fillStyle = `rgba(255, 255, 255, ${pulseIntensity})`
      ctx.beginPath()
      ctx.arc(
        hookX - Math.cos(angle) * hookSize * 0.8,
        hookY - Math.sin(angle) * hookSize * 0.8,
        4,
        0,
        Math.PI * 2
      )
      ctx.fill()
      
      // Reset shadow
      ctx.shadowBlur = 0
      ctx.shadowColor = "transparent"
      
      // Draw connection point on companion orb (pulsing circle)
      ctx.fillStyle = `rgba(255, 215, 0, ${0.8 * pulseIntensity})`
      ctx.shadowBlur = 8
      ctx.shadowColor = "rgba(255, 215, 0, 0.6)"
      ctx.beginPath()
      ctx.arc(companionX, companionY, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
    }
  }

  // Laser Eyes
  if (effects?.hasLaserEyes && game.lasersActive.length > 0) {
    game.lasersActive.forEach((laser) => {
      const laserGradient = ctx.createLinearGradient(x + COPTER_SIZE / 2, y + COPTER_SIZE / 4, laser.x, laser.y)
      laserGradient.addColorStop(0, "rgba(239, 68, 68, 0.9)")
      laserGradient.addColorStop(0.5, "rgba(239, 68, 68, 0.6)")
      laserGradient.addColorStop(1, "rgba(239, 68, 68, 0.2)")

      ctx.strokeStyle = laserGradient
      ctx.lineWidth = 4
          ctx.beginPath()
          ctx.moveTo(x + COPTER_SIZE / 2, y + COPTER_SIZE / 4)
          ctx.lineTo(laser.x, laser.y)
          ctx.stroke()

          ctx.strokeStyle = "rgba(254, 202, 202, 0.8)"
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(x + COPTER_SIZE / 2, y + COPTER_SIZE / 4)
          ctx.lineTo(laser.x, laser.y)
          ctx.stroke()
    })
  }

  // Lightning Eyes
  if (effects?.hasLightningEyes && game.lightningActive.length > 0) {
    game.lightningActive.forEach((lightning) => {
          ctx.strokeStyle = "rgba(250, 204, 21, 0.9)"
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.moveTo(x + COPTER_SIZE / 2, y + COPTER_SIZE / 4)

          const segments = 8
          for (let i = 1; i <= segments; i++) {
            const segmentX = x + COPTER_SIZE / 2 + ((lightning.points[0].x - x - COPTER_SIZE / 2) * i) / segments
            const segmentY = y + COPTER_SIZE / 4 + ((lightning.points[0].y - y - COPTER_SIZE / 4) * i) / segments + (Math.random() - 0.5) * 20
            ctx.lineTo(segmentX, segmentY)
          }
          ctx.lineTo(lightning.points[0].x, lightning.points[0].y)
          ctx.stroke()

      ctx.strokeStyle = "rgba(254, 240, 138, 0.6)"
      ctx.lineWidth = 1
      ctx.stroke()
    })
  }

  // Jetpack flame
  if (effects?.gravityModifier < 0 && game.isPressed) {
      const flameHeight = 20 + Math.random() * 10
      const flameGradient = ctx.createLinearGradient(x + COPTER_SIZE / 2, y + COPTER_SIZE, x + COPTER_SIZE / 2, y + COPTER_SIZE + flameHeight)
    flameGradient.addColorStop(0, "rgba(251, 146, 60, 0.9)")
    flameGradient.addColorStop(0.5, "rgba(234, 88, 12, 0.7)")
    flameGradient.addColorStop(1, "rgba(234, 88, 12, 0)")

      ctx.fillStyle = flameGradient
      ctx.beginPath()
      ctx.moveTo(x + COPTER_SIZE / 3, y + COPTER_SIZE)
      ctx.lineTo(x + COPTER_SIZE / 2, y + COPTER_SIZE + flameHeight)
      ctx.lineTo(x + (COPTER_SIZE * 2) / 3, y + COPTER_SIZE)
      ctx.fill()
  }

  // Sword indicator
  if (effects?.canDestroyObstacles) {
    const timeSinceLastSword = game.frame - game.lastSwordUse
    const swordReady = timeSinceLastSword >= (effects.swordCooldown || 600)
    if (swordReady) {
      ctx.fillStyle = "rgba(147, 197, 253, 0.8)"
      ctx.font = "bold 20px monospace"
      ctx.fillText("🗡️", x + COPTER_SIZE + 5, y - 5)
    }
  }
}

export function drawHats(ctx: CanvasRenderingContext2D, hats: Array<{ x: number; y: number; collected: boolean }>): void {
  const hatImg = preloadHatImage()
  const hatSize = 50 // Size of hat in game (increased for visibility)

  hats.forEach((hat) => {
    if (hat.collected) return

    // Draw hat image, centered at hat.x, hat.y
    // Check if image is loaded and ready (more robust check)
    if (hatImg && hatImg.complete && hatImg.naturalWidth > 0 && hatImg.naturalHeight > 0) {
      // Maintain aspect ratio
      const aspectRatio = hatImg.naturalWidth / hatImg.naturalHeight
      let drawWidth = hatSize
      let drawHeight = hatSize

      if (aspectRatio > 1) {
        // Image is wider than tall
        drawHeight = hatSize / aspectRatio
      } else {
        // Image is taller than wide
        drawWidth = hatSize * aspectRatio
      }

      const offsetX = (hatSize - drawWidth) / 2
      const offsetY = (hatSize - drawHeight) / 2
      
      // Draw the hat image
      ctx.drawImage(hatImg, hat.x - hatSize / 2 + offsetX, hat.y - hatSize / 2 + offsetY, drawWidth, drawHeight)
    } else {
      // Fallback: draw a simple hat shape if image not loaded yet
      // Make it more visible with bright colors
      ctx.fillStyle = "#fbbf24" // Bright yellow for visibility
      ctx.beginPath()
      ctx.ellipse(hat.x, hat.y + 15, 15, 5, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = "#7c3aed" // Purple
      ctx.fillRect(hat.x - 15, hat.y, 30, 15)
      
      // Add a glow effect to make it more visible
      ctx.strokeStyle = "#fbbf24"
      ctx.lineWidth = 3
      ctx.strokeRect(hat.x - 15, hat.y, 30, 15)
    }
  })
}

export function drawObstacles(
  ctx: CanvasRenderingContext2D,
  obstacles: Array<{ x: number; topHeight: number; gap: number; isSmall: boolean }>,
  constants: GameConstants,
  traitEffects: ActiveTraitEffects | null,
): void {
  const { CANVAS_HEIGHT, CANVAS_WIDTH } = constants

  obstacles.forEach((obstacle) => {
    if (obstacle.isSmall) {
      ctx.fillStyle = "rgba(120, 113, 108, 0.9)"
      const wallHeight = 80
      const wallY = obstacle.topHeight + (obstacle.gap - wallHeight) / 2
      ctx.fillRect(obstacle.x, wallY, 60, wallHeight)
      ctx.strokeStyle = "rgba(68, 64, 60, 0.5)"
      ctx.lineWidth = 2
      ctx.strokeRect(obstacle.x, wallY, 60, wallHeight)
    } else {
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

  // Holographic Display preview removed - now handled in drawHolographicMap
}

export function drawLasers(
  ctx: CanvasRenderingContext2D,
  copter: { x: number; y: number },
  lasersActive: Array<{ x: number; y: number; frame: number }>,
  currentFrame: number,
  constants: GameConstants,
): void {
  const { COPTER_SIZE } = constants

  lasersActive.forEach((laser) => {
    const age = currentFrame - laser.frame
    if (age > 20) return

    const alpha = 1 - age / 20
    ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`
    ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(copter.x + COPTER_SIZE, copter.y + COPTER_SIZE / 4)
        ctx.lineTo(laser.x, laser.y)
        ctx.stroke()

    ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`
    ctx.beginPath()
    ctx.arc(laser.x, laser.y, 8, 0, Math.PI * 2)
    ctx.fill()
  })
}

export function drawLightning(
  ctx: CanvasRenderingContext2D,
  lightningActive: Array<{ points: Array<{ x: number; y: number }>; frame: number }>,
  currentFrame: number,
): void {
  lightningActive.forEach((lightning) => {
    const age = currentFrame - lightning.frame
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

export function drawHolographicMap(
  ctx: CanvasRenderingContext2D,
  copter: { x: number; y: number },
  obstacles: Array<{ x: number; topHeight: number; gap: number; isSmall: boolean }>,
  constants: GameConstants,
): void {
  const { CANVAS_HEIGHT, CANVAS_WIDTH, COPTER_SIZE, OBSTACLE_WIDTH } = constants

  // Mini-map dimensions
  const mapHeight = 120
  const mapWidth = CANVAS_WIDTH * 0.9
  const mapX = (CANVAS_WIDTH - mapWidth) / 2
  const mapY = CANVAS_HEIGHT - mapHeight - 20
  const mapPadding = 10

  // Draw transparent background with border
  ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
  ctx.fillRect(mapX, mapY, mapWidth, mapHeight)

  // Draw border with glow effect
  ctx.strokeStyle = "rgba(56, 189, 248, 0.8)"
  ctx.lineWidth = 3
  ctx.strokeRect(mapX, mapY, mapWidth, mapHeight)

  // Inner glow
  ctx.strokeStyle = "rgba(147, 197, 253, 0.4)"
  ctx.lineWidth = 1
  ctx.strokeRect(mapX + 2, mapY + 2, mapWidth - 4, mapHeight - 4)

  // Calculate visible area (current position + next 3 obstacles ahead)
  // Get obstacles that are ahead of or near the copter
  const visibleObstacles = obstacles
    .filter((obs) => obs.x >= copter.x - 200 && obs.x <= copter.x + CANVAS_WIDTH * 3)
    .sort((a, b) => a.x - b.x) // Sort by x position
    .slice(0, 4) // Current + next 3

  if (visibleObstacles.length === 0) {
    // No obstacles to show, but still draw the map frame
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
    ctx.font = "bold 12px monospace"
    ctx.fillText("📡 Holographic Map - No obstacles ahead", mapX + 10, mapY + 20)
    return
  }

  // Find min/max x positions for scaling
  const minX = Math.min(copter.x - 200, ...visibleObstacles.map((o) => o.x))
  const maxX = Math.max(
    copter.x + CANVAS_WIDTH * 3,
    ...visibleObstacles.map((o) => o.x + OBSTACLE_WIDTH),
  )
  const xRange = Math.max(maxX - minX, CANVAS_WIDTH) // Ensure minimum range

  // Scale factor for x-axis
  const scaleX = (mapWidth - mapPadding * 2) / xRange
  const scaleY = (mapHeight - mapPadding * 2) / CANVAS_HEIGHT

  // Draw obstacles in mini-map
  visibleObstacles.forEach((obstacle) => {
    const mapObstacleX = mapX + mapPadding + (obstacle.x - minX) * scaleX
    const mapObstacleWidth = OBSTACLE_WIDTH * scaleX

    if (obstacle.isSmall) {
      // Small obstacle - middle wall
      const wallHeight = 80
      const wallY = obstacle.topHeight + (obstacle.gap - wallHeight) / 2
      const mapWallY = mapY + mapPadding + wallY * scaleY
      const mapWallHeight = wallHeight * scaleY

      ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
      ctx.fillRect(mapObstacleX, mapWallY, mapObstacleWidth, mapWallHeight)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
      ctx.lineWidth = 2
      ctx.strokeRect(mapObstacleX, mapWallY, mapObstacleWidth, mapWallHeight)
    } else {
      // Normal obstacle - top and bottom walls
      const mapTopHeight = (obstacle.topHeight * scaleY)
      const mapGap = obstacle.gap * scaleY
      const mapBottomHeight = (CANVAS_HEIGHT - obstacle.topHeight - obstacle.gap) * scaleY

      // Top wall
      ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
      ctx.fillRect(mapObstacleX, mapY + mapPadding, mapObstacleWidth, mapTopHeight)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
      ctx.lineWidth = 2
      ctx.strokeRect(mapObstacleX, mapY + mapPadding, mapObstacleWidth, mapTopHeight)

      // Bottom wall
      ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
      ctx.fillRect(
        mapObstacleX,
        mapY + mapPadding + mapTopHeight + mapGap,
        mapObstacleWidth,
        mapBottomHeight,
      )
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
      ctx.lineWidth = 2
      ctx.strokeRect(
        mapObstacleX,
        mapY + mapPadding + mapTopHeight + mapGap,
        mapObstacleWidth,
        mapBottomHeight,
      )
    }
  })

  // Draw copter position indicator
  const mapCopterX = mapX + mapPadding + (copter.x - minX) * scaleX
  const mapCopterY = mapY + mapPadding + copter.y * scaleY
  const mapCopterSize = COPTER_SIZE * scaleY

  // Copter indicator with glow
  ctx.fillStyle = "rgba(34, 197, 94, 0.9)"
  ctx.beginPath()
  ctx.arc(mapCopterX + mapCopterSize / 2, mapCopterY + mapCopterSize / 2, mapCopterSize / 2, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = "rgba(255, 255, 255, 1)"
  ctx.lineWidth = 2
  ctx.stroke()

  // Draw label
  ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
  ctx.font = "bold 12px monospace"
  ctx.fillText("📡 Holographic Map", mapX + 10, mapY + 20)
}

// Preload NFT image
let nftPlayerImage: HTMLImageElement | null = null
let nftPlayerImageUrl: string | null = null
let nftPlayerImageLoaded = false

export function setNFTPlayerImage(url: string | null) {
  if (url === nftPlayerImageUrl) return // Already set
  
  nftPlayerImageUrl = url
  nftPlayerImageLoaded = false
  
  if (url) {
    // Create new image and load it
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      nftPlayerImageLoaded = true
      nftPlayerImage = img
      console.log("✅ NFT player image loaded:", url)
    }
    img.onerror = (error) => {
      console.warn("❌ NFT player image failed to load:", url, error)
      nftPlayerImageLoaded = false
      nftPlayerImage = null
    }
    img.src = url
  } else {
    nftPlayerImage = null
    nftPlayerImageLoaded = false
  }
}

export function drawHUD(
  ctx: CanvasRenderingContext2D,
  game: GameRef,
  distance: number,
  selectedTraits: number[],
  constants?: GameConstants,
): void {
  const metersDistance = Math.floor(distance / 10)
  const effects = game.traitEffects
  const CANVAS_HEIGHT = constants?.CANVAS_HEIGHT || 800

  // Distance and Score
  ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
  ctx.font = "bold 20px monospace"
  ctx.fillText(`Distance: ${metersDistance}m`, 20, 35)
  ctx.fillText(`$DEGEN: ${game.score}`, 20, 60)

  // Player NFT Image in bottom left (or default pfp if no NFT)
  const playerImageSize = 80
  const playerImageX = 20
  const playerImageY = CANVAS_HEIGHT - playerImageSize - 20
  
  // Check if NFT image is loaded and ready (more robust check)
  if (nftPlayerImage && nftPlayerImage.complete && nftPlayerImage.naturalWidth > 0 && nftPlayerImage.naturalHeight > 0) {
    // Draw rounded circle background
    ctx.save()
    ctx.beginPath()
    ctx.arc(
      playerImageX + playerImageSize / 2,
      playerImageY + playerImageSize / 2,
      playerImageSize / 2,
      0,
      Math.PI * 2
    )
    ctx.clip()
    
    // Draw image
    ctx.drawImage(
      nftPlayerImage,
      playerImageX,
      playerImageY,
      playerImageSize,
      playerImageSize
    )
    ctx.restore()
    
    // Draw border
    ctx.strokeStyle = "rgba(168, 85, 247, 0.8)"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(
      playerImageX + playerImageSize / 2,
      playerImageY + playerImageSize / 2,
      playerImageSize / 2,
      0,
      Math.PI * 2
    )
    ctx.stroke()
    
    // Draw "Player" label
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    ctx.font = "bold 14px monospace"
    ctx.fillText("Player", playerImageX, playerImageY - 5)
  } else {
    // Fallback: show "Player" text while image loads
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    ctx.font = "bold 14px monospace"
    ctx.fillText("Player", playerImageX, playerImageY + playerImageSize / 2)
  }

  // Trait-related UI
  let yOffset = 85

  // Hits Remaining
  if (effects && (effects.durabilityHits > 0 || effects.hitsAbsorbed > 0)) {
    ctx.fillStyle = "rgba(249, 115, 22, 0.9)"
    ctx.fillText(`❤️ Hits: ${game.hitsRemaining}`, 20, yOffset)
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    yOffset += 25
  }

  // Shield UI
  if (effects?.hasShield) {
    const shieldStatus = effects.shieldActive ? "ACTIVE" : "RECHARGING"
    const shieldColor = effects.shieldActive ? "rgba(56, 189, 248, 0.9)" : "rgba(239, 68, 68, 0.9)"
    ctx.fillStyle = shieldColor
    ctx.fillText(`🛡️ Shield: ${shieldStatus}`, 20, yOffset)
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    yOffset += 25
  }

  // Sword Cooldown
  if (effects?.canDestroyObstacles && selectedTraits.includes(0)) {
    const timeSinceLastSword = game.frame - game.lastSwordUse
    const swordCooldown = effects.swordCooldown || 600
    const swordSecondsLeft = Math.max(0, Math.ceil((swordCooldown - timeSinceLastSword) / 60))

    if (swordSecondsLeft > 0) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
      ctx.fillText(`🗡️ Sword: ${swordSecondsLeft}s`, 20, yOffset)
      ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    } else {
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)"
      ctx.fillText(`🗡️ Sword: READY`, 20, yOffset)
      ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    }
    yOffset += 25
  }

  // Laser Cooldown
  if (effects?.hasLaserEyes && selectedTraits.includes(10)) {
    const timeSinceLastLaser = game.frame - game.lastLaserShot
    const laserCooldown = effects.laserCooldown || 600
    const laserSecondsLeft = Math.max(0, Math.ceil((laserCooldown - timeSinceLastLaser) / 60))

    if (laserSecondsLeft > 0) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
      ctx.fillText(`👁️ Laser: ${laserSecondsLeft}s`, 20, yOffset)
      ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    } else {
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)"
      ctx.fillText(`👁️ Laser: READY`, 20, yOffset)
      ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    }
    yOffset += 25
  }

  // Lightning Cooldown
  if (effects?.hasLightningEyes && selectedTraits.includes(11)) {
    const timeSinceLastLightning = game.frame - game.lastLightningShot
    const lightningCooldown = effects.lightningCooldown || 600
    const lightningSecondsLeft = Math.max(0, Math.ceil((lightningCooldown - timeSinceLastLightning) / 60))

    if (lightningSecondsLeft > 0) {
      ctx.fillStyle = "rgba(239, 68, 68, 0.9)"
      ctx.fillText(`⚡ Lightning: ${lightningSecondsLeft}s`, 20, yOffset)
      ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    } else {
      ctx.fillStyle = "rgba(34, 197, 94, 0.9)"
      ctx.fillText(`⚡ Lightning: READY`, 20, yOffset)
      ctx.fillStyle = "rgba(30, 41, 59, 0.9)"
    }
    yOffset += 25
  }
}

