import type { ReactNode } from 'react'
import { GameIcon } from './Icons'

interface CollapsibleProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function Collapsible({ title, children, defaultOpen = true }: CollapsibleProps) {
  return (
    <details className="collapsible" open={defaultOpen}>
      <summary className="collapsible__head">
        <span>{title}</span>
        <GameIcon name="upArrow" size={14} className="collapsible__caret" />
      </summary>
      <div className="collapsible__body">{children}</div>
    </details>
  )
}
