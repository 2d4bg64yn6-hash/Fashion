import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { useStore, payables } from '../store'
import { PURCHASE_STATUSES, orderTotal, type PurchaseStatus } from '../data'
import { useNav } from '../App'
import { DocEditor } from '../components/DocEditor'
import { DocDrawer, StatusSelect, LinesSummary } from '../components/DocParts'
import { Button, Card, Empty, PageHeader, SearchInput, Table, Tabs, Td, Th, Tr, date, money } from '../components/ui'

export default function Purchases() {
  const s = useStore()
  const { intent, clearIntent } = useNav()
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'all' | PurchaseStatus>('all')
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    if (intent === 'new') setCreating(true)
    if (intent?.startsWith('open:')) setOpenId(intent.slice(5))
    if (intent) clearIntent()
  }, [intent, clearIntent])

  const list = s.purchases
    .filter((p) => (tab === 'all' || p.status === tab) && `${p.number} ${s.supplierName(p.supplierId)}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date))
  const opened = s.purchases.find((p) => p.id === openId)

  return (
    <>
      <PageHeader
        title="Закупки"
        subtitle={`Заказы поставщикам · к оплате ${money(payables(s.purchases))}`}
        actions={<Button icon={Plus} onClick={() => setCreating(true)}>Новая закупка</Button>}
      />
      <Card pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { id: 'all', label: 'Все', count: s.purchases.length },
              ...PURCHASE_STATUSES.map((st) => ({ id: st, label: st, count: s.purchases.filter((p) => p.status === st).length })),
            ]}
          />
          <div className="ml-auto w-full sm:w-auto"><SearchInput value={q} onChange={setQ} placeholder="№ или поставщик" /></div>
        </div>
        <Table>
          <thead>
            <tr><Th>№</Th><Th>Поставщик</Th><Th>Товары</Th><Th right>Сумма</Th><Th>Статус</Th><Th>Дата</Th></tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <Tr key={p.id} onClick={() => setOpenId(p.id)}>
                <Td className="font-medium whitespace-nowrap text-brand-700">{p.number}</Td>
                <Td className="whitespace-nowrap">{s.supplierName(p.supplierId)}</Td>
                <Td className="max-w-[320px] text-slate-500"><LinesSummary lines={p.lines} /></Td>
                <Td right className="font-medium whitespace-nowrap">{money(orderTotal(p.lines))}</Td>
                <Td><StatusSelect value={p.status} options={PURCHASE_STATUSES} onChange={(st) => s.setPurchaseStatus(p.id, st)} /></Td>
                <Td className="whitespace-nowrap text-slate-500">{date(p.date)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {!list.length && <Empty text="Закупок не найдено" />}
      </Card>

      {creating && (
        <DocEditor
          title="Новый заказ поставщику"
          partyLabel="Поставщик"
          parties={s.suppliers.map((c) => ({ id: c.id, name: c.company }))}
          statuses={PURCHASE_STATUSES}
          priceKey="cost"
          onClose={() => setCreating(false)}
          onSave={(d) => { s.addPurchase({ supplierId: d.partyId, lines: d.lines, status: d.status }); setCreating(false) }}
        />
      )}

      {opened && (
        <DocDrawer
          title={`Закупка ${opened.number}`}
          partyLabel="Поставщик"
          partyName={s.supplierName(opened.supplierId)}
          date={opened.date}
          lines={opened.lines}
          status={opened.status}
          statuses={PURCHASE_STATUSES}
          onStatus={(st) => s.setPurchaseStatus(opened.id, st)}
          notes={[opened.received ? '✓ Товар оприходован на Основной склад, оплата проведена в «Финансах»' : 'При статусе «Получен» товар поступит на Основной склад']}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  )
}
