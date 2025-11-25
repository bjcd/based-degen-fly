"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { Menu } from "@/components/game/Menu"
import { TraitSelector } from "@/components/game/TraitSelector"
import { GameOver } from "@/components/game/GameOver"
import { GameCanvas } from "@/components/game/GameCanvas"
import type { GameState } from "@/lib/game/types"
import { updateGameState } from "@/lib/game/engine"
import { calculateTraitEffects, TRAITS } from "@/lib/game/traits"
import { useNFTTraitsOptimized as useNFTTraits } from "@/hooks/useNFTTraits-optimized"
import { useAccount } from "wagmi"
import {
  BASE_GRAVITY,
  BASE_THRUST,
  BASE_SPEED,
  OBSTACLE_WIDTH,
  GAP_SIZE,
  COPTER_SIZE,
  CANVAS_WIDTH_DESKTOP,
  CANVAS_HEIGHT_DESKTOP,
} from "@/lib/game/constants"
import {
  drawBackground,
  drawCopter,
  drawHats,
  drawObstacles,
  drawLasers,
  drawLightning,
  drawHUD,
  drawHolographicMap,
  setNFTPlayerImage,
} from "@/lib/game/renderer"
import type { GameRef, GameConstants } from "@/lib/game/types"

export default function CopterGame() {
  const { isConnected } = useAccount()
  const { ownedTraits, nftImageUrl, loading: traitsLoading, hasNFTs } = useNFTTraits()
  const [gameState, setGameState] = useState<GameState>("menu")
  const [highScore, setHighScore] = useState(0)
  const [selectedTraits, setSelectedTraits] = useState<number[]>([])

  // Auto-select owned traits (up to 4)
  useEffect(() => {
    if (ownedTraits && ownedTraits.length > 0) {
      // Auto-select first 4 owned traits
      const traitsToSelect = ownedTraits.slice(0, 4)
      setSelectedTraits(traitsToSelect)
    } else if (!isConnected) {
      // If not connected, select first 4 unlocked traits (for preview)
      const unlockedTraits = TRAITS.filter((t) => t.unlocked).slice(0, 4)
      setSelectedTraits(unlockedTraits.map((t) => t.id))
    }
  }, [ownedTraits, isConnected])
  const [canvasDimensions, setCanvasDimensions] = useState({
    width: CANVAS_WIDTH_DESKTOP,
    height: CANVAS_HEIGHT_DESKTOP,
  })

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameRef | null>(null)
  const gameLoopRef = useRef<number | null>(null)
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState(0)

  useEffect(() => {
    const savedHighScore = localStorage.getItem("copterHighScore")
    if (savedHighScore) setHighScore(Number.parseInt(savedHighScore))
  }, [])

  // Update NFT player image when it's loaded, or use default pfp if no NFT
  useEffect(() => {
    if (nftImageUrl) {
      // User has NFT, use their NFT image
      setNFTPlayerImage(nftImageUrl)
    } else if (!hasNFTs && !traitsLoading) {
      // User doesn't have NFTs, use default pfp
      setNFTPlayerImage("/defaultpfp.png")
    } else if (!hasNFTs && traitsLoading) {
      // Still loading, don't set anything yet
      setNFTPlayerImage(null)
    }
  }, [nftImageUrl, hasNFTs, traitsLoading])

  useEffect(() => {
    const updateCanvasSize = () => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      if (viewportWidth < 768) {
        const width = viewportWidth
        const height = viewportHeight
        setCanvasDimensions({ width, height })
      } else {
        setCanvasDimensions({ width: CANVAS_WIDTH_DESKTOP, height: CANVAS_HEIGHT_DESKTOP })
      }
    }

    updateCanvasSize()
    window.addEventListener("resize", updateCanvasSize)
    return () => window.removeEventListener("resize", updateCanvasSize)
  }, [])

  const getGameConstants = (): GameConstants => {
    const effects = gameRef.current?.traitEffects
    return {
      GRAVITY: effects ? BASE_GRAVITY * (1 - effects.gravityModifier) : BASE_GRAVITY,
      THRUST: effects ? BASE_THRUST * (1 + effects.accelerationBoost) : BASE_THRUST,
      OBSTACLE_SPEED: effects ? BASE_SPEED * effects.speedMultiplier : BASE_SPEED,
      COPTER_SIZE,
      OBSTACLE_WIDTH,
      GAP_SIZE,
      CANVAS_HEIGHT: canvasDimensions.height,
      CANVAS_WIDTH: canvasDimensions.width,
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || gameState !== "playing") {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = null
      }
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

      const traitEffects = calculateTraitEffects(selectedTraits)
    const totalHits = (traitEffects.durabilityHits || 0) + (traitEffects.hitsAbsorbed || 0)

      gameRef.current = {
        copter: { x: 100, y: canvasDimensions.height / 2, velocity: 0 },
        obstacles: [],
        hats: [],
        score: 0,
        distance: 0,
        frame: 0,
        isPressed: false,
        traitEffects,
      hitsRemaining: totalHits,
        lastShieldRegen: 0,
        lastSwordUse: 0,
        lastLaserShot: 0,
        lastLightningShot: 0,
        lastCompanionCollect: 0,
        lasersActive: [],
        lightningActive: [],
        companionTarget: null,
      }
    setScore(0)
    setDistance(0)

    // Initial render
    const constants = getGameConstants()
    drawBackground(ctx, constants)
    drawCopter(ctx, gameRef.current, constants)

    const gameLoop = () => {
      if (gameState !== "playing" || !gameRef.current) return

      const game = gameRef.current
      const constants = getGameConstants()

      const result = updateGameState(game, constants, selectedTraits)
      setDistance(result.distance)
      setScore(result.score)

      if (result.gameOver) {
        setGameState("gameover")
        const metersDistance = Math.floor(result.distance / 10)
        if (metersDistance > highScore) {
          setHighScore(metersDistance)
          localStorage.setItem("copterHighScore", metersDistance.toString())
        }
        return
      }

      // Render everything
      drawBackground(ctx, constants)
      drawObstacles(ctx, game.obstacles, constants, game.traitEffects)
      drawHats(ctx, game.hats)
      drawCopter(ctx, game, constants)
      drawLasers(ctx, game.copter, game.lasersActive, game.frame, constants)
      drawLightning(ctx, game.lightningActive, game.frame)
      drawHUD(ctx, game, result.distance, selectedTraits, constants)
      
      // Draw holographic map if trait is active
      if (game.traitEffects?.hasHolographicDisplay) {
        drawHolographicMap(ctx, game.copter, game.obstacles, constants)
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

      gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
        gameLoopRef.current = null
      }
    }
  }, [gameState, selectedTraits, canvasDimensions, highScore])

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


  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault()
    if (gameState === "playing" && gameRef.current) {
      gameRef.current.isPressed = true
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault()
    if (gameState === "playing" && gameRef.current) {
      gameRef.current.isPressed = false
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault()
    if (gameRef.current) {
    gameRef.current.isPressed = true
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault()
    if (gameRef.current) {
    gameRef.current.isPressed = false
  }
  }

  const metersDistance = Math.floor(distance / 10)

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 md:p-4">
      <div className="flex w-full max-w-4xl flex-col items-center gap-4">
        {gameState === "menu" && (
          <Menu
            highScore={highScore}
            onStart={() => setGameState("traits")}
          />
        )}

        {gameState === "traits" && (
          <TraitSelector
            selectedTraits={selectedTraits}
            onTraitToggle={toggleTrait}
            onStart={() => setGameState("playing")}
            ownedTraits={isConnected ? ownedTraits : undefined}
            requiresWallet={isConnected}
            loadingTraits={traitsLoading}
          />
        )}

        {gameState === "playing" && (
          <GameCanvas
            canvasRef={canvasRef}
            game={gameRef.current || {
              copter: { x: 100, y: canvasDimensions.height / 2, velocity: 0 },
              obstacles: [],
              hats: [],
              score: 0,
              distance: 0,
              frame: 0,
              isPressed: false,
              traitEffects: calculateTraitEffects(selectedTraits),
              hitsRemaining: 1,
              lastShieldRegen: 0,
              lastSwordUse: 0,
              lastLaserShot: 0,
              lastLightningShot: 0,
              lastCompanionCollect: 0,
              lasersActive: [],
              lightningActive: [],
              companionTarget: null,
            }}
            constants={getGameConstants()}
            distance={distance}
            selectedTraits={selectedTraits}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            canvasDimensions={canvasDimensions}
            />
        )}

        {gameState === "gameover" && (
          <GameOver
            distance={metersDistance}
            score={score}
            highScore={highScore}
            hasNFTs={hasNFTs}
            onPlayAgain={() => setGameState("playing")}
            onChangeTraits={() => setGameState("traits")}
          />
        )}
      </div>
    </div>
  )
}
