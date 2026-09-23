import { useMemo, useState } from 'react'
import { TrendingUp, ShoppingBag, Boxes, Coins, HandCoins, ArrowRight, AlertTriangle } from 'lucide-react'
import { useStore, totalStock, stockStatus, receivables } from '../store'
import { orderTotal } from '../data'
import { useNav } from '../App'
import { BarChart } from '../components/Chart'
import { Button, Card, CardHeader, Kpi, PageHeader, StatusBadge, Table, Tabs, Td, Th, Tr, date, money, num } from '../components/ui'

const DAY = 86_400_000

export default function Dashboard() {
  const s = useStore()
  const { go } = useNav()
  const [period, setPeriod] = useState<'14' | '30' | '60'>('30')

  const inPeriod = (iso: string, days: number, offset = 0) => {
    const age = (Date.now() - new Date(iso).getTime()) / DAY
    return age >= offset && age < days + offset
  }
  const month = s.orders.filter((o) => inPeriod(o.date, 30))
  const prevMonth = s.orders.filter((o) => inPeriod(o.date, 30, 30))
  const monthSum = month.reduce((a, o) => a + orderTotal(o.lines), 0)
  const prevSum = prevMonth.reduce((a, o) => a + orderTotal(o.lines), 0)
  const growth = prevSum ? ((monthSum - prevSum) / prevSum) * 100 : 0
  const units = s.products.reduce((a, p) => a + totalStock(p), 0)
  const stockValue = s.products.reduce((a, p) => a + totalStock(p) * p.cost, 0)
  const debt = receivables(s.orders)

  const chart = useMemo(() => {
    const days = +period
    return Array.from({ length: days }, (_, i) => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - (days - 1 - i))
      const value = s.orders
        .filter((o) => {
          const od = new Date(o.date)
          od.setHours(0, 0, 0, 0)
          return od.getTime() === d.getTime()
        })
        .reduce((a, o) => a + orderTotal(o.lines), 0)
      return { label: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }), value }
    })
  }, [s.orders, period])
  const chartSum = chart.reduce((a, d) => a + d.value, 0)

  const recent = [...s.orders].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7)
  const low = s.products.filter((p) => stockStatus(p) !== 'В наличии').sort((a, b) => totalStock(a) - totalStock(b))

  return (
    <>
      <PageHeader title="Дашборд" subtitle="Сводка по продажам, складу и расчётам" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Kpi
          label="Продажи за месяц"
          value={money(monthSum)}
          icon={TrendingUp}
          tone="blue"
          hint={<span className={growth >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{growth >= 0 ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}% к прошлому месяцу</span>}
        />
        <Kpi label="Заказы" value={num(month.length)} icon={ShoppingBag} tone="violet" hint={`${s.orders.filter((o) => o.status === 'Новый').length} новых ждут обработки`} />
        <Kpi label="Товаров на складе" value={`${num(units)} шт.`} icon={Boxes} tone="teal" hint={`${s.products.length} позиций в каталоге`} />
        <Kpi label="Сумма остатков" value={money(stockValue)} icon={Coins} tone="green" hint="по себестоимости" />
        <Kpi label="Дебиторская задолженность" value={money(debt)} icon={HandCoins} tone="amber" hint="неоплаченные заказы" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Продажи за период"
            subtitle={`${money(chartSum)} за ${period} дней`}
            action={
              <Tabs
                value={period}
                onChange={setPeriod}
                items={[{ id: '14', label: '14 дн' }, { id: '30', label: '30 дн' }, { id: '60', label: '60 дн' }]}
              />
            }
          />
          <BarChart data={chart} />
        </Card>

        <Card pad={false} className="flex flex-col">
          <div className="p-5 pb-3">
            <CardHeader
              title="Низкий остаток"
              subtitle="Нужно заказать у поставщика"
              action={<AlertTriangle size={18} className="text-amber-500" />}
            />
          </div>
          <ul className="flex-1 divide-y divide-slate-100 overflow-y-auto" style={{ maxHeight: 300 }}>
            {low.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.sku} · мин. {p.minStock} шт.</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold whitespace-nowrap tabular ${totalStock(p) === 0 ? 'text-rose-600' : 'text-amber-600'}`}>{totalStock(p)} шт.</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 p-3">
            <Button variant="ghost" className="w-full" onClick={() => go('purchases', 'new')}>
              Создать закупку <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      </div>

      <Card pad={false} className="mt-6">
        <div className="p-5 pb-1">
          <CardHeader title="Последние заказы" action={<Button variant="ghost" size="sm" onClick={() => go('sales')}>Все заказы <ArrowRight size={14} /></Button>} />
        </div>
        <Table>
          <thead>
            <tr><Th>Номер</Th><Th>Клиент</Th><Th right>Сумма</Th><Th>Статус</Th><Th>Дата</Th></tr>
          </thead>
          <tbody>
            {recent.map((o) => (
              <Tr key={o.id} onClick={() => go('sales', `open:${o.id}`)}>
                <Td className="font-medium text-brand-700">{o.number}</Td>
                <Td>{s.clientName(o.clientId)}</Td>
                <Td right className="font-medium">{money(orderTotal(o.lines))}</Td>
                <Td><StatusBadge status={o.status} /></Td>
                <Td className="text-slate-500">{date(o.date)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </>
  )
}
