export type BudgetFields = Record<string, number>

export type BudgetCreate = { today: string; values: BudgetFields }

export type MonthMeta = { key: string; label: string }

export type HistoryResponse = {
  months: MonthMeta[]
  pivot: Record<string, Record<string, number | null>>
  items: string[]
}

export type CategoryType = 'income' | 'expense'

export type Category = {
  id: number
  name: string
  type: CategoryType
  sort_order: number
}

export type ImportResult = {
  imported_months: string[]
  added_categories: string[]
  rejected_categories: string[]
  rejected_amounts: string[]
  rejected_months: string[]
}
