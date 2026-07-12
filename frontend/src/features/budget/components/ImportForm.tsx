'use client'

import { useState } from 'react'
import { importCsv } from '../api/budget'
import type { ImportResult } from '../types'
import { ALLOWED_AMOUNTS, ALLOWED_CATEGORY_NAMES, ALLOWED_DATES, monthLabel } from '../constants'

const SAMPLE_ROWS: [string, string, string][] = [
  ['収入', '188,800', '195,000'],
  ['家賃', '58,000', '58,000'],
  ['水道代', '0', '3,200'],
  ['電気代', '4,500', '4,807'],
]

function SampleCsvTable() {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-bold text-gray-700">CSVのイメージ</p>
      <table className="border-collapse text-xs sm:text-sm">
        <thead>
          <tr>
            <th className="border-2 border-black bg-gray-50 px-2 py-1 sm:px-3"></th>
            <th className="border-2 border-black bg-gray-50 px-2 py-1 sm:px-3">2025年10月</th>
            <th className="border-2 border-black bg-gray-50 px-2 py-1 sm:px-3">2025年11月</th>
          </tr>
        </thead>
        <tbody>
          {SAMPLE_ROWS.map(([name, a, b]) => (
            <tr key={name}>
              <td className="border-2 border-black px-2 py-1 whitespace-nowrap sm:px-3">{name}</td>
              <td className="border-2 border-black px-2 py-1 text-right sm:px-3">{a}</td>
              <td className="border-2 border-black px-2 py-1 text-right sm:px-3">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="max-w-[16rem] text-center text-xs text-gray-500">
        1行目=月、1列目=カテゴリ名。月・カテゴリ名・金額とも下の一覧にあるものだけ取り込まれます。
      </p>
    </div>
  )
}

function AllowedMonthList() {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-bold text-gray-700">使える月の一覧</p>
      <div className="flex max-w-xs flex-wrap justify-center gap-1">
        {ALLOWED_DATES.map(date => (
          <span key={date} className="rounded border border-gray-400 bg-gray-50 px-2 py-0.5 text-xs">
            {monthLabel(date)}
          </span>
        ))}
      </div>
      <p className="max-w-[18rem] text-center text-xs text-gray-500">
        この一覧にない月の列は、インポート時に無視されます(新しい月は追加できません)。
      </p>
    </div>
  )
}

function AllowedAmountList() {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm font-bold text-gray-700">使える金額の一覧</p>
      <div className="flex max-w-xs flex-wrap justify-center gap-1">
        {ALLOWED_AMOUNTS.map(amount => (
          <span key={amount} className="rounded border border-gray-400 bg-gray-50 px-2 py-0.5 text-xs">
            {amount.toLocaleString()}
          </span>
        ))}
      </div>
      <p className="max-w-[18rem] text-center text-xs text-gray-500">
        この一覧にない金額は、インポート時に0として扱われます。
      </p>
    </div>
  )
}

function AllowedCategoryList() {
  return (
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
        この一覧にない列名(カテゴリ名)は、インポート時に無視されます。
      </p>
    </div>
  )
}

export default function ImportForm() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setError('')
    setResult(null)
    setLoading(true)
    try {
      const res = await importCsv(file)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 px-3 py-6 sm:gap-6 sm:px-4 sm:py-8">
      <h1 className="text-xl font-bold sm:text-2xl">CSVインポート</h1>

      {error && (
        <div
          role="alert"
          className="flex w-full max-w-md items-center gap-2 rounded-lg border-2 border-red-600 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 sm:text-base"
        >
          <span aria-hidden="true" className="text-lg sm:text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="flex w-full max-w-md flex-col gap-2 rounded-lg border-2 border-black px-4 py-3 text-sm sm:text-base">
          <p className="font-bold">インポートが完了しました</p>
          <p>取り込んだ月: {result.imported_months.map(monthLabel).join('、') || 'なし'}</p>
          <p>
            追加されたカテゴリ:{' '}
            {result.added_categories.length > 0 ? result.added_categories.join('、') : 'なし'}
          </p>
          {result.rejected_categories.length > 0 && (
            <p className="text-red-700">
              一覧にないため無視されたカテゴリ: {result.rejected_categories.join('、')}
            </p>
          )}
          {result.rejected_amounts.length > 0 && (
            <p className="text-red-700">
              一覧にないため0として扱われた金額: {result.rejected_amounts.join('、')}
            </p>
          )}
          {result.rejected_months.length > 0 && (
            <p className="text-red-700">
              一覧にないため無視された月: {result.rejected_months.join('、')}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start sm:gap-12">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={e => setFile(e.target.files?.[0] ?? null)}
            className="text-sm sm:text-base"
          />
          <button
            type="submit"
            disabled={!file || loading}
            className="h-10 w-36 rounded bg-black text-sm text-white hover:bg-gray-800 disabled:opacity-40 sm:h-12 sm:w-40 sm:text-base"
          >
            {loading ? 'インポート中…' : 'インポート'}
          </button>
        </form>

        <SampleCsvTable />
        <AllowedMonthList />
        <AllowedCategoryList />
        <AllowedAmountList />
      </div>
    </div>
  )
}
