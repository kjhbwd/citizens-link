import './globals.css'
import Link from 'next/link'

export const metadata = {
  title: '참여연대 시민연결 | 연대와 공존의 기록',
  description: '따뜻한 연대로 만드는 공존의 세상, 참여연대 활동지수 시스템입니다.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="bg-[#FFFDE7] text-[#5D4037] font-sans antialiased">
        {/* 참여연대 공식 스타일 내비게이션 (따뜻한 버전) */}
        <nav className="bg-white/90 backdrop-blur-md border-b-4 border-[#FF8A65] sticky top-0 z-50 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-20 flex justify-between items-center">
            
            {/* 로고 영역 */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-[#FF8A65] text-white px-3 py-2 font-black text-xl rounded-xl shadow-sm group-hover:bg-[#FF7043] transition-colors">
                참여연대
              </div>
              <span className="text-2xl font-bold tracking-tighter text-[#4E342E]">시민연결</span>
            </Link>
            
            {/* 메뉴 영역 */}
            <div className="flex gap-8 font-bold text-sm text-[#8D6E63] items-center">
              <Link 
                href="/vision" 
                className="text-[#FF8A65] hover:text-[#F4511E] transition-all flex items-center gap-1 bg-[#FFF3E0] px-3 py-1.5 rounded-full"
              >
                <span>📜</span> 연대 백서
              </Link>
              <Link href="/" className="hover:text-[#FF8A65] transition">
                활동보고
              </Link>
              <Link href="/ranking" className="hover:text-[#FF8A65] transition">
                명예의 전당
              </Link>
              
              {/* 운영본부 (구분선 추가) */}
              <div className="h-4 w-[1px] bg-[#D7CCC8] ml-2"></div>
              <Link href="/admin" className="hover:text-[#FF8A65] transition text-[#BCAAA4]">
                운영본부
              </Link>
            </div>
          </div>
        </nav>

        {/* 페이지 본문 영역 */}
        <div className="min-h-[calc(100vh-80px)]">
          {children}
        </div>

        {/* 하단 정보 영역 */}
        <footer className="bg-white border-t border-[#FFE0B2] py-10">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <p className="text-[#A1887F] text-sm">
              우리의 연대가 세상을 바꿉니다. 참여연대 시민연결 시스템
            </p>
            <p className="text-[#D7CCC8] text-[10px] mt-2 italic">
              Developed for Solidarity and Coexistence
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}