'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function HomeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const mode = searchParams.get('mode') 
  const isAdminView = searchParams.get('admin') === 'true'
  const presetActivity = searchParams.get('activity')

  // 상태 관리
  const [activities, setActivities] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<string | number>('')
  const [pendingReports, setPendingReports] = useState<any[]>([])
  const [rankings, setRankings] = useState<{name: string, point: number}[]>([])
  const [searchName, setSearchName] = useState('')

  useEffect(() => {
    async function fetchData() {
      // 활동 종류 로드
      const { data: acts } = await supabase.from('activity_types').select('*')
      if (acts) {
        setActivities(acts)
        if (presetActivity) setSelectedActivity(presetActivity)
      }
      
      // 모드에 따른 데이터 로드
      if (isAdminView || mode === 'hq') fetchPending()
      if (mode === 'ranking') fetchRankings()
    }
    fetchData()
  }, [presetActivity, isAdminView, mode])

  // 1. 승인 대기 목록 가져오기
  const fetchPending = async () => {
    const { data } = await supabase.from('activity_reports').select('*, activity_types(name)').eq('status', 'pending').order('created_at', { ascending: false })
    if (data) setPendingReports(data)
  }

  // 2. 실시간 랭킹 데이터 집계 (사용자님이 넣은 3명 포함 전체)
  const fetchRankings = async () => {
    const { data, error } = await supabase.from('activity_reports').select('user_name, activity_types(points)').eq('status', 'approved')
    if (data) {
      const aggregate = data.reduce((acc: any, curr: any) => {
        const name = curr.user_name
        const points = curr.activity_types?.points || 0
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
    if (!error) { alert('✅ 승인 완료!'); fetchPending(); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !selectedActivity) return alert('정보를 입력해주세요!')
    const finalStatus = mode === 'qr' ? 'approved' : 'pending'
    const { error } = await supabase.from('activity_reports').insert([{ user_name: userName, activity_id: Number(selectedActivity), status: finalStatus }])
    if (!error) { alert(mode === 'qr' ? '✨ 즉시 인증!' : '📝 제출 완료!'); setUserName(''); }
  }

  // --- 🎨 UI 구성 요소: 통합 헤더 ---
  const Header = () => (
    <header className="bg-white sticky top-0 z-50 border-b-4 border-[#FF8A65] shadow-sm">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2 flex-shrink-0">
             <div className="bg-[#FF8A65] text-white px-2 py-1 font-black text-sm sm:text-lg rounded-lg whitespace-nowrap">참여연대</div>
             <span className="text-lg sm:text-xl font-bold tracking-tighter text-[#4E342E] whitespace-nowrap">시민연결</span>
          </div>
          <nav className="flex gap-2 sm:gap-4 items-center overflow-x-auto no-scrollbar ml-2">
            <button onClick={() => router.push('/')} className={`text-[11px] sm:text-sm font-bold whitespace-nowrap ${!mode && !isAdminView ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>활동보고</button>
            <button onClick={() => router.push('?mode=vision')} className={`text-[11px] sm:text-sm font-bold whitespace-nowrap ${mode === 'vision' ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>연대백서</button>
            <button onClick={() => router.push('?mode=ranking')} className={`text-[11px] sm:text-sm font-bold whitespace-nowrap ${mode === 'ranking' ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>명예의전당</button>
            <div className="h-3 w-[1px] bg-gray-200 flex-shrink-0 mx-1"></div>
            <button onClick={() => router.push('?mode=hq')} className={`px-2 py-1.5 rounded-lg text-[11px] sm:text-sm font-black whitespace-nowrap transition-all ${mode === 'hq' || mode === 'guide' || isAdminView ? "bg-[#5D4037] text-white" : "bg-gray-100 text-[#BCAAA4]"}`}>운영본부</button>
          </nav>
        </div>
      </div>
      
      {/* 운영본부 선택 시 하부 디렉토리 */}
      {(mode === 'hq' || mode === 'guide' || isAdminView) && (
        <div className="bg-[#FFF8E1] border-t border-[#FFE0B2]">
          <div className="max-w-5xl mx-auto px-4 flex justify-around h-12 items-center">
            <button onClick={() => router.push('?mode=guide')} className={`text-xs font-bold ${mode === 'guide' ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>📖 사용가이드</button>
            <button onClick={() => router.push('?admin=true')} className={`text-xs font-bold ${isAdminView ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>⚙️ 승인관리</button>
          </div>
        </div>
      )}
    </header>
  )

  // --- 🏠 [1] 메인: 활동보고 ---
  if (!mode && !isAdminView) return (
    <main className="min-h-screen bg-[#FFFDE7] break-keep"><Header />
      <div className="py-16 text-center bg-[#FFE0B2] text-[#5D4037] px-4">
        <h1 className="text-4xl font-black mb-3 tracking-tighter leading-tight">참여연대 활동인증</h1>
        <p className="opacity-80 font-medium text-sm sm:text-base">우리의 작은 활동이 세상을 바꾸는 데이터가 됩니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-10 px-6 pb-20">
        <div className="bg-white p-8 sm:p-10 rounded-[40px] shadow-2xl border-4 border-[#FF8A65]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-lg outline-none focus:border-[#FF8A65]" />
            <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className={`w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-lg ${presetActivity ? 'hidden' : 'block'}`}>
              <option value="">활동을 선택하세요</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button className="w-full bg-[#FF8A65] text-white py-5 rounded-3xl font-black text-xl shadow-lg active:scale-95 transition-all">인증 완료 🚀</button>
          </form>
        </div>
      </div>
    </main>
  )

  // --- 📜 [2] 연대백서: 비전과 가치 ---
  if (mode === 'vision') return (
    <main className="min-h-screen bg-white break-keep"><Header />
      <div className="max-w-2xl mx-auto py-12 px-6">
        <h2 className="text-3xl font-black text-[#5D4037] mb-10 text-center italic leading-tight">"기록되지 않은 연대는<br/>기억되기 어렵습니다"</h2>
        <div className="space-y-8">
          <div className="p-6 bg-orange-50 rounded-3xl border-l-8 border-[#FF8A65]">
            <h3 className="text-xl font-bold mb-2">⚖️ 공정한 인정의 가치</h3>
            <p className="text-gray-600 text-sm leading-relaxed">무대 위 주인공뿐만 아니라 주차 안내, 뒷정리를 맡은 모든 시민의 노고를 디지털로 정량화하여 누구도 소외되지 않는 연대 문화를 만듭니다.</p>
          </div>
          <div className="p-6 bg-blue-50 rounded-3xl border-l-8 border-blue-400">
            <h3 className="text-xl font-bold mb-2">📊 투명한 보고의 힘</h3>
            <p className="text-gray-600 text-sm leading-relaxed">"열심히 했다"는 말 대신 "500명이 1,200시간 연대했다"는 정직한 지표를 통해 후원자들에게 우리 활동의 역동성을 증명합니다.</p>
          </div>
        </div>
      </div>
    </main>
  )

  // --- 🏆 [3] 명예의전당: 실시간 랭킹 & 점수 확인 ---
  if (mode === 'ranking') return (
    <main className="min-h-screen bg-[#FDFCFB] break-keep"><Header />
      <div className="max-w-2xl mx-auto py-10 px-6">
        <h2 className="text-2xl font-black text-center mb-2">🏆 명예의 전당</h2>
        <p className="text-center text-gray-400 text-xs mb-8">가장 뜨겁게 연대한 시민들의 이름입니다.</p>
        
        {/* 본인 점수 검색 */}
        <div className="mb-10 bg-white p-4 rounded-3xl shadow-md border-2 border-[#FFE0B2]">
          <input 
            type="text" 
            placeholder="본인 성함을 검색하여 점수를 확인하세요" 
            value={searchName} 
            onChange={(e) => setSearchName(e.target.value)}
            className="w-full p-3 text-center font-bold outline-none text-[#FF7043]"
          />
        </div>

        <div className="space-y-4">
          {rankings.map((r, index) => {
            const isSearched = searchName && r.name.includes(searchName);
            return (
              <div 
                key={index} 
                className={`flex justify-between items-center p-5 rounded-[25px] transition-all shadow-sm
                  ${index === 0 ? 'bg-[#FFF9C4] border-2 border-[#FBC02D]' : 
                    index === 1 ? 'bg-[#F5F5F5] border-2 border-[#BDBDBD]' : 
                    index === 2 ? 'bg-[#EFEBE9] border-2 border-[#A1887F]' : 'bg-white border border-gray-100'}
                  ${isSearched ? 'ring-4 ring-[#FF7043] scale-105' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black w-6 text-center">{index + 1}</span>
                  <span className="font-bold text-gray-800 text-lg">{r.name}</span>
                  {index < 3 && <span>{index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}</span>}
                </div>
                <div className="text-right">
                  <span className="text-[#FF7043] font-black text-xl">{r.point}</span>
                  <span className="text-[10px] ml-1 font-bold text-gray-400 whitespace-nowrap">Points</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  )

  // --- ⚙️ [4] 운영본부 및 승인관리 ---
  if (isAdminView || mode === 'hq' || mode === 'guide') {
    if (mode === 'guide') return (
      <main className="min-h-screen bg-white break-keep"><Header />
        <div className="max-w-2xl mx-auto py-12 px-6">
          <h2 className="text-2xl font-black mb-10">시민 참여 가이드</h2>
          <div className="space-y-6">
            <div className="p-6 bg-gray-50 rounded-2xl"><h4 className="font-bold mb-2">1. 현장 QR 인증</h4><p className="text-sm text-gray-500">배치된 QR을 찍고 성함만 입력하면 즉시 포인트가 지급됩니다.</p></div>
            <div className="p-6 bg-gray-50 rounded-2xl"><h4 className="font-bold mb-2">2. 사후 활동 보고</h4><p className="text-sm text-gray-500">인증을 놓친 경우 홈페이지 메인에서 보고서를 제출해 주세요. 관리자 승인 후 반영됩니다.</p></div>
          </div>
        </div>
      </main>
    )
    return (
      <main className="min-h-screen bg-gray-50 break-keep"><Header />
        <div className="max-w-4xl mx-auto py-10 px-4">
          <h2 className="text-xl font-black mb-6">⚙️ 실시간 승인 관리</h2>
          <div className="bg-white rounded-[30px] shadow-xl overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-[#5D4037] text-white text-xs">
                <tr><th className="p-4">활동가</th><th className="p-4">활동 내용</th><th className="p-4 text-center">승인</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {pendingReports.length === 0 ? <tr><td colSpan={3} className="p-20 text-center text-gray-300 font-bold">대기 중인 보고서가 없습니다.</td></tr> : 
                  pendingReports.map(r => (
                    <tr key={r.id} className="hover:bg-orange-50/50"><td className="p-4 font-bold">{r.user_name}</td><td className="p-4">{r.activity_types?.name}</td>
                    <td className="p-4 text-center"><button onClick={() => handleApprove(r.id)} className="bg-[#00C853] text-white px-5 py-2 rounded-xl font-black text-xs">승인</button></td></tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      </main>
    )
  }

  return null
}

export default function Home() {
  return ( <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-[#FF8A65] tracking-widest animate-pulse">CONNECTING...</div>}><HomeContent /></Suspense> )
}