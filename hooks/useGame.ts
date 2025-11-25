import { useEffect, useRef, useState } from "react"
import type { GameRef, GameState, GameConstants, ActiveTraitEffects } from "@/lib/game/types"
import { calculateTraitEffects } from "@/lib/game/traits"
import { updateGameState } from "@/lib/game/engine"
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
} from "@/lib/game/renderer"

export function useGame(
  gameState: GameState,
  selectedTraits: number[],
  canvasDimensions: { width: number; height: number },
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<GameRef | null>(null)
  const gameLoopRef = useRef<number | null>(null)
  const [score, setScore] = useState(0)
  const [distance, setDistance] = useState(0)

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

  const resetGame = () => {
    const traitEffects = calculateTraitEffects(selectedTraits)
    const totalHits = (traitEffects.durabilityHits || 0) + (traitEffects.hitsAbsorbed || 0) + 1

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
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || gameState !== "playing") return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    resetGame()

    const gameLoop = () => {
      if (gameState !== "playing" || !gameRef.current) return

      const game = gameRef.current
      const constants = getGameConstants()

      const result = updateGameState(game, constants, selectedTraits)
      setDistance(result.distance)
      setScore(result.score)

      if (result.gameOver) {
        return
      }

      // Render everything
      drawBackground(ctx, constants)
      drawObstacles(ctx, game.obstacles, constants, game.traitEffects)
      drawHats(ctx, game.hats)
      drawCopter(ctx, game, constants)
      drawLasers(ctx, game.copter, game.lasersActive, game.frame, constants)
      drawLightning(ctx, game.lightningActive, game.frame)
      drawHUD(ctx, game, result.distance, selectedTraits)

      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameState, selectedTraits, canvasDimensions])

  return {
    canvasRef,
    gameRef,
    score,
    distance,
  }
}





