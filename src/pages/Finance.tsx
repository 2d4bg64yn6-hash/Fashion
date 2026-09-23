import { useState } from 'react'
import { Plus, ArrowDownLeft, ArrowUpRight, HandCoins, Landmark, Scale } from 'lucide-react'
import { useStore, payables, receivables } from '../store'
import { HBars } from '../components/Chart'
import { Button, Card, CardHeader, Field, Input, Kpi, Modal, PageHeader, Select, Table, Tabs, Td, Th, Tr, cx, date, money } from '../components/ui'

const OPENING_BALANCE = 12_000_000 // остаток на счёте на начало периода (демо)
const EXPENSE_CATS = ['Оплата поставщику', 'Аренда', 'Зарплата', 'Коммунальные', 'Доставка', 'Реклама', 'Прочее']
const INCOME_CATS = ['Оплата от покупателя', 'Прочий доход']

export default function Finance() {
  const s = useStore()
  const [tab, setTab] = useState<'all' | 'income' | 'expense'>('all')
  const [adding, setAdding] = useState(false)

  const income = s.financeOps.filter((f) => f.kind === 'income').reduce((a, f) => a + f.amount, 0)
  const expense = s.financeOps.filter((f) => f.kind === 'expense').reduce((a, f) => a + f.amount, 0)
  const balance = OPENING_BALANCE + income - expense
  const ops = s.financeOps.filter((f) => tab === 'all' || f.kind === tab).sort((a, b) => b.date.localeCompare(a.date))

  const byCat = EXPENSE_CATS.map((c) => ({ label: c, value: s.financeOps.filter((f) => f.kind === 'expense' && f.category === c).reduce((a, f) => a + f.amount, 0) }))
    .filter((x) => x.value > 0)
    .sort((a, b) => b.value - a.value)

  return (
    <>
      <PageHeader title="Финансы" subtitle="Деньги, расчёты с покупателями и поставщиками" actions={<Button icon={Plus} onClick={() => setAdding(true)}>Добавить операцию</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Kpi label="Доходы" value={money(income)} icon={ArrowDownLeft} tone="green" hint="поступления за 60 дней" />
        <Kpi label="Расходы" value={money(expense)} icon={ArrowUpRight} tone="red" hint="платежи за 60 дней" />
        <Kpi label="Дебиторка" value={money(receivables(s.orders))} icon={HandCoins} tone="amber" hint="нам должны покупатели" />
        <Kpi label="Кредиторка" value={money(payables(s.purchases))} icon={Landmark} tone="violet" hint="мы должны поставщикам" />
        <Kpi label="Баланс" value={money(balance)} icon={Scale} tone="blue" hint={`на начало: ${money(OPENING_BALANCE)}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card pad={false} className="xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <h3 className="text-[15px] font-semibold text-slate-900">Операции</h3>
            <Tabs value={tab} onChange={setTab} items={[{ id: 'all', label: 'Все' }, { id: 'income', label: 'Доходы' }, { id: 'expense', label: 'Расходы' }]} />
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            <Table>
              <thead><tr><Th>Дата</Th><Th>Статья</Th><Th>Контрагент</Th><Th right>Сумма</Th></tr></thead>
              <tbody>
                {ops.map((f) => (
                  <Tr key={f.id}>
                    <Td className="whitespace-nowrap text-slate-500">{date(f.date)}</Td>
                    <Td className="whitespace-nowrap">{f.category}</Td>
                    <Td>
                      <div className="text-slate-700">{f.counterparty}</div>
                      {f.comment && <div className="text-xs text-slate-400">{f.comment}</div>}
                    </Td>
                    <Td right className={cx('font-medium whitespace-nowrap', f.kind === 'income' ? 'text-emerald-600' : 'text-rose-600')}>
                      {f.kind === 'income' ? '+' : '−'} {money(f.amount)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
        <Card>
          <CardHeader title="Структура расходов" />
          <HBars data={byCat} />
        </Card>
      </div>

      {adding && <FinanceForm onClose={() => setAdding(false)} />}
    </>
  )
}

function FinanceForm({ onClose }: { onClose: () => void }) {
  const s = useStore()
  const [kind, setKind] = useState<'income' | 'expense'>('expense')
  const [category, setCategory] = useState(EXPENSE_CATS[1])
  const [counterparty, setCounterparty] = useState('')
  const [amount, setAmount] = useState(0)
  const [comment, setComment] = useState('')
  const [err, setErr] = useState('')
  const cats = kind === 'income' ? INCOME_CATS : EXPENSE_CATS
  const save = () => {
    if (amount <= 0) return setErr('Укажите сумму')
    s.addFinanceOp({ kind, category, counterparty: counterparty || '—', amount, comment })
    onClose()
  }
  return (
    <Modal title="Новая операция" onClose={onClose} footer={<><span className="mr-auto self-center text-sm text-rose-600">{err}</span><Button variant="secondary" onClick={onClose}>Отмена</Button><Button onClick={save}>Сохранить</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Тип">
          <Select value={kind} onChange={(e) => { const k = e.target.value as 'income' | 'expense'; setKind(k); setCategory((k === 'income' ? INCOME_CATS : EXPENSE_CATS)[0]) }}>
            <option value="income">Доход</option>
            <option value="expense">Расход</option>
          </Select>
        </Field>
        <Field label="Статья">
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>{cats.map((c) => <option key={c}>{c}</option>)}</Select>
        </Field>
        <Field label="Контрагент"><Input value={counterparty} onChange={(e) => setCounterparty(e.target.value)} /></Field>
        <Field label="Сумма, ₸"><Input type="number" min={0} value={amount} onChange={(e) => { setAmount(+e.target.value); setErr('') }} /></Field>
        <Field label="Комментарий" className="sm:col-span-2"><Input value={comment} onChange={(e) => setComment(e.target.value)} /></Field>
      </div>
    </Modal>
  )
}
