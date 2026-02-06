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

  // 🔐 관리자 전용 PIN
  const ADMIN_PIN = "1234"

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const { data: acts } = await supabase.from('activity_types').select('*')
      if (acts) setActivities(acts)
      if (isAdminView || mode === 'hq' || mode === 'guide' || mode === 'vision' || mode === 'points') await fetchPending()
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
    //의 base_points 컬럼을 정확히 사용합니다.
    const { data } = await supabase.from('activity_reports').select('user_name, activity_types(base_points)').eq('status', 'approved')
    if (data && data.length > 0) {
      const aggregate = data.reduce((acc: any, curr: any) => {
        const name = curr.user_name?.trim() || '익명'
        const rawPoints = curr.activity_types
        const points = Array.isArray(rawPoints) ? (rawPoints[0]?.base_points || 0) : (rawPoints?.base_points || 0)
        acc[name] = (acc[name] || 0) + points
        return acc
      }, {})
      const sorted = Object.entries(aggregate).map(([name, point]: any) => ({ name, point })).sort((a, b) => b.point - a.point)
      setRankings(sorted)
    }
  }

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
    const pin = window.prompt("관리자 PIN 번호를 입력하세요.")
    if (pin !== ADMIN_PIN) return alert("❌ 권한이 없습니다.")
    const { error } = await supabase.from('activity_reports').update({ status: 'approved' }).eq('id', id)
    if (!error) { alert('✅ 승인 완료!'); fetchPending(); fetchRankings(); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !selectedActivity) return alert('성함과 활동을 입력해주세요!')
    const { error } = await supabase.from('activity_reports').insert([{ user_name: userName, activity_id: Number(selectedActivity), status: 'pending' }])
    if (!error) { alert('📝 제출 완료! 운영진 승인 후 반영됩니다.'); setUserName(''); }
  }

  // 🌱 공정한 철학을 반영한 단계 치환 (등급 단어 삭제)
  const getSolidarityStage = (point: number) => {
    if (point >= 5000) return { title: '연대의 숲 🌲', color: 'bg-green-200 text-green-800' }
    if (point >= 2000) return { title: '아낌없이 주는 나무 🌳', color: 'bg-green-100 text-green-700' }
    if (point >= 1000) return { title: '든든한 새싹 시민 🌱', color: 'bg-blue-100 text-blue-700' }
    return { title: '소중한 씨앗 시민 ✨', color: 'bg-orange-100 text-orange-700' }
  }

  const Header = () => {
    const isHQActive = mode === 'hq' || mode === 'guide' || mode === 'vision' || mode === 'points' || isAdminView;
    return (
      <header className="bg-white sticky top-0 z-50 border-b-4 border-[#FF8A65] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-16 sm:h-20 whitespace-nowrap overflow-x-auto no-scrollbar">
          <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2 flex-shrink-0 mr-6">
             <div className="bg-[#FF8A65] text-white px-2 py-1 font-black text-xs rounded-lg">참여연대</div>
             <span className="text-base sm:text-lg font-bold tracking-tighter text-[#4E342E]">시민연결</span>
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
            <div className="max-w-5xl mx-auto px-4 flex justify-around h-12 items-center text-[10px] sm:text-xs font-black gap-4 overflow-x-auto no-scrollbar">
              <button onClick={() => router.push('?mode=guide')} className={`${mode === 'guide' ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>📖 사용가이드</button>
              <button onClick={() => router.push('?mode=vision')} className={`${mode === 'vision' ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>📜 연대백서</button>
              <button onClick={() => router.push('?mode=points')} className={`${mode === 'points' ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>📊 포인트안내</button>
              <button onClick={() => router.push('?admin=true')} className={`${isAdminView ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63]"}`}>⚙️ 승인관리</button>
            </div>
          </div>
        )}
      </header>
    )
  }

  // --- [1] 상세 사용 설명서 (QR 가이드 포함) ---
  if (mode === 'guide') return (
    <main className="min-h-screen bg-white break-keep"><Header />
      <div className="max-w-3xl mx-auto py-16 px-6 leading-relaxed text-gray-700">
        <h2 className="text-3xl font-black mb-12 text-[#5D4037]">📱 현장 QR 이용 가이드</h2>
        <div className="space-y-10">
          <section className="bg-orange-50 p-8 rounded-[40px] border-2 border-dashed border-[#FF8A65]">
            <h3 className="text-xl font-bold mb-4 text-[#5D4037]">📍 집회 및 행사 현장에서</h3>
            <p className="text-lg font-medium leading-relaxed">
              피켓 뒷면이나 부스 입구에 부착된 <strong>[시민연결 QR코드]</strong>를 스마트폰 카메라로 비춰주세요. 즉시 활동 보고 화면으로 연결되어 여러분의 발걸음을 실시간 데이터로 기록할 수 있습니다.
            </p>
          </section>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-8 bg-gray-50 rounded-[30px] shadow-sm font-bold text-center">
              <span className="text-2xl mb-4 block">📸</span>
              스캔 후 본인 성함 입력
            </div>
            <div className="p-8 bg-gray-50 rounded-[30px] shadow-sm font-bold text-center">
              <span className="text-2xl mb-4 block">✅</span>
              참여 활동 선택 후 완료
            </div>
          </div>
        </div>
      </div>
    </main>
  )

  // --- [2] 연대 백서 상세 메세지 (철학적 기반) ---
  if (mode === 'vision') return (
    <main className="min-h-screen bg-white break-keep"><Header />
      <div className="max-w-3xl mx-auto py-16 px-6 leading-relaxed">
        <h2 className="text-3xl font-black text-center mb-16 italic text-[#FF8A65]">"기록되지 않은 시민의 힘은<br/>기억되지 않습니다"</h2>
        <div className="space-y-16 text-gray-700">
          <section className="border-l-8 border-[#FF8A65] pl-8">
            <h3 className="text-2xl font-black mb-6 text-[#5D4037]">⚖️ 보이지 않는 헌신의 역사를 기록합니다</h3>
            <p className="text-lg leading-loose font-medium">
              무대 위의 발언자뿐만 아니라, 현장 뒤에서 묵묵히 정성을 다하신 선배 시민님들의 발걸음을 이제 디지털 데이터로 영구히 보존합니다. 이는 참여연대의 역사가 단 몇 명의 대표자가 아닌, 현장을 지킨 수만 명의 시민에 의해 쓰여졌음을 증명하는 가장 확실한 기록관이 될 것입니다.
            </p>
          </section>
          <section className="border-l-8 border-blue-500 pl-8">
            <h3 className="text-2xl font-black mb-6 text-[#5D4037]">📈 숫자로 증명하는 시민의 힘과 후원의 가치</h3>
            <p className="text-lg leading-loose font-medium">
              막연한 호소보다 <strong>"이번 한 달간 1,000명의 시민이 함께 연대했다"</strong>는 투명한 숫자는 참여연대의 역동성을 증명하는 무기가 됩니다. 이 기록은 후원자들에게 신뢰를 주고, 우리가 더 당당하게 조직의 내일을 위한 후원을 요청할 수 있는 전략적 지표가 됩니다.
            </p>
          </section>
        </div>
      </div>
    </main>
  )

  // --- [3] 포인트 안내 (재정 유동성 이해) ---
  if (mode === 'points') return (
    <main className="min-h-screen bg-[#F9F9F9] break-keep"><Header />
      <div className="max-w-3xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-black mb-6 text-[#5D4037]">📊 활동별 포인트 측정표</h2>
        <div className="bg-blue-50 p-8 rounded-3xl mb-12 border border-blue-100 font-bold text-blue-700 leading-relaxed text-sm">
          💡 포인트 환산 가치는 고정되지 않습니다. 매달 참여연대의 후원금 재정 상황에 따라 포인트의 가치는 유동적으로 변동됩니다. 이는 고정된 보상이 아니라, 조직의 형편을 함께 책임지는 진정한 동료 시민의 약속입니다.
        </div>
        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100 font-bold">
          <table className="w-full text-left">
            <thead className="bg-[#5D4037] text-white text-[10px] uppercase tracking-widest">
              <tr><th className="p-6">활동 유형</th><th className="p-6 text-right">포인트(pts)</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activities.sort((a,b) => b.base_points - a.base_points).map(a => (
                <tr key={a.id} className="hover:bg-orange-50/50">
                  <td className="p-6 text-gray-700">{a.name}</td>
                  <td className="p-6 text-right text-[#FF7043]">{a.base_points.toLocaleString()} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )

  // --- [4] 함께 걷는 길 (랭킹 및 검색) ---
  if (mode === 'ranking') return (
    <main className="min-h-screen bg-[#FDFCFB] break-keep"><Header />
      <div className="max-w-2xl mx-auto py-10 px-6 text-center">
        <h2 className="text-2xl font-black mb-10 text-[#5D4037]">🏆 오늘의 연대 길잡이</h2>
        <div className="grid grid-cols-3 gap-2 mb-12 items-end">
           {[1, 0, 2].map((idx) => {
             const r = rankings[idx];
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
          <input type="text" placeholder="성함을 입력하세요" value={searchName} onChange={(e) => setSearchName(e.target.value)} className="w-full p-4 rounded-full border-2 border-[#FFE0B2] shadow-lg text-center font-bold outline-none focus:border-[#FF7043]" />
        </div>
        {searchedUser ? (
          <div className="bg-[#5D4037] p-8 rounded-[40px] text-white shadow-2xl mt-6">
            <h4 className="text-2xl font-black">{searchedUser.name} 님</h4>
            <div className={`inline-block px-4 py-1 rounded-full font-bold text-xs mt-3 ${getSolidarityStage(searchedUser.point).color}`}>
              {getSolidarityStage(searchedUser.point).title}
            </div>
            <div className="mt-8 grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 pt-6 font-black">
              <div><p className="text-[10px] opacity-50 mb-1">연대 순위</p><p className="text-xl">{rankOfSearched}위</p></div>
              <div><p className="text-[10px] opacity-50 mb-1">연대 온도</p><p className="text-xl text-[#FF8A65]">{searchedUser.point} pts</p></div>
            </div>
          </div>
        ) : searchName && !isLoading ? <div className="text-gray-300 font-bold py-10">연대의 기록을 찾는 중...</div> : null}
      </div>
    </main>
  )

  // --- [5] 승인 관리 ---
  if (isAdminView || mode === 'hq') return (
    <main className="min-h-screen bg-gray-50 break-keep"><Header />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden">
          <div className="bg-[#5D4037] p-6 text-white font-black">⚙️ 실시간 승인 관리 (PIN: 1234)</div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] text-gray-400 font-black uppercase tracking-widest">
              <tr><th className="p-5">활동가</th><th className="p-5">활동 내용</th><th className="p-5 text-center">처리</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-bold">
              {pendingReports.length === 0 ? <tr><td colSpan={3} className="p-20 text-center text-gray-300">승인 대기 기록이 없습니다.</td></tr> : 
                pendingReports.map(r => (
                  <tr key={r.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="p-5">{r.user_name}</td>
                    <td className="p-5 text-gray-500">{r.activity_types?.name}</td>
                    <td className="p-5 text-center"><button onClick={() => handleApprove(r.id)} className="bg-[#00C853] text-white px-5 py-2 rounded-2xl text-xs">승인</button></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )

  // --- [🏠 메인 활동보고 화면] ---
  return (
    <main className="min-h-screen bg-[#FFFDE7] break-keep"><Header />
      <div className="py-20 text-center bg-[#FFE0B2] text-[#5D4037] px-6">
        <h1 className="text-4xl font-black mb-4 tracking-tighter">참여연대 시민연결</h1>
        <p className="opacity-80 font-bold text-sm tracking-widest">보이지 않는 헌신의 역사를 함께 기록합니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-10 px-6 pb-20">
        <div className="bg-white p-10 rounded-[50px] shadow-2xl border-4 border-[#FF8A65]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-lg outline-none focus:border-[#FF8A65]" />
            <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-lg appearance-none">
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
  return ( <Suspense fallback={<div className="flex items-center justify-center min-h-screen font-black text-[#FF8A65]">연대 확인 중...</div>}><HomeContent /></Suspense> )
}