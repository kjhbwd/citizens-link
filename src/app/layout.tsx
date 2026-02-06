import './globals.css'

export const metadata = {
  title: '참여연대 시민연결 | 연대의 발자취',
  description: '우리의 걸음이 세상을 바꿉니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-[#FFFDE7] antialiased break-keep text-[#4E342E]">
        {children}
      </body>
    </html>
  )
}