import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '収支管理',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-white text-black">{children}</body>
    </html>
  )
}
