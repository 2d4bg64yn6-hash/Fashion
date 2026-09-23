import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import * as demo from './data'
import type {
  Client, DocLine, FinanceOp, Movement, MovementType, Order, OrderStatus, Product, Purchase, PurchaseStatus, Supplier, WarehouseId,
} from './data'
import { isOrderPaid, orderTotal } from './data'

interface State {
  products: Product[]
  clients: Client[]
  suppliers: Supplier[]
  orders: Order[]
  purchases: Purchase[]
  movements: Movement[]
  financeOps: FinanceOp[]
}

const STORAGE_KEY = 'autosklad-demo-v1'

const initialState = (): State => ({
  products: demo.products,
  clients: demo.clients,
  suppliers: demo.suppliers,
  orders: demo.orders,
  purchases: demo.purchases,
  movements: demo.movements,
  financeOps: demo.financeOps,
})

const load = (): State => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return initialState()
}

const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const now = () => new Date().toISOString()

export interface Toast { id: number; text: string; tone: 'success' | 'error' }

export interface StockOp {
  type: MovementType
  productId: string
  qty: number
  from?: WarehouseId
  to?: WarehouseId
  comment: string
}

function useStoreValue() {
  const [state, setState] = useState<State>(load)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
  }, [state])

  const notify = (text: string, tone: Toast['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200)
  }

  const clientName = (id: string) => state.clients.find((c) => c.id === id)?.company ?? '—'
  const supplierName = (id: string) => state.suppliers.find((s) => s.id === id)?.company ?? '—'
  const product = (id: string) => state.products.find((p) => p.id === id)

  // Применить изменения остатков: список [productId, warehouse, delta]
  const applyStock = (products: Product[], changes: [string, WarehouseId, number][]) =>
    products.map((p) => {
      const mine = changes.filter((c) => c[0] === p.id)
      if (!mine.length) return p
      const stock = { ...p.stock }
      mine.forEach(([, w, d]) => (stock[w] = Math.max(0, stock[w] + d)))
      return { ...p, stock }
    })

  // ---------- Товары ----------
  const addProduct = (p: Omit<Product, 'id'>) => {
    setState((s) => ({ ...s, products: [{ ...p, id: uid('p') }, ...s.products] }))
    notify(`Товар «${p.name}» добавлен`)
  }
  const updateProduct = (p: Product) => {
    setState((s) => ({ ...s, products: s.products.map((x) => (x.id === p.id ? p : x)) }))
    notify('Изменения сохранены')
  }

  // ---------- Склад ----------
  const stockOperation = (op: StockOp): string | null => {
    const p = product(op.productId)
    if (!p) return 'Выберите товар'
    if (op.qty <= 0) return 'Количество должно быть больше нуля'
    if (op.from && p.stock[op.from] < op.qty) return `Недостаточно товара: на складе ${p.stock[op.from]} шт.`
    if (op.type === 'Перемещение' && op.from === op.to) return 'Склады должны отличаться'
    const changes: [string, WarehouseId, number][] = []
    if (op.from) changes.push([op.productId, op.from, -op.qty])
    if (op.to) changes.push([op.productId, op.to, op.qty])
    setState((s) => ({
      ...s,
      products: applyStock(s.products, changes),
      movements: [{ id: uid('m'), date: now(), ...op }, ...s.movements],
    }))
    notify(`${op.type}: ${p.name} — ${op.qty} шт.`)
    return null
  }

  // ---------- Продажи ----------
  const addOrder = (o: { clientId: string; lines: DocLine[]; status: OrderStatus; comment?: string }) => {
    const number = `ЗК-${1001 + state.orders.length}`
    const order: Order = { id: uid('o'), number, date: now(), shipped: false, ...o }
    // setOrderStatus с fresh вставляет заказ и применяет эффекты статуса (оплата/отгрузка)
    setOrderStatus(order.id, o.status, order)
    notify(`Заказ ${number} создан`)
  }

  const setOrderStatus = (id: string, status: OrderStatus, fresh?: Order) => {
    setState((s) => {
      const o = fresh ?? s.orders.find((x) => x.id === id)
      if (!o) return s
      const updated: Order = { ...o, status }
      let products = s.products
      let movements = s.movements
      let financeOps = s.financeOps
      const client = s.clients.find((c) => c.id === o.clientId)?.company ?? ''
      // Оплата → приход денег
      if (isOrderPaid(updated) && !financeOps.some((f) => f.id === `f-${o.id}`)) {
        financeOps = [
          { id: `f-${o.id}`, date: now(), kind: 'income', category: 'Оплата от покупателя', counterparty: client, amount: orderTotal(o.lines), comment: `Оплата по ${o.number}` },
          ...financeOps,
        ]
      }
      // Отгрузка → списание со склада
      if ((status === 'Отгружен' || status === 'Завершён') && !o.shipped) {
        updated.shipped = true
        const changes: [string, WarehouseId, number][] = o.lines.map((l) => [l.productId, 'main', -l.qty])
        products = applyStock(products, changes)
        movements = [
          ...o.lines.map<Movement>((l) => ({ id: uid('m'), type: 'Расход', productId: l.productId, qty: l.qty, from: 'main', date: now(), comment: `Отгрузка по ${o.number}` })),
          ...movements,
        ]
      }
      const exists = s.orders.some((x) => x.id === id)
      const orders = exists ? s.orders.map((x) => (x.id === id ? updated : x)) : [updated, ...s.orders]
      return { ...s, orders, products, movements, financeOps }
    })
    if (!fresh) notify(`Статус изменён: ${status}`)
  }

  // ---------- Закупки ----------
  const addPurchase = (p: { supplierId: string; lines: DocLine[]; status: PurchaseStatus }) => {
    const number = `ЗП-${501 + state.purchases.length}`
    const purchase: Purchase = { id: uid('pu'), number, date: now(), received: false, ...p }
    setPurchaseStatus(purchase.id, p.status, purchase)
    notify(`Закупка ${number} создана`)
  }

  const setPurchaseStatus = (id: string, status: PurchaseStatus, fresh?: Purchase) => {
    setState((s) => {
      const p = fresh ?? s.purchases.find((x) => x.id === id)
      if (!p) return s
      const updated: Purchase = { ...p, status }
      let products = s.products
      let movements = s.movements
      let financeOps = s.financeOps
      if (status === 'Получен' && !p.received) {
        updated.received = true
        products = applyStock(products, p.lines.map((l) => [l.productId, 'main', l.qty]))
        movements = [
          ...p.lines.map<Movement>((l) => ({ id: uid('m'), type: 'Приход', productId: l.productId, qty: l.qty, to: 'main', date: now(), comment: `Поступление по ${p.number}` })),
          ...movements,
        ]
        financeOps = [
          { id: `f-${p.id}`, date: now(), kind: 'expense', category: 'Оплата поставщику', counterparty: s.suppliers.find((x) => x.id === p.supplierId)?.company ?? '', amount: orderTotal(p.lines), comment: `Оплата по ${p.number}` },
          ...financeOps,
        ]
      }
      const exists = s.purchases.some((x) => x.id === id)
      const purchases = exists ? s.purchases.map((x) => (x.id === id ? updated : x)) : [updated, ...s.purchases]
      return { ...s, purchases, products, movements, financeOps }
    })
    if (!fresh) notify(status === 'Получен' ? 'Товар оприходован на Основной склад' : `Статус изменён: ${status}`)
  }

  // ---------- Контрагенты ----------
  const addClient = (c: Omit<Client, 'id'>) => {
    setState((s) => ({ ...s, clients: [{ ...c, id: uid('c') }, ...s.clients] }))
    notify(`Клиент «${c.company}» добавлен`)
  }
  const addSupplier = (c: Omit<Supplier, 'id'>) => {
    setState((s) => ({ ...s, suppliers: [{ ...c, id: uid('s') }, ...s.suppliers] }))
    notify(`Поставщик «${c.company}» добавлен`)
  }

  // ---------- Финансы ----------
  const addFinanceOp = (f: Omit<FinanceOp, 'id' | 'date'>) => {
    setState((s) => ({ ...s, financeOps: [{ ...f, id: uid('f'), date: now() }, ...s.financeOps] }))
    notify('Операция добавлена')
  }

  const resetDemo = () => {
    setState(initialState())
    notify('Демо-данные сброшены')
  }

  return {
    ...state,
    toasts,
    notify,
    clientName,
    supplierName,
    product,
    addProduct,
    updateProduct,
    stockOperation,
    addOrder,
    setOrderStatus: (id: string, status: OrderStatus) => setOrderStatus(id, status),
    addPurchase,
    setPurchaseStatus: (id: string, status: PurchaseStatus) => setPurchaseStatus(id, status),
    addClient,
    addSupplier,
    addFinanceOp,
    resetDemo,
  }
}

export type Store = ReturnType<typeof useStoreValue>
const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => useContext(StoreContext)!

// ---------- производные показатели ----------
export const totalStock = (p: Product) => p.stock.main + p.stock.second
export type StockStatus = 'В наличии' | 'Мало' | 'Нет в наличии'
export const stockStatus = (p: Product): StockStatus => {
  const t = totalStock(p)
  if (t === 0) return 'Нет в наличии'
  if (t <= p.minStock) return 'Мало'
  return 'В наличии'
}
export const clientDebt = (orders: Order[], clientId: string) =>
  orders.filter((o) => o.clientId === clientId && !isOrderPaid(o)).reduce((s, o) => s + orderTotal(o.lines), 0)
export const receivables = (orders: Order[]) => orders.filter((o) => !isOrderPaid(o)).reduce((s, o) => s + orderTotal(o.lines), 0)
export const payables = (purchases: Purchase[]) =>
  purchases.filter((p) => p.status === 'Заказан' || p.status === 'В пути').reduce((s, p) => s + orderTotal(p.lines), 0)
