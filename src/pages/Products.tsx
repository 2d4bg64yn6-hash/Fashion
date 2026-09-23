import { useEffect, useState } from 'react'
import { Plus, Pencil, Package } from 'lucide-react'
import { useStore, totalStock, stockStatus, type StockStatus } from '../store'
import { CATEGORIES, WAREHOUSES, type Category, type Product } from '../data'
import { useNav } from '../App'
import {
  Button, Card, Drawer, Empty, Field, InfoGrid, Input, Modal, PageHeader, SearchInput, Select, StatusBadge, Table, Td, Textarea, Th, Tr, money, dateTime,
} from '../components/ui'

const emptyProduct = (supplierId: string): Omit<Product, 'id'> => ({
  sku: '', name: '', category: CATEGORIES[0], price: 0, cost: 0, stock: { main: 0, second: 0 }, minStock: 5, supplierId, description: '',
})

export default function Products() {
  const s = useStore()
  const { intent, clearIntent } = useNav()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<'' | Category>('')
  const [st, setSt] = useState<'' | StockStatus>('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (intent?.startsWith('open:')) setOpenId(intent.slice(5))
    if (intent === 'new') setAdding(true)
    if (intent) clearIntent()
  }, [intent, clearIntent])

  const list = s.products.filter((p) => {
    const text = `${p.sku} ${p.name}`.toLowerCase()
    return text.includes(q.toLowerCase()) && (!cat || p.category === cat) && (!st || stockStatus(p) === st)
  })
  const opened = s.products.find((p) => p.id === openId)

  return (
    <>
      <PageHeader
        title="Товары"
        subtitle={`${s.products.length} позиций в каталоге`}
        actions={<Button icon={Plus} onClick={() => setAdding(true)}>Добавить товар</Button>}
      />

      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <SearchInput value={q} onChange={setQ} placeholder="Поиск по названию или артикулу" />
          <Select value={cat} onChange={(e) => setCat(e.target.value as Category)} className="w-full sm:w-56">
            <option value="">Все категории</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Select value={st} onChange={(e) => setSt(e.target.value as StockStatus)} className="w-full sm:w-44">
            <option value="">Любой статус</option>
            <option>В наличии</option>
            <option>Мало</option>
            <option>Нет в наличии</option>
          </Select>
          <span className="ml-auto text-sm text-slate-400">Найдено: {list.length}</span>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Артикул</Th><Th>Название</Th><Th>Категория</Th><Th right>Остаток</Th><Th right>Цена</Th><Th right>Себестоимость</Th><Th>Статус</Th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <Tr key={p.id} onClick={() => setOpenId(p.id)}>
                <Td className="font-mono text-xs text-slate-500">{p.sku}</Td>
                <Td className="max-w-[340px] font-medium text-slate-900">{p.name}</Td>
                <Td className="whitespace-nowrap text-slate-600">{p.category}</Td>
                <Td right>{totalStock(p)} шт.</Td>
                <Td right className="font-medium">{money(p.price)}</Td>
                <Td right className="text-slate-500">{money(p.cost)}</Td>
                <Td><StatusBadge status={stockStatus(p)} /></Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {!list.length && <Empty text="Ничего не найдено — измените условия поиска" />}
      </Card>

      {opened && <ProductCard product={opened} onClose={() => setOpenId(null)} />}
      {adding && (
        <ProductForm
          title="Новый товар"
          initial={emptyProduct(s.suppliers[0]?.id ?? '')}
          onClose={() => setAdding(false)}
          onSave={(p) => { s.addProduct(p); setAdding(false) }}
        />
      )}
    </>
  )
}

function ProductCard({ product: p, onClose }: { product: Product; onClose: () => void }) {
  const s = useStore()
  const [editing, setEditing] = useState(false)
  const margin = p.price ? Math.round(((p.price - p.cost) / p.price) * 100) : 0
  const moves = s.movements.filter((m) => m.productId === p.id).slice(0, 5)

  return (
    <>
      <Drawer
        title={p.name}
        subtitle={<span className="font-mono">{p.sku}</span>}
        onClose={onClose}
        footer={<Button variant="secondary" icon={Pencil} onClick={() => setEditing(true)}>Редактировать</Button>}
      >
        <div className="mb-6 flex items-center gap-4 rounded-xl bg-slate-50 p-4">
          <div className="grid size-14 place-items-center rounded-xl bg-white text-slate-400 ring-1 ring-slate-200">
            <Package size={26} />
          </div>
          <div>
            <StatusBadge status={stockStatus(p)} />
            <p className="mt-1.5 text-2xl font-semibold text-slate-900 tabular">{money(p.price)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-500">Маржа</p>
            <p className="text-lg font-semibold text-emerald-600">{margin}%</p>
          </div>
        </div>

        <InfoGrid
          items={[
            ['Название', p.name],
            ['Артикул', <span className="font-mono">{p.sku}</span>],
            ['Категория', p.category],
            ['Поставщик', s.supplierName(p.supplierId)],
            ['Цена продажи', money(p.price)],
            ['Себестоимость', money(p.cost)],
            ['Остаток всего', `${totalStock(p)} шт.`],
            ['Минимальный остаток', `${p.minStock} шт.`],
          ]}
        />

        <h4 className="mt-7 mb-2 text-sm font-semibold text-slate-900">Остатки по складам</h4>
        <div className="grid grid-cols-2 gap-3">
          {WAREHOUSES.map((w) => (
            <div key={w.id} className="rounded-xl border border-slate-200 p-3">
              <p className="text-xs text-slate-500">{w.name}</p>
              <p className="mt-1 text-lg font-semibold tabular">{p.stock[w.id]} шт.</p>
            </div>
          ))}
        </div>

        <h4 className="mt-7 mb-2 text-sm font-semibold text-slate-900">Описание</h4>
        <p className="text-sm leading-relaxed text-slate-600">{p.description || '—'}</p>

        <h4 className="mt-7 mb-2 text-sm font-semibold text-slate-900">Последние движения</h4>
        {moves.length ? (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {moves.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><StatusBadge status={m.type} /> <span className="text-slate-500">{m.comment}</span></span>
                <span className="text-right tabular text-slate-700">{m.qty} шт. <span className="ml-2 text-xs text-slate-400">{dateTime(m.date)}</span></span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">Движений пока не было</p>
        )}
      </Drawer>
      {editing && (
        <ProductForm
          title="Редактирование товара"
          initial={p}
          onClose={() => setEditing(false)}
          onSave={(np) => { s.updateProduct({ ...np, id: p.id }); setEditing(false) }}
        />
      )}
    </>
  )
}

function ProductForm({ title, initial, onSave, onClose }: { title: string; initial: Omit<Product, 'id'>; onSave: (p: Omit<Product, 'id'>) => void; onClose: () => void }) {
  const { suppliers } = useStore()
  const [f, setF] = useState(initial)
  const [err, setErr] = useState('')
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  const save = () => {
    if (!f.name.trim() || !f.sku.trim()) return setErr('Укажите название и артикул')
    if (f.price <= 0) return setErr('Цена должна быть больше нуля')
    onSave(f)
  }

  return (
    <Modal
      title={title}
      onClose={onClose}
      wide
      footer={<><span className="mr-auto self-center text-sm text-rose-600">{err}</span><Button variant="secondary" onClick={onClose}>Отмена</Button><Button onClick={save}>Сохранить</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Название" className="sm:col-span-2"><Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="Напр. Колодки тормозные передние…" autoFocus /></Field>
        <Field label="Артикул"><Input value={f.sku} onChange={(e) => set('sku', e.target.value)} placeholder="BP-1004" /></Field>
        <Field label="Категория">
          <Select value={f.category} onChange={(e) => set('category', e.target.value as Category)}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Цена продажи, ₸"><Input type="number" min={0} value={f.price} onChange={(e) => set('price', +e.target.value)} /></Field>
        <Field label="Себестоимость, ₸"><Input type="number" min={0} value={f.cost} onChange={(e) => set('cost', +e.target.value)} /></Field>
        <Field label="Остаток: Основной склад"><Input type="number" min={0} value={f.stock.main} onChange={(e) => set('stock', { ...f.stock, main: Math.max(0, +e.target.value) })} /></Field>
        <Field label="Остаток: Склад №2"><Input type="number" min={0} value={f.stock.second} onChange={(e) => set('stock', { ...f.stock, second: Math.max(0, +e.target.value) })} /></Field>
        <Field label="Минимальный остаток"><Input type="number" min={0} value={f.minStock} onChange={(e) => set('minStock', +e.target.value)} /></Field>
        <Field label="Поставщик">
          <Select value={f.supplierId} onChange={(e) => set('supplierId', e.target.value)}>
            {suppliers.map((x) => <option key={x.id} value={x.id}>{x.company}</option>)}
          </Select>
        </Field>
        <Field label="Описание" className="sm:col-span-2"><Textarea value={f.description} onChange={(e) => set('description', e.target.value)} /></Field>
      </div>
    </Modal>
  )
}
