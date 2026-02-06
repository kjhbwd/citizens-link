import './globals.css'

export const metadata = {
  title: '참여연대 시민연결 | 연대와 공존의 기록',
  description: '따뜻한 연대로 만드는 공존의 세상, 참여연대 시민연결 시스템입니다.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-[#FFFDE7] antialiased break-keep">
        {/* 모든 레이아웃과 메뉴는 page.tsx에서 통합 관리합니다 */}
        {children}
      </body>
    </html>
  )
}