import { useEffect, type ReactNode } from 'react'
import { GameIcon } from './Icons'
import './modal.css'

interface ModalProps {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, subtitle, onClose, children }: ModalProps) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__box">
        <header className="modal__head">
          <div>
            <h2 className="modal__title">{title}</h2>
            {subtitle && <p className="modal__subtitle">{subtitle}</p>}
          </div>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
            <GameIcon name="close" size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
