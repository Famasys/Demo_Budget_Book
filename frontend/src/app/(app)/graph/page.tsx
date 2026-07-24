import { fetchHistory } from '@/features/budget/api/budget'
import GraphView from '@/features/budget/components/GraphView'

export default async function GraphPage() {
  const history = await fetchHistory()
  return <GraphView history={history} />
}
