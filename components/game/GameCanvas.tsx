"use client"

import type React from "react"
import type { GameRef, GameConstants } from "@/lib/game/types"

type GameCanvasProps = {
  canvasRef: React.RefObject<HTMLCanvasElement>
  game: GameRef
  constants: GameConstants
  distance: number
  selectedTraits: number[]
  onPointerDown: (e: React.PointerEvent) => void
  onPointerUp: (e: React.PointerEvent) => void
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  canvasDimensions: { width: number; height: number }
}

export function GameCanvas({
  canvasRef,
  game,
  constants,
  distance,
  selectedTraits,
  onPointerDown,
  onPointerUp,
  onTouchStart,
  onTouchEnd,
  canvasDimensions,
}: GameCanvasProps) {
  return (
    <div className="relative w-full h-screen md:h-auto md:flex md:flex-col md:items-center md:gap-4">
      <canvas
        ref={canvasRef}
        width={canvasDimensions.width}
        height={canvasDimensions.height}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="w-full h-full md:h-auto md:rounded-lg md:shadow-2xl cursor-pointer touch-none"
      />
      <p className="absolute bottom-2 left-0 right-0 text-center text-[10px] sm:text-sm text-white md:text-gray-700 drop-shadow-lg md:drop-shadow-none md:relative">
        Touch and hold to fly up, release to fall
      </p>
    </div>
  )
}

