import { useState, type ChangeEvent } from 'react'
import { Plus, Phone, Mail, MapPin } from 'lucide-react'
import { useStore, clientDebt } from '../store'
import { orderTotal } from '../data'
import { useNav } from '../App'
import { Button, Card, Drawer, Empty, Field, Input, Modal, PageHeader, SearchInput, StatusBadge, Table, Td, Th, Tr, date, money } from '../components/ui'

export default function Clients() {
  const s = useStore()
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const rows = s.clients
    .map((c) => {
      const orders = s.orders.filter((o) => o.clientId === c.id)
      return { ...c, count: orders.length, sum: orders.reduce((a, o) => a + orderTotal(o.lines), 0), debt: clientDebt(s.orders, c.id) }
    })
    .filter((c) => `${c.company} ${c.contact} ${c.phone} ${c.city}`.toLowerCase().includes(q.toLowerCase()))
  const opened = s.clients.find((c) => c.id === openId)

  return (
    <>
      <PageHeader title="Клиенты" subtitle={`${s.clients.length} покупателей`} actions={<Button icon={Plus} onClick={() => setAdding(true)}>Добавить клиента</Button>} />
      <Card pad={false}>
        <div className="border-b border-slate-100 p-4">
          <SearchInput value={q} onChange={setQ} placeholder="Компания, контакт, телефон или город" />
        </div>
        <Table>
          <thead>
            <tr><Th>Компания</Th><Th>Контактное лицо</Th><Th>Телефон</Th><Th right>Заказов</Th><Th right>Сумма покупок</Th><Th right>Долг</Th></tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <Tr key={c.id} onClick={() => setOpenId(c.id)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar name={c.company} />
                    <div>
                      <div className="font-medium text-slate-900">{c.company}</div>
                      <div className="text-xs text-slate-400">{c.city}</div>
                    </div>
                  </div>
                </Td>
                <Td>{c.contact}</Td>
                <Td className="whitespace-nowrap text-slate-600">{c.phone}</Td>
                <Td right>{c.count}</Td>
                <Td right className="font-medium">{money(c.sum)}</Td>
                <Td right className={c.debt ? 'font-medium text-amber-600' : 'text-slate-400'}>{c.debt ? money(c.debt) : '—'}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {!rows.length && <Empty text="Клиенты не найдены" />}
      </Card>

      {opened && <ClientCard id={opened.id} onClose={() => setOpenId(null)} />}
      {adding && <PartyForm title="Новый клиент" withCity onClose={() => setAdding(false)} onSave={(v) => { s.addClient({ ...v, city: v.city ?? '' }); setAdding(false) }} />}
    </>
  )
}

export function Avatar({ name }: { name: string }) {
  const letters = name.replace(/[«»"]/g, '').split(' ').filter((w) => !['ТОО', 'ООО', 'ИП', 'СТО'].includes(w)).map((w) => w[0]).join('').slice(0, 2)
  return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{letters}</span>
}

function ClientCard({ id, onClose }: { id: string; onClose: () => void }) {
  const s = useStore()
  const { go } = useNav()
  const c = s.clients.find((x) => x.id === id)!
  const orders = s.orders.filter((o) => o.clientId === id).sort((a, b) => b.date.localeCompare(a.date))
  const sum = orders.reduce((a, o) => a + orderTotal(o.lines), 0)
  const debt = clientDebt(s.orders, id)
  return (
    <Drawer title={c.company} subtitle={`${c.contact} · ${c.city}`} onClose={onClose} footer={<Button icon={Plus} onClick={() => go('sales', 'new')}>Новый заказ</Button>}>
      <div className="space-y-2 text-sm text-slate-600">
        <p className="flex items-center gap-2"><Phone size={15} className="text-slate-400" /> {c.phone}</p>
        <p className="flex items-center gap-2"><Mail size={15} className="text-slate-400" /> {c.email}</p>
        <p className="flex items-center gap-2"><MapPin size={15} className="text-slate-400" /> {c.city}</p>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Заказов" value={String(orders.length)} />
        <Stat label="Сумма покупок" value={money(sum)} />
        <Stat label="Долг" value={debt ? money(debt) : '—'} warn={!!debt} />
      </div>
      <h4 className="mt-7 mb-3 text-sm font-semibold text-slate-900">История заказов</h4>
      {orders.length ? (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
          {orders.map((o) => (
            <li key={o.id} onClick={() => go('sales', `open:${o.id}`)} className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
              <div>
                <p className="text-sm font-medium text-brand-300">{o.number}</p>
                <p className="text-xs text-slate-400">{date(o.date)} · {o.lines.length} поз.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium tabular">{money(orderTotal(o.lines))}</span>
                <StatusBadge status={o.status} />
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-400">Заказов пока нет</p>}
    </Drawer>
  )
}

export function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-[15px] font-semibold tabular ${warn ? 'text-amber-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

export function PartyForm({ title, withCity, onSave, onClose }: {
  title: string
  withCity?: boolean
  onSave: (v: { company: string; contact: string; phone: string; email: string; city?: string }) => void
  onClose: () => void
}) {
  const [v, setV] = useState({ company: '', contact: '', phone: '+7 ', email: '', city: '' })
  const [err, setErr] = useState('')
  const set = (k: keyof typeof v) => (e: ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value })
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={<><span className="mr-auto self-center text-sm text-rose-600">{err}</span><Button variant="secondary" onClick={onClose}>Отмена</Button><Button onClick={() => (v.company.trim() ? onSave(v) : setErr('Укажите название компании'))}>Сохранить</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Компания" className="sm:col-span-2"><Input value={v.company} onChange={set('company')} autoFocus /></Field>
        <Field label="Контактное лицо"><Input value={v.contact} onChange={set('contact')} /></Field>
        <Field label="Телефон"><Input value={v.phone} onChange={set('phone')} /></Field>
        <Field label="Email"><Input value={v.email} onChange={set('email')} /></Field>
        {withCity && <Field label="Город"><Input value={v.city} onChange={set('city')} /></Field>}
      </div>
    </Modal>
  )
}
