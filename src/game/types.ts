export type ResourceKey = 'gold' | 'bones' | 'essence'

export interface Rates {
  gold: number
  bones: number
  essence: number
}

export type StationEffect = ResourceKey | 'click' | 'global'

export interface UnitUpgradeDef {
  id: string
  unitId: string
  name: string
  description: string
  cost: number
  currency: ResourceKey
  multiplier: number
  requirement: number
}

export interface UnitDef {
  id: string
  name: string
  role: string
  description: string
  sigil: string
  cost: number
  costGrowth: number
  produces: ResourceKey
  baseRate: number
  evolvesTo?: string
  evolutionCost?: number
  upgrades: UnitUpgradeDef[]
}

export interface StationDef {
  id: string
  name: string
  role: string
  description: string
  sigil: string
  baseCost: number
  costGrowth: number
  bonusPerLevel: number
  effect: StationEffect
  group: 'estacoes' | 'outros'
}

export interface OfflineAward {
  ms: number
  gain: Rates
}

export interface GameState {
  gold: number
  bones: number
  essence: number
  totalGold: number
  units: Record<string, number>
  stations: Record<string, number>
  upgrades: string[]
  clicks: number
  purchases: number
  xp: number
  level: number
  objectiveIndex: number
  objectivesDone: number
  sound: boolean
  lastSeen: number
  offlineAward: OfflineAward | null
}

export interface ObjectiveDef {
  id: string
  text: string
  target: number
  reward: number
  current: (state: GameState) => number
}

export interface AchievementDef {
  id: string
  name: string
  description: string
  unlocked: (state: GameState) => boolean
}

export interface Selection {
  kind: 'unit' | 'station'
  id: string
}

export type ModalKind = 'settings' | 'achievements' | 'credits' | 'missions' | 'exit' | null
