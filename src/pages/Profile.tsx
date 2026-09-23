import { useStore } from '../store'
import { Button, Card, CardHeader, Field, Input, PageHeader } from '../components/ui'

export default function Profile() {
  const s = useStore()
  return (
    <>
      <PageHeader title="Профиль" />
      <div className="grid max-w-4xl gap-6">
        <Card className="flex items-center gap-5">
          <span className="grid size-16 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-500 text-xl font-semibold text-white">АС</span>
          <div>
            <p className="text-lg font-semibold text-slate-900">Асель Смагулова</p>
            <p className="text-sm text-slate-500">Администратор · ТОО «АвтоСклад Демо»</p>
          </div>
        </Card>
        <Card>
          <CardHeader title="Личные данные" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Имя"><Input defaultValue="Асель Смагулова" /></Field>
            <Field label="Должность"><Input defaultValue="Администратор" /></Field>
            <Field label="Email"><Input defaultValue="asel@autosklad.demo" /></Field>
            <Field label="Телефон"><Input defaultValue="+7 701 000 00 00" /></Field>
          </div>
          <div className="mt-5 flex justify-end"><Button onClick={() => s.notify('Профиль обновлён')}>Сохранить</Button></div>
        </Card>
      </div>
    </>
  )
}
