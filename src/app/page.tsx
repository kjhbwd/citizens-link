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

  // 1. 데이터 로드 로직 (초기 로드 시 모든 승인 데이터 미리 가져오기)
  useEffect(() => {
    async function fetchData() {
      const { data: acts } = await supabase.from('activity_types').select('*')
      if (acts) setActivities(acts)
      
      if (isAdminView || mode === 'hq' || mode === 'guide') fetchPending()
      fetchRankings() // 검색 속도를 위해 랭킹 데이터를 미리 불러옵니다.
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

  // 2. 실시간 검색 필터링 (엔터 없이 즉시 찾기)
  const searchedUser = useMemo(() => {
    if (!searchName.trim()) return null
    return rankings.find(r => r.name.replace(/\s/g, '').includes(searchName.trim().replace(/\s/g, '')))
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
            <div className="max-w-5xl mx-auto px-4 flex justify-around h-12 items-center text-[11px] font-black">
              <button onClick={() => router.push('?mode=guide')} className={`${mode === 'guide' ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>📖 가이드</button>
              <button onClick={() => router.push('?mode=vision')} className={`${mode === 'vision' ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>📜 연대백서</button>
              <button onClick={() => router.push('?admin=true')} className={`${isAdminView ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>⚙️ 승인관리</button>
            </div>
          </div>
        )}
      </header>
    )
  }

  // --- 📜 연대 백서 (상세 내용 보강) ---
  if (mode === 'vision') return (
    <main className="min-h-screen bg-white break-keep"><Header />
      <div className="max-w-3xl mx-auto py-16 px-6 leading-relaxed">
        <h2 className="text-3xl font-black text-center mb-12 italic text-[#FF8A65]">"기록되지 않은 시민의 힘은<br/>기억되지 않습니다"</h2>
        <div className="space-y-12 text-gray-700">
          <section className="border-l-4 border-[#FF8A65] pl-6">
            <h3 className="text-xl font-bold mb-4 text-[#5D4037]">⚖️ 보이지 않는 헌신의 주인공을 찾아서</h3>
            <p className="text-lg">현장에서 묵묵히 정성을 다하신 시민님들의 발걸음을 이제 디지털로 기록합니다. 이 데이터는 참여연대가 특정인이 아닌 수많은 시민의 힘으로 지탱된다는 확실한 증거가 될 것입니다.</p>
          </section>
          <section className="border-l-4 border-blue-500 pl-6">
            <h3 className="text-xl font-bold mb-4 text-[#5D4037]">📈 더 큰 지지와 후원의 강력한 근거</h3>
            <p className="text-lg">"열심히 했다"는 말 대신 <strong>"이번 달 500명의 시민이 1,200시간 연대했다"</strong>는 정직한 숫자는 우리 조직의 역동성을 증명합니다. 이는 우리가 더 당당하게 후원을 요청할 수 있는 신뢰의 지표가 될 것입니다.</p>
          </section>
        </div>
      </div>
    </main>
  )

  // --- 🏆 함께 걷는 길 (실시간 검색 보완) ---
  if (mode === 'ranking') return (
    <main className="min-h-screen bg-[#FDFCFB] break-keep"><Header />
      <div className="max-w-2xl mx-auto py-10 px-6 text-center">
        <h2 className="text-2xl font-black mb-10 text-[#5D4037]">🏆 오늘의 연대 길잡이</h2>
        
        {/* 상위 3인 리더보드 */}
        <div className="grid grid-cols-3 gap-2 mb-12 items-end">
           {[1, 0, 2].map((idx) => {
             const r = rankings[idx];
             if (!r) return <div key={idx} className="h-10 bg-gray-50 rounded-2xl opacity-20"></div>;
             return (
               <div key={idx} className={`p-4 rounded-t-[30px] shadow-sm ${idx === 0 ? 'bg-yellow-50 h-40 border-t-4 border-yellow-200' : 'bg-white h-32 border border-gray-100'}`}>
                  <span className="text-xl mb-1 block">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</span>
                  <span className="font-black text-gray-800 text-xs truncate block">{r.name} 님</span>
                  <span className="text-[10px] font-bold text-[#FF7043]">{r.point} pts</span>
               </div>
             )
           })}
        </div>

        {/* 실시간 검색 영역 */}
        <div className="mb-4">
          <input 
            type="text" 
            placeholder="성함을 입력하세요" 
            value={searchName} 
            onChange={(e) => setSearchName(e.target.value)} 
            className="w-full p-4 rounded-full border-2 border-[#FFE0B2] shadow-lg text-center font-bold outline-none focus:border-[#FF7043] transition-all" 
          />
          <p className="text-[11px] text-gray-400 mt-3 font-bold">
            💡 성함을 입력하시면 자동으로 검색됩니다 (엔터 불필요)
          </p>
        </div>

        {searchedUser ? (
          <div className="bg-[#5D4037] p-8 rounded-[40px] text-white shadow-2xl mt-6 animate-in zoom-in duration-300">
            <h4 className="text-2xl font-black">{searchedUser.name} 님</h4>
            <p className={`inline-block px-4 py-1 rounded-full font-bold text-sm mt-3 ${getBadge(searchedUser.point).color}`}>{getBadge(searchedUser.point).title}</p>
            <div className="mt-6 flex justify-around items-center border-t border-white/10 pt-6">
              <div><p className="text-[10px] opacity-50">연대 순위</p><p className="text-xl font-black">{rankOfSearched}위</p></div>
              <div><p className="text-[10px] opacity-50">연대 온도</p><p className="text-xl font-black text-[#FF8A65]">{searchedUser.point} pts</p></div>
            </div>
          </div>
        ) : searchName && <div className="text-gray-300 font-bold py-10">연대의 기록을 찾고 있습니다...</div>}
      </div>
    </main>
  )

  // --- ⚙️ 운영본부 / 가이드 / 승인 ---
  if (isAdminView || mode === 'hq' || mode === 'guide') return (
    <main className="min-h-screen bg-gray-50 break-keep"><Header />
      <div className="max-w-4xl mx-auto py-10 px-4">
        {mode === 'guide' ? (
          <div className="bg-white p-10 rounded-[40px] shadow-xl border border-gray-100 font-bold text-gray-600 space-y-6">
            <h2 className="text-2xl font-black text-[#5D4037]">📖 이용 방법</h2>
            <p>1. 메인 화면에서 성함과 활동 내용을 선택하고 [인증 완료]를 누릅니다.</p>
            <p>2. 운영본부 승인 후 [함께걷는길]에서 본인의 성장 등급을 확인하세요.</p>
          </div>
        ) : (
          <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#5D4037] text-white text-[10px] uppercase tracking-widest">
                <tr><th className="p-5">활동가</th><th className="p-5">활동 내용</th><th className="p-5 text-center">처리</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingReports.length === 0 ? <tr><td colSpan={3} className="p-20 text-center text-gray-300 font-bold italic">새로운 기록이 없습니다.</td></tr> : 
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

  // --- 🏠 메인 화면 ---
  return (
    <main className="min-h-screen bg-[#FFFDE7] break-keep"><Header />
      <div className="py-20 text-center bg-[#FFE0B2] text-[#5D4037] px-6">
        <h1 className="text-4xl font-black mb-4 tracking-tighter">참여연대 시민연결</h1>
        <p className="opacity-80 font-bold text-sm">기록되지 않은 시민의 힘은 기억되지 않습니다.</p>
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
  return ( <Suspense fallback={<div className="flex items-center justify-center min-h-screen">LOADING...</div>}><HomeContent /></Suspense> )
}