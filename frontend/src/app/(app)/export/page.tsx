import { fetchHistory } from '@/features/budget/api/budget'
import ExportSelector from '@/features/budget/components/ExportSelector'

export default async function ExportPage() {
  const history = await fetchHistory()
  return <ExportSelector history={history} />
}
