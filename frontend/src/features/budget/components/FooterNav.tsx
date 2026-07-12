'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/list', label: '履歴' },
  { href: '/graph', label: 'グラフ表示' },
  { href: '/import', label: 'CSVインポート' },
  { href: '/export', label: 'CSVエクスポート' },
  { href: '/categories', label: 'カテゴリ編集' },
]

// Pages whose content has a fixed, narrow width — safe to pin the nav beside it.
// Pages with content that grows wider (multi-month edit, graphs, history/export tables) keep the nav below.
const SIDE_PATHS = ['/', '/import', '/categories']

const linkClassName = 'flex h-10 w-36 items-center justify-center rounded border-2 border-black text-sm hover:bg-gray-100 sm:h-12 sm:w-40 sm:text-base'

const bottomClassName = 'flex flex-wrap justify-center gap-3 pb-6 sm:gap-4 sm:pb-8'
// Side placement only kicks in on wide *and* landscape screens (PC/tablet).
// Portrait screens (phones, or a tablet held upright) always keep the nav below the content.
const sideClassName = `${bottomClassName} lg:landscape:fixed lg:landscape:right-[12%] lg:landscape:top-1/2 lg:landscape:w-auto lg:landscape:-translate-y-1/2 lg:landscape:flex-col lg:landscape:flex-nowrap lg:landscape:pb-0`

export default function FooterNav() {
  const pathname = usePathname()
  const links = LINKS.filter(link => link.href !== pathname)
  const className = SIDE_PATHS.includes(pathname) ? sideClassName : bottomClassName

  return (
    <footer className={className}>
      {links.map(link => (
        <Link key={link.href} href={link.href} className={linkClassName}>
          {link.label}
        </Link>
      ))}
    </footer>
  )
}
