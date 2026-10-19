import { RESOURCES } from '../game/data'
import { formatRate } from '../game/format'
import type { ModalKind, Rates, ResourceKey } from '../game/types'
import { GameIcon } from './Icons'

interface FooterProps {
  rates: Rates
  onOpen: (modal: ModalKind) => void
}

const TOTALS: ResourceKey[] = ['gold', 'bones', 'essence']

export function Footer({ rates, onOpen }: FooterProps) {
  return (
    <footer className="footer">
      <span className="footer__label">Produção total</span>

      <div className="totals">
        {TOTALS.map((key) => (
          <div className="total" key={key}>
            <GameIcon name={RESOURCES[key].sigil} size={15} />
            <span className="total__text">
              <span className="total__name">{RESOURCES[key].label}</span>
              <span className={`amount amount--${key}`}>{formatRate(rates[key])}</span>
            </span>
          </div>
        ))}
      </div>

      <nav className="footer__nav" aria-label="Navegação do jogo">
        <button type="button" className="btn btn--ghost btn--small" onClick={() => onOpen('achievements')}>
          <GameIcon name="trophy" size={14} />
          Conquistas
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => onOpen('missions')}>
          <GameIcon name="scroll" size={14} />
          Missões
        </button>
        <button type="button" className="btn btn--ghost btn--small" onClick={() => onOpen('settings')}>
          <GameIcon name="gear" size={14} />
          Config.
        </button>
      </nav>
    </footer>
  )
}
