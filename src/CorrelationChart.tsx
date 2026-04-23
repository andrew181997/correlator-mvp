import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { buildCorrelationChartRows, type ChartSeries, type TimeRangePreset } from './correlationChartModel'

type CorrelationChartProps = {
  series: ChartSeries[]
  timePreset: TimeRangePreset
  customFrom: string
  customTo: string
}

export function CorrelationChart({ series, timePreset, customFrom, customTo }: CorrelationChartProps) {
  const { rows, subtitle } = useMemo(
    () => buildCorrelationChartRows(series, timePreset, customFrom, customTo),
    [series, timePreset, customFrom, customTo],
  )

  if (series.length === 0) {
    return <p className="muted chart-empty">Нет показателей для графика. Выберите другую группу.</p>
  }

  return (
    <div className="chart-block">
      <p className="muted chart-subtitle">{subtitle}</p>
      <div className="chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="t" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={16} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={36} />
            <Tooltip />
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.dataKey}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

type ToolbarProps = {
  value: TimeRangePreset
  onChange: (next: TimeRangePreset) => void
  customFrom: string
  customTo: string
  onCustomFromChange: (v: string) => void
  onCustomToChange: (v: string) => void
}

export function CorrelationTimeRangeToolbar({
  value,
  onChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
}: ToolbarProps) {
  return (
    <div className="time-range-toolbar">
      <span className="time-range-label">Период:</span>
      <div className="time-range-buttons" role="group" aria-label="Период графика">
        {(
          [
            { id: 'hour' as const, label: 'Час' },
            { id: 'day' as const, label: 'День' },
            { id: 'week' as const, label: 'Неделя' },
            { id: 'custom' as const, label: 'Произвольно' },
          ] as const
        ).map((btn) => (
          <button
            key={btn.id}
            type="button"
            className={value === btn.id ? 'time-range-btn active' : 'time-range-btn'}
            onClick={() => onChange(btn.id)}
          >
            {btn.label}
          </button>
        ))}
      </div>
      {value === 'custom' ? (
        <div className="time-range-custom">
          <label>
            С
            <input type="datetime-local" value={customFrom} onChange={(e) => onCustomFromChange(e.target.value)} />
          </label>
          <label>
            По
            <input type="datetime-local" value={customTo} onChange={(e) => onCustomToChange(e.target.value)} />
          </label>
        </div>
      ) : null}
    </div>
  )
}
