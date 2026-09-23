import { useState } from 'react'
import { Plus, Phone, Mail } from 'lucide-react'
import { useStore } from '../store'
import { orderTotal } from '../data'
import { useNav } from '../App'
import { Avatar, PartyForm, Stat } from './Clients'
import { Button, Card, Drawer, Empty, PageHeader, SearchInput, StatusBadge, Table, Td, Th, Tr, date, money } from '../components/ui'

export default function Suppliers() {
  const s = useStore()
  const { go } = useNav()
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const rows = s.suppliers
    .map((x) => ({
      ...x,
      products: s.products.filter((p) => p.supplierId === x.id).length,
      sum: s.purchases.filter((p) => p.supplierId === x.id && p.status !== 'Черновик').reduce((a, p) => a + orderTotal(p.lines), 0),
    }))
    .filter((x) => `${x.company} ${x.contact} ${x.phone}`.toLowerCase().includes(q.toLowerCase()))
  const opened = s.suppliers.find((x) => x.id === openId)
  const purchases = s.purchases.filter((p) => p.supplierId === openId).sort((a, b) => b.date.localeCompare(a.date))
  const catalog = s.products.filter((p) => p.supplierId === openId)

  return (
    <>
      <PageHeader title="Поставщики" subtitle={`${s.suppliers.length} поставщиков`} actions={<Button icon={Plus} onClick={() => setAdding(true)}>Добавить поставщика</Button>} />
      <Card pad={false}>
        <div className="border-b border-slate-100 p-4"><SearchInput value={q} onChange={setQ} placeholder="Поиск поставщика" /></div>
        <Table>
          <thead><tr><Th>Компания</Th><Th>Контакт</Th><Th>Телефон</Th><Th right>Товаров</Th><Th right>Сумма закупок</Th></tr></thead>
          <tbody>
            {rows.map((x) => (
              <Tr key={x.id} onClick={() => setOpenId(x.id)}>
                <Td><div className="flex items-center gap-3"><Avatar name={x.company} /><span className="font-medium text-slate-900">{x.company}</span></div></Td>
                <Td>{x.contact}</Td>
                <Td className="whitespace-nowrap text-slate-600">{x.phone}</Td>
                <Td right>{x.products}</Td>
                <Td right className="font-medium">{money(x.sum)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {!rows.length && <Empty text="Поставщики не найдены" />}
      </Card>

      {opened && (
        <Drawer title={opened.company} subtitle={opened.contact} onClose={() => setOpenId(null)} footer={<Button icon={Plus} onClick={() => go('purchases', 'new')}>Новая закупка</Button>}>
          <div className="space-y-2 text-sm text-slate-600">
            <p className="flex items-center gap-2"><Phone size={15} className="text-slate-400" /> {opened.phone}</p>
            <p className="flex items-center gap-2"><Mail size={15} className="text-slate-400" /> {opened.email}</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Stat label="Товаров в каталоге" value={String(catalog.length)} />
            <Stat label="Сумма закупок" value={money(purchases.filter((p) => p.status !== 'Черновик').reduce((a, p) => a + orderTotal(p.lines), 0))} />
          </div>
          <h4 className="mt-7 mb-3 text-sm font-semibold text-slate-900">Закупки</h4>
          {purchases.length ? (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {purchases.map((p) => (
                <li key={p.id} onClick={() => go('purchases', `open:${p.id}`)} className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                  <div><p className="text-sm font-medium text-brand-300">{p.number}</p><p className="text-xs text-slate-400">{date(p.date)}</p></div>
                  <div className="flex items-center gap-3"><span className="text-sm font-medium tabular">{money(orderTotal(p.lines))}</span><StatusBadge status={p.status} /></div>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-400">Закупок пока нет</p>}
          <h4 className="mt-7 mb-3 text-sm font-semibold text-slate-900">Товары поставщика</h4>
          <ul className="space-y-1.5 text-sm">
            {catalog.map((p) => (
              <li key={p.id} className="flex justify-between gap-3"><span className="text-slate-700">{p.name}</span><span className="text-slate-500 tabular">{money(p.cost)}</span></li>
            ))}
          </ul>
        </Drawer>
      )}
      {adding && <PartyForm title="Новый поставщик" onClose={() => setAdding(false)} onSave={(v) => { s.addSupplier(v); setAdding(false) }} />}
    </>
  )
}
