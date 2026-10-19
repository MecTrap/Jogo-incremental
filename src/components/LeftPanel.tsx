import { useState } from 'react'
import { AUTO_CLICKERS, STATIONS, UNITS } from '../game/data'
import {
  affordableCount,
  autoClickerCost,
  autoClicksPerSecond,
  clickPower,
  levelMultiplier,
  stationBonusPercent,
  stationCost,
  stationEffectMultiplier,
  unitCost,
  unitProduction,
  unitUpgradeMultiplier,
} from '../game/engine'
import { formatNumber } from '../game/format'
import type { GameState, Selection, StationDef, UnitDef } from '../game/types'
import { Collapsible } from './Collapsible'
import { GameIcon } from './Icons'

interface LeftPanelProps {
  state: GameState
  selection: Selection
  onSelect: (selection: Selection) => void
  onBuyUnit: (unitId: string) => void
  onBuyStation: (stationId: string) => void
  onBuyAutoClicker: (itemId: string) => void
}

const EFFECT_LABEL: Record<StationDef['effect'], string> = {
  gold: 'ouro',
  bones: 'ossos',
  essence: 'essência',
  click: 'ossos por conjuração',
  global: 'produção geral',
}

function perUnitRate(state: GameState, unit: UnitDef): number {
  const multiplier =
    unitUpgradeMultiplier(state, unit) *
    stationEffectMultiplier(state, unit.produces) *
    levelMultiplier(state.level)
  return unit.baseRate * multiplier
}

export function LeftPanel({
  state,
  selection,
  onSelect,
  onBuyUnit,
  onBuyStation,
  onBuyAutoClicker,
}: LeftPanelProps) {
  const [tab, setTab] = useState<'monstros' | 'estacoes' | 'loja'>('monstros')

  const centerStations = STATIONS.filter((station) => station.group === 'estacoes')
  const otherStations = STATIONS.filter((station) => station.group === 'outros')
  const autoClicks = autoClicksPerSecond(state)
  const autoBones = autoClicks * clickPower(state)

  const renderStation = (station: StationDef) => {
    const level = state.stations[station.id] ?? 0
    const cost = stationCost(station, level)
    const affordable = state.gold >= cost
    const isSelected = selection.kind === 'station' && selection.id === station.id

    return (
      <div className={`station-row${isSelected ? ' station-row--selected' : ''}`} key={station.id}>
        <button
          type="button"
          className="station-row__pick"
          onClick={() => onSelect({ kind: 'station', id: station.id })}
        >
          <span className="sigil station-row__sigil">
            <GameIcon name={station.sigil} size={20} />
          </span>
          <span className="station-row__text">
            <span className="station-row__name">{station.name}</span>
            <span className="station-row__meta">
              Nível {level} · +{stationBonusPercent(station, level)}% {EFFECT_LABEL[station.effect]}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="btn btn--small station-row__buy"
          disabled={!affordable}
          onClick={() => onBuyStation(station.id)}
          title={`Melhorar por ${formatNumber(cost)} de ouro`}
        >
          <GameIcon name="upArrow" size={13} />
          <span className="station-row__cost">{formatNumber(cost)}</span>
        </button>
      </div>
    )
  }

  return (
    <aside className="side side--left panel">
      <div className="side__tabs">
        <button
          type="button"
          className={`tab${tab === 'monstros' ? ' tab--active' : ''}`}
          onClick={() => setTab('monstros')}
        >
          Monstros
        </button>
        <button
          type="button"
          className={`tab${tab === 'estacoes' ? ' tab--active' : ''}`}
          onClick={() => setTab('estacoes')}
        >
          Estações
        </button>
        <button type="button" className={`tab${tab === 'loja' ? ' tab--active' : ''}`} onClick={() => setTab('loja')}>
          Loja
        </button>
      </div>

      <div className="side__scroll">
        {tab === 'monstros' &&
          UNITS.map((unit) => {
            const owned = state.units[unit.id] ?? 0
            const cost = unitCost(unit, owned)
            const maxAffordable = affordableCount(unit, owned, state.bones)
            const affordable = maxAffordable > 0
            const isSelected = selection.kind === 'unit' && selection.id === unit.id
            const total = unitProduction(state, unit)

            return (
              <div className={`unit-row${isSelected ? ' unit-row--selected' : ''}`} key={unit.id}>
                <button
                  type="button"
                  className="unit-row__pick"
                  onClick={() => onSelect({ kind: 'unit', id: unit.id })}
                >
                  <span className="sigil unit-row__sigil">
                    <GameIcon name={unit.sigil} size={22} />
                  </span>
                  <span className="unit-row__text">
                    <span className="unit-row__name">{unit.name}</span>
                    <span className="unit-row__meta">
                      <span className={`amount amount--${unit.produces}`}>+{formatNumber(perUnitRate(state, unit))}/s</span> cada ·{' '}
                      {owned} em posse
                    </span>
                    {owned > 0 && (
                      <span className="unit-row__total">
                        total: <span className={`amount amount--${unit.produces}`}>+{formatNumber(total)}/s</span>
                      </span>
                    )}
                  </span>
                </button>
                <button
                  type="button"
                  className="btn btn--small unit-row__buy"
                  disabled={!affordable}
                  onClick={() => onBuyUnit(unit.id)}
                >
                  Comprar
                  <span className="unit-row__cost">{formatNumber(cost)} ossos</span>
                </button>
              </div>
            )
          })}

        {tab === 'estacoes' && (
          <>
            <Collapsible title="Upgrades das Estações">{centerStations.map(renderStation)}</Collapsible>
            <Collapsible title="Outros" defaultOpen={false}>
              {otherStations.map(renderStation)}
            </Collapsible>
          </>
        )}

        {tab === 'loja' && (
          <>
            <div className="shop__summary">
              <span className="shop__summary-label">Conjurações automáticas</span>
              <span className="shop__summary-value">
                {formatNumber(autoClicks)}/s ·{' '}
                <span className="amount amount--bones">+{formatNumber(autoBones)} ossos/s</span>
              </span>
            </div>

            {AUTO_CLICKERS.map((item) => {
              const owned = state.autoClickers[item.id] ?? 0
              const cost = autoClickerCost(item, owned)
              const affordable = state.essence >= cost
              const total = owned * item.clicksPerSecond

              return (
                <div className="unit-row shop-row" key={item.id}>
                  <span className="unit-row__pick">
                    <span className="sigil unit-row__sigil">
                      <GameIcon name={item.sigil} size={22} />
                    </span>
                    <span className="unit-row__text">
                      <span className="unit-row__name">{item.name}</span>
                      <span className="unit-row__meta">
                        <span className="amount amount--bones">+{formatNumber(item.clicksPerSecond)}/s</span> de conjuração ·{' '}
                        {owned} em posse
                      </span>
                      {owned > 0 && (
                        <span className="unit-row__total">
                          total: {formatNumber(total)}/s →{' '}
                          <span className="amount amount--bones">
                            +{formatNumber(total * clickPower(state))} ossos/s
                          </span>
                        </span>
                      )}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn--small unit-row__buy"
                    disabled={!affordable}
                    onClick={() => onBuyAutoClicker(item.id)}
                    title={item.description}
                  >
                    Comprar
                    <span className="unit-row__cost unit-row__cost--essence">
                      {formatNumber(cost)} essência
                    </span>
                  </button>
                </div>
              )
            })}

            <p className="shop__hint">
              Cada item conjura o Cemitério sozinho. A Torre do Necromante e os níveis do Cemitério aumentam os ossos
              de cada conjuração automática.
            </p>
          </>
        )}
      </div>
    </aside>
  )
}
