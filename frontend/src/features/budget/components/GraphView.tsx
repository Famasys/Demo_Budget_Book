'use client'

import { useRouter } from 'next/navigation'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { HistoryResponse } from '../types'

const EXCLUDE = new Set(['収入', '合計', '残高'])
const COLORS = [
  '#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#9333ea',
  '#0891b2', '#ca8a04', '#db2777', '#4b5563', '#65a30d', '#7c3aed', '#0d9488',
]

export default function GraphView({ history }: { history: HistoryResponse }) {
  const router = useRouter()
  const { months, pivot, items } = history
  const categories = items.filter(i => !EXCLUDE.has(i))

  const trendData = months.map(m => ({
    label: m.label,
    収入: pivot[m.key]?.['収入'] ?? 0,
    支出: pivot[m.key]?.['合計'] ?? 0,
    残高: pivot[m.key]?.['残高'] ?? 0,
  }))

  const categoryData = months.map(m => {
    const entry: Record<string, number | string> = { label: m.label }
    categories.forEach(c => { entry[c] = pivot[m.key]?.[c] ?? 0 })
    return entry
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const yen = (v: any) => (typeof v === 'number' ? `¥${v.toLocaleString()}` : String(v))

  return (
    <div className="flex flex-col items-center gap-8 px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">グラフ</h1>

      {months.length === 0 ? (
        <p className="text-gray-500">表示できるデータがありません</p>
      ) : (
        <>
          <section className="w-full max-w-3xl">
            <h2 className="mb-2 text-center font-bold">収入・支出・残高の推移</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={yen} />
                <Legend />
                <Line type="monotone" dataKey="収入" stroke="#16a34a" />
                <Line type="monotone" dataKey="支出" stroke="#dc2626" />
                <Line type="monotone" dataKey="残高" stroke="#2563eb" />
              </LineChart>
            </ResponsiveContainer>
          </section>

          <section className="w-full max-w-3xl">
            <h2 className="mb-2 text-center font-bold">カテゴリ別支出の内訳</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={yen} shared={false} position={{ y: 0 }} />
                <Legend />
                {categories.map((c, i) => (
                  <Bar key={c} dataKey={c} stackId="expense" fill={COLORS[i % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </section>
        </>
      )}

      <button
        onClick={() => router.push('/')}
        className="h-10 w-36 rounded border-2 border-black text-sm hover:bg-gray-100 sm:h-12 sm:w-40 sm:text-base"
      >
        入力画面へ戻る
      </button>
    </div>
  )
}
