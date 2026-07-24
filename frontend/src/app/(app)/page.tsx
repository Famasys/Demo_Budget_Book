import { fetchCategories } from '@/features/budget/api/budget'
import BudgetForm from '@/features/budget/components/BudgetForm'

export default async function HomePage() {
  const categories = await fetchCategories()
  return <BudgetForm mode="create" categories={categories} />
}
