import './globals.css'

export const metadata = {
  title: '참여연대 시민연결',
  description: '시민의 연대를 기록하는 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#FFFDE7] antialiased break-keep">
        {children}
      </body>
    </html>
  )
}