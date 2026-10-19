import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_UPGRADES, AUTO_CLICKER_BY_ID, OBJECTIVES, STATION_BY_ID, UNIT_BY_ID } from './data'
import {
  affordableCount,
  autoClickerCost,
  clickPower,
  levelRequirement,
  productionRates,
  stationCost,
  unitCost,
} from './engine'
import { playConjure } from './sfx'
import type { GameState, Rates } from './types'

const SAVE_KEY = 'necromante-inc.save.v1'
const MAX_OFFLINE_MS = 12 * 60 * 60 * 1000
const SAVE_INTERVAL_MS = 5000

export function createInitialState(): GameState {
  return {
    gold: 0,
    bones: 0,
    essence: 0,
    totalGold: 0,
    units: {},
    stations: {},
    autoClickers: {},
    upgrades: [],
    clicks: 0,
    purchases: 0,
    xp: 0,
    level: 1,
    objectiveIndex: 0,
    objectivesDone: 0,
    sound: true,
    lastSeen: Date.now(),
    offlineAward: null,
  }
}

function grantXp(state: GameState, amount: number): void {
  state.xp += amount
  let needed = levelRequirement(state.level)
  while (state.xp >= needed) {
    state.xp -= needed
    state.level += 1
    needed = levelRequirement(state.level)
  }
}

/** Conclui objetivos assim que a condição é atingida (cada um só uma vez). */
function resolveObjectives(state: GameState): void {
  let guard = 0
  while (guard < 32) {
    guard += 1
    const objective = OBJECTIVES[state.objectiveIndex]
    if (!objective) return
    if (objective.current(state) < objective.target) return
    state.gold += objective.reward
    state.objectivesDone += 1
    state.objectiveIndex += 1
    grantXp(state, 25)
  }
}

function loadState(): GameState {
  const fallback = createInitialState()
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return fallback

    const saved = JSON.parse(raw) as Partial<GameState>
    const state: GameState = {
      ...fallback,
      ...saved,
      units: { ...saved.units },
      stations: { ...saved.stations },
      autoClickers: { ...saved.autoClickers },
      upgrades: Array.isArray(saved.upgrades) ? [...saved.upgrades] : [],
      offlineAward: null,
    }

    const lastSeen = typeof saved.lastSeen === 'number' ? saved.lastSeen : Date.now()
    const elapsed = Math.min(Math.max(Date.now() - lastSeen, 0), MAX_OFFLINE_MS)

    if (elapsed > 60_000) {
      const perSecond = productionRates(state)
      const seconds = elapsed / 1000
      const gain: Rates = {
        gold: perSecond.gold * seconds,
        bones: perSecond.bones * seconds,
        essence: perSecond.essence * seconds,
      }
      state.gold += gain.gold
      state.totalGold += gain.gold
      state.bones += gain.bones
      state.essence += gain.essence
      state.offlineAward = { ms: elapsed, gain }
    }

    state.lastSeen = Date.now()
    return state
  } catch {
    return fallback
  }
}

export interface GameApi {
  state: GameState
  rates: Rates
  conjurePower: number
  levelInfo: { current: number; needed: number }
  conjure: () => void
  buyUnit: (unitId: string, amount: number | 'max') => void
  buyStation: (stationId: string) => void
  buyAutoClicker: (itemId: string) => void
  buyUpgrade: (upgradeId: string) => void
  evolve: (unitId: string) => void
  toggleSound: () => void
  reset: () => void
  dismissOffline: () => void
  saveNow: () => void
}

export function useGame(): GameApi {
  const [state, setState] = useState<GameState>(loadState)
  const stateRef = useRef(state)
  stateRef.current = state

  const rates = useMemo(() => productionRates(state), [state])
  const conjurePower = useMemo(() => clickPower(state), [state])
  const levelInfo = useMemo(
    () => ({ current: state.xp, needed: levelRequirement(state.level) }),
    [state.xp, state.level],
  )

  const persist = useCallback((snapshot: GameState) => {
    try {
      window.localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({ ...snapshot, lastSeen: Date.now(), offlineAward: null }),
      )
    } catch {
      /* armazenamento indisponível — o jogo segue rodando em memória */
    }
  }, [])

  // Produção passiva (criaturas + loja de automação).
  useEffect(() => {
    let last = performance.now()
    const timer = window.setInterval(() => {
      const now = performance.now()
      const seconds = Math.min((now - last) / 1000, 5)
      last = now
      setState((previous) => {
        const perSecond = productionRates(previous)
        if (perSecond.gold === 0 && perSecond.bones === 0 && perSecond.essence === 0) return previous
        return {
          ...previous,
          gold: previous.gold + perSecond.gold * seconds,
          totalGold: previous.totalGold + perSecond.gold * seconds,
          bones: previous.bones + perSecond.bones * seconds,
          essence: previous.essence + perSecond.essence * seconds,
        }
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [])

  // Salvamento automático.
  useEffect(() => {
    const timer = window.setInterval(() => persist(stateRef.current), SAVE_INTERVAL_MS)
    const saveOnHide = () => persist(stateRef.current)
    window.addEventListener('beforeunload', saveOnHide)
    document.addEventListener('visibilitychange', saveOnHide)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('beforeunload', saveOnHide)
      document.removeEventListener('visibilitychange', saveOnHide)
      persist(stateRef.current)
    }
  }, [persist])

  const mutate = useCallback((change: (draft: GameState) => void) => {
    setState((previous) => {
      const draft: GameState = {
        ...previous,
        units: { ...previous.units },
        stations: { ...previous.stations },
        autoClickers: { ...previous.autoClickers },
        upgrades: [...previous.upgrades],
      }
      change(draft)
      resolveObjectives(draft)
      return draft
    })
  }, [])

  const conjure = useCallback(() => {
    if (stateRef.current.sound) playConjure()
    mutate((draft) => {
      draft.bones += clickPower(draft)
      draft.clicks += 1
      grantXp(draft, 1)
    })
  }, [mutate])

  const buyUnit = useCallback(
    (unitId: string, amount: number | 'max') => {
      mutate((draft) => {
        const unit = UNIT_BY_ID[unitId]
        if (!unit) return
        const owned = draft.units[unitId] ?? 0
        const affordable = affordableCount(unit, owned, draft.bones)
        const count = amount === 'max' ? affordable : Math.min(amount, affordable)
        if (count <= 0) return
        const cost = unitCost(unit, owned, count)
        if (cost > draft.bones) return
        draft.bones -= cost
        draft.units[unitId] = owned + count
        draft.purchases += count
        grantXp(draft, count * 2)
      })
    },
    [mutate],
  )

  const buyStation = useCallback(
    (stationId: string) => {
      mutate((draft) => {
        const station = STATION_BY_ID[stationId]
        if (!station) return
        const level = draft.stations[stationId] ?? 0
        const cost = stationCost(station, level)
        if (draft.gold < cost) return
        draft.gold -= cost
        draft.stations[stationId] = level + 1
        grantXp(draft, 10)
      })
    },
    [mutate],
  )

  const buyAutoClicker = useCallback(
    (itemId: string) => {
      mutate((draft) => {
        const item = AUTO_CLICKER_BY_ID[itemId]
        if (!item) return
        const owned = draft.autoClickers[itemId] ?? 0
        const cost = autoClickerCost(item, owned)
        if (draft.essence < cost) return
        draft.essence -= cost
        draft.autoClickers[itemId] = owned + 1
        draft.purchases += 1
        grantXp(draft, 12)
      })
    },
    [mutate],
  )

  const buyUpgrade = useCallback(
    (upgradeId: string) => {
      mutate((draft) => {
        const upgrade = ALL_UPGRADES.find((item) => item.id === upgradeId)
        if (!upgrade || draft.upgrades.includes(upgradeId)) return
        if ((draft.units[upgrade.unitId] ?? 0) < upgrade.requirement) return
        const balance =
          upgrade.currency === 'gold' ? draft.gold : upgrade.currency === 'bones' ? draft.bones : draft.essence
        if (balance < upgrade.cost) return
        if (upgrade.currency === 'gold') draft.gold -= upgrade.cost
        else if (upgrade.currency === 'bones') draft.bones -= upgrade.cost
        else draft.essence -= upgrade.cost
        draft.upgrades.push(upgrade.id)
        grantXp(draft, 15)
      })
    },
    [mutate],
  )

  const evolve = useCallback(
    (unitId: string) => {
      mutate((draft) => {
        const unit = UNIT_BY_ID[unitId]
        if (!unit?.evolvesTo || !unit.evolutionCost) return
        const owned = draft.units[unitId] ?? 0
        if (owned < unit.evolutionCost) return
        draft.units[unitId] = owned - unit.evolutionCost
        draft.units[unit.evolvesTo] = (draft.units[unit.evolvesTo] ?? 0) + 1
        grantXp(draft, 20)
      })
    },
    [mutate],
  )

  const toggleSound = useCallback(() => {
    mutate((draft) => {
      draft.sound = !draft.sound
    })
  }, [mutate])

  const reset = useCallback(() => {
    const fresh = createInitialState()
    try {
      window.localStorage.removeItem(SAVE_KEY)
    } catch {
      /* ignora */
    }
    setState(fresh)
  }, [])

  const dismissOffline = useCallback(() => {
    mutate((draft) => {
      draft.offlineAward = null
    })
  }, [mutate])

  const saveNow = useCallback(() => persist(stateRef.current), [persist])

  return {
    state,
    rates,
    conjurePower,
    levelInfo,
    conjure,
    buyUnit,
    buyStation,
    buyAutoClicker,
    buyUpgrade,
    evolve,
    toggleSound,
    reset,
    dismissOffline,
    saveNow,
  }
}
