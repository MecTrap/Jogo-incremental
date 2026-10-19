import { ALL_UPGRADES, RESOURCES, STATION_BY_ID, UNITS, UNIT_BY_ID } from '../game/data'
import {
  affordableCount,
  productionRates,
  stationBonusPercent,
  stationCost,
  unitCost,
  unitProduction,
  unitUpgradeMultiplier,
} from '../game/engine'
import { formatNumber, formatRate } from '../game/format'
import type { GameState, Selection, StationDef, UnitDef } from '../game/types'
import { Collapsible } from './Collapsible'
import { GameIcon } from './Icons'

interface RightPanelProps {
  state: GameState
  selection: Selection
  onBuyUnit: (unitId: string, amount: number | 'max') => void
  onBuyStation: (stationId: string) => void
  onBuyUpgrade: (upgradeId: string) => void
  onEvolve: (unitId: string) => void
}

const EFFECT_LABEL: Record<StationDef['effect'], string> = {
  gold: 'Produção de ouro',
  bones: 'Ganho de ossos',
  essence: 'Produção de essência',
  click: 'Ossos por conjuração',
  global: 'Produção geral',
}

/** Cadeia de evolução (Esqueleto → Zumbi → Cavaleiro Morto) da unidade informada. */
function evolutionChain(unitId: string): UnitDef[] {
  let root = UNIT_BY_ID[unitId]
  let previous: UnitDef | undefined
  let guard = 0
  do {
    previous = UNITS.find((unit) => unit.evolvesTo === root.id)
    if (previous) root = previous
    guard += 1
  } while (previous && guard < 10)

  const chain: UnitDef[] = []
  let cursor: UnitDef | undefined = root
  while (cursor && guard < 20) {
    chain.push(cursor)
    cursor = cursor.evolvesTo ? UNIT_BY_ID[cursor.evolvesTo] : undefined
    guard += 1
  }
  return chain
}

export function RightPanel({ state, selection, onBuyUnit, onBuyStation, onBuyUpgrade, onEvolve }: RightPanelProps) {
  const rates = productionRates(state)

  if (selection.kind === 'station') {
    const station = STATION_BY_ID[selection.id]
    if (!station) return <aside className="side side--right panel" />

    const level = state.stations[station.id] ?? 0
    const cost = stationCost(station, level)
    const affordable = state.gold >= cost

    return (
      <aside className="side side--right panel">
        <div className="detail">
          <div className="detail__hero">
            <span className="sigil detail__sigil">
              <GameIcon name={station.sigil} size={34} />
            </span>
            <div>
              <h2 className="detail__name">{station.name}</h2>
              <span className="detail__role">{station.role}</span>
              <div className="detail__tags">
                <span className="tag tag--teal">Nível {level}</span>
              </div>
            </div>
          </div>

          <p className="detail__desc">{station.description}</p>

          <div className="section">
            <div className="section__head">
              <span>Efeito</span>
              <span>{EFFECT_LABEL[station.effect]}</span>
            </div>
            <div className="section__body">
              <div className="stat-row">
                <span>Bônus atual</span>
                <span className="amount amount--gold">+{stationBonusPercent(station, level)}%</span>
              </div>
              <div className="stat-row">
                <span>Após a melhoria</span>
                <span className="amount amount--gold">
                  +{stationBonusPercent(station, level + 1)}%
                </span>
              </div>
              <div className="stat-row">
                <span>Custo da melhoria</span>
                <span className="amount amount--gold">{formatNumber(cost)}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn btn--gold btn--block"
            disabled={!affordable}
            onClick={() => onBuyStation(station.id)}
          >
            <GameIcon name="upArrow" size={14} />
            Melhorar para o nível {level + 1}
          </button>
        </div>
      </aside>
    )
  }

  const unit = UNIT_BY_ID[selection.id] ?? UNITS[0]
  const owned = state.units[unit.id] ?? 0
  const costOne = unitCost(unit, owned)
  const maxCount = affordableCount(unit, owned, state.bones)
  const maxCost = maxCount > 0 ? unitCost(unit, owned, maxCount) : 0
  const total = unitProduction(state, unit)
  const share = rates[unit.produces] > 0 ? (total / rates[unit.produces]) * 100 : 0
  const chain = evolutionChain(unit.id)
  const target = unit.evolvesTo ? UNIT_BY_ID[unit.evolvesTo] : undefined
  const canEvolve = Boolean(target && unit.evolutionCost && owned >= unit.evolutionCost)

  return (
    <aside className="side side--right panel">
      <div className="detail">
        <div className="detail__hero">
          <span className="sigil detail__sigil">
            <GameIcon name={unit.sigil} size={34} />
          </span>
          <div>
            <h2 className="detail__name">{unit.name}</h2>
            <span className="detail__role">{unit.role}</span>
            <div className="detail__tags">
              <span className="tag tag--teal">Em posse: {formatNumber(owned)}</span>
            </div>
          </div>
        </div>

        <p className="detail__desc">{unit.description}</p>

        <div className="section">
          <div className="section__head">
            <span>Produção</span>
            <span className={`amount amount--${unit.produces}`}>{formatRate(total)}</span>
          </div>
          <div className="section__body">
            <div className="stat-row">
              <span>Por unidade</span>
              <span className={`amount amount--${unit.produces}`}>
                {formatRate(owned > 0 ? total / owned : unit.baseRate * unitUpgradeMultiplier(state, unit))}
              </span>
            </div>
            <div className="stat-row">
              <span>Recurso gerado</span>
              <span>{RESOURCES[unit.produces].label}</span>
            </div>
            <div className="stat-row">
              <span>Melhorias adquiridas</span>
              <span>
                {unit.upgrades.filter((upgrade) => state.upgrades.includes(upgrade.id)).length}/{unit.upgrades.length}
              </span>
            </div>
            <div className="stat-row">
              <span>Fatia da renda</span>
              <span>{share < 0.1 ? '0%' : `${share.toFixed(0)}%`}</span>
            </div>
          </div>
        </div>

        <div className="detail__actions">
          <button
            type="button"
            className="btn btn--block"
            disabled={maxCount < 1}
            onClick={() => onBuyUnit(unit.id, 1)}
          >
            Comprar 1 · {formatNumber(costOne)}
          </button>
          <button
            type="button"
            className="btn btn--block btn--ghost"
            disabled={maxCount < 1}
            onClick={() => onBuyUnit(unit.id, 'max')}
          >
            {maxCount > 0 ? `Comprar Máx. (${maxCount}) · ${formatNumber(maxCost)}` : 'Comprar Máx.'}
          </button>
        </div>

        <Collapsible title={`Upgrades do ${unit.name}`}>
          {ALL_UPGRADES.filter((upgrade) => upgrade.unitId === unit.id).map((upgrade) => {
            const purchased = state.upgrades.includes(upgrade.id)
            const unlocked = owned >= upgrade.requirement
            const balance =
              upgrade.currency === 'gold' ? state.gold : upgrade.currency === 'bones' ? state.bones : state.essence
            const affordable = balance >= upgrade.cost

            return (
              <div className={`upgrade-card${purchased ? ' upgrade-card--owned' : ''}`} key={upgrade.id}>
                <span className="upgrade-card__text">
                  <span className="upgrade-card__name">{upgrade.name}</span>
                  <span className="upgrade-card__desc">{upgrade.description}</span>
                  <span className="upgrade-card__meta">
                    {purchased
                      ? 'Adquirido · ×2 produção'
                      : unlocked
                        ? `×2 produção · ${formatNumber(upgrade.cost)} de ${RESOURCES[upgrade.currency].label.toLowerCase()}`
                        : `Requer ${upgrade.requirement} ${unit.name.toLowerCase()}(s)`}
                  </span>
                </span>
                <button
                  type="button"
                  className="btn btn--small"
                  disabled={purchased || !unlocked || !affordable}
                  onClick={() => onBuyUpgrade(upgrade.id)}
                >
                  {purchased ? 'Ativo' : unlocked ? 'Comprar' : <GameIcon name="lock" size={13} />}
                </button>
              </div>
            )
          })}
        </Collapsible>

        {chain.length > 1 && (
          <Collapsible title="Evolução da Unidade">
            <div className="evolution">
              {chain.map((node, index) => (
                <span className="evolution__step" key={node.id}>
                  {index > 0 && <span className="evo-arrow">→</span>}
                  <span className={`evo-node${node.id === unit.id ? ' evo-node--current' : ''}`}>
                    <GameIcon name={node.sigil} size={18} />
                    <span className="evo-node__name">{node.name}</span>
                    <span className="evo-node__bonus">×{node.baseRate}</span>
                  </span>
                </span>
              ))}
            </div>
            {target && unit.evolutionCost && (
              <>
                <p className="evolution__hint">
                  Junte {unit.evolutionCost} {unit.name.toLowerCase()}(s) para erguer 1 {target.name.toLowerCase()}.
                </p>
                <button
                  type="button"
                  className="btn btn--block evolution__button"
                  disabled={!canEvolve}
                  onClick={() => onEvolve(unit.id)}
                >
                  Evoluir {unit.evolutionCost} → 1 {target.name}
                </button>
              </>
            )}
          </Collapsible>
        )}
      </div>
    </aside>
  )
}
