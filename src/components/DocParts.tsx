import { Check } from 'lucide-react'
import { useStore } from '../store'
import { orderTotal, type DocLine } from '../data'
import { Drawer, InfoGrid, StatusBadge, cx, dateTime, money, statusTone } from './ui'

const selectTone: Record<string, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
}

// Статус в таблице, который можно поменять прямо в строке
export function StatusSelect<S extends string>({ value, options, onChange }: { value: S; options: readonly S[]; onChange: (s: S) => void }) {
  return (
    <select
      value={value}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => onChange(e.target.value as S)}
      className={cx('cursor-pointer rounded-full border-0 py-0.5 pr-6 pl-2.5 text-xs font-medium ring-1 outline-none ring-inset', selectTone[statusTone[value] ?? 'gray'])}
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  )
}

export function LinesSummary({ lines }: { lines: DocLine[] }) {
  const { product } = useStore()
  const first = lines[0] && product(lines[0].productId)
  return (
    <span className="line-clamp-1">
      {first?.name ?? '—'} × {lines[0]?.qty}
      {lines.length > 1 && <span className="ml-1 text-slate-400">+ ещё {lines.length - 1}</span>}
    </span>
  )
}

export function DocDrawer<S extends string>({
  title, partyLabel, partyName, date, lines, status, statuses, onStatus, notes, onClose,
}: {
  title: string
  partyLabel: string
  partyName: string
  date: string
  lines: DocLine[]
  status: S
  statuses: readonly S[]
  onStatus: (s: S) => void
  notes: string[]
  onClose: () => void
}) {
  const { product } = useStore()
  const idx = statuses.indexOf(status)
  return (
    <Drawer title={title} subtitle={<StatusBadge status={status} />} onClose={onClose}>
      <InfoGrid items={[[partyLabel, partyName], ['Дата', dateTime(date)], ['Позиций', lines.length], ['Сумма', <b>{money(orderTotal(lines))}</b>]]} />

      <h4 className="mt-7 mb-3 text-sm font-semibold text-slate-900">Статус</h4>
      <div className="flex flex-wrap gap-2">
        {statuses.map((st, i) => (
          <button
            key={st}
            onClick={() => onStatus(st)}
            className={cx(
              'flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-medium transition',
              i === idx ? 'border-brand-500 bg-brand-50 text-brand-700' : i < idx ? 'border-slate-200 text-slate-500' : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
            )}
          >
            {i < idx && <Check size={14} className="text-emerald-500" />}
            {st}
          </button>
        ))}
      </div>
      <ul className="mt-3 space-y-1 text-xs text-slate-500">
        {notes.map((n) => <li key={n}>{n}</li>)}
      </ul>

      <h4 className="mt-7 mb-3 text-sm font-semibold text-slate-900">Товары</h4>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Товар</th>
              <th className="px-3 py-2 text-right font-medium">Кол-во</th>
              <th className="px-3 py-2 text-right font-medium">Цена</th>
              <th className="px-3 py-2 text-right font-medium">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.productId} className="border-t border-slate-100">
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-800">{product(l.productId)?.name}</div>
                  <div className="font-mono text-xs text-slate-400">{product(l.productId)?.sku}</div>
                </td>
                <td className="px-3 py-2 text-right tabular">{l.qty}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap tabular">{money(l.price)}</td>
                <td className="px-3 py-2 text-right font-medium whitespace-nowrap tabular">{money(l.qty * l.price)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 bg-slate-50">
              <td colSpan={3} className="px-3 py-2.5 text-right text-slate-500">Итого</td>
              <td className="px-3 py-2.5 text-right font-semibold whitespace-nowrap tabular">{money(orderTotal(lines))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Drawer>
  )
}
