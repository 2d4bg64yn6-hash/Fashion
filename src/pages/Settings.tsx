import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { useStore } from '../store'
import { WAREHOUSES } from '../data'
import { Button, Card, CardHeader, Field, Input, PageHeader, Select } from '../components/ui'

export default function Settings() {
  const s = useStore()
  const [company, setCompany] = useState('ТОО «АвтоСклад Демо»')
  return (
    <>
      <PageHeader title="Настройки" subtitle="Параметры компании и прототипа" />
      <div className="grid max-w-4xl gap-6">
        <Card>
          <CardHeader title="Компания" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Название"><Input value={company} onChange={(e) => setCompany(e.target.value)} /></Field>
            <Field label="БИН"><Input defaultValue="180540012345" /></Field>
            <Field label="Валюта"><Select defaultValue="KZT"><option value="KZT">Тенге (₸)</option><option value="RUB">Рубль (₽)</option></Select></Field>
            <Field label="Ставка НДС"><Select defaultValue="12"><option value="12">12%</option><option value="0">Без НДС</option></Select></Field>
          </div>
          <div className="mt-5 flex justify-end"><Button onClick={() => s.notify('Настройки сохранены')}>Сохранить</Button></div>
        </Card>
        <Card>
          <CardHeader title="Склады" subtitle="Места хранения товара" />
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
            {WAREHOUSES.map((w) => <li key={w.id} className="px-4 py-3 text-sm">{w.name}</li>)}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Демо-данные" subtitle="Все изменения хранятся в браузере (localStorage). Можно вернуть исходные данные." />
          <Button variant="secondary" icon={RotateCcw} onClick={s.resetDemo}>Сбросить демо-данные</Button>
        </Card>
      </div>
    </>
  )
}
