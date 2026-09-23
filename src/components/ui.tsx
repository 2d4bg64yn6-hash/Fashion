import { useEffect, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { X, Search } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

const moneyFmt = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })
export const money = (n: number) => `${moneyFmt.format(Math.round(n))} ₸`
export const num = (n: number) => moneyFmt.format(n)
export const compactMoney = (n: number) => {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.', ',')} млн ₸`
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)} тыс ₸`
  return money(n)
}
export const date = (iso: string) => new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

// ---------- базовые элементы ----------

export function Card({ children, className, pad = true }: { children: ReactNode; className?: string; pad?: boolean }) {
  return <div className={cx('rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]', pad && 'p-5', className)}>{children}</div>
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <h3 className="text-[15px] font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export function Button({
  children, variant = 'primary', icon: Icon, className, size = 'md', ...rest
}: { children?: ReactNode; variant?: BtnVariant; icon?: LucideIcon; size?: 'sm' | 'md' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
    secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
    ghost: 'text-slate-600 hover:bg-slate-100',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
  }
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer',
        size === 'md' ? 'h-9 px-3.5 text-sm' : 'h-8 px-2.5 text-[13px]',
        styles[variant],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon size={16} strokeWidth={2} />}
      {children}
    </button>
  )
}

export type Tone = 'gray' | 'blue' | 'amber' | 'green' | 'violet' | 'red' | 'teal'
const toneCls: Record<Tone, string> = {
  gray: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
}
export function Badge({ tone = 'gray', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', toneCls[tone])}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  )
}

export const statusTone: Record<string, Tone> = {
  'Новый': 'blue',
  'В обработке': 'amber',
  'Оплачен': 'violet',
  'Отгружен': 'teal',
  'Завершён': 'green',
  'Черновик': 'gray',
  'Заказан': 'blue',
  'В пути': 'amber',
  'Получен': 'green',
  'В наличии': 'green',
  'Мало': 'amber',
  'Нет в наличии': 'red',
  'Приход': 'green',
  'Расход': 'blue',
  'Перемещение': 'violet',
  'Списание': 'red',
}
export const StatusBadge = ({ status }: { status: string }) => <Badge tone={statusTone[status] ?? 'gray'}>{status}</Badge>

// ---------- формы ----------

const inputCls =
  'h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-100'

export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cx(inputCls, p.className)} />
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea {...p} className={cx(inputCls, 'h-auto min-h-20 py-2', p.className)} />
)
export const Select = ({ children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select {...p} className={cx(inputCls, 'cursor-pointer pr-8', p.className)}>
    {children}
  </select>
)

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block text-[13px] font-medium text-slate-600">{label}</span>
      {children}
    </label>
  )
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-72">
      <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  )
}

// ---------- макет страниц ----------

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function Kpi({ label, value, hint, icon: Icon, tone = 'blue' }: { label: string; value: string; hint?: ReactNode; icon: LucideIcon; tone?: Tone }) {
  const iconBg: Record<Tone, string> = {
    blue: 'bg-blue-50 text-blue-600', green: 'bg-emerald-50 text-emerald-600', amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600', red: 'bg-rose-50 text-rose-600', gray: 'bg-slate-100 text-slate-600', teal: 'bg-teal-50 text-teal-600',
  }
  return (
    <Card>
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium text-slate-500">{label}</p>
        <span className={cx('grid size-8 place-items-center rounded-lg', iconBg[tone])}>
          <Icon size={17} />
        </span>
      </div>
      <p className="tabular mt-3 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  )
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { id: T; label: string; count?: number }[] }) {
  return (
    <div className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={cx(
            'flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium transition',
            value === it.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {it.label}
          {it.count !== undefined && <span className="tabular rounded-md bg-slate-200/70 px-1.5 text-[11px] text-slate-600">{it.count}</span>}
        </button>
      ))}
    </div>
  )
}

// ---------- таблицы ----------

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  )
}
export const Th = ({ children, right, className }: { children?: ReactNode; right?: boolean; className?: string }) => (
  <th className={cx('whitespace-nowrap border-b border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs font-medium tracking-wide text-slate-500 uppercase', right && 'text-right', className)}>
    {children}
  </th>
)
export const Td = ({ children, right, className }: { children?: ReactNode; right?: boolean; className?: string }) => (
  <td className={cx('border-b border-slate-100 px-4 py-3 align-middle', right && 'tabular text-right', className)}>{children}</td>
)
export const Tr = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <tr onClick={onClick} className={cx('transition-colors', onClick && 'cursor-pointer hover:bg-slate-50')}>
    {children}
  </tr>
)

export function Empty({ text }: { text: string }) {
  return <div className="px-4 py-12 text-center text-sm text-slate-400">{text}</div>
}

// ---------- оверлеи ----------

function useEsc(onClose: () => void) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
}

export function Modal({ title, onClose, children, footer, wide }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEsc(onClose)
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-[2px] sm:items-center" onMouseDown={onClose}>
      <div
        className={cx('my-8 w-full rounded-2xl bg-white shadow-2xl', wide ? 'max-w-3xl' : 'max-w-lg')}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}

export function Drawer({ title, subtitle, onClose, children, footer }: { title: string; subtitle?: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEsc(onClose)
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-[1px]" onMouseDown={onClose}>
      <div className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            {subtitle && <div className="mt-1 text-sm text-slate-500">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-6 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}

export function InfoGrid({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs font-medium text-slate-500">{k}</dt>
          <dd className="mt-0.5 text-sm text-slate-900">{v}</dd>
        </div>
      ))}
    </dl>
  )
}
