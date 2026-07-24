'use client'

import { useState } from 'react'
import type { HistoryResponse } from '../types'
import { API } from '../api/budget'

export default function ExportSelector({ history }: { history: HistoryResponse }) {
  const { months, pivot, items } = history
  const [selected, setSelected] = useState<Set<string>>(new Set(months.map(m => m.key)))

  const toggle = (key: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const selectAll = () => setSelected(new Set(months.map(m => m.key)))
  const deselectAll = () => setSelected(new Set())

  const handleExport = () => {
    if (selected.size === 0) return
    const params = new URLSearchParams({ dates: [...selected].join(',') })
    window.location.href = `${API}/budget/export?${params}`
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold">CSVエクスポート</h1>

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={selectAll}
          className="h-9 rounded border-2 border-black px-4 text-sm hover:bg-gray-100 sm:h-10 sm:text-base"
        >
          全て選択
        </button>
        <button
          type="button"
          onClick={deselectAll}
          className="h-9 rounded border-2 border-black px-4 text-sm hover:bg-gray-100 sm:h-10 sm:text-base"
        >
          全て外す
        </button>
      </div>

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

      <button
        type="button"
        onClick={handleExport}
        disabled={selected.size === 0}
        className="h-10 w-36 rounded bg-black text-sm text-white hover:bg-gray-800 disabled:opacity-40 sm:h-12 sm:w-40 sm:text-base"
      >
        エクスポート
      </button>
    </div>
  )
}
