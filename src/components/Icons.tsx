import type { ReactElement } from 'react'

interface GameIconProps {
  name: string
  size?: number
  className?: string
}

const SHAPES: Record<string, ReactElement> = {
  skull: (
    <>
      <path d="M12 3c4.2 0 7 3 7 6.8 0 2.2-.9 3.7-2 4.7V18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-3.5c-1.1-1-2-2.5-2-4.7C5 6 7.8 3 12 3Z" />
      <circle cx="9.4" cy="11" r="1.9" fill="currentColor" stroke="none" />
      <circle cx="14.6" cy="11" r="1.9" fill="currentColor" stroke="none" />
      <path d="M10.5 15.5h3" />
    </>
  ),
  zombie: (
    <>
      <path d="M12 3.5c4 0 6.5 2.7 6.5 6.3 0 2.1-.8 3.6-2.2 4.6l-.5 3.4c-.1.9-.8 1.6-1.8 1.6h-4c-1 0-1.7-.7-1.8-1.6l-.5-3.4c-1.4-1-2.2-2.5-2.2-4.6 0-3.6 2.5-6.3 6.5-6.3Z" />
      <circle cx="9.6" cy="9.8" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="14.4" cy="9.8" r="1.5" fill="currentColor" stroke="none" />
      <path d="M9 15h6M8 11.8l2 1.4M16 11.8l-2 1.4" />
    </>
  ),
  knight: (
    <>
      <path d="M5.5 12.5a6.5 6.5 0 0 1 13 0v3.6a2.4 2.4 0 0 1-2.4 2.4H7.9a2.4 2.4 0 0 1-2.4-2.4Z" />
      <path d="M6 12.5h12M12 6v4.5M9.4 14.6h5.2" />
      <path d="M12 19v2.5" />
    </>
  ),
  necromancer: (
    <>
      <path d="M12 3c3.6 0 6 3.4 6 8 0 3.6-.7 7-2.1 10H8.1C6.7 18 6 14.6 6 11c0-4.6 2.4-8 6-8Z" />
      <circle cx="10.2" cy="11.2" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="13.8" cy="11.2" r="1.2" fill="currentColor" stroke="none" />
      <path d="M9.6 16.2c1.6 1 3.2 1 4.8 0" />
    </>
  ),
  golem: (
    <>
      <circle cx="12" cy="12" r="7.6" />
      <path d="M8 9.6 12 12l4-2.4M12 12v5.4M9.4 15.2 12 17.4l2.6-2.2" />
    </>
  ),
  dragon: (
    <>
      <path d="M3.5 13.6c0-4 3.4-7.1 7.4-7.1 2.2 0 3.8.8 5.2 2.1l4.4-1-2.1 3 1.6 3.1-4.6.5c-1 2.4-2.9 3.6-5.1 3.6-3.6 0-6.8-1.6-6.8-4.2Z" />
      <circle cx="8.6" cy="11.6" r="1.1" fill="currentColor" stroke="none" />
      <path d="M6.5 7.5 5 4.5l3.4 1.4" />
    </>
  ),
  cemiterio: (
    <>
      <path d="M7.5 21V12a4.5 4.5 0 0 1 9 0v9" />
      <path d="M12 9.2v5.4M9.8 11.4h4.4" />
      <path d="M4 21h16" />
    </>
  ),
  cripta: (
    <>
      <path d="M9 3h6l2.6 6L12 21.5 6.4 9Z" />
      <path d="M9.4 8.6h5.2" />
    </>
  ),
  acampamento: (
    <>
      <path d="M4.6 9.6h14.8v2.2a7.4 7.4 0 0 1-14.8 0Z" />
      <path d="M8.4 19.4 7 21.5M15.6 19.4l1.4 2.1" />
      <path d="M9.2 6.2c1.6-1.5 4-1.5 5.6 0" />
    </>
  ),
  forja: (
    <>
      <path d="M3 9.6h10.4c1.6 0 2.5 1 3.7 1H21l-2 3.1h-4.1l-2 2H6.2L5 12H3Z" />
      <path d="M10.4 15.7 9.2 20h5.6l-1.4-4.3" />
    </>
  ),
  torre: (
    <>
      <path d="M8 21V6.2L12 3l4 3.2V21" />
      <path d="M6 21h12M8.4 9.4h7.2" />
      <path d="M10.4 21v-3.6a1.6 1.6 0 0 1 3.2 0V21" />
    </>
  ),
  portal: (
    <>
      <path d="M5 21V11a7 7 0 0 1 14 0v10" />
      <path d="M9 21v-9.2a3 3 0 0 1 6 0V21" />
      <circle cx="12" cy="13" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  hand: (
    <>
      <path d="M8.4 12.6V5.6a1.3 1.3 0 0 1 2.6 0v5.4" />
      <path d="M11 10.8V4.4a1.3 1.3 0 0 1 2.6 0v6.4" />
      <path d="M13.6 11V6.2a1.3 1.3 0 0 1 2.6 0v7.2a7 7 0 0 1-7 7h-1a4 4 0 0 1-3.3-1.7l-1.6-2.5a1.3 1.3 0 0 1 2.1-1.5l1.8 2.1" />
    </>
  ),
  spirit: (
    <>
      <path d="M19 20.4V12a7 7 0 0 0-14 0v8.4l2.3-1.7 2.1 1.7 2.6-1.9L14.6 20.4l2.1-1.7Z" />
      <circle cx="9.9" cy="11" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.1" cy="11" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="8.4" />
      <circle cx="12" cy="12" r="4.2" />
    </>
  ),
  bone: (
    <>
      <path d="M7.6 16.4 16.4 7.6" strokeWidth="2.4" />
      <circle cx="6.2" cy="15" r="2.4" />
      <circle cx="9" cy="18" r="2.4" />
      <circle cx="17.8" cy="9" r="2.4" />
      <circle cx="15" cy="6" r="2.4" />
    </>
  ),
  crystal: (
    <>
      <path d="M12 2.6 18.4 9 12 21.4 5.6 9Z" />
      <path d="M5.6 9h12.8M12 2.6 9.2 9l2.8 12.4M12 2.6 14.8 9 12 21.4" />
    </>
  ),
  gear: (
    <>
      <polygon points="20.4,12 17.5,15.2 16.2,19.3 12,18.4 7.8,19.3 6.5,15.2 3.6,12 6.5,8.8 7.8,4.7 12,5.6 16.2,4.7 17.5,8.8" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v4.2a5 5 0 0 1-10 0Z" />
      <path d="M7 5.2H4.6a2.6 2.6 0 0 0 2.6 5.2M17 5.2h2.4a2.6 2.6 0 0 1-2.6 5.2" />
      <path d="M12 13.2v2.8M9.2 20h5.6M10 16h4l1 4H9Z" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.6 20a6.4 6.4 0 0 1 12.8 0" />
    </>
  ),
  door: (
    <>
      <path d="M14 3.4H6.6A1.6 1.6 0 0 0 5 5v14a1.6 1.6 0 0 0 1.6 1.6H14" />
      <path d="M11 12h9m0 0-3.2-3.2M20 12l-3.2 3.2" />
    </>
  ),
  play: <polygon points="16,4 6.5,12 16,20" fill="currentColor" stroke="none" />,
  mail: (
    <>
      <rect x="3" y="5.4" width="18" height="13.2" rx="2" />
      <path d="m4 7.2 8 6 8-6" />
    </>
  ),
  chart: (
    <>
      <path d="M3 20h18" />
      <rect x="5" y="11" width="3.4" height="6" />
      <rect x="10.3" y="7" width="3.4" height="10" />
      <rect x="15.6" y="13" width="3.4" height="4" />
    </>
  ),
  scroll: (
    <>
      <path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 0 2 2H8a2 2 0 0 1-2-2Z" />
      <path d="M9 9h7M9 13h7M9 17h4" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="m15.4 8.6-2 5-5 2 2-5Z" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6 6 18" />,
  check: <path d="m5 12.5 4.6 4.5L19 7" />,
  lock: (
    <>
      <rect x="5" y="10.4" width="14" height="9.6" rx="2" />
      <path d="M8.5 10.4V8a3.5 3.5 0 0 1 7 0v2.4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  upArrow: <path d="M12 19.5V5.5M5.8 11.7 12 5.5l6.2 6.2" />,
  soundOn: (
    <>
      <path d="M4 9.6h3L11 6v12l-4-3.6H4Z" />
      <path d="M14.8 9.2a4 4 0 0 1 0 5.6M17.4 6.6a8 8 0 0 1 0 10.8" />
    </>
  ),
  soundOff: (
    <>
      <path d="M4 9.6h3L11 6v12l-4-3.6H4Z" />
      <path d="m15.2 9.8 4.4 4.4M19.6 9.8l-4.4 4.4" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.4-5.7" />
      <path d="M20 4v4.6h-4.6" />
    </>
  ),
  save: (
    <>
      <path d="M4 5.6A1.6 1.6 0 0 1 5.6 4h9.9L20 8.5v9.9A1.6 1.6 0 0 1 18.4 20H5.6A1.6 1.6 0 0 1 4 18.4Z" />
      <path d="M8 4v5h6.4V4M8 20v-5.2h8V20" />
    </>
  ),
}

export function GameIcon({ name, size = 22, className }: GameIconProps) {
  const shape = SHAPES[name] ?? SHAPES.skull
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shape}
    </svg>
  )
}
