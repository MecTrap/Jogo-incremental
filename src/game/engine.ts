import { AUTO_CLICKERS, STATIONS, UNITS } from './data'
import type {
  AutoClickerDef,
  GameState,
  Rates,
  ResourceKey,
  StationDef,
  StationEffect,
  UnitDef,
} from './types'

/** Ossos ganhos por conjuração antes de qualquer melhoria. */
export const BASE_CLICK_BONES = 1

export function levelRequirement(level: number): number {
  return Math.round(100 * Math.pow(level, 1.5))
}

/** Cada nível concede +5% em toda a produção. */
export function levelMultiplier(level: number): number {
  return 1 + (level - 1) * 0.05
}

export function stationEffectMultiplier(state: GameState, effect: StationEffect): number {
  return STATIONS.filter((station) => station.effect === effect).reduce(
    (multiplier, station) => multiplier * (1 + (state.stations[station.id] ?? 0) * station.bonusPerLevel),
    1,
  )
}

export function clickPower(state: GameState): number {
  const flat = STATIONS.filter((station) => station.effect === 'click').reduce(
    (total, station) => total + (state.stations[station.id] ?? 0) * station.bonusPerLevel,
    0,
  )
  return (BASE_CLICK_BONES + flat) * stationEffectMultiplier(state, 'bones') * levelMultiplier(state.level)
}

export function unitUpgradeMultiplier(state: GameState, unit: UnitDef): number {
  return unit.upgrades.reduce(
    (multiplier, upgrade) => (state.upgrades.includes(upgrade.id) ? multiplier * upgrade.multiplier : multiplier),
    1,
  )
}

/** Produção (por segundo) de um tipo de criatura, já com todas as melhorias. */
export function unitProduction(state: GameState, unit: UnitDef): number {
  const owned = state.units[unit.id] ?? 0
  if (owned <= 0) return 0
  const raw = owned * unit.baseRate * unitUpgradeMultiplier(state, unit)
  return raw * stationEffectMultiplier(state, unit.produces) * levelMultiplier(state.level)
}

/** Conjurações automáticas por segundo, somando toda a loja. */
export function autoClicksPerSecond(state: GameState): number {
  return AUTO_CLICKERS.reduce(
    (total, item) => total + (state.autoClickers[item.id] ?? 0) * item.clicksPerSecond,
    0,
  )
}

export function productionRates(state: GameState): Rates {
  const global = levelMultiplier(state.level)
  const multipliers: Record<ResourceKey, number> = {
    gold: stationEffectMultiplier(state, 'gold') * global,
    bones: stationEffectMultiplier(state, 'bones') * global,
    essence: stationEffectMultiplier(state, 'essence') * global,
  }

  const rates: Rates = { gold: 0, bones: 0, essence: 0 }

  for (const unit of UNITS) {
    const owned = state.units[unit.id] ?? 0
    if (owned <= 0) continue
    rates[unit.produces] += owned * unit.baseRate * unitUpgradeMultiplier(state, unit)
  }

  rates.gold *= multipliers.gold
  rates.bones *= multipliers.bones
  rates.essence *= multipliers.essence

  // Automação: cada conjuração automática rende os mesmos ossos de um clique manual.
  rates.bones += autoClicksPerSecond(state) * clickPower(state)

  return rates
}

/** Custo de `amount` unidades, considerando as já possuídas. */
export function unitCost(unit: UnitDef, owned: number, amount = 1): number {
  const growth = unit.costGrowth
  const first = unit.cost * Math.pow(growth, owned)
  if (amount <= 1) return first
  return (first * (Math.pow(growth, amount) - 1)) / (growth - 1)
}

export function affordableCount(unit: UnitDef, owned: number, available: number): number {
  const growth = unit.costGrowth
  const first = unit.cost * Math.pow(growth, owned)
  if (available < first) return 0
  const ratio = (available * (growth - 1)) / first
  return Math.max(0, Math.floor(Math.log(ratio + 1) / Math.log(growth)))
}

export function stationCost(station: StationDef, level: number): number {
  return Math.round(station.baseCost * Math.pow(station.costGrowth, level))
}

export function stationBonusPercent(station: StationDef, level: number): number {
  return Math.round(level * station.bonusPerLevel * 100)
}

export function autoClickerCost(item: AutoClickerDef, owned: number): number {
  return Math.round(item.cost * Math.pow(item.costGrowth, owned))
}

export function totalUnits(state: GameState): number {
  return UNITS.reduce((total, unit) => total + (state.units[unit.id] ?? 0), 0)
}
