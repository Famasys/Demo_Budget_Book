import { fetchCategories, fetchMonthData } from '@/features/budget/api/budget'
import BudgetForm from '@/features/budget/components/BudgetForm'
import type { BudgetFields } from '@/features/budget/types'

export default async function EditPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params
  const dates = decodeURIComponent(date).split(',')
  const [dataList, categories] = await Promise.all([
    Promise.all(dates.map(d => fetchMonthData(d))),
    fetchCategories(),
  ])
  const initialData: Record<string, BudgetFields> = {}
  dates.forEach((d, i) => { initialData[d] = dataList[i] })
  return <BudgetForm mode="edit" dates={dates} initialData={initialData} categories={categories} />
}
