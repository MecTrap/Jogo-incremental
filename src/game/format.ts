const grouped = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 })
const decimal = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })

const SUFFIXES = ['', 'mil', 'mi', 'bi', 'tri', 'qua', 'qui', 'sex', 'sep', 'oct', 'non', 'dec']

/** Números do jogo em pt-BR: 1.248.532, 0,5, 12,3 mi. */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '∞'
  const absolute = Math.abs(value)

  if (absolute < 10 && !Number.isInteger(value)) return decimal.format(value)

  if (absolute >= 1e15) {
    const tier = Math.min(Math.floor(Math.log10(absolute) / 3), SUFFIXES.length - 1)
    const scaled = value / Math.pow(1000, tier)
    return `${scaled.toFixed(scaled < 10 ? 2 : 1).replace('.', ',')} ${SUFFIXES[tier]}`.trim()
  }

  return grouped.format(Math.floor(value))
}

export function formatRate(value: number): string {
  return `+${formatNumber(value)}/s`
}

export function formatPercent(value: number): string {
  return `${formatNumber(value * 100)}%`
}

export function formatDuration(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60_000))
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return hours > 0 ? `${hours}h ${rest}m` : `${rest}m`
}
