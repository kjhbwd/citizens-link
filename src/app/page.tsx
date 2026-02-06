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

  const [activities, setActivities] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<string | number>('')
  const [pendingReports, setPendingReports] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data: acts } = await supabase.from('activity_types').select('*')
      if (acts) {
        setActivities(acts)
        if (presetActivity) setSelectedActivity(presetActivity)
      }
      if (isAdminView) fetchPending()
    }
    fetchData()
  }, [presetActivity, isAdminView])

  const fetchPending = async () => {
    const { data } = await supabase
      .from('activity_reports')
      .select('*, activity_types(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setPendingReports(data)
  }

  const handleApprove = async (id: number) => {
    const { error } = await supabase.from('activity_reports').update({ status: 'approved' }).eq('id', id)
    if (error) alert('승인 오류')
    else { alert('✅ 승인이 완료되었습니다!'); fetchPending(); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !selectedActivity) return alert('성함과 활동을 선택해주세요!')
    const finalStatus = mode === 'qr' ? 'approved' : 'pending'
    const { error } = await supabase.from('activity_reports').insert([{ user_name: userName, activity_id: Number(selectedActivity), status: finalStatus }])
    if (error) alert('등록 오류')
    else { alert(mode === 'qr' ? '✨ 즉시 승인되었습니다!' : '📝 보고 완료!'); setUserName(''); }
  }

  // --- 상단 네비게이션 (하부 카테고리 포함) ---
  const Header = () => (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2">
             <span className="bg-[#FF7043] text-white px-2 py-1 rounded-lg font-black text-sm">참여연대</span>
             <span className="font-bold text-gray-800">시민연결</span>
          </div>
          <div className="flex gap-6 text-sm font-bold items-center text-gray-500">
            <a href="/" className={!mode && !isAdminView ? "text-[#FF7043]" : ""}>활동보고</a>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <a href="?mode=hq" className={mode === 'hq' || mode === 'guide' || mode === 'vision' || isAdminView ? "text-[#FF7043]" : ""}>운영본부</a>
          </div>
        </div>
      </div>
      
      {/* 운영본부 클릭 시 나타나는 하부 카테고리 바 */}
      {(mode === 'hq' || mode === 'guide' || mode === 'vision' || isAdminView) && (
        <div className="bg-gray-50 border-b border-gray-200 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 flex gap-8 h-12 items-center overflow-x-auto whitespace-nowrap">
            <button onClick={() => router.push('?mode=hq')} className={`text-sm font-bold transition-all ${mode === 'hq' ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}>본부홈</button>
            <button onClick={() => router.push('?mode=guide')} className={`text-sm font-bold transition-all ${mode === 'guide' ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}>사용가이드</button>
            <button onClick={() => router.push('?mode=vision')} className={`text-sm font-bold transition-all ${mode === 'vision' ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}>비전과 가치</button>
            <button onClick={() => router.push('?admin=true')} className={`text-sm font-bold transition-all ${isAdminView ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}>승인 관리</button>
          </div>
        </div>
      )}
    </header>
  )

  // --- [하부 카테고리 1] 운영본부 홈 대시보드 ---
  if (mode === 'hq') {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="max-w-4xl mx-auto py-12 px-6">
          <div className="mb-10">
            <h2 className="text-3xl font-black text-[#5D4037] mb-2">운영본부 대시보드</h2>
            <p className="text-gray-500">시스템의 핵심 가치와 관리 기능을 한눈에 확인하세요.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div onClick={() => router.push('?mode=guide')} className="group p-8 rounded-[32px] bg-orange-50 border border-orange-100 cursor-pointer hover:bg-orange-100 transition-all">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📖</div>
              <h3 className="font-bold text-xl mb-2 text-[#E65100]">사용 가이드</h3>
              <p className="text-sm text-orange-600/70">QR 활용 및 보고 체계 안내</p>
            </div>
            <div onClick={() => router.push('?mode=vision')} className="group p-8 rounded-[32px] bg-green-50 border border-green-100 cursor-pointer hover:bg-green-100 transition-all">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💎</div>
              <h3 className="font-bold text-xl mb-2 text-[#2E7D32]">비전과 가치</h3>
              <p className="text-sm text-green-600/70">데이터의 공정성과 후원 가치</p>
            </div>
            <div onClick={() => router.push('?admin=true')} className="group p-8 rounded-[32px] bg-gray-900 border border-gray-800 cursor-pointer hover:bg-black transition-all text-white">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
              <h3 className="font-bold text-xl mb-2">실시간 관리</h3>
              <p className="text-sm opacity-60">참여 현황 승인 및 데이터 관리</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // --- [하부 카테고리 2] 비전과 가치 ---
  if (mode === 'vision') {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="max-w-3xl mx-auto py-16 px-6 text-center">
           <span className="text-[#FF7043] font-black tracking-widest uppercase text-sm">Vision & Value</span>
           <h2 className="text-4xl font-black text-[#5D4037] mt-4 mb-12">투명한 기록이 시민의 힘이 됩니다</h2>
           
           <div className="grid gap-8 text-left">
              <div className="p-8 rounded-[32px] bg-gray-50 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">📊 디지털 투명성</h3>
                <p className="text-gray-600 leading-relaxed">모든 활동을 데이터로 기록하여 후원자들에게 신뢰를 제공합니다. "우리의 움직임"을 숫자로 증명하여 더 큰 후원을 이끌어냅니다.</p>
              </div>
              <div className="p-8 rounded-[32px] bg-gray-50 border border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">⚖️ 공정한 인정</h3>
                <p className="text-gray-600 leading-relaxed">눈에 띄지 않는 곳에서의 헌신도 빠짐없이 기록합니다. 정량화된 데이터는 활동가들에게 공정한 보상과 명예를 드리는 기준이 됩니다.</p>
              </div>
           </div>
        </div>
      </main>
    )
  }

  // --- [하부 카테고리 3] 사용 가이드 ---
  if (mode === 'guide') {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="max-w-3xl mx-auto py-16 px-6">
          <h2 className="text-3xl font-black text-gray-900 mb-10">시스템 운영 가이드</h2>
          <div className="space-y-12">
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-black shrink-0">01</div>
              <div>
                <h4 className="font-bold text-xl mb-2">현장 즉시 인증 (QR)</h4>
                <p className="text-gray-500">행사장 전용 QR을 찍으면 '성함' 입력만으로 즉시 승인됩니다. 가장 빠르고 간편한 방식입니다.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-black shrink-0">02</div>
              <div>
                <h4 className="font-bold text-xl mb-2">사후 보고 및 승인</h4>
                <p className="text-gray-500">QR을 놓친 경우 일반 링크로 접속해 보고서를 제출하세요. 운영진이 확인 후 버튼 하나로 승인해 드립니다.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // --- [하부 카테고리 4] 승인 관리 (Admin) ---
  if (isAdminView) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-5xl mx-auto py-10 px-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-black text-gray-900">포인트 승인 관리</h2>
            <button onClick={fetchPending} className="bg-white border-2 border-gray-100 px-5 py-2 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all">목록 새로고침</button>
          </div>
          <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-gray-100">
            <table className="w-full text-left">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="p-6 font-bold text-sm uppercase tracking-widest">활동가</th>
                  <th className="p-6 font-bold text-sm uppercase tracking-widest">활동 내용</th>
                  <th className="p-6 font-bold text-sm text-center uppercase tracking-widest">액션</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingReports.length === 0 ? (
                  <tr><td colSpan={3} className="p-24 text-center text-gray-400 font-medium">대기 중인 보고가 없습니다.</td></tr>
                ) : (
                  pendingReports.map(report => (
                    <tr key={report.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-6 font-bold text-gray-800 text-lg">{report.user_name}</td>
                      <td className="p-6 text-gray-500 font-medium">{report.activity_types?.name}</td>
                      <td className="p-6 text-center">
                        <button onClick={() => handleApprove(report.id)} className="bg-[#00C853] text-white px-8 py-3 rounded-2xl font-black shadow-lg hover:bg-[#00B24A] hover:-translate-y-0.5 active:translate-y-0 transition-all text-sm">승인 처리</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    )
  }

  // --- 메인 활동보고 화면 (기본) ---
  return (
    <main className="min-h-screen bg-[#FFFDE7]">
      <Header />
      <div className={`py-24 px-4 text-center ${mode === 'qr' ? 'bg-[#FF8A65] text-white' : 'bg-[#FFE0B2] text-[#5D4037]'}`}>
        <p className="text-xs font-black mb-3 uppercase tracking-widest opacity-70">Citizens Solidarity System</p>
        <h1 className="text-5xl font-black mb-4">참여연대 활동보고</h1>
        <p className="text-lg opacity-90 font-medium max-w-md mx-auto">시민의 힘이 데이터로 기록됩니다. 아래 성함을 입력하고 인증해주세요.</p>
      </div>
      <div className="max-w-lg mx-auto px-6 -mt-16 pb-32">
        <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-orange-50/50">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-black text-gray-300 uppercase tracking-widest ml-1">Name</label>
              <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-[#FF7043] focus:bg-white transition-all font-bold text-xl" />
            </div>
            <div className={`space-y-2 ${presetActivity ? "hidden" : "block"}`}>
              <label className="text-sm font-black text-gray-300 uppercase tracking-widest ml-1">Activity</label>
              <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-[#FF7043] focus:bg-white transition-all font-bold text-xl appearance-none">
                <option value="">활동 종류 선택</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[#FF7043] hover:bg-[#F4511E] text-white py-7 rounded-[32px] font-black text-2xl shadow-xl transition-all active:scale-[0.98] flex justify-center items-center gap-3">
              🚀 활동 인증하기
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-bold text-gray-200">SYSTEM LOADING...</div>}>
      <HomeContent />
    </Suspense>
  )
}