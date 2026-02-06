'use client'

import { useEffect, useState, Suspense, useMemo } from 'react'
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
  const [isLoading, setIsLoading] = useState(true)

  // 1. 데이터 로드: base_points 컬럼을 정확히 호출합니다.
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const { data: acts } = await supabase.from('activity_types').select('*')
      if (acts) setActivities(acts)
      
      if (isAdminView || mode === 'hq' || mode === 'guide') await fetchPending()
      await fetchRankings()
      setIsLoading(false)
    }
    fetchData()
  }, [mode, isAdminView])

  const fetchPending = async () => {
    const { data } = await supabase.from('activity_reports').select('*, activity_types(name)').eq('status', 'pending').order('created_at', { ascending: false })
    if (data) setPendingReports(data)
  }

  const fetchRankings = async () => {
    // ⚠️ [수정] points -> base_points로 컬럼명 매칭
    const { data } = await supabase
      .from('activity_reports')
      .select('user_name, activity_types(base_points)')
      .eq('status', 'approved')

    if (data && data.length > 0) {
      const aggregate = data.reduce((acc: any, curr: any) => {
        const name = curr.user_name?.trim() || '익명'
        const rawData = curr.activity_types
        // 수파베이스 조인 결과가 배열인 경우와 객체인 경우 모두 대응
        const points = Array.isArray(rawData) 
          ? (rawData[0]?.base_points || 10) 
          : (rawData?.base_points || 10)
        
        acc[name] = (acc[name] || 0) + points
        return acc
      }, {})

      const sorted = Object.entries(aggregate)
        .map(([name, point]: any) => ({ name, point }))
        .sort((a, b) => b.point - a.point)
      
      setRankings(sorted)
    } else {
      setRankings([])
    }
  }

  // 🔍 실시간 검색 필터: 공백 무시 로직 강화
  const searchedUser = useMemo(() => {
    const target = searchName.trim().replace(/\s/g, '')
    if (!target) return null
    return rankings.find(r => r.name.trim().replace(/\s/g, '').includes(target))
  }, [searchName, rankings])

  const rankOfSearched = useMemo(() => {
    if (!searchedUser) return 0
    return rankings.findIndex(r => r.name === searchedUser.name) + 1
  }, [searchedUser, rankings])

  const handleApprove = async (id: number) => {
    const { error } = await supabase.from('activity_reports').update({ status: 'approved' }).eq('id', id)
    if (!error) { alert('✅ 승인 완료!'); fetchPending(); fetchRankings(); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !selectedActivity) return alert('성함과 활동을 입력해주세요!')
    const { error } = await supabase.from('activity_reports').insert([{ user_name: userName, activity_id: Number(selectedActivity), status: 'pending' }])
    if (!error) { alert('📝 제출 완료! 운영본부 승인 후 반영됩니다.'); setUserName(''); }
  }

  const getBadge = (point: number) => {
    if (point >= 100) return { title: '아낌없이 주는 나무 🌳', color: 'bg-green-100 text-green-700' }
    if (point >= 31) return { title: '든든한 새싹 시민 🌱', color: 'bg-blue-100 text-blue-700' }
    return { title: '소중한 씨앗 시민 ✨', color: 'bg-orange-100 text-orange-700' }
  }

  const Header = () => {
    const isHQActive = mode === 'hq' || mode === 'guide' || mode === 'vision' || isAdminView;
    return (
      <header className="bg-white sticky top-0 z-50 border-b-4 border-[#FF8A65] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-16 sm:h-20 whitespace-nowrap overflow-x-auto no-scrollbar">
          <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2 flex-shrink-0 mr-6">
             <div className="bg-[#FF8A65] text-white px-2 py-1 font-black text-sm rounded-lg">참여연대</div>
             <span className="text-lg font-bold tracking-tighter text-[#4E342E]">시민연결</span>
          </div>
          <nav className="flex gap-5 items-center font-bold text-xs sm:text-sm">
            <button onClick={() => router.push('/')} className={`${!mode && !isAdminView ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>활동보고</button>
            <button onClick={() => router.push('?mode=ranking')} className={`${mode === 'ranking' ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>함께걷는길</button>
            <div className="h-3 w-[1px] bg-gray-200"></div>
            <button onClick={() => router.push('?mode=hq')} className={`px-3 py-1.5 rounded-xl transition-all ${isHQActive ? "bg-[#5D4037] text-white" : "bg-gray-100 text-[#BCAAA4]"}`}>운영본부 ⚙️</button>
          </nav>
        </div>
        {isHQActive && (
          <div className="bg-[#FFF8E1] border-t border-[#FFE0B2]">
            <div className="max-w-5xl mx-auto px-4 flex justify-around h-12 items-center text-[11px] sm:text-xs font-black">
              <button onClick={() => router.push('?mode=guide')} className={`${mode === 'guide' ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>📖 사용가이드</button>
              <button onClick={() => router.push('?mode=vision')} className={`${mode === 'vision' ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>📜 연대백서</button>
              <button onClick={() => router.push('?admin=true')} className={`${isAdminView ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>⚙️ 승인관리</button>
            </div>
          </div>
        )}
      </header>
    )
  }

  // --- [화면 1] 연대 백서: 상세 내용 복원 ---
  if (mode === 'vision') return (
    <main className="min-h-screen bg-white break-keep"><Header />
      <div className="max-w-3xl mx-auto py-16 px-6 leading-relaxed">
        <h2 className="text-3xl font-black text-center mb-12 italic text-[#FF8A65]">"기록되지 않은 시민의 힘은<br/>기억되지 않습니다"</h2>
        <div className="space-y-12 text-gray-700">
          <section className="border-l-4 border-[#FF8A65] pl-6">
            <h3 className="text-xl font-bold mb-4 text-[#5D4037]">⚖️ 보이지 않는 헌신의 역사를 기록합니다</h3>
            <p className="text-lg">현장에서 묵묵히 정성을 다하신 시민님들의 발걸음을 이제 디지털 데이터로 영구히 보존합니다. 이는 참여연대의 역사가 단 몇 명의 대표자가 아닌, 현장을 지킨 수만 명의 시민에 의해 쓰여졌음을 증명하는 가장 확실한 기록관이 될 것입니다.</p>
          </section>
          <section className="border-l-4 border-blue-500 pl-6">
            <h3 className="text-xl font-bold mb-4 text-[#5D4037]">📈 숫자로 증명하는 시민의 힘과 후원의 가치</h3>
            <p className="text-lg">막연한 호소보다 <strong>"이번 한 달간 수백 명의 시민이 연대했다"</strong>는 투명한 숫자는 참여연대의 역동성을 증명하는 무기가 됩니다. 이 기록은 후원자들에게 신뢰를 주고, 우리가 더 당당하게 조직의 내일을 위한 후원을 요청할 수 있는 전략적 지표가 됩니다.</p>
          </section>
        </div>
      </div>
    </main>
  )

  // --- [화면 2] 함께 걷는 길: 시상대 + 실시간 검색 ---
  if (mode === 'ranking') return (
    <main className="min-h-screen bg-[#FDFCFB] break-keep"><Header />
      <div className="max-w-2xl mx-auto py-10 px-6 text-center">
        <h2 className="text-2xl font-black mb-10 text-[#5D4037]">🏆 오늘의 연대 길잡이</h2>
        
        <div className="grid grid-cols-3 gap-2 mb-12 items-end">
           {[1, 0, 2].map((idx) => {
             const r = rankings[idx];
             if (!r && isLoading) return <div key={idx} className="h-32 bg-gray-50 rounded-t-[30px] animate-pulse flex items-center justify-center text-[10px] text-gray-300">로딩중...</div>;
             if (!r) return <div key={idx} className="h-10 bg-gray-50 rounded-2xl opacity-20"></div>;
             return (
               <div key={idx} className={`p-4 rounded-t-[30px] shadow-sm ${idx === 0 ? 'bg-yellow-50 h-44 border-t-4 border-yellow-200' : 'bg-white h-32 border border-gray-100'}`}>
                  <span className="text-xl mb-1 block">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <span className="font-black text-gray-800 text-xs truncate block">{r.name} 님</span>
                  <span className="text-[10px] font-bold text-[#FF7043]">{r.point} pts</span>
               </div>
             )
           })}
        </div>

        <div className="mb-6">
          <input 
            type="text" 
            placeholder="성함을 입력해 내 기록을 확인하세요" 
            value={searchName} 
            onChange={(e) => setSearchName(e.target.value)} 
            className="w-full p-4 rounded-full border-2 border-[#FFE0B2] shadow-lg text-center font-bold outline-none focus:border-[#FF7043]" 
          />
          <p className="text-[11px] text-gray-400 mt-3 font-bold">💡 입력 즉시 자동으로 검색됩니다.</p>
        </div>

        {searchedUser ? (
          <div className="bg-[#5D4037] p-8 rounded-[40px] text-white shadow-2xl mt-6 animate-in zoom-in duration-300 text-center">
            <h4 className="text-2xl font-black">{searchedUser.name} 님</h4>
            <p className={`inline-block px-4 py-1 rounded-full font-bold text-sm mt-3 ${getBadge(searchedUser.point).color}`}>{getBadge(searchedUser.point).title}</p>
            <div className="mt-8 grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 pt-6">
              <div><p className="text-[10px] opacity-50 mb-1">나의 순위</p><p className="text-2xl font-black">{rankOfSearched}위</p></div>
              <div><p className="text-[10px] opacity-50 mb-1">나의 온도</p><p className="text-2xl font-black text-[#FF8A65]">{searchedUser.point} pts</p></div>
            </div>
          </div>
        ) : searchName && !isLoading ? (
          <div className="text-gray-300 font-bold py-10">연대의 기록을 찾고 있습니다...</div>
        ) : null}
      </div>
    </main>
  )

  // --- [운영본부 / 가이드 / 승인] ---
  if (isAdminView || mode === 'hq' || mode === 'guide') return (
    <main className="min-h-screen bg-gray-50 break-keep"><Header />
      <div className="max-w-4xl mx-auto py-10 px-4">
        {mode === 'guide' ? (
          <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 font-bold text-gray-600 space-y-6 text-sm">
            <h2 className="text-2xl font-black text-[#5D4037]">📖 이용 가이드</h2>
            <p>1. [활동보고]에서 성함과 활동 내용을 선택하고 [인증 완료]를 누릅니다.</p>
            <p>2. 운영본부 승인 후 [함께걷는길] 메뉴에서 본인의 성장 등급과 순위를 확인하실 수 있습니다.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-[#5D4037] p-5 text-white flex justify-between items-center"><h2 className="font-black">⚙️ 실시간 승인 관리</h2></div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-widest">
                <tr><th className="p-5">활동가</th><th className="p-5">활동 내용</th><th className="p-5 text-center">처리</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingReports.length === 0 ? <tr><td colSpan={3} className="p-20 text-center text-gray-300 font-bold italic">승인할 기록이 없습니다.</td></tr> : 
                  pendingReports.map(r => (
                    <tr key={r.id} className="hover:bg-orange-50/50 transition-colors">
                      <td className="p-5 font-bold">{r.user_name}</td>
                      <td className="p-5 text-gray-500">{r.activity_types?.name}</td>
                      <td className="p-5 text-center"><button onClick={() => handleApprove(r.id)} className="bg-[#00C853] text-white px-4 py-2 rounded-xl font-black text-xs">최종 승인</button></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )

  // --- [🏠 메인 화면] ---
  return (
    <main className="min-h-screen bg-[#FFFDE7] break-keep"><Header />
      <div className="py-20 text-center bg-[#FFE0B2] text-[#5D4037] px-6">
        <h1 className="text-4xl font-black mb-4 tracking-tighter">참여연대 시민연결</h1>
        <p className="opacity-80 font-bold text-sm italic">기록되지 않은 시민의 힘은 기억되지 않습니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-10 px-6 pb-20">
        <div className="bg-white p-10 rounded-[50px] shadow-2xl border-4 border-[#FF8A65]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-lg outline-none focus:border-[#FF8A65]" />
            <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-lg appearance-none">
              <option value="">활동을 선택하세요</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button className="w-full bg-[#FF8A65] text-white py-6 rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition-all">인증 완료 🚀</button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return ( <Suspense fallback={<div className="flex items-center justify-center min-h-screen font-black text-[#FF8A65]">LOADING...</div>}><HomeContent /></Suspense> )
}