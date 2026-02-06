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
      if (isAdminView || mode === 'hq') fetchPending()
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
        const name = curr.user_name.trim()
        const points = curr.activity_types?.points || 10
        acc[name] = (acc[name] || 0) + points
        return acc
      }, {})
      const sorted = Object.entries(aggregate)
        .map(([name, point]: any) => ({ name, point }))
        .sort((a, b) => b.point - a.point)
      setRankings(sorted)
    }
  }

  const handleApprove = async (id: number) => {
    const { error } = await supabase.from('activity_reports').update({ status: 'approved' }).eq('id', id)
    if (!error) { alert('✅ 승인 완료! 랭킹에 반영되었습니다.'); fetchPending(); fetchRankings(); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !selectedActivity) return alert('성함과 활동을 입력해주세요!')
    const { error } = await supabase.from('activity_reports').insert([{ user_name: userName, activity_id: Number(selectedActivity), status: 'pending' }])
    if (!error) { alert('📝 보고서가 제출되었습니다! 관리자 승인 후 랭킹에 반영됩니다.'); setUserName(''); }
  }

  const Header = () => (
    <header className="bg-white sticky top-0 z-50 border-b-4 border-[#FF8A65] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-16 sm:h-20">
        <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2 flex-shrink-0">
           <div className="bg-[#FF8A65] text-white px-2 py-1 font-black text-sm rounded-lg whitespace-nowrap">참여연대</div>
           <span className="text-lg font-bold tracking-tighter text-[#4E342E] whitespace-nowrap">시민연결</span>
        </div>
        <nav className="flex gap-2 sm:gap-4 items-center overflow-x-auto no-scrollbar ml-2">
          <button onClick={() => router.push('/')} className={`text-[11px] sm:text-sm font-bold whitespace-nowrap ${!mode && !isAdminView ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>활동보고</button>
          <button onClick={() => router.push('?mode=vision')} className={`text-[11px] sm:text-sm font-bold whitespace-nowrap ${mode === 'vision' ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>연대백서</button>
          <button onClick={() => router.push('?mode=ranking')} className={`text-[11px] sm:text-sm font-bold whitespace-nowrap ${mode === 'ranking' ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>명예의전당</button>
          <div className="h-3 w-[1px] bg-gray-200 flex-shrink-0 mx-1"></div>
          <button onClick={() => router.push('?mode=hq')} className={`px-2 py-1.5 rounded-lg text-[11px] font-black whitespace-nowrap ${mode === 'hq' || isAdminView ? "bg-[#5D4037] text-white" : "bg-gray-100 text-[#BCAAA4]"}`}>운영본부</button>
        </nav>
      </div>
    </header>
  )

  // --- [1] 메인: 활동보고 ---
  if (!mode && !isAdminView) return (
    <main className="min-h-screen break-keep"><Header />
      <div className="py-16 text-center bg-[#FFE0B2] px-4">
        <h1 className="text-4xl font-black mb-3 tracking-tighter">참여연대 활동보고</h1>
        <p className="opacity-80 font-medium">우리의 연대가 세상을 바꿉니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-10 px-6 pb-20">
        <div className="bg-white p-8 rounded-[40px] shadow-2xl border-4 border-[#FF8A65]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-lg outline-none focus:border-[#FF8A65]" />
            <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-lg">
              <option value="">활동을 선택하세요</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button className="w-full bg-[#FF8A65] text-white py-5 rounded-3xl font-black text-xl shadow-lg active:scale-95 transition-all">인증 완료 🚀</button>
          </form>
        </div>
      </div>
    </main>
  )

  // --- [2] 명예의 전당: 실시간 랭킹 & 검색 ---
  if (mode === 'ranking') {
    const filtered = rankings.filter(r => r.name.includes(searchName))
    return (
      <main className="min-h-screen bg-[#FDFCFB] break-keep"><Header />
        <div className="max-w-2xl mx-auto py-10 px-6">
          <h2 className="text-2xl font-black text-center mb-8 italic">🏆 명예의 전당</h2>
          <div className="mb-8"><input type="text" placeholder="성함으로 검색하세요" value={searchName} onChange={(e) => setSearchName(e.target.value)} className="w-full p-4 rounded-3xl border-2 border-[#FFE0B2] shadow-sm text-center font-bold outline-none focus:border-[#FF7043]" /></div>
          <div className="space-y-4">
            {filtered.length === 0 ? <div className="py-20 text-center text-gray-300 font-bold bg-white rounded-3xl border border-dashed">데이터를 불러오는 중이거나 없습니다.</div> : 
              filtered.map((r, index) => {
                const actualRank = rankings.findIndex(x => x.name === r.name) + 1
                return (
                  <div key={index} className={`flex justify-between items-center p-5 rounded-[30px] border-2 transition-all ${actualRank === 1 ? 'bg-yellow-50 border-yellow-200 shadow-md' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-center gap-4">
                      <span className="w-10 text-center text-xl font-black">{actualRank === 1 ? '🥇' : actualRank === 2 ? '🥈' : actualRank === 3 ? '🥉' : actualRank}</span>
                      <span className="font-extrabold text-gray-800 text-lg">{r.name}</span>
                    </div>
                    <div className="text-right font-black text-[#FF7043] text-2xl">{r.point.toLocaleString()}<span className="text-[10px] ml-1 text-gray-300">PTS</span></div>
                  </div>
                )
              })
            }
          </div>
        </div>
      </main>
    )
  }

  // --- [3] 연대백서 (비전) ---
  if (mode === 'vision') return (
    <main className="min-h-screen bg-white break-keep"><Header />
      <div className="max-w-2xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-black text-center mb-10 leading-tight">"기록되지 않은 시민의 힘은<br/>기억되지 않습니다"</h2>
        <div className="space-y-8">
          <section className="p-6 bg-orange-50 rounded-3xl border-l-8 border-[#FF8A65]">
            <h3 className="text-xl font-bold mb-2">⚖️ 공정한 기록</h3>
            <p className="text-sm text-gray-600 leading-relaxed">우리는 무대 위 주인공뿐만 아니라 현장의 보이지 않는 곳에서 헌신하는 모든 시민의 노고를 디지털로 투명하게 기록합니다.</p>
          </section>
        </div>
      </div>
    </main>
  )

  // --- [4] 운영본부 (승인 관리) ---
  if (isAdminView || mode === 'hq') return (
    <main className="min-h-screen bg-gray-50 break-keep"><Header />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h2 className="text-xl font-black mb-6">⚙️ 실시간 승인 관리</h2>
        <div className="bg-white rounded-[30px] shadow-xl overflow-hidden border">
          <table className="w-full text-left">
            <thead className="bg-[#5D4037] text-white text-xs uppercase">
              <tr><th className="p-4">활동가</th><th className="p-4">활동 내용</th><th className="p-4 text-center">승인</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm">
              {pendingReports.length === 0 ? <tr><td colSpan={3} className="p-20 text-center text-gray-300 font-bold italic">대기 중인 데이터가 없습니다. 😊</td></tr> : 
                pendingReports.map(r => (
                  <tr key={r.id} className="hover:bg-orange-50/50">
                    <td className="p-4 font-bold">{r.user_name}</td>
                    <td className="p-4 text-gray-500">{r.activity_types?.name}</td>
                    <td className="p-4 text-center"><button onClick={() => handleApprove(r.id)} className="bg-[#00C853] text-white px-5 py-2 rounded-xl font-black text-xs whitespace-nowrap">승인</button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )

  return null
}

export default function Home() {
  return ( <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-[#FF8A65] animate-pulse">CONNECTING...</div>}><HomeContent /></Suspense> )
}