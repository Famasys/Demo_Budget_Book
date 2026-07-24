import type {
  BudgetCreate, BudgetFields, Category, CategoryType, HistoryResponse, ImportResult,
} from '../types'

export const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export async function fetchHistory(): Promise<HistoryResponse> {
  const res = await fetch(`${API}/budget/history`, { cache: 'no-store' })
  if (!res.ok) throw new Error('履歴の取得に失敗しました')
  return res.json()
}

export async function fetchMonthData(date: string): Promise<BudgetFields> {
  const res = await fetch(`${API}/budget/${date}`, { cache: 'no-store' })
  if (!res.ok) throw new Error('データの取得に失敗しました')
  return res.json()
}

export async function checkExists(date: string): Promise<boolean> {
  const res = await fetch(`${API}/budget/${date}/exists`, { cache: 'no-store' })
  if (!res.ok) throw new Error('確認に失敗しました')
  const data = await res.json()
  return data.exists
}

export async function createBudget(body: BudgetCreate): Promise<void> {
  const res = await fetch(`${API}/budget`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (res.status === 409) {
    const data = await res.json()
    throw new Error(data.detail)
  }
  if (!res.ok) throw new Error('保存に失敗しました')
}

export async function updateBudget(date: string, values: BudgetFields): Promise<void> {
  const res = await fetch(`${API}/budget/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values }),
  })
  if (!res.ok) throw new Error('更新に失敗しました')
}

export async function deleteBudget(date: string): Promise<void> {
  const res = await fetch(`${API}/budget/${date}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('削除に失敗しました')
}

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API}/categories`, { cache: 'no-store' })
  if (!res.ok) throw new Error('カテゴリの取得に失敗しました')
  return res.json()
}

export async function addCategory(name: string, type: CategoryType): Promise<Category> {
  const res = await fetch(`${API}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, type }),
  })
  if (res.status === 409 || res.status === 400) {
    const data = await res.json()
    throw new Error(data.detail)
  }
  if (!res.ok) throw new Error('カテゴリの追加に失敗しました')
  return res.json()
}

export async function updateCategory(
  id: number,
  changes: { name?: string; type?: CategoryType },
): Promise<void> {
  const res = await fetch(`${API}/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(changes),
  })
  if (res.status === 400) {
    const data = await res.json()
    throw new Error(data.detail)
  }
  if (!res.ok) throw new Error('カテゴリの更新に失敗しました')
}

export async function deleteCategory(id: number): Promise<void> {
  const res = await fetch(`${API}/categories/${id}`, { method: 'DELETE' })
  if (res.status === 409) {
    const data = await res.json()
    throw new Error(data.detail)
  }
  if (!res.ok) throw new Error('カテゴリの削除に失敗しました')
}

export async function importCsv(file: File): Promise<ImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API}/budget/import`, { method: 'POST', body: formData })
  if (!res.ok) {
    const data = await res.json().catch(() => null)
    throw new Error(data?.detail ?? 'インポートに失敗しました')
  }
  return res.json()
}
