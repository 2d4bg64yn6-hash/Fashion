// Демонстрационные (вымышленные) данные прототипа.

export type WarehouseId = 'main' | 'second'
export const WAREHOUSES: { id: WarehouseId; name: string }[] = [
  { id: 'main', name: 'Основной склад' },
  { id: 'second', name: 'Склад №2' },
]
export const warehouseName = (id: WarehouseId) => WAREHOUSES.find((w) => w.id === id)!.name

export const CATEGORIES = [
  'Тормозные колодки',
  'Масляные фильтры',
  'Воздушные фильтры',
  'Свечи зажигания',
  'Амортизаторы',
  'Аккумуляторы',
  'Масла',
  'Ремни ГРМ',
  'Диски',
  'Фары',
] as const
export type Category = (typeof CATEGORIES)[number]

export interface Product {
  id: string
  sku: string
  name: string
  category: Category
  price: number
  cost: number
  stock: Record<WarehouseId, number>
  minStock: number
  supplierId: string
  description: string
}

export interface Client {
  id: string
  company: string
  contact: string
  phone: string
  email: string
  city: string
}

export interface Supplier {
  id: string
  company: string
  contact: string
  phone: string
  email: string
}

export interface DocLine {
  productId: string
  qty: number
  price: number
}

export const ORDER_STATUSES = ['Новый', 'В обработке', 'Оплачен', 'Отгружен', 'Завершён'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const PURCHASE_STATUSES = ['Черновик', 'Заказан', 'В пути', 'Получен'] as const
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number]

export interface Order {
  id: string
  number: string
  clientId: string
  lines: DocLine[]
  status: OrderStatus
  date: string // ISO
  shipped: boolean // списан ли товар со склада
  comment?: string
}

export interface Purchase {
  id: string
  number: string
  supplierId: string
  lines: DocLine[]
  status: PurchaseStatus
  date: string
  received: boolean // оприходован ли товар
}

export type MovementType = 'Приход' | 'Расход' | 'Перемещение' | 'Списание'
export interface Movement {
  id: string
  type: MovementType
  productId: string
  qty: number
  from?: WarehouseId
  to?: WarehouseId
  date: string
  comment: string
}

export interface FinanceOp {
  id: string
  date: string
  kind: 'income' | 'expense'
  category: string
  counterparty: string
  amount: number
  comment: string
}

// ---------- генерация ----------

let seed = 42
const rnd = () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)]
const daysAgo = (d: number, hour = 10) => {
  const dt = new Date()
  dt.setDate(dt.getDate() - d)
  dt.setHours(hour, Math.floor(rnd() * 60), 0, 0)
  return dt.toISOString()
}

export const suppliers: Supplier[] = [
  { id: 's1', company: 'ТОО «АвтоДеталь Импорт»', contact: 'Ержан Сапаров', phone: '+7 701 555 12 40', email: 'sales@avtodetal.kz' },
  { id: 's2', company: 'ООО «ФильтрПро»', contact: 'Игорь Малахов', phone: '+7 702 318 44 09', email: 'order@filterpro.ru' },
  { id: 's3', company: 'ТОО «Energy Battery»', contact: 'Айгерим Нуркенова', phone: '+7 705 221 90 17', email: 'b2b@energybat.kz' },
  { id: 's4', company: 'ТОО «Лубрикант Трейд»', contact: 'Павел Орлов', phone: '+7 707 640 33 81', email: 'opt@lubtrade.kz' },
  { id: 's5', company: 'ТОО «Свет и Ход»', contact: 'Дамир Ахметов', phone: '+7 747 102 58 66', email: 'info@svetihod.kz' },
]

type P = [string, string, Category, number, number, number, number, number, string, string]
const productRows: P[] = [
  ['BP-1001', 'Колодки тормозные передние Toyota Camry 70', 'Тормозные колодки', 18500, 11200, 34, 12, 10, 's1', 'Керамические колодки, низкий уровень шума и пыли. Комплект на ось.'],
  ['BP-1002', 'Колодки тормозные задние Hyundai Tucson', 'Тормозные колодки', 14200, 8400, 6, 2, 10, 's1', 'Полуметаллические, с датчиком износа. Комплект на ось.'],
  ['BP-1003', 'Колодки тормозные передние Kia Rio 4', 'Тормозные колодки', 11900, 6900, 22, 8, 8, 's1', 'Оригинальное качество, сертификат ECE R90.'],
  ['OF-2001', 'Фильтр масляный Toyota 90915-YZZE1', 'Масляные фильтры', 3200, 1650, 52, 20, 20, 's2', 'Подходит для большинства бензиновых двигателей Toyota и Lexus.'],
  ['OF-2002', 'Фильтр масляный Hyundai/Kia 26300-35505', 'Масляные фильтры', 2900, 1450, 14, 3, 20, 's2', 'Фильтр с противодренажным клапаном.'],
  ['AF-3001', 'Фильтр воздушный Toyota RAV4 2.0/2.5', 'Воздушные фильтры', 5400, 2900, 28, 10, 10, 's2', 'Многослойный фильтрующий материал, высокая пылеёмкость.'],
  ['AF-3002', 'Фильтр воздушный VW Polo Sedan', 'Воздушные фильтры', 4100, 2100, 3, 0, 8, 's2', 'Размер 294×160×50 мм.'],
  ['SP-4001', 'Свеча зажигания NGK Iridium IX', 'Свечи зажигания', 4800, 2600, 120, 40, 40, 's1', 'Иридиевый электрод, ресурс до 60 000 км.'],
  ['SP-4002', 'Свеча зажигания Denso K20TT', 'Свечи зажигания', 2600, 1350, 64, 36, 40, 's1', 'Двойной электрод Twin Tip, никель.'],
  ['SA-5001', 'Амортизатор передний левый Camry 70 KYB', 'Амортизаторы', 42000, 28500, 8, 4, 4, 's1', 'Газомасляный, серия Excel-G.'],
  ['SA-5002', 'Амортизатор задний Hyundai Solaris', 'Амортизаторы', 26500, 17200, 2, 1, 4, 's1', 'Газовый, в сборе с пыльником.'],
  ['BT-6001', 'Аккумулятор Varta Blue Dynamic 60 А·ч', 'Аккумуляторы', 58000, 41000, 12, 6, 5, 's3', '12 В, пусковой ток 540 А, обратная полярность.'],
  ['BT-6002', 'Аккумулятор Bosch S4 74 А·ч', 'Аккумуляторы', 69500, 49800, 4, 0, 5, 's3', '12 В, пусковой ток 680 А, прямая полярность.'],
  ['OL-7001', 'Масло моторное Mobil 1 5W-30, 4 л', 'Масла', 24500, 16800, 46, 24, 20, 's4', 'Синтетическое, API SP, ILSAC GF-6A.'],
  ['OL-7002', 'Масло моторное Shell Helix HX8 5W-40, 4 л', 'Масла', 19800, 13100, 38, 10, 20, 's4', 'Синтетическое, API SN/CF, ACEA A3/B4.'],
  ['OL-7003', 'Масло трансмиссионное Toyota ATF WS, 4 л', 'Масла', 27900, 19500, 9, 2, 10, 's4', 'Для АКПП Toyota/Lexus, оригинал.'],
  ['TB-8001', 'Ремень ГРМ Gates 5670XS', 'Ремни ГРМ', 12400, 7300, 15, 5, 6, 's1', 'Армирован стекловолокном, ресурс 90 000 км.'],
  ['TB-8002', 'Комплект ГРМ Contitech CT1139K1', 'Ремни ГРМ', 36800, 24100, 5, 0, 4, 's1', 'Ремень + натяжной и обводной ролики.'],
  ['WD-9001', 'Диск литой R17 5×114.3 ET45 Silver', 'Диски', 48000, 31000, 16, 8, 8, 's1', 'Литой алюминиевый диск, ширина 7J, ЦО 60.1.'],
  ['WD-9002', 'Диск штампованный R15 4×100 ET40', 'Диски', 19500, 12200, 20, 12, 8, 's1', 'Стальной, чёрный, ширина 6J.'],
  ['HL-9501', 'Фара передняя правая LED Camry 70', 'Фары', 185000, 132000, 3, 1, 2, 's5', 'Светодиодная, с корректором, аналог оригинала.'],
  ['HL-9502', 'Фара передняя левая Hyundai Accent', 'Фары', 64000, 43500, 0, 2, 2, 's5', 'Галогеновая, с электрокорректором.'],
]

export const products: Product[] = productRows.map((r, i) => ({
  id: `p${i + 1}`,
  sku: r[0],
  name: r[1],
  category: r[2],
  price: r[3],
  cost: r[4],
  stock: { main: r[5], second: r[6] },
  minStock: r[7],
  supplierId: r[8],
  description: r[9],
}))

export const clients: Client[] = [
  { id: 'c1', company: 'СТО «Гараж 24»', contact: 'Алексей Ким', phone: '+7 701 234 56 78', email: 'garage24@mail.kz', city: 'Алматы' },
  { id: 'c2', company: 'ТОО «АвтоМастер Плюс»', contact: 'Руслан Беков', phone: '+7 702 876 11 20', email: 'info@avtomaster.kz', city: 'Астана' },
  { id: 'c3', company: 'ИП Жумабаев Н.', contact: 'Нурлан Жумабаев', phone: '+7 705 443 21 09', email: 'nurlan.zh@gmail.com', city: 'Шымкент' },
  { id: 'c4', company: 'Такси «Комфорт Лайн»', contact: 'Ольга Сергеева', phone: '+7 707 990 45 12', email: 'park@comfortline.kz', city: 'Алматы' },
  { id: 'c5', company: 'ТОО «ЛогистикТранс»', contact: 'Марат Исаев', phone: '+7 708 312 77 64', email: 'fleet@logtrans.kz', city: 'Караганда' },
  { id: 'c6', company: 'Автосервис «Мотор»', contact: 'Виктор Лим', phone: '+7 747 551 09 33', email: 'motor.service@mail.ru', city: 'Алматы' },
  { id: 'c7', company: 'ИП Сейткали А.', contact: 'Айдар Сейткали', phone: '+7 776 120 88 45', email: 'aidar.s@inbox.kz', city: 'Актобе' },
  { id: 'c8', company: 'ТОО «Дилер Центр»', contact: 'Екатерина Павлова', phone: '+7 771 604 23 17', email: 'parts@dealercenter.kz', city: 'Астана' },
]

const genLines = (count: number, priceKey: 'price' | 'cost'): DocLine[] => {
  const used = new Set<string>()
  const lines: DocLine[] = []
  while (lines.length < count) {
    const p = pick(products)
    if (used.has(p.id)) continue
    used.add(p.id)
    const qty = p.price > 50000 ? 1 + Math.floor(rnd() * 2) : 1 + Math.floor(rnd() * 6)
    lines.push({ productId: p.id, qty, price: p[priceKey] })
  }
  return lines
}

const orderStatusByAge = (d: number): OrderStatus => {
  if (d <= 1) return pick(['Новый', 'Новый', 'В обработке'] as const)
  if (d <= 4) return pick(['В обработке', 'Оплачен', 'Новый'] as const)
  if (d <= 10) return pick(['Оплачен', 'Отгружен', 'В обработке'] as const)
  return pick(['Завершён', 'Завершён', 'Отгружен', 'Оплачен'] as const)
}

export const orders: Order[] = Array.from({ length: 42 }, (_, i) => {
  const age = Math.floor(((42 - i) / 42) * 60) // от 60 дней назад до сегодня
  const status = i >= 39 ? 'Новый' : orderStatusByAge(age) // последние заказы — новые
  return {
    id: `o${i + 1}`,
    number: `ЗК-${String(1001 + i)}`,
    clientId: pick(clients).id,
    lines: genLines(1 + Math.floor(rnd() * 3), 'price'),
    status,
    date: daysAgo(age, 9 + Math.floor(rnd() * 9)),
    shipped: status === 'Отгружен' || status === 'Завершён',
  }
})

export const purchases: Purchase[] = Array.from({ length: 12 }, (_, i) => {
  const age = Math.floor(((12 - i) / 12) * 45)
  const status: PurchaseStatus = age > 14 ? 'Получен' : age > 7 ? pick(['В пути', 'Получен'] as const) : age > 2 ? pick(['Заказан', 'В пути'] as const) : 'Черновик'
  const supplier = pick(suppliers)
  const pool = products.filter((p) => p.supplierId === supplier.id)
  const lines: DocLine[] = pool.slice(0, 1 + Math.floor(rnd() * Math.min(3, pool.length))).map((p) => ({
    productId: p.id,
    qty: p.cost > 40000 ? 2 + Math.floor(rnd() * 3) : 10 + Math.floor(rnd() * 30),
    price: p.cost,
  }))
  return {
    id: `pu${i + 1}`,
    number: `ЗП-${String(501 + i)}`,
    supplierId: supplier.id,
    lines,
    status,
    date: daysAgo(age),
    received: status === 'Получен',
  }
})

export const movements: Movement[] = [
  { id: 'm1', type: 'Приход', productId: 'p4', qty: 40, to: 'main', date: daysAgo(12), comment: 'Поступление по ЗП-506' },
  { id: 'm2', type: 'Перемещение', productId: 'p8', qty: 20, from: 'main', to: 'second', date: daysAgo(9), comment: 'Пополнение витрины' },
  { id: 'm3', type: 'Расход', productId: 'p14', qty: 6, from: 'main', date: daysAgo(7), comment: 'Отгрузка по ЗК-1030' },
  { id: 'm4', type: 'Списание', productId: 'p7', qty: 2, from: 'main', date: daysAgo(5), comment: 'Брак упаковки' },
  { id: 'm5', type: 'Приход', productId: 'p12', qty: 8, to: 'main', date: daysAgo(3), comment: 'Поступление по ЗП-510' },
  { id: 'm6', type: 'Перемещение', productId: 'p1', qty: 6, from: 'main', to: 'second', date: daysAgo(1), comment: '' },
]

export const orderTotal = (lines: DocLine[]) => lines.reduce((s, l) => s + l.qty * l.price, 0)

const PAID_STATUSES: OrderStatus[] = ['Оплачен', 'Отгружен', 'Завершён']
export const isOrderPaid = (o: Order) => PAID_STATUSES.includes(o.status)

export const financeOps: FinanceOp[] = [
  ...orders
    .filter(isOrderPaid)
    .map<FinanceOp>((o) => ({
      id: `f-${o.id}`,
      date: o.date,
      kind: 'income',
      category: 'Оплата от покупателя',
      counterparty: clients.find((c) => c.id === o.clientId)!.company,
      amount: orderTotal(o.lines),
      comment: `Оплата по ${o.number}`,
    })),
  ...purchases
    .filter((p) => p.received)
    .map<FinanceOp>((p) => ({
      id: `f-${p.id}`,
      date: p.date,
      kind: 'expense',
      category: 'Оплата поставщику',
      counterparty: suppliers.find((s) => s.id === p.supplierId)!.company,
      amount: orderTotal(p.lines),
      comment: `Оплата по ${p.number}`,
    })),
  { id: 'f-r1', date: daysAgo(22), kind: 'expense', category: 'Аренда', counterparty: 'ТОО «БизнесПарк»', amount: 450000, comment: 'Аренда склада' },
  { id: 'f-z1', date: daysAgo(18), kind: 'expense', category: 'Зарплата', counterparty: 'Сотрудники', amount: 1200000, comment: 'Зарплата за месяц' },
  { id: 'f-u1', date: daysAgo(8), kind: 'expense', category: 'Коммунальные', counterparty: 'АО «АлматыЭнергоСбыт»', amount: 96000, comment: 'Электроэнергия' },
  { id: 'f-d1', date: daysAgo(4), kind: 'expense', category: 'Доставка', counterparty: 'ТОО «Быстрая Логистика»', amount: 145000, comment: 'Доставка заказов' },
]
