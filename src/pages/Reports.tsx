import { useState } from 'react'
import { PackageSearch, PieChart, Boxes, ArrowLeftRight, HandCoins } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore, totalStock, stockStatus, clientDebt } from '../store'
import { CATEGORIES, orderTotal, isOrderPaid, warehouseName } from '../data'
import { HBars } from '../components/Chart'
import { Card, CardHeader, StatusBadge, Table, Td, Th, Tr, cx, date, dateTime, money } from '../components/ui'
import { PageHeader } from '../components/ui'

type ReportId = 'byProduct' | 'byCategory' | 'stock' | 'moves' | 'debts'
const REPORTS: { id: ReportId; title: string; desc: string; icon: LucideIcon }[] = [
  { id: 'byProduct', title: 'Продажи по товарам', desc: 'Выручка и количество по каждой позиции', icon: PackageSearch },
  { id: 'byCategory', title: 'Продажи по категориям', desc: 'Какие группы товаров приносят выручку', icon: PieChart },
  { id: 'stock', title: 'Остатки на складе', desc: 'Количество и стоимость остатков', icon: Boxes },
  { id: 'moves', title: 'Движение товаров', desc: 'Приход, расход, перемещения, списания', icon: ArrowLeftRight },
  { id: 'debts', title: 'Дебиторская задолженность', desc: 'Кто и сколько должен', icon: HandCoins },
]

export default function Reports() {
  const s = useStore()
  const [active, setActive] = useState<ReportId>('byProduct')

  const sold = s.products
    .map((p) => {
      const lines = s.orders.flatMap((o) => o.lines.filter((l) => l.productId === p.id))
      return { p, qty: lines.reduce((a, l) => a + l.qty, 0), sum: lines.reduce((a, l) => a + l.qty * l.price, 0), profit: lines.reduce((a, l) => a + l.qty * (l.price - p.cost), 0) }
    })
    .sort((a, b) => b.sum - a.sum)

  const byCat = CATEGORIES.map((c) => ({ label: c, value: sold.filter((x) => x.p.category === c).reduce((a, x) => a + x.sum, 0) })).sort((a, b) => b.value - a.value)
  const catTotal = byCat.reduce((a, c) => a + c.value, 0)

  return (
    <>
      <PageHeader title="Отчёты" subtitle="Аналитика по продажам, складу и расчётам" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {REPORTS.map((r) => (
          <button
            key={r.id}
            onClick={() => setActive(r.id)}
            className={cx(
              'cursor-pointer rounded-2xl border bg-surface p-4 text-left transition hover:shadow-md',
              active === r.id ? 'border-brand-500 ring-3 ring-brand-100' : 'border-slate-200/80',
            )}
          >
            <span className={cx('grid size-9 place-items-center rounded-xl', active === r.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')}><r.icon size={18} /></span>
            <p className="mt-3 text-sm font-semibold text-slate-900">{r.title}</p>
            <p className="mt-0.5 text-xs text-slate-500">{r.desc}</p>
          </button>
        ))}
      </div>

      <Card pad={false} className="mt-6">
        <div className="p-5 pb-1"><CardHeader title={REPORTS.find((r) => r.id === active)!.title} subtitle="Период: последние 60 дней" /></div>

        {active === 'byProduct' && (
          <Table>
            <thead><tr><Th>Товар</Th><Th>Категория</Th><Th right>Продано, шт.</Th><Th right>Выручка</Th><Th right>Валовая прибыль</Th></tr></thead>
            <tbody>
              {sold.map((x) => (
                <Tr key={x.p.id}>
                  <Td className="font-medium">{x.p.name}</Td>
                  <Td className="text-slate-500">{x.p.category}</Td>
                  <Td right>{x.qty}</Td>
                  <Td right className="font-medium">{money(x.sum)}</Td>
                  <Td right className="text-emerald-600">{money(x.profit)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}

        {active === 'byCategory' && (
          <div className="p-5 pt-2">
            <HBars data={byCat.map((c) => ({ ...c, sub: catTotal ? `${Math.round((c.value / catTotal) * 100)}%` : '' }))} />
          </div>
        )}

        {active === 'stock' && (
          <Table>
            <thead><tr><Th>Товар</Th><Th right>Остаток, шт.</Th><Th right>Себестоимость</Th><Th right>Стоимость остатка</Th><Th right>В ценах продажи</Th><Th>Статус</Th></tr></thead>
            <tbody>
              {[...s.products].sort((a, b) => totalStock(b) * b.cost - totalStock(a) * a.cost).map((p) => (
                <Tr key={p.id}>
                  <Td className="font-medium">{p.name}</Td>
                  <Td right>{totalStock(p)}</Td>
                  <Td right className="text-slate-500">{money(p.cost)}</Td>
                  <Td right className="font-medium">{money(totalStock(p) * p.cost)}</Td>
                  <Td right className="text-slate-600">{money(totalStock(p) * p.price)}</Td>
                  <Td><StatusBadge status={stockStatus(p)} /></Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}

        {active === 'moves' && (
          <Table>
            <thead><tr><Th>Дата</Th><Th>Операция</Th><Th>Товар</Th><Th right>Кол-во</Th><Th>Склад</Th><Th>Основание</Th></tr></thead>
            <tbody>
              {[...s.movements].sort((a, b) => b.date.localeCompare(a.date)).map((m) => (
                <Tr key={m.id}>
                  <Td className="whitespace-nowrap text-slate-500">{dateTime(m.date)}</Td>
                  <Td><StatusBadge status={m.type} /></Td>
                  <Td className="font-medium">{s.product(m.productId)?.name}</Td>
                  <Td right>{m.type === 'Приход' ? '+' : m.type === 'Перемещение' ? '' : '−'}{m.qty}</Td>
                  <Td className="whitespace-nowrap text-slate-600">{[m.from, m.to].filter(Boolean).map((w) => warehouseName(w!)).join(' → ')}</Td>
                  <Td className="text-slate-500">{m.comment || '—'}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}

        {active === 'debts' && (
          <Table>
            <thead><tr><Th>Клиент</Th><Th>Неоплаченные заказы</Th><Th>Старейший</Th><Th right>Сумма долга</Th></tr></thead>
            <tbody>
              {s.clients
                .map((c) => ({ c, debt: clientDebt(s.orders, c.id), unpaid: s.orders.filter((o) => o.clientId === c.id && !isOrderPaid(o)) }))
                .filter((x) => x.debt > 0)
                .sort((a, b) => b.debt - a.debt)
                .map(({ c, debt, unpaid }) => (
                  <Tr key={c.id}>
                    <Td className="font-medium">{c.company}</Td>
                    <Td className="text-slate-500">{unpaid.map((o) => o.number).join(', ')}</Td>
                    <Td className="text-slate-500">{date(unpaid.map((o) => o.date).sort()[0])}</Td>
                    <Td right className="font-semibold text-amber-600">{money(debt)}</Td>
                  </Tr>
                ))}
            </tbody>
          </Table>
        )}
        <div className="h-2" />
      </Card>
      <p className="mt-3 text-xs text-slate-400">Сумма заказов в отчёте: {money(s.orders.reduce((a, o) => a + orderTotal(o.lines), 0))}</p>
    </>
  )
}
