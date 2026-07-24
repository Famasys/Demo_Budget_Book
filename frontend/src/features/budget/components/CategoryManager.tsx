'use client'

import { useState } from 'react'
import type { Category, CategoryType } from '../types'
import { addCategory, deleteCategory, updateCategory } from '../api/budget'
import { ALLOWED_CATEGORY_NAMES } from '../constants'

const NOT_ALLOWED_MESSAGE = '入力された名前はダミーデータの一覧と異なります。一覧にある名前をそのまま入力してください。'

type Draft = { name: string; type: CategoryType }

export default function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const [categories, setCategories] = useState(initialCategories)
  const [drafts, setDrafts] = useState<Record<number, Draft>>(
    Object.fromEntries(initialCategories.map(c => [c.id, { name: c.name, type: c.type }]))
  )
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<CategoryType>('expense')
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<number | null>(null)

  const setDraft = (id: number, changes: Partial<Draft>) => {
    setDrafts(prev => ({ ...prev, [id]: { ...prev[id], ...changes } }))
  }

  const handleSave = async (id: number) => {
    const draft = drafts[id]
    setError('')
    if (!ALLOWED_CATEGORY_NAMES.includes(draft.name)) {
      setError(NOT_ALLOWED_MESSAGE)
      return
    }
    setSavingId(id)
    try {
      await updateCategory(id, draft)
      setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...draft } : c)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか?`)) return
    setError('')
    setSavingId(id)
    try {
      await deleteCategory(id)
      setCategories(prev => prev.filter(c => c.id !== id))
      setDrafts(prev => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setSavingId(null)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setError('')
    if (!ALLOWED_CATEGORY_NAMES.includes(newName.trim())) {
      setError(NOT_ALLOWED_MESSAGE)
      return
    }
    try {
      const created = await addCategory(newName.trim(), newType)
      setCategories(prev => [...prev, created])
      setDrafts(prev => ({ ...prev, [created.id]: { name: created.name, type: created.type } }))
      setNewName('')
      setNewType('expense')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 px-3 py-6 sm:gap-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">カテゴリ編集</h1>

      {error && (
        <div
          role="alert"
          className="flex w-full max-w-md items-center gap-2 rounded-lg border-2 border-red-600 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 sm:text-base"
        >
          <span aria-hidden="true" className="text-lg sm:text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="w-full max-w-full overflow-x-auto">
        <table className="border-collapse mx-auto text-sm sm:text-base">
          <thead>
            <tr>
              <th className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2">カテゴリ名</th>
              <th className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2">種別</th>
              <th className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map(cat => (
              <tr key={cat.id}>
                <td className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2">
                  <input
                    type="text"
                    value={drafts[cat.id]?.name ?? ''}
                    onChange={e => setDraft(cat.id, { name: e.target.value })}
                    className="w-40 rounded border px-2 py-1 sm:w-56"
                  />
                </td>
                <td className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2">
                  <select
                    value={drafts[cat.id]?.type ?? 'expense'}
                    onChange={e => setDraft(cat.id, { type: e.target.value as CategoryType })}
                    className="rounded border px-2 py-1"
                  >
                    <option value="income">収入</option>
                    <option value="expense">支出</option>
                  </select>
                </td>
                <td className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleSave(cat.id)}
                      disabled={savingId === cat.id}
                      className="h-8 w-20 rounded border-2 border-black text-xs hover:bg-gray-100 disabled:opacity-40 sm:h-10 sm:w-24 sm:text-sm"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.name)}
                      disabled={savingId === cat.id}
                      className="h-8 w-16 rounded border-2 border-red-600 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40 sm:h-10 sm:w-20 sm:text-sm"
                    >
                      削除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-12">
        <form onSubmit={handleAdd} className="flex flex-wrap items-center justify-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="新しいカテゴリ名"
            className="w-40 rounded border px-2 py-1 sm:w-56"
          />
          <select
            value={newType}
            onChange={e => setNewType(e.target.value as CategoryType)}
            className="rounded border px-2 py-1"
          >
            <option value="income">収入</option>
            <option value="expense">支出</option>
          </select>
          <button
            type="submit"
            className="h-9 rounded bg-black px-4 text-sm text-white hover:bg-gray-800 sm:h-10"
          >
            追加
          </button>
        </form>

        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-bold text-gray-700">使えるカテゴリ名の一覧</p>
          <div className="flex max-w-xs flex-wrap justify-center gap-1">
            {ALLOWED_CATEGORY_NAMES.map(name => (
              <span key={name} className="rounded border border-gray-400 bg-gray-50 px-2 py-0.5 text-xs">
                {name}
              </span>
            ))}
          </div>
          <p className="max-w-[18rem] text-center text-xs text-gray-500">
            カテゴリ名の追加・変更は、この一覧にある名前しか登録できません。
          </p>
        </div>
      </div>
    </div>
  )
}
