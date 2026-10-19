import { useRef, useState } from 'react'
import { OBJECTIVES, STATION_BY_ID } from '../game/data'
import { formatNumber } from '../game/format'
import type { GameState, Selection } from '../game/types'
import { GameIcon } from './Icons'

interface WorldMapProps {
  state: GameState
  selection: Selection
  conjurePower: number
  onSelect: (selection: Selection) => void
  onConjure: () => void
}

interface Hotspot {
  id: string
  x: number
  y: number
}

/** Pontos clicáveis sobre a arte isométrica (percentuais da imagem). */
const HOTSPOTS: Hotspot[] = [
  { id: 'torre', x: 25, y: 14 },
  { id: 'cripta', x: 34, y: 40 },
  { id: 'cemiterio', x: 16, y: 68 },
  { id: 'acampamento', x: 72, y: 18 },
  { id: 'forja', x: 74, y: 47 },
  { id: 'portal', x: 89, y: 68 },
]

interface Pop {
  id: number
  x: number
  y: number
  value: number
}

export function WorldMap({ state, selection, conjurePower, onSelect, onConjure }: WorldMapProps) {
  const [pops, setPops] = useState<Pop[]>([])
  const nextPopId = useRef(0)

  const conjureAt = (x: number, y: number) => {
    const id = nextPopId.current
    nextPopId.current += 1
    setPops((previous) => [...previous, { id, x, y, value: conjurePower }])
    window.setTimeout(() => setPops((previous) => previous.filter((pop) => pop.id !== id)), 1000)
    onConjure()
  }

  const objective = OBJECTIVES[state.objectiveIndex]

  return (
    <section className="world">
      <div className="world__art" aria-hidden="true" />
      <div className="world__veil" aria-hidden="true" />

      {objective && (
        <div className="objective">
          <span className="objective__label">Objetivo atual</span>
          <p className="objective__text">{objective.text}</p>
          <div className="bar objective__bar">
            <div
              className="bar__fill"
              style={{
                width: `${Math.min(100, (objective.current(state) / objective.target) * 100)}%`,
              }}
            />
          </div>
          <span className="objective__progress">
            {formatNumber(Math.min(objective.current(state), objective.target))}/{formatNumber(objective.target)} ·{' '}
            <span className="amount--gold">{formatNumber(objective.reward)} de ouro</span>
          </span>
        </div>
      )}

      {HOTSPOTS.map((hotspot) => {
        const station = STATION_BY_ID[hotspot.id]
        if (!station) return null
        const isCemetery = hotspot.id === 'cemiterio'
        const isSelected = selection.kind === 'station' && selection.id === hotspot.id
        const level = state.stations[hotspot.id] ?? 0

        return (
          <button
            type="button"
            key={hotspot.id}
            className={`hotspot${isSelected ? ' hotspot--selected' : ''}${isCemetery ? ' hotspot--conjure' : ''}`}
            style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
            onClick={() => {
              onSelect({ kind: 'station', id: hotspot.id })
              if (isCemetery) conjureAt(hotspot.x, hotspot.y)
            }}
            title={isCemetery ? 'Conjurar — clique para reunir ossos' : station.description}
          >
            <span className="hotspot__pin">
              <GameIcon name={station.sigil} size={isCemetery ? 26 : 22} />
            </span>
            <span className="hotspot__chip">
              <span className="hotspot__name">{station.name}</span>
              <span className="hotspot__role">
                {isCemetery ? 'Clique para conjurar' : station.role} · Nv {level}
              </span>
            </span>
          </button>
        )
      })}

      {pops.map((pop) => (
        <span className="pop" key={pop.id} style={{ left: `${pop.x}%`, top: `${pop.y}%` }}>
          +{formatNumber(pop.value)} ossos
        </span>
      ))}

      <div className="minimap" title="Reino atual: Vale dos Ossos">
        <GameIcon name="compass" size={26} />
        <span className="minimap__label">Vale dos Ossos</span>
      </div>
    </section>
  )
}
