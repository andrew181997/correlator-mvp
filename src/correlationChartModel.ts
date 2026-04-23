export type TimeRangePreset = 'hour' | 'day' | 'week' | 'custom'

export type ChartSeries = {
  key: string
  dataKey: string
  label: string
  color: string
}

export function defaultCustomRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date(to.getTime() - 72 * 60 * 60 * 1000)
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  return { from: fmt(from), to: fmt(to) }
}

function hashSeed(text: string): number {
  let hash = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

function syntheticValue(seriesKey: string, pointIndex: number, pointCount: number): number {
  const seed = hashSeed(seriesKey)
  const t = pointCount <= 1 ? 0 : (pointIndex / (pointCount - 1)) * Math.PI * 2
  const base = 32 + (seed % 48)
  const wave =
    Math.sin(t * 2.1 + seed * 0.0017) * 18 +
    Math.cos(t * 1.3 + seed * 0.0029) * 11 +
    Math.sin(t * 4 + seed * 0.0007) * 6
  const value = base + wave + (seed % 10) * 0.4
  return Math.round(Math.min(100, Math.max(0, value)) * 10) / 10
}

function parseInputLocal(value: string): Date | null {
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function buildLabelsAndCount(
  preset: TimeRangePreset,
  customFrom: string,
  customTo: string,
): { labels: string[]; subtitle: string } {
  const now = new Date()

  if (preset === 'hour') {
    const labels: string[] = []
    for (let i = 59; i >= 0; i -= 1) labels.push(i === 0 ? 'Сейчас' : `−${i}м`)
    return { labels, subtitle: 'Последний час (поминутно)' }
  }

  if (preset === 'day') {
    const labels = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, '0')}:00`)
    return { labels, subtitle: 'Сутки (почасово)' }
  }

  if (preset === 'week') {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    return { labels: days, subtitle: 'Неделя (по дням)' }
  }

  const from = parseInputLocal(customFrom) ?? new Date(now.getTime() - 72 * 60 * 60 * 1000)
  let to = parseInputLocal(customTo) ?? now
  if (to.getTime() <= from.getTime()) {
    to = new Date(from.getTime() + 60 * 60 * 1000)
  }
  const spanMs = to.getTime() - from.getTime()
  const hours = Math.ceil(spanMs / (60 * 60 * 1000))
  const pointCount = Math.min(72, Math.max(4, hours))
  const labels: string[] = []
  for (let i = 0; i < pointCount; i += 1) {
    const ts = new Date(from.getTime() + (spanMs * i) / (pointCount - 1 || 1))
    labels.push(
      `${String(ts.getDate()).padStart(2, '0')}.${String(ts.getMonth() + 1).padStart(2, '0')} ${String(ts.getHours()).padStart(2, '0')}:${String(ts.getMinutes()).padStart(2, '0')}`,
    )
  }
  return { labels, subtitle: 'Произвольный интервал' }
}

export function buildCorrelationChartRows(
  series: ChartSeries[],
  preset: TimeRangePreset,
  customFrom: string,
  customTo: string,
): { rows: Record<string, string | number>[]; subtitle: string } {
  const { labels, subtitle } = buildLabelsAndCount(preset, customFrom, customTo)
  const rows: Record<string, string | number>[] = labels.map((label, pointIndex) => {
    const row: Record<string, string | number> = { t: label }
    for (const s of series) {
      row[s.dataKey] = syntheticValue(s.key, pointIndex, labels.length)
    }
    return row
  })
  return { rows, subtitle }
}
