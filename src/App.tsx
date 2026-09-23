import { createContext, useContext, useEffect, useState, type ComponentType } from 'react'
import {
  LayoutDashboard, Package, Warehouse, ShoppingCart, Truck, Users, Factory, Wallet, BarChart3, Settings as SettingsIcon,
  Menu, Bell, Plus, CheckCircle2, AlertCircle, Wrench, ChevronsLeft,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useStore, stockStatus } from './store'
import { cx } from './components/ui'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import WarehousePage from './pages/Warehouse'
import Sales from './pages/Sales'
import Purchases from './pages/Purchases'
import Clients from './pages/Clients'
import Suppliers from './pages/Suppliers'
import Finance from './pages/Finance'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Profile from './pages/Profile'

export type PageId =
  | 'dashboard' | 'products' | 'warehouse' | 'sales' | 'purchases' | 'clients' | 'suppliers' | 'finance' | 'reports' | 'settings' | 'profile'

const NAV: { id: PageId; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
  { id: 'products', label: 'Товары', icon: Package },
  { id: 'warehouse', label: 'Склад', icon: Warehouse },
  { id: 'sales', label: 'Продажи', icon: ShoppingCart },
  { id: 'purchases', label: 'Закупки', icon: Truck },
  { id: 'clients', label: 'Клиенты', icon: Users },
  { id: 'suppliers', label: 'Поставщики', icon: Factory },
  { id: 'finance', label: 'Финансы', icon: Wallet },
  { id: 'reports', label: 'Отчёты', icon: BarChart3 },
]

const PAGES: Record<PageId, ComponentType> = {
  dashboard: Dashboard, products: Products, warehouse: WarehousePage, sales: Sales, purchases: Purchases,
  clients: Clients, suppliers: Suppliers, finance: Finance, reports: Reports, settings: Settings, profile: Profile,
}

// Навигация: страница + необязательное «намерение» (например, открыть форму нового заказа)
interface Nav { page: PageId; intent?: string; go: (page: PageId, intent?: string) => void; clearIntent: () => void }
const NavContext = createContext<Nav | null>(null)
export const useNav = () => useContext(NavContext)!

const readHash = (): PageId => {
  const h = window.location.hash.replace('#/', '') as PageId
  return h in PAGES ? h : 'dashboard'
}

export default function App() {
  const store = useStore()
  const [page, setPage] = useState<PageId>(readHash)
  const [intent, setIntent] = useState<string>()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const h = () => setPage(readHash())
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])

  const go = (p: PageId, i?: string) => {
    window.location.hash = `/${p}`
    setPage(p)
    setIntent(i)
    setMobileOpen(false)
    window.scrollTo({ top: 0 })
  }

  const lowStock = store.products.filter((p) => stockStatus(p) !== 'В наличии').length
  const newOrders = store.orders.filter((o) => o.status === 'Новый').length
  const badges: Partial<Record<PageId, number>> = { sales: newOrders, warehouse: lowStock }

  const Page = PAGES[page]

  const NavItem = ({ id, label, icon: Icon }: { id: PageId; label: string; icon: LucideIcon }) => (
    <button
      onClick={() => go(id)}
      title={collapsed ? label : undefined}
      className={cx(
        'group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        page === id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        collapsed && 'lg:justify-center lg:px-0',
      )}
    >
      <Icon size={18} className={page === id ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600'} />
      <span className={cx('flex-1 text-left', collapsed && 'lg:hidden')}>{label}</span>
      {!!badges[id] && (
        <span className={cx('tabular rounded-full bg-slate-100 px-1.5 text-[11px] text-slate-600', page === id && 'bg-brand-100 text-brand-700', collapsed && 'lg:hidden')}>
          {badges[id]}
        </span>
      )}
    </button>
  )

  return (
    <NavContext.Provider value={{ page, intent, go, clearIntent: () => setIntent(undefined) }}>
      <div className="min-h-screen">
        {/* Боковое меню */}
        {mobileOpen && <div className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden" onClick={() => setMobileOpen(false)} />}
        <aside
          className={cx(
            'fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-all lg:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
            collapsed && 'lg:w-[72px]',
          )}
        >
          <div className={cx('flex h-16 items-center gap-2.5 px-5', collapsed && 'lg:justify-center lg:px-0')}>
            <div className="grid size-8 place-items-center rounded-lg bg-brand-600 text-white shadow-sm">
              <Wrench size={17} />
            </div>
            <div className={cx(collapsed && 'lg:hidden')}>
              <p className="text-[15px] leading-tight font-semibold text-slate-900">АвтоСклад</p>
              <p className="text-[11px] leading-tight text-slate-400">учёт автозапчастей</p>
            </div>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
            {NAV.map((n) => <NavItem key={n.id} {...n} />)}
          </nav>
          <div className="space-y-0.5 border-t border-slate-100 px-3 py-3">
            <NavItem id="settings" label="Настройки" icon={SettingsIcon} />
            <button
              onClick={() => go('profile')}
              className={cx(
                'flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-100',
                page === 'profile' && 'bg-brand-50',
                collapsed && 'lg:justify-center lg:px-0',
              )}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-xs font-semibold text-white">АС</span>
              <span className={cx('min-w-0 text-left', collapsed && 'lg:hidden')}>
                <span className="block truncate text-sm font-medium text-slate-800">Асель Смагулова</span>
                <span className="block truncate text-xs text-slate-400">Администратор</span>
              </span>
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:flex"
            >
              <ChevronsLeft size={16} className={cx('transition', collapsed && 'rotate-180 lg:mx-auto')} />
              <span className={cx(collapsed && 'lg:hidden')}>Свернуть меню</span>
            </button>
          </div>
        </aside>

        {/* Контент */}
        <div className={cx('transition-all', collapsed ? 'lg:pl-[72px]' : 'lg:pl-64')}>
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur sm:px-8">
            <button className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="text-sm text-slate-400">
              ТОО «АвтоСклад Демо» <span className="mx-1.5">/</span>
              <span className="font-medium text-slate-700">{[...NAV, { id: 'settings', label: 'Настройки' }, { id: 'profile', label: 'Профиль' }].find((n) => n.id === page)?.label}</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button onClick={() => go('sales', 'new')} className="hidden h-9 cursor-pointer items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white shadow-sm hover:bg-brand-700 sm:inline-flex">
                <Plus size={16} /> Новый заказ
              </button>
              <button
                onClick={() => go('warehouse')}
                title={`${lowStock} товаров с низким остатком`}
                className="relative cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <Bell size={19} />
                {lowStock > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />}
              </button>
            </div>
          </header>
          <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-8 sm:py-8">
            <Page />
          </main>
        </div>

        {/* Уведомления */}
        <div className="fixed right-4 bottom-4 z-[60] flex flex-col gap-2">
          {store.toasts.map((t) => (
            <div key={t.id} className="flex items-center gap-2.5 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
              {t.tone === 'success' ? <CheckCircle2 size={17} className="text-emerald-400" /> : <AlertCircle size={17} className="text-rose-400" />}
              {t.text}
            </div>
          ))}
        </div>
      </div>
    </NavContext.Provider>
  )
}
