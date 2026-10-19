import { useMemo } from 'react'
import { RESOURCES } from '../game/data'
import { formatNumber, formatRate } from '../game/format'
import type { ModalKind, ResourceKey, Rates, GameState } from '../game/types'
import { GameIcon } from './Icons'
import './menu.css'

interface MainMenuProps {
  state: GameState
  rates: Rates
  onPlay: () => void
  onOpen: (modal: ModalKind) => void
}

const MENU_ENTRIES: Array<{ id: 'play' | ModalKind; label: string; icon: string }> = [
  { id: 'play', label: 'Jogar', icon: 'play' },
  { id: 'settings', label: 'Configurações', icon: 'gear' },
  { id: 'achievements', label: 'Conquistas', icon: 'trophy' },
  { id: 'credits', label: 'Créditos', icon: 'person' },
  { id: 'exit', label: 'Sair', icon: 'door' },
]

const WALLET_ORDER: ResourceKey[] = ['gold', 'bones', 'essence']

export function MainMenu({ state, rates, onPlay, onOpen }: MainMenuProps) {
  const hasProgress = useMemo(
    () => state.clicks > 0 || state.level > 1 || state.bones > 0 || state.gold > 0,
    [state],
  )

  return (
    <div className="menu">
      <div className="menu__art" aria-hidden="true" />
      <div className="menu__veil" aria-hidden="true" />

      <header className="menu__header">
        <span className="menu__crest">
          <GameIcon name="skull" size={30} />
        </span>
        <h1 className="menu__title">Necromante Inc.</h1>
      </header>

      <p className="menu__flavor">
        Reúna seus mortos. Construa seu império. Seja o <strong>Lich Supremo</strong>.
      </p>

      <nav className="menu__nav" aria-label="Menu principal">
        {MENU_ENTRIES.map((entry) => (
          <button
            key={entry.label}
            type="button"
            className={`menu__btn${entry.id === 'play' ? ' menu__btn--primary' : ''}`}
            onClick={() => (entry.id === 'play' ? onPlay() : onOpen(entry.id as ModalKind))}
          >
            <GameIcon name={entry.icon} size={16} />
            <span className="menu__btn-label">{entry.label}</span>
          </button>
        ))}
        {hasProgress && <span className="menu__hint">Partida salva encontrada — continue de onde parou.</span>}
      </nav>

      <div className="menu__version">v0.1.0</div>

      <div className="menu__wallet panel">
        {WALLET_ORDER.map((key) => (
          <div className="menu__wallet-item" key={key}>
            <GameIcon name={RESOURCES[key].sigil} size={16} />
            <span className={`amount amount--${key}`}>{formatNumber(state[key])}</span>
            <span className="amount--rate">{formatRate(rates[key])}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
