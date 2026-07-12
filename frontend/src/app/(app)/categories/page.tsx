import { fetchCategories } from '@/features/budget/api/budget'
import CategoryManager from '@/features/budget/components/CategoryManager'

export default async function CategoriesPage() {
  const categories = await fetchCategories()
  return <CategoryManager initialCategories={categories} />
}
