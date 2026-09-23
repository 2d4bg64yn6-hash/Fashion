import { useState } from 'react'
import { compactMoney, money } from './ui'

// Простой столбчатый график на SVG без внешних библиотек
export function BarChart({ data, height = 240 }: { data: { label: string; value: number }[]; height?: number }) {
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(...data.map((d) => d.value), 1)
  const nice = Math.ceil(max / 10 ** Math.floor(Math.log10(max))) * 10 ** Math.floor(Math.log10(max))
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * nice)
  const labelEvery = Math.ceil(data.length / 10)

  return (
    <div className="flex gap-3" style={{ height }}>
      <div className="flex flex-col-reverse justify-between pb-6 text-right text-[11px] text-slate-400 tabular">
        {ticks.map((t) => (
          <span key={t} className="leading-none">{compactMoney(t).replace(' ₸', '')}</span>
        ))}
      </div>
      <div className="relative flex-1">
        <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col-reverse justify-between">
          {ticks.map((t) => (
            <div key={t} className="border-t border-dashed border-slate-100" />
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 bottom-6 flex items-end gap-[3px]">
          {data.map((d, i) => (
            <div
              key={i}
              className="relative flex h-full flex-1 cursor-default items-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div
                className={`w-full rounded-t-[4px] transition-colors ${hover === i ? 'bg-brand-600' : 'bg-brand-500/75'}`}
                style={{ height: `${(d.value / nice) * 100}%`, minHeight: d.value ? 2 : 0 }}
              />
              {hover === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs whitespace-nowrap text-white shadow-lg">
                  <div className="text-slate-400">{d.label}</div>
                  <div className="font-semibold tabular">{money(d.value)}</div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex gap-[3px] text-[11px] text-slate-400">
          {data.map((d, i) => (
            <div key={i} className="flex-1 text-center whitespace-nowrap">
              {i % labelEvery === 0 ? d.label : ''}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Горизонтальные полосы для отчётов
export function HBars({ data, format = money }: { data: { label: string; value: number; sub?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label}>
          <div className="mb-1 flex justify-between gap-4 text-sm">
            <span className="truncate text-slate-700">{d.label}</span>
            <span className="shrink-0 font-medium text-slate-900 tabular">
              {format(d.value)}
              {d.sub && <span className="ml-2 font-normal text-slate-400">{d.sub}</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${(d.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}
