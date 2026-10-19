import { useState } from 'react'
import { RESOURCES } from '../game/data'
import { formatDuration, formatNumber } from '../game/format'
import type { GameApi } from '../game/useGame'
import type { ModalKind, ResourceKey, Selection } from '../game/types'
import { Footer } from './Footer'
import { Header } from './Header'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'
import { WorldMap } from './WorldMap'
import './game.css'

interface GameScreenProps {
  game: GameApi
  onOpen: (modal: ModalKind) => void
  onMenu: () => void
}

const WALLET_ORDER: ResourceKey[] = ['gold', 'bones', 'essence']

export function GameScreen({ game, onOpen, onMenu }: GameScreenProps) {
  const [selection, setSelection] = useState<Selection>({ kind: 'unit', id: 'esqueleto' })
  const { state, rates, conjurePower, levelInfo, offlineAward } = game

  return (
    <div className="game">
      <Header state={state} rates={rates} levelInfo={levelInfo} onOpen={onOpen} onMenu={onMenu} />

      <div className="board">
        <LeftPanel
          state={state}
          selection={selection}
          onSelect={setSelection}
          onBuyUnit={(unitId) => game.buyUnit(unitId, 1)}
          onBuyStation={game.buyStation}
        />
        <WorldMap
          state={state}
          selection={selection}
          conjurePower={conjurePower}
          onSelect={setSelection}
          onConjure={game.conjure}
        />
        <RightPanel
          state={state}
          selection={selection}
          onBuyUnit={game.buyUnit}
          onBuyStation={game.buyStation}
          onBuyUpgrade={game.buyUpgrade}
          onEvolve={game.evolve}
        />
      </div>

      <Footer rates={rates} onOpen={onOpen} />

      {offlineAward && (
        <div className="toast">
          <p className="toast__title">Seu exército trabalhou sozinho</p>
          <p className="toast__time">Offline por {formatDuration(offlineAward.ms)}</p>
          <ul className="toast__list">
            {WALLET_ORDER.map((key) => (
              <li key={key}>
                <span>{RESOURCES[key].label}</span>
                <span className={`amount amount--${key}`}>+{formatNumber(offlineAward.gain[key])}</span>
              </li>
            ))}
          </ul>
          <button type="button" className="btn btn--block btn--small" onClick={game.dismissOffline}>
            Recolher
          </button>
        </div>
      )}
    </div>
  )
}
