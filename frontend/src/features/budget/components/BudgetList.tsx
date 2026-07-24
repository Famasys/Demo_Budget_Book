'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { HistoryResponse } from '../types'
import { deleteBudget } from '../api/budget'

export default function BudgetList({ history }: { history: HistoryResponse }) {
  const router = useRouter()
  const [{ months, pivot, items }, setHistory] = useState(history)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleEdit = () => {
    if (selected.size === 0) return
    router.push(`/edit/${[...selected].join(',')}`)
  }

  const handleDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`選択した${selected.size}件を削除しますか?`)) return
    setError('')
    try {
      await Promise.all([...selected].map(date => deleteBudget(date)))
      setHistory(prev => ({
        ...prev,
        months: prev.months.filter(m => !selected.has(m.key)),
        pivot: Object.fromEntries(
          Object.entries(prev.pivot).filter(([key]) => !selected.has(key))
        ),
      }))
      setSelected(new Set())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold">履歴</h1>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 w-full max-w-md rounded-lg border-2 border-red-600 bg-red-50 px-4 py-3 text-red-700 font-bold text-sm sm:text-base"
        >
          <span aria-hidden="true" className="text-lg sm:text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      <div className="w-full max-w-full overflow-x-auto">
        <table className="border-collapse text-center text-sm sm:text-base mx-auto">
          <thead>
            <tr>
              <th className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2"></th>
              {months.map(m => (
                <th key={m.key} className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2">
                  <div className="flex flex-col items-center gap-1">
                    <input
                      type="checkbox"
                      checked={selected.has(m.key)}
                      onChange={() => toggle(m.key)}
                    />
                    <span className="whitespace-nowrap">{m.label}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item}>
                <td className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2 font-medium whitespace-nowrap">{item}</td>
                {months.map(m => {
                  const val = pivot[m.key]?.[item]
                  return (
                    <td key={m.key} className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2 text-right whitespace-nowrap">
                      {val != null ? `¥${val.toLocaleString()}` : ''}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
        <button
          onClick={handleEdit}
          disabled={selected.size === 0}
          className="w-20 h-10 text-sm sm:w-24 sm:h-12 sm:text-base border-2 border-black rounded hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          編集
        </button>
        <button
          onClick={handleDelete}
          disabled={selected.size === 0}
          className="w-20 h-10 text-sm sm:w-24 sm:h-12 sm:text-base border-2 border-black rounded hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent"
        >
          削除
        </button>
      </div>

      <button
        onClick={() => router.push('/')}
        className="w-36 h-10 text-sm sm:w-40 sm:h-12 sm:text-base border-2 border-black rounded hover:bg-gray-100"
      >
        入力画面へ戻る
      </button>
    </div>
  )
}
