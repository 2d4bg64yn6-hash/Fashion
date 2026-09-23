import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore, totalStock } from '../store'
import type { DocLine } from '../data'
import { orderTotal } from '../data'
import { Button, Field, Input, Modal, Select, money } from './ui'

// Общая форма документа: заказ покупателя или заказ поставщику
export function DocEditor<S extends string>({
  title, partyLabel, parties, statuses, priceKey, onSave, onClose, checkStock,
}: {
  title: string
  partyLabel: string
  parties: { id: string; name: string }[]
  statuses: readonly S[]
  priceKey: 'price' | 'cost'
  checkStock?: boolean
  onSave: (d: { partyId: string; lines: DocLine[]; status: S }) => void
  onClose: () => void
}) {
  const { products, product } = useStore()
  const [partyId, setPartyId] = useState('')
  const [status, setStatus] = useState<S>(statuses[0])
  const [lines, setLines] = useState<DocLine[]>([])
  const [pickId, setPickId] = useState('')
  const [error, setError] = useState('')

  const addLine = (id: string) => {
    const p = product(id)
    if (!p) return
    setLines((ls) => (ls.some((l) => l.productId === id) ? ls.map((l) => (l.productId === id ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { productId: id, qty: 1, price: p[priceKey] }]))
    setPickId('')
  }
  const update = (id: string, patch: Partial<DocLine>) => setLines((ls) => ls.map((l) => (l.productId === id ? { ...l, ...patch } : l)))

  const total = orderTotal(lines)
  const save = () => {
    if (!partyId) return setError(`Выберите: ${partyLabel.toLowerCase()}`)
    if (!lines.length) return setError('Добавьте хотя бы один товар')
    onSave({ partyId, lines, status })
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Отмена</Button>
          <Button onClick={save}>Сохранить</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={partyLabel}>
          <Select value={partyId} onChange={(e) => { setPartyId(e.target.value); setError('') }}>
            <option value="">— выберите —</option>
            {parties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </Field>
        <Field label="Статус">
          <Select value={status} onChange={(e) => setStatus(e.target.value as S)}>
            {statuses.map((s) => <option key={s}>{s}</option>)}
          </Select>
        </Field>
      </div>

      <div className="mt-5">
        <p className="mb-1.5 text-[13px] font-medium text-slate-600">Товары</p>
        <Select value={pickId} onChange={(e) => { addLine(e.target.value); setError('') }}>
          <option value="">+ Добавить товар…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.sku} · {p.name} — {money(p[priceKey])} (ост. {totalStock(p)})
            </option>
          ))}
        </Select>

        <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
          {lines.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-slate-400">Товары не добавлены</div>
          ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Товар</th>
                  <th className="w-24 px-3 py-2 text-right font-medium">Кол-во</th>
                  <th className="w-32 px-3 py-2 text-right font-medium">Цена</th>
                  <th className="w-32 px-3 py-2 text-right font-medium">Сумма</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => {
                  const p = product(l.productId)!
                  const over = checkStock && l.qty > p.stock.main
                  return (
                    <tr key={l.productId} className="border-t border-slate-100">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className={over ? 'text-xs text-amber-600' : 'text-xs text-slate-400'}>
                          {p.sku} · на осн. складе {p.stock.main} шт.{over && ' — не хватает для отгрузки'}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Input type="number" min={1} value={l.qty} onChange={(e) => update(l.productId, { qty: Math.max(1, +e.target.value || 1) })} className="h-8 text-right" />
                      </td>
                      <td className="px-3 py-2">
                        <Input type="number" min={0} value={l.price} onChange={(e) => update(l.productId, { price: Math.max(0, +e.target.value) })} className="h-8 text-right" />
                      </td>
                      <td className="px-3 py-2 text-right font-medium tabular">{money(l.qty * l.price)}</td>
                      <td className="px-2">
                        <button onClick={() => setLines((ls) => ls.filter((x) => x.productId !== l.productId))} className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-rose-600">{error}</span>
        <div className="text-right">
          <div className="text-xs text-slate-500">Итого, {lines.reduce((s, l) => s + l.qty, 0)} шт.</div>
          <div className="text-xl font-semibold text-slate-900 tabular">{money(total)}</div>
        </div>
      </div>
    </Modal>
  )
}

