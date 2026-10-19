import { RESOURCES } from '../game/data'
import { formatDuration, formatNumber, formatRate } from '../game/format'
import type { GameState, ModalKind, Rates, ResourceKey } from '../game/types'
import { GameIcon } from './Icons'

interface HeaderProps {
  state: GameState
  rates: Rates
  levelInfo: { current: number; needed: number }
  onOpen: (modal: ModalKind) => void
  onMenu: () => void
}

const WALLET_ORDER: ResourceKey[] = ['gold', 'bones', 'essence']

export function Header({ state, rates, levelInfo, onOpen, onMenu }: HeaderProps) {
  const progress = levelInfo.needed > 0 ? Math.min(100, (levelInfo.current / levelInfo.needed) * 100) : 0

  return (
    <header className="hud">
      <div className="hud__brand">
        <span className="sigil hud__portrait">
          <GameIcon name="skull" size={24} />
        </span>
        <div>
          <h1 className="hud__title">Necromante Inc.</h1>
          <div className="hud__level">
            <span className="hud__level-label">Nível {state.level}</span>
            <div className="bar hud__bar">
              <div className="bar__fill" style={{ width: `${progress}%` }} />
            </div>
            <span className="hud__xp">
              {formatNumber(levelInfo.current)}/{formatNumber(levelInfo.needed)}
            </span>
          </div>
        </div>
      </div>

      <div className="hud__wallet">
        {WALLET_ORDER.map((key) => (
          <div className="hud__res" key={key}>
            <GameIcon name={RESOURCES[key].sigil} size={17} />
            <span className="hud__res-text">
              <span className={`amount amount--${key}`}>{formatNumber(state[key])}</span>
              <span className="amount--rate">{formatRate(rates[key])}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="hud__actions">
        {state.offlineAward && (
          <span className="hud__offline" title="Produção acumulada enquanto você esteve fora">
            Offline: {formatDuration(state.offlineAward.ms)}
          </span>
        )}
        <button type="button" className="hud__icon" onClick={() => onOpen('missions')} title="Objetivos">
          <GameIcon name="mail" size={17} />
        </button>
        <button type="button" className="hud__icon" onClick={() => onOpen('achievements')} title="Conquistas">
          <GameIcon name="chart" size={17} />
        </button>
        <button type="button" className="hud__icon" onClick={() => onOpen('settings')} title="Configurações">
          <GameIcon name="gear" size={17} />
        </button>
        <button type="button" className="hud__icon" onClick={onMenu} title="Menu principal">
          <GameIcon name="door" size={17} />
        </button>
      </div>
    </header>
  )
}
