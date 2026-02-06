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
      <body className="bg-[#FFFDE7] antialiased">
        {/* 모든 디자인 요소는 page.tsx에서 관리하므로 여기서는 children만 렌더링합니다 */}
        {children}
      </body>
    </html>
  )
}