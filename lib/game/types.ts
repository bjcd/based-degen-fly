export type Trait = {
  id: number
  name: string
  description: string[]
  icon: string
  unlocked: boolean
}

export type ActiveTraitEffects = {
  speedMultiplier: number
  degenMultiplier: number
  canDestroyObstacles: boolean
  swordCooldown: number
  durabilityHits: number
  hitsAbsorbed: number
  hasShield: boolean
  shieldActive: boolean
  shieldCooldown: number
  accelerationBoost: number
  gravityReduction: number
  showPreview: boolean
  hasCompanion: boolean
  companionCooldown: number
  hatSpawnBoost: number
  canShootLasers: boolean
  laserCooldown: number
  hasChainLightning: boolean
  lightningCooldown: number
  hasLaserEyes: boolean
  hasLightningEyes: boolean
  rewardMultiplier: number
  gravityModifier: number
  hasHolographicDisplay: boolean
}

export type GameState = "menu" | "traits" | "playing" | "gameover"

export type Obstacle = {
  x: number
  topHeight: number
  gap: number
  isSmall: boolean
}

export type Hat = {
  x: number
  y: number
  collected: boolean
}

export type Laser = {
  x: number
  y: number
  frame: number
}

export type Lightning = {
  points: Array<{ x: number; y: number }>
  frame: number
}

export type Copter = {
  x: number
  y: number
  velocity: number
}

export type GameRef = {
  copter: Copter
  obstacles: Obstacle[]
  hats: Hat[]
  score: number
  distance: number
  frame: number
  isPressed: boolean
  traitEffects: ActiveTraitEffects
  hitsRemaining: number
  lastShieldRegen: number
  lastSwordUse: number
  lastLaserShot: number
  lastLightningShot: number
  lastCompanionCollect: number
  lasersActive: Laser[]
  lightningActive: Lightning[]
  companionTarget: Hat | null
}

export type GameConstants = {
  GRAVITY: number
  THRUST: number
  OBSTACLE_SPEED: number
  COPTER_SIZE: number
  OBSTACLE_WIDTH: number
  GAP_SIZE: number
  CANVAS_HEIGHT: number
  CANVAS_WIDTH: number
}





