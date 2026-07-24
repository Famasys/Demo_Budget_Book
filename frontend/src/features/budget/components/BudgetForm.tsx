'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { BudgetFields, Category } from '../types'
import { createBudget, updateBudget, deleteBudget, fetchMonthData } from '../api/budget'
import { ALLOWED_AMOUNTS, ALLOWED_DATES, monthLabel } from '../constants'

const ALLOWED_AMOUNTS_SET = new Set(ALLOWED_AMOUNTS)

type Props =
  | { mode: 'create'; categories: Category[] }
  | { mode: 'edit'; dates: string[]; initialData: Record<string, BudgetFields>; categories: Category[] }

type FillDrag = { category: string; sourceValue: number; hoverIndex: number }

const CREATE_KEYS = ['create']

export default function BudgetForm(props: Props) {
  const router = useRouter()
  const { categories } = props
  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  const emptyValues = (): BudgetFields =>
    Object.fromEntries(categories.map(c => [c.name, 0]))

  const [selectedDate, setSelectedDate] = useState(ALLOWED_DATES[0])
  const [values, setValues] = useState<Record<string, BudgetFields>>(
    props.mode === 'edit' ? props.initialData : { create: emptyValues() }
  )
  const [error, setError] = useState('')
  const [checkedForDelete, setCheckedForDelete] = useState<Set<string>>(new Set())
  const [fillDrag, setFillDrag] = useState<FillDrag | null>(null)

  const dateKeys = props.mode === 'edit' ? props.dates : CREATE_KEYS
  const isMultiEdit = props.mode === 'edit' && dateKeys.length > 1

  useEffect(() => {
    if (!fillDrag) return
    const handleMouseUp = () => {
      setValues(prev => {
        const next = { ...prev }
        for (let i = 1; i <= fillDrag.hoverIndex; i++) {
          const d = dateKeys[i]
          next[d] = { ...next[d], [fillDrag.category]: fillDrag.sourceValue }
        }
        return next
      })
      setFillDrag(null)
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [fillDrag, dateKeys])

  const toggleCheckedForDelete = (dateKey: string) => {
    setCheckedForDelete(prev => {
      const next = new Set(prev)
      if (next.has(dateKey)) next.delete(dateKey)
      else next.add(dateKey)
      return next
    })
  }

  const set = (dateKey: string, field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = Number(e.target.value) || 0
    setValues(prev => ({ ...prev, [dateKey]: { ...prev[dateKey], [field]: num } }))
  }

  const balanceOf = (dateKey: string) => {
    const v = values[dateKey]
    const totalIncome = incomeCategories.reduce((s, c) => s + (v[c.name] || 0), 0)
    const totalExpense = expenseCategories.reduce((s, c) => s + (v[c.name] || 0), 0)
    return totalIncome - totalExpense
  }

  const handleFillStart = (category: string, sourceValue: number) => (e: React.MouseEvent) => {
    e.preventDefault()
    setFillDrag({ category, sourceValue, hoverIndex: 0 })
  }

  const handleCellEnter = (category: string, index: number) => {
    setFillDrag(prev => (prev && prev.category === category ? { ...prev, hoverIndex: index } : prev))
  }

  const handleCopyPrevious = async () => {
    setError('')
    const index = ALLOWED_DATES.indexOf(selectedDate)
    const prevDate = ALLOWED_DATES[index - 1]
    if (!prevDate) {
      setError('前月のデータが見つかりませんでした')
      return
    }
    try {
      const data = await fetchMonthData(prevDate)
      setValues(prev => ({ ...prev, create: { ...emptyValues(), ...data } }))
    } catch {
      setError('前月のデータが見つかりませんでした')
    }
  }

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault()
    setError('')
    const invalid = new Set(
      dateKeys.flatMap(d => Object.values(values[d])).filter(v => !ALLOWED_AMOUNTS_SET.has(v))
    )
    if (invalid.size > 0) {
      setError(`一覧にない金額は入力できません: ${[...invalid].join('、')}`)
      return
    }
    try {
      if (props.mode === 'create') {
        await createBudget({ today: selectedDate, values: values.create })
      } else {
        await Promise.all(dateKeys.map(d => updateBudget(d, values[d])))
      }
      router.push('/list')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const handleDelete = async () => {
    if (props.mode !== 'edit') return
    const targets = isMultiEdit ? [...checkedForDelete] : dateKeys
    if (targets.length === 0) return
    if (!confirm(`選択した${targets.length}件を削除しますか?`)) return
    setError('')
    try {
      await Promise.all(targets.map(d => deleteBudget(d)))
      router.push('/list')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました')
    }
  }

  const renderRow = (cat: Category, bold: boolean) => (
    <tr key={cat.id}>
      <td className={`border-2 border-black px-2 py-1 sm:px-4 sm:py-2 whitespace-nowrap ${bold ? 'font-bold' : ''}`}>
        {cat.name}
      </td>
      {dateKeys.map((d, i) => (
        <td
          key={d}
          onMouseEnter={() => handleCellEnter(cat.name, i)}
          className={`relative border-2 border-black px-2 py-1 sm:px-4 sm:py-2 ${
            fillDrag && fillDrag.category === cat.name && i > 0 && i <= fillDrag.hoverIndex ? 'bg-blue-100' : ''
          }`}
        >
          <input
            type="number"
            value={values[d][cat.name] || ''}
            onChange={set(d, cat.name)}
            placeholder="金額を入力してください"
            className="border rounded px-2 py-1 w-36 sm:w-56"
          />
          {isMultiEdit && i === 0 && (
            <span
              onMouseDown={handleFillStart(cat.name, values[d][cat.name] || 0)}
              title="ドラッグして他の月にコピー"
              className="absolute bottom-0.5 right-0.5 h-2 w-2 cursor-col-resize bg-black"
            />
          )}
        </td>
      ))}
    </tr>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 sm:gap-6 px-3 py-6 sm:px-4 sm:py-8">
      <h1 className="text-xl sm:text-2xl font-bold text-center">
        {props.mode === 'create'
          ? '収支入力'
          : dateKeys.length === 1
            ? `${dateKeys[0].slice(0, 7)} の編集`
            : `${dateKeys.length}件の月をまとめて編集`}
      </h1>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 w-full max-w-md rounded-lg border-2 border-red-600 bg-red-50 px-4 py-3 text-red-700 font-bold text-sm sm:text-base"
        >
          <span aria-hidden="true" className="text-lg sm:text-xl">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {props.mode === 'create' && (
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="border rounded px-2 py-1"
            >
              {ALLOWED_DATES.map(d => <option key={d} value={d}>{monthLabel(d)}</option>)}
            </select>
            <button
              type="button"
              onClick={handleCopyPrevious}
              className="h-8 rounded border-2 border-black px-3 text-xs hover:bg-gray-100 sm:h-9 sm:text-sm"
            >
              前月の値をコピー
            </button>
          </div>
          <p className="max-w-[20rem] text-center text-xs text-gray-500">
            このデモでは、あらかじめ用意された2026年2月〜7月の月しか選べません。
          </p>
        </div>
      )}

      <div className="w-full max-w-full overflow-x-auto">
        <table className="border-collapse mx-auto text-sm sm:text-base select-none">
          <thead>
            {isMultiEdit && (
              <tr>
                <th className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2"></th>
                {dateKeys.map(d => (
                  <th key={d} className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2">
                    <div className="flex flex-col items-center gap-1">
                      <span className="whitespace-nowrap">{monthLabel(d)}</span>
                      <label className="flex items-center gap-1 text-xs font-normal text-red-600">
                        <input
                          type="checkbox"
                          checked={checkedForDelete.has(d)}
                          onChange={() => toggleCheckedForDelete(d)}
                        />
                        削除
                      </label>
                    </div>
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {incomeCategories.map(cat => renderRow(cat, true))}
            {expenseCategories.map(cat => renderRow(cat, false))}
            <tr>
              <td className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2 font-bold whitespace-nowrap">残高</td>
              {dateKeys.map(d => (
                <td key={d} className="border-2 border-black px-2 py-1 sm:px-4 sm:py-2 font-bold text-right whitespace-nowrap">
                  ¥{balanceOf(d).toLocaleString()}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex flex-col items-center gap-2">
        <p className="text-xs font-bold text-gray-700 sm:text-sm">入力できる金額の一覧</p>
        <div className="flex max-w-md flex-wrap justify-center gap-1">
          {ALLOWED_AMOUNTS.map(amount => (
            <span key={amount} className="rounded border border-gray-400 bg-gray-50 px-2 py-0.5 text-xs">
              {amount.toLocaleString()}
            </span>
          ))}
        </div>
        <p className="max-w-[20rem] text-center text-xs text-gray-500">
          この一覧にある数字だけを入力してください。それ以外の金額は保存できません。
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        <button
          type="submit"
          className="w-28 h-10 text-base sm:w-36 sm:h-12 sm:text-lg bg-black text-white rounded hover:bg-gray-800"
        >
          {props.mode === 'create' ? '保　存' : '更　新'}
        </button>
        {props.mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isMultiEdit && checkedForDelete.size === 0}
            className="w-28 h-10 text-base sm:w-36 sm:h-12 sm:text-lg border-2 border-red-600 text-red-600 rounded hover:bg-red-50 disabled:opacity-40 disabled:hover:bg-transparent"
          >
            削　除
          </button>
        )}
      </div>
    </form>
  )
}
