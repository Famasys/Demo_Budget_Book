import { fetchHistory } from '@/features/budget/api/budget'
import BudgetList from '@/features/budget/components/BudgetList'

export default async function ListPage() {
  const history = await fetchHistory()
  return <BudgetList history={history} />
}
