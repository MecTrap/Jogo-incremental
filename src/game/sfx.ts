let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  context ??= new Ctor()
  return context
}

/** Estalo curto de conjuração — sem arquivos de áudio. */
export function playConjure(): void {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const now = ctx.currentTime
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = 'triangle'
  oscillator.frequency.setValueAtTime(340, now)
  oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.18)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.07, now + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)

  oscillator.connect(gain).connect(ctx.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.24)
}
