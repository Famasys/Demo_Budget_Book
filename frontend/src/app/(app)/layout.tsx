import FooterNav from '@/features/budget/components/FooterNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="bg-yellow-100 px-3 py-2 text-center text-xs text-yellow-900 sm:text-sm">
        これはデモ画面です。カテゴリ名は用意された一覧からのみ登録できるようになっており、実際の氏名・会社名などの個人情報は入力・登録できません。
      </div>
      {children}
      <FooterNav />
    </>
  )
}
