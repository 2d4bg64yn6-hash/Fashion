import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore } from '../store'
import { ORDER_STATUSES, orderTotal, isOrderPaid, type OrderStatus } from '../data'
import { useNav } from '../App'
import { DocEditor } from '../components/DocEditor'
import { DocDrawer, StatusSelect, LinesSummary } from '../components/DocParts'
import { Button, Card, Empty, PageHeader, SearchInput, Table, Tabs, Td, Th, Tr, date, money } from '../components/ui'

export default function Sales() {
  const s = useStore()
  const { intent, clearIntent } = useNav()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'all' | OrderStatus>('all')
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (intent === 'new') setCreating(true)
    if (intent?.startsWith('open:')) setOpenId(intent.slice(5))
    if (intent) clearIntent()
  }, [intent, clearIntent])

  const list = s.orders
    .filter((o) => (tab === 'all' || o.status === tab) && `${o.number} ${s.clientName(o.clientId)}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))
  const opened = s.orders.find((o) => o.id === openId)

  return (
    <>
      <PageHeader
        title="Продажи"
        subtitle="Заказы покупателей"
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>Новый заказ</Button>}
      />
      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: 'all', label: 'Все', count: s.orders.length },
              ...ORDER_STATUSES.map((st) => ({ id: st, label: st, count: s.orders.filter((o) => o.status === st).length })),
            ]}
          />
          <div className="ml-auto w-full sm:w-auto"><SearchInput value={q} onChange={setQ} placeholder="№ заказа или клиент" /></div>
        </div>
        <Table>
          <thead>
            <tr><Th>№</Th><Th>Клиент</Th><Th>Товары</Th><Th right>Сумма</Th><Th>Статус</Th><Th>Дата</Th></tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <Tr key={o.id} onClick={() => setOpenId(o.id)}>
                <Td className="font-medium whitespace-nowrap text-brand-300">{o.number}</Td>
                <Td className="whitespace-nowrap">{s.clientName(o.clientId)}</Td>
                <Td className="max-w-[320px] text-slate-500"><LinesSummary lines={o.lines} /></Td>
                <Td right className="font-medium whitespace-nowrap">{money(orderTotal(o.lines))}</Td>
                <Td><StatusSelect value={o.status} options={ORDER_STATUSES} onChange={(st) => s.setOrderStatus(o.id, st)} /></Td>
                <Td className="whitespace-nowrap text-slate-500">{date(o.date)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {!list.length && <Empty text="Заказов не найдено" />}
      </Card>

      {creating && (
        <DocEditor
          title="Новый заказ покупателя"
          partyLabel="Клиент"
          parties={s.clients.map((c) => ({ id: c.id, name: c.company }))}
          statuses={ORDER_STATUSES}
          priceKey="price"
          checkStock
          onClose={() => setCreating(false)}
          onSave={(d) => { s.addOrder({ clientId: d.partyId, lines: d.lines, status: d.status }); setCreating(false) }}
        />
      )}

      {opened && (
        <DocDrawer
          title={`Заказ ${opened.number}`}
          partyLabel="Клиент"
          partyName={s.clientName(opened.clientId)}
          date={opened.date}
          lines={opened.lines}
          status={opened.status}
          statuses={ORDER_STATUSES}
          onStatus={(st) => s.setOrderStatus(opened.id, st)}
          notes={[
            isOrderPaid(opened) ? '✓ Оплата получена — операция в разделе «Финансы»' : 'Ожидает оплаты — учитывается в дебиторской задолженности',
            opened.shipped ? '✓ Товар списан с Основного склада' : 'При статусе «Отгружен» товар спишется с Основного склада',
          ]}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  )
}
