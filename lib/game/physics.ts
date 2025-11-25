import type { Copter, GameConstants } from "./types"

export function applyGravity(copter: Copter, gravity: number): void {
  copter.velocity += gravity
}

export function applyThrust(copter: Copter, thrust: number): void {
  copter.velocity = thrust
}

export function updatePosition(copter: Copter, constants: GameConstants): void {
  copter.y += copter.velocity

  // Constrain copter to canvas bounds
  if (copter.y < 0) copter.y = 0
  if (copter.y + constants.COPTER_SIZE > constants.CANVAS_HEIGHT) {
    copter.y = constants.CANVAS_HEIGHT - constants.COPTER_SIZE
  }
}





