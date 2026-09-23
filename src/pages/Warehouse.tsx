import { useState } from 'react'
import { ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Trash2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore, totalStock, stockStatus } from '../store'
import { WAREHOUSES, warehouseName, type MovementType, type WarehouseId } from '../data'
import { useNav } from '../App'
import {
  Button, Card, CardHeader, Empty, Field, Input, Modal, PageHeader, SearchInput, Select, StatusBadge, Table, Tabs, Td, Th, Tr, cx, dateTime, money, num,
} from '../components/ui'

const OPS: { type: MovementType; icon: LucideIcon; hint: string; cls: string }[] = [
  { type: 'Приход', icon: ArrowDownToLine, hint: 'Поступление товара на склад', cls: 'text-emerald-600 bg-emerald-50' },
  { type: 'Расход', icon: ArrowUpFromLine, hint: 'Выдача / продажа со склада', cls: 'text-blue-600 bg-blue-50' },
  { type: 'Перемещение', icon: ArrowLeftRight, hint: 'Между складами', cls: 'text-violet-600 bg-violet-50' },
  { type: 'Списание', icon: Trash2, hint: 'Брак, порча, недостача', cls: 'text-rose-600 bg-rose-50' },
]

export default function WarehousePage() {
  const s = useStore()
  const { go } = useNav()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'stock' | 'moves'>('stock')
  const [onlyLow, setOnlyLow] = useState(false)
  const [op, setOp] = useState<MovementType | null>(null)

  const list = s.products.filter((p) => `${p.sku} ${p.name}`.toLowerCase().includes(q.toLowerCase()) && (!onlyLow || stockStatus(p) !== 'В наличии'))
  const totals = WAREHOUSES.map((w) => ({
    ...w,
    units: s.products.reduce((a, p) => a + p.stock[w.id], 0),
    value: s.products.reduce((a, p) => a + p.stock[w.id] * p.cost, 0),
  }))

  return (
    <>
      <PageHeader title="Склад" subtitle="Остатки по складам и складские операции" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {OPS.map((o) => (
          <button
            key={o.type}
            onClick={() => setOp(o.type)}
            className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200/80 bg-surface p-4 text-left transition hover:border-brand-200 hover:shadow-md"
          >
            <span className={cx('grid size-10 place-items-center rounded-xl', o.cls)}><o.icon size={19} /></span>
            <span>
              <span className="block text-sm font-semibold text-slate-900">{o.type}</span>
              <span className="block text-xs text-slate-500">{o.hint}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {totals.map((w) => (
          <Card key={w.id} className="flex items-center justify-between">
            <div>
              <p className="text-[13px] font-medium text-slate-500">{w.name}</p>
              <p className="mt-1 text-xl font-semibold tabular">{num(w.units)} шт.</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Стоимость остатков</p>
              <p className="mt-1 font-semibold tabular text-slate-700">{money(w.value)}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card pad={false} className="mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <Tabs value={tab} onChange={setTab} items={[{ id: 'stock', label: 'Остатки' }, { id: 'moves', label: 'Движение товаров', count: s.movements.length }]} />
          {tab === 'stock' && (
            <>
              <SearchInput value={q} onChange={setQ} placeholder="Поиск товара" />
              <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="size-4 accent-brand-600" />
                Только с низким остатком
              </label>
            </>
          )}
        </div>

        {tab === 'stock' ? (
          <>
            <Table>
              <thead>
                <tr><Th>Товар</Th>{WAREHOUSES.map((w) => <Th key={w.id} right>{w.name}</Th>)}<Th right>Всего</Th><Th right>Мин.</Th><Th>Статус</Th></tr>
              </thead>
              <tbody>
                {list.map((p) => (
                  <Tr key={p.id} onClick={() => go('products', `open:${p.id}`)}>
                    <Td>
                      <div className="font-medium text-slate-900">{p.name}</div>
                      <div className="font-mono text-xs text-slate-400">{p.sku}</div>
                    </Td>
                    {WAREHOUSES.map((w) => <Td key={w.id} right>{p.stock[w.id]}</Td>)}
                    <Td right className="font-semibold">{totalStock(p)}</Td>
                    <Td right className="text-slate-400">{p.minStock}</Td>
                    <Td><StatusBadge status={stockStatus(p)} /></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            {!list.length && <Empty text="Товары не найдены" />}
          </>
        ) : (
          <Table>
            <thead>
              <tr><Th>Дата</Th><Th>Операция</Th><Th>Товар</Th><Th right>Кол-во</Th><Th>Откуда</Th><Th>Куда</Th><Th>Комментарий</Th></tr>
            </thead>
            <tbody>
              {[...s.movements].sort((a, b) => b.date.localeCompare(a.date)).map((m) => (
                <Tr key={m.id}>
                  <Td className="whitespace-nowrap text-slate-500">{dateTime(m.date)}</Td>
                  <Td><StatusBadge status={m.type} /></Td>
                  <Td className="font-medium">{s.product(m.productId)?.name}</Td>
                  <Td right>{m.qty}</Td>
                  <Td className="whitespace-nowrap text-slate-600">{m.from ? warehouseName(m.from) : '—'}</Td>
                  <Td className="whitespace-nowrap text-slate-600">{m.to ? warehouseName(m.to) : '—'}</Td>
                  <Td className="text-slate-500">{m.comment || '—'}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {op && <StockOpModal type={op} onClose={() => setOp(null)} onDone={() => { setOp(null); setTab('moves') }} />}
    </>
  )
}

function StockOpModal({ type, onClose, onDone }: { type: MovementType; onClose: () => void; onDone: () => void }) {
  const s = useStore()
  const [productId, setProductId] = useState('')
  const [qty, setQty] = useState(1)
  const [from, setFrom] = useState<WarehouseId>('main')
  const [to, setTo] = useState<WarehouseId>(type === 'Перемещение' ? 'second' : 'main')
  const [comment, setComment] = useState('')
  const [err, setErr] = useState('')
  const p = s.product(productId)

  const needFrom = type !== 'Приход'
  const needTo = type === 'Приход' || type === 'Перемещение'

  const submit = () => {
    const e = s.stockOperation({ type, productId, qty, from: needFrom ? from : undefined, to: needTo ? to : undefined, comment })
    if (e) setErr(e)
    else onDone()
  }

  const WhSelect = ({ value, onChange }: { value: WarehouseId; onChange: (v: WarehouseId) => void }) => (
    <Select value={value} onChange={(e) => onChange(e.target.value as WarehouseId)}>
      {WAREHOUSES.map((w) => <option key={w.id} value={w.id}>{w.name}{p ? ` (${p.stock[w.id]} шт.)` : ''}</option>)}
    </Select>
  )

  return (
    <Modal
      title={type}
      onClose={onClose}
      footer={<><span className="mr-auto self-center text-sm text-rose-600">{err}</span><Button variant="secondary" onClick={onClose}>Отмена</Button><Button onClick={submit}>Провести</Button></>}
    >
      <div className="grid gap-4">
        <Field label="Товар">
          <Select value={productId} onChange={(e) => { setProductId(e.target.value); setErr('') }}>
            <option value="">— выберите товар —</option>
            {s.products.map((x) => <option key={x.id} value={x.id}>{x.sku} · {x.name}</option>)}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          {needFrom && <Field label={type === 'Перемещение' ? 'Со склада' : 'Склад'}><WhSelect value={from} onChange={setFrom} /></Field>}
          {needTo && <Field label={type === 'Перемещение' ? 'На склад' : 'Склад'}><WhSelect value={to} onChange={setTo} /></Field>}
          <Field label="Количество, шт."><Input type="number" min={1} value={qty} onChange={(e) => { setQty(+e.target.value); setErr('') }} /></Field>
        </div>
        <Field label="Комментарий"><Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Необязательно" /></Field>
      </div>
      {p && (
        <Card className="mt-4 bg-slate-50">
          <CardHeader title="После проведения" />
          <div className="grid grid-cols-2 gap-3 text-sm">
            {WAREHOUSES.map((w) => {
              const delta = (needFrom && from === w.id ? -qty : 0) + (needTo && to === w.id ? qty : 0)
              return (
                <div key={w.id}>
                  <p className="text-xs text-slate-500">{w.name}</p>
                  <p className="tabular">
                    {p.stock[w.id]} → <b className={delta < 0 ? 'text-rose-600' : delta > 0 ? 'text-emerald-600' : ''}>{p.stock[w.id] + delta}</b> шт.
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </Modal>
  )
}
