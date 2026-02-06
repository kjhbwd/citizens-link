'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') 
  const isAdminView = searchParams.get('admin') === 'true'

  const [activities, setActivities] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<string | number>('')
  const [pendingReports, setPendingReports] = useState<any[]>([])
  const [rankings, setRankings] = useState<{name: string, point: number}[]>([])
  const [searchName, setSearchName] = useState('')

  useEffect(() => {
    async function fetchData() {
      const { data: acts } = await supabase.from('activity_types').select('*')
      if (acts) setActivities(acts)
      if (isAdminView || mode === 'hq' || mode === 'guide') fetchPending()
      if (mode === 'ranking') fetchRankings()
    }
    fetchData()
  }, [mode, isAdminView])

  const fetchPending = async () => {
    const { data } = await supabase.from('activity_reports').select('*, activity_types(name)').eq('status', 'pending').order('created_at', { ascending: false })
    if (data) setPendingReports(data)
  }

  const fetchRankings = async () => {
    const { data } = await supabase.from('activity_reports').select('user_name, activity_types(points)').eq('status', 'approved')
    if (data) {
      const aggregate = data.reduce((acc: any, curr: any) => {
        const name = curr.user_name?.trim() || '익명'
        const points = curr.activity_types?.points || 10
        acc[name] = (acc[name] || 0) + points
        return acc
      }, {})
      const sorted = Object.entries(aggregate).map(([name, point]: any) => ({ name, point })).sort((a, b) => b.point - a.point)
      setRankings(sorted)
    }
  }

  const handleApprove = async (id: number) => {
    const { error } = await supabase.from('activity_reports').update({ status: 'approved' }).eq('id', id)
    if (!error) { alert('✅ 승인 완료! 연대의 기록이 업데이트되었습니다.'); fetchPending(); fetchRankings(); }
  }

  const getBadge = (point: number) => {
    if (point >= 100) return { title: '아름다운 나무 🌳', color: 'text-green-600' }
    if (point >= 31) return { title: '든든한 새싹 🌱', color: 'text-blue-500' }
    return { title: '소중한 씨앗 ✨', color: 'text-orange-400' }
  }

  // --- 🎨 헤더: 운영본부 클릭 시 하위 메뉴 노출 로직 보완 ---
  const Header = () => {
    const isHQActive = mode === 'hq' || mode === 'guide' || isAdminView;
    return (
      <header className="bg-white sticky top-0 z-50 border-b-4 border-[#FF8A65] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-16 sm:h-20 whitespace-nowrap overflow-x-auto no-scrollbar">
          <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2 flex-shrink-0 mr-4">
             <div className="bg-[#FF8A65] text-white px-2 py-1 font-black text-sm rounded-lg">참여연대</div>
             <span className="text-lg font-bold tracking-tighter text-[#4E342E]">시민연결</span>
          </div>
          <nav className="flex gap-4 items-center font-bold text-xs sm:text-sm">
            <button onClick={() => router.push('/')} className={`${!mode && !isAdminView ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>활동보고</button>
            <button onClick={() => router.push('?mode=vision')} className={`${mode === 'vision' ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>연대백서</button>
            <button onClick={() => router.push('?mode=ranking')} className={`${mode === 'ranking' ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>함께걷는길</button>
            <div className="h-3 w-[1px] bg-gray-200"></div>
            <button onClick={() => router.push('?mode=hq')} className={`px-3 py-1.5 rounded-xl transition-all ${isHQActive ? "bg-[#5D4037] text-white" : "bg-gray-100 text-[#BCAAA4]"}`}>운영본부 ⚙️</button>
          </nav>
        </div>
        
        {/* 하위 디렉토리: 운영본부 관련 모드일 때만 표시 */}
        {isHQActive && (
          <div className="bg-[#FFF8E1] border-t border-[#FFE0B2]">
            <div className="max-w-5xl mx-auto px-4 flex justify-around h-12 items-center text-[11px] font-black">
              <button onClick={() => router.push('?mode=guide')} className={`${mode === 'guide' ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>📖 사용가이드</button>
              <button onClick={() => router.push('?admin=true')} className={`${isAdminView ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>⚙️ 승인관리</button>
            </div>
          </div>
        )}
      </header>
    )
  }

  // --- [1] 연대 백서: 깊이 있는 내용 구성 ---
  if (mode === 'vision') return (
    <main className="min-h-screen bg-white"><Header />
      <div className="max-w-3xl mx-auto py-16 px-6 break-keep">
        <h2 className="text-3xl font-black text-center mb-12 leading-tight italic text-[#FF8A65]">"기록되지 않은 시민의 힘은<br/>기억되지 않습니다"</h2>
        <div className="space-y-12 text-gray-700 leading-relaxed">
          <section className="border-l-4 border-[#FF8A65] pl-6">
            <h3 className="text-xl font-bold mb-4 text-[#5D4037]">⚖️ 보이지 않는 헌신의 주인공을 찾아서</h3>
            <p className="text-base">뜨거운 집회 현장의 앞줄뿐만 아니라, 가장자리에서 묵묵히 주차를 안내하고 쓰레기를 줍던 그 소중한 시민들의 발걸음을 우리는 잊지 않으려 합니다. 이 시스템은 잊혀질 수 있는 모든 정성을 디지털로 정량화하여 참여연대의 역사가 단 몇 명이 아닌 수천 명의 시민에 의해 쓰여졌음을 증명하는 기록관입니다.</p>
          </section>
          <section className="border-l-4 border-green-500 pl-6">
            <h3 className="text-xl font-bold mb-4 text-[#5D4037]">📈 조직의 내일을 여는 투명한 지표</h3>
            <p className="text-base">막연한 호소 대신 <strong>"지난 한 달간 500명의 시민이 1,200시간 동안 현장을 지켰습니다"</strong>라는 정직한 숫자는 후원자들에게 우리 활동의 역동성을 증명하는 가장 강력한 무기가 됩니다. 이 데이터는 참여연대가 사회적 지지를 이끌어내고 투명한 후원을 요청할 수 있는 당당한 근거가 될 것입니다.</p>
          </section>
          <section className="bg-orange-50 p-8 rounded-[40px] text-center">
            <h4 className="font-black text-lg mb-4 text-[#FF7043]">🌱 우리가 함께 성장하는 방식</h4>
            <p className="text-sm">점수로 줄을 세우는 대신, 활동의 깊이에 따라 <strong>씨앗 → 새싹 → 나무</strong>로 성장하는 즐거움을 드립니다. 경쟁이 아닌 연대를 통해 우리는 더 큰 숲을 이룰 것입니다.</p>
          </section>
        </div>
      </div>
    </main>
  )

  // --- [2] 함께 걷는 길 (랭킹 & 개인 검색): TOP 3 유지 + 개인 찾기 ---
  if (mode === 'ranking') {
    const searchedUser = rankings.find(r => r.name.includes(searchName))
    return (
      <main className="min-h-screen bg-[#FDFCFB]"><Header />
        <div className="max-w-2xl mx-auto py-10 px-6 break-keep">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-black mb-2 text-[#5D4037]">🏆 연대의 발자취</h2>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Warmth of Solidarity</p>
          </div>
          
          {/* TOP 3: 언제나 상단에 따뜻하게 노출 */}
          <div className="grid grid-cols-3 gap-2 mb-12 items-end text-center">
             {[1, 0, 2].map((idx) => {
               const r = rankings[idx];
               if (!r) return <div key={idx} className="h-10 bg-gray-50 rounded-2xl opacity-20"></div>;
               return (
                 <div key={idx} className={`p-4 rounded-t-[40px] shadow-sm flex flex-col items-center ${idx === 0 ? 'bg-yellow-50 h-48 border-x-2 border-t-2 border-yellow-200 ring-4 ring-yellow-50' : 'bg-white h-36 border border-gray-100'}`}>
                    <span className="text-2xl mb-2">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                    <span className="font-black text-gray-800 text-sm mb-1">{r.name}</span>
                    <span className="text-[10px] font-bold text-[#FF7043]">{r.point} pts</span>
                 </div>
               )
             })}
          </div>

          {/* 나의 기록 찾기 */}
          <div className="mb-8">
            <label className="text-[10px] font-black text-gray-400 ml-4 mb-2 block uppercase tracking-tighter">Search My Record</label>
            <input type="text" placeholder="성함을 입력하여 연대의 온도를 확인하세요" value={searchName} onChange={(e) => setSearchName(e.target.value)} className="w-full p-5 rounded-[30px] border-2 border-[#FFE0B2] shadow-lg text-center font-bold outline-none focus:border-[#FF7043] transition-all" />
          </div>

          {/* 검색 결과 강조 및 칭호 표시 */}
          <div className="space-y-4">
            {searchName && searchedUser ? (
              <div className="bg-[#5D4037] p-8 rounded-[40px] text-white shadow-2xl scale-105 transition-all">
                <p className="text-xs opacity-70 mb-1 text-center font-bold">당신은 소중한 길잡이입니다!</p>
                <div className="flex justify-between items-center px-4">
                  <div>
                    <h4 className="text-2xl font-black">{searchedUser.name} 님</h4>
                    <p className={`font-bold mt-1 ${getBadge(searchedUser.point).color}`}>{getBadge(searchedUser.point).title}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-black text-[#FF8A65]">{searchedUser.point}</span>
                    <span className="text-xs ml-1 opacity-50">PTS</span>
                  </div>
                </div>
              </div>
            ) : searchName && (
              <div className="text-center py-10 text-gray-300 font-bold">기록을 찾을 수 없습니다. (오타 혹은 승인 대기 중)</div>
            )}
          </div>
        </div>
      </main>
    )
  }

  // --- [3] 운영본부: 승인 관리 ---
  if (isAdminView || mode === 'hq') return (
    <main className="min-h-screen bg-gray-50"><Header />
      <div className="max-w-4xl mx-auto py-10 px-4 break-keep">
        <h2 className="text-xl font-black mb-6 flex items-center gap-2">⚙️ 승인 관리 센터 <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">{pendingReports.length} 건</span></h2>
        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-[#5D4037] text-white text-[10px] uppercase tracking-widest">
              <tr><th className="p-5">활동가</th><th className="p-5">활동 내용</th><th className="p-5 text-center">승인</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {pendingReports.length === 0 ? <tr><td colSpan={3} className="p-20 text-center text-gray-300 font-bold italic">새로운 연대 기록을 기다리고 있습니다. 😊</td></tr> : 
                pendingReports.map(r => (
                  <tr key={r.id} className="hover:bg-orange-50/50">
                    <td className="p-5 font-bold text-gray-700">{r.user_name}</td>
                    <td className="p-5 text-gray-500 font-medium">{r.activity_types?.name}</td>
                    <td className="p-5 text-center"><button onClick={() => handleApprove(r.id)} className="bg-[#00C853] text-white px-5 py-2 rounded-2xl font-black text-xs hover:shadow-lg transition-all">최종 승인</button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )

  // --- [4] 메인 화면 (활동보고) ---
  return (
    <main className="min-h-screen bg-[#FFFDE7] break-keep"><Header />
      <div className="py-20 text-center bg-[#FFE0B2] text-[#5D4037] px-6">
        <h1 className="text-4xl font-black mb-4 tracking-tighter leading-tight">참여연대 시민연결</h1>
        <p className="opacity-80 font-bold text-sm sm:text-base max-w-sm mx-auto">당신의 소중한 활동이<br/>참여연대의 튼튼한 뿌리가 됩니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-10 px-6 pb-20">
        <div className="bg-white p-10 rounded-[50px] shadow-2xl border-4 border-[#FF8A65]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-300 ml-2 uppercase">Your Name</label>
              <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-lg outline-none focus:border-[#FF8A65] focus:bg-white transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-300 ml-2 uppercase">Activity Type</label>
              <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-lg appearance-none">
                <option value="">활동을 선택하세요</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <button className="w-full bg-[#FF8A65] text-white py-6 rounded-3xl font-black text-2xl shadow-xl hover:bg-[#FF7043] transition-all active:scale-95">인증 완료 🚀</button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return ( <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-[#FF8A65] animate-pulse">CONNECTING...</div>}><HomeContent /></Suspense> )
}