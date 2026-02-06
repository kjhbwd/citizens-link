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

  // 🔐 관리자 PIN 번호 변경 (사용자 요청: 1234)
  const ADMIN_PIN = "1234"

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      const { data: acts } = await supabase.from('activity_types').select('*')
      if (acts) setActivities(acts)
      
      if (isAdminView || mode === 'hq' || mode === 'guide' || mode === 'points') await fetchPending()
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
    const { data } = await supabase.from('activity_reports').select('user_name, activity_types(base_points)').eq('status', 'approved')
    if (data && data.length > 0) {
      const aggregate = data.reduce((acc: any, curr: any) => {
        const name = curr.user_name?.trim() || '익명'
        const rawPoints = curr.activity_types
        const points = Array.isArray(rawPoints) ? (rawPoints[0]?.base_points || 10) : (rawPoints?.base_points || 10)
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

  // 🛡️ 승인 보안 로직 (PIN: 1234)
  const handleApprove = async (id: number) => {
    const pin = window.prompt("관리자 인증이 필요합니다. PIN 번호 4자리를 입력하세요.")
    if (pin !== ADMIN_PIN) return alert("❌ 올바르지 않은 번호입니다. 권한이 거부되었습니다.")

    const { error } = await supabase.from('activity_reports').update({ status: 'approved' }).eq('id', id)
    if (!error) { 
      alert('✅ 연대의 기록이 최종 승인되었습니다.'); 
      fetchPending(); 
      fetchRankings(); 
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !selectedActivity) return alert('성함과 활동을 입력해주세요!')
    const { error } = await supabase.from('activity_reports').insert([{ user_name: userName, activity_id: Number(selectedActivity), status: 'pending' }])
    if (!error) { alert('📝 제출 완료! 운영본부의 승인 후 기록이 등재됩니다.'); setUserName(''); }
  }

  // 🌱 공정한 성장을 위한 '연대 단계' 정의 (등급 단어 삭제)
  const getSolidarityStage = (point: number) => {
    if (point >= 2000) return { title: '연대의 숲 🌲', color: 'bg-green-200 text-green-800', desc: '공동체를 지탱하는 든든한 버팀목' }
    if (point >= 1000) return { title: '아낌없이 주는 나무 🌳', color: 'bg-green-100 text-green-700', desc: '풍성한 그늘을 시민과 나누는 존재' }
    if (point >= 100) return { title: '든든한 새싹 시민 🌱', color: 'bg-blue-100 text-blue-700', desc: '함께 희망의 싹을 틔우는 시작' }
    return { title: '소중한 씨앗 시민 ✨', color: 'bg-orange-100 text-orange-700', desc: '미래를 품은 연대의 첫걸음' }
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
            <div className="max-w-5xl mx-auto px-4 flex justify-around h-12 items-center text-[10px] sm:text-xs font-black gap-4">
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

  // --- [1] 현장 QR 이용 가이드 ---
  if (mode === 'guide') return (
    <main className="min-h-screen bg-white break-keep"><Header />
      <div className="max-w-3xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-black mb-10 text-[#5D4037]">📱 현장 QR 이용 방법</h2>
        <div className="bg-orange-50 p-8 rounded-[40px] border-2 border-dashed border-[#FF8A65] mb-8">
          <p className="text-gray-700 font-medium leading-loose text-lg">
            집회 현장이나 행사 부스에 부착된 <strong>[QR 코드]</strong>를 스캔하시면 별도의 로그인 없이도 즉시 활동을 기록할 수 있습니다. 피켓 뒷면의 QR을 활용해 여러분의 실시간 참여를 기록해 주세요.
          </p>
        </div>
        <ul className="space-y-4 text-gray-600 font-bold">
          <li>1. 카메라 앱으로 QR 스캔</li>
          <li>2. 열린 페이지에서 성함 입력 및 활동 선택</li>
          <li>3. [인증 완료] 클릭 후 운영진 승인 대기</li>
        </ul>
      </div>
    </main>
  )

  // --- [2] 연대 백서 (철학적 기반 및 후원 근거) ---
  if (mode === 'vision') return (
    <main className="min-h-screen bg-white break-keep"><Header />
      <div className="max-w-3xl mx-auto py-16 px-6 leading-relaxed">
        <h2 className="text-3xl font-black text-center mb-16 italic text-[#FF8A65]">"기록되지 않은 시민의 힘은<br/>기억되지 않습니다"</h2>
        <div className="space-y-16 text-gray-700">
          <section className="border-l-8 border-[#FF8A65] pl-8">
            <h3 className="text-2xl font-black mb-6 text-[#5D4037]">⚖️ 보이지 않는 곳의 정성을 기록합니다</h3>
            <p className="text-lg leading-loose">
              무대 위의 발언자뿐만 아니라, 현장의 질서를 유지하고 뒷정리를 하신 <strong>'보이지 않는 연대자'</strong>들의 발걸음을 기록합니다. 이 데이터는 참여연대가 소수가 아닌, 이름 없는 수만 명의 시민에 의해 움직이고 있음을 증명하는 가장 강력한 기록이 될 것입니다.
            </p>
          </section>
          <section className="border-l-8 border-blue-500 pl-8">
            <h3 className="text-2xl font-black mb-6 text-[#5D4037]">📈 숫자로 증명하는 활동의 역동성</h3>
            <p className="text-lg leading-loose">
              "우리는 열심히 한다"는 호소보다 <strong>"한 달간 1,000명이 5,000시간 함께했다"</strong>는 수치는 후원자들에게 가장 투명하고 정직한 신뢰의 근거가 됩니다. 이 데이터를 기반으로 우리는 더 당당하게 조직의 내일을 위한 후원을 요청할 수 있습니다.
            </p>
          </section>
        </div>
      </div>
    </main>
  )

  // --- [3] 포인트 측정표 (재정 유동성 이해) ---
  if (mode === 'points') return (
    <main className="min-h-screen bg-[#F9F9F9] break-keep"><Header />
      <div className="max-w-3xl mx-auto py-16 px-6">
        <h2 className="text-2xl font-black mb-4 text-[#5D4037]">📊 활동 가치 측정표</h2>
        <div className="bg-blue-50 p-6 rounded-3xl mb-10 border border-blue-100">
          <p className="text-sm text-blue-700 font-bold leading-relaxed">
            💡 포인트 환산 가치는 고정되지 않습니다. 매달 참여연대의 후원금 및 재정 상황에 따라 포인트의 가치는 유동적으로 변동됩니다. 이는 고정된 보상이 아니라, 조직의 형편을 함께 책임지고 공감하는 시민 공동체의 약속입니다.
          </p>
        </div>
        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100 font-bold">
          <table className="w-full text-left">
            <thead className="bg-[#5D4037] text-white text-[10px] uppercase tracking-widest">
              <tr><th className="p-6">연대 활동 종류</th><th className="p-6 text-right">포인트 (pts)</th></tr>
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

  // --- [4] 함께 걷는 길 (시상대 및 검색) ---
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
          <input type="text" placeholder="성함을 입력해 내 기록을 확인하세요" value={searchName} onChange={(e) => setSearchName(e.target.value)} className="w-full p-4 rounded-full border-2 border-[#FFE0B2] shadow-lg text-center font-bold outline-none focus:border-[#FF7043]" />
          <p className="text-[11px] text-gray-400 mt-3 font-bold">💡 실시간으로 연대의 깊이를 찾아드립니다.</p>
        </div>
        {searchedUser ? (
          <div className="bg-[#5D4037] p-8 rounded-[40px] text-white shadow-2xl mt-6 animate-in zoom-in duration-300">
            <h4 className="text-2xl font-black">{searchedUser.name} 님</h4>
            <div className={`inline-block px-4 py-1 rounded-full font-bold text-xs mt-3 ${getSolidarityStage(searchedUser.point).color}`}>
              {getSolidarityStage(searchedUser.point).title}
            </div>
            <p className="text-[10px] opacity-60 mt-2">{getSolidarityStage(searchedUser.point).desc}</p>
            <div className="mt-8 grid grid-cols-2 divide-x divide-white/10 border-t border-white/10 pt-6 font-black tracking-tighter">
              <div><p className="text-[10px] opacity-50 mb-1 uppercase tracking-widest">Solidarity Rank</p><p className="text-xl">{rankOfSearched}위</p></div>
              <div><p className="text-[10px] opacity-50 mb-1 uppercase tracking-widest">Solidarity Points</p><p className="text-xl text-[#FF8A65]">{searchedUser.point} pts</p></div>
            </div>
          </div>
        ) : searchName && !isLoading ? <div className="text-gray-300 font-bold py-10 italic tracking-widest">CONNECTING...</div> : null}
      </div>
    </main>
  )

  // --- [5] 승인 관리 (운영본부 전용) ---
  if (isAdminView || mode === 'hq') return (
    <main className="min-h-screen bg-gray-50 break-keep"><Header />
      <div className="max-w-4xl mx-auto py-10 px-4">
        <div className="bg-white rounded-[40px] shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-[#5D4037] p-6 text-white flex justify-between items-center"><h2 className="font-black text-lg">⚙️ 실시간 승인 관리 센터</h2></div>
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase tracking-widest font-black">
              <tr><th className="p-5">활동가</th><th className="p-5">활동 내용</th><th className="p-5 text-center">처리</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-bold">
              {pendingReports.length === 0 ? <tr><td colSpan={3} className="p-20 text-center text-gray-300 italic">승인 대기 중인 연대의 발걸음이 없습니다.</td></tr> : 
                pendingReports.map(r => (
                  <tr key={r.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="p-5 font-black text-gray-800">{r.user_name}</td>
                    <td className="p-5 text-gray-500">{r.activity_types?.name}</td>
                    <td className="p-5 text-center"><button onClick={() => handleApprove(r.id)} className="bg-[#00C853] text-white px-5 py-2 rounded-2xl font-black text-xs hover:shadow-lg transition-all active:scale-95">승인</button></td>
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
        <h1 className="text-4xl font-black mb-4 tracking-tighter text-[#4E342E]">참여연대 시민연결</h1>
        <p className="opacity-80 font-bold text-sm tracking-widest">보이지 않는 헌신의 역사를 함께 기록합니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-10 px-6 pb-20">
        <div className="bg-white p-10 rounded-[50px] shadow-2xl border-4 border-[#FF8A65]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-3xl font-bold text-lg outline-none focus:border-[#FF8A65] transition-all" />
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
  return ( <Suspense fallback={<div className="flex items-center justify-center min-h-screen font-black text-[#FF8A65]">SOLIDARITY LOADING...</div>}><HomeContent /></Suspense> )
}