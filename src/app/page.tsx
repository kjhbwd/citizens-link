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
    const { data } = await supabase.from('activity_reports').select('*, activity_types(name)').eq('status', 'pending').order('created_at', { ascending: false })
    if (data) setPendingReports(data)
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
    if (!error) { alert(mode === 'qr' ? '✨ 즉시 승인!' : '📝 제출 완료!'); setUserName(''); }
  }

  // --- ⭐ 모든 카테고리가 포함된 고정 헤더 ---
  const Header = () => (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-16">
        <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2 font-black text-[#FF7043] text-xl">
          참여연대 <span className="text-gray-400 font-light text-lg">시민연결</span>
        </div>
      </div>
      
      {/* 하부 카테고리 바: 어떤 페이지에서든 항상 노출 */}
      <div className="bg-gray-50 border-t border-gray-200 overflow-x-auto whitespace-nowrap">
        <div className="max-w-5xl mx-auto px-4 flex gap-6 h-12 items-center text-xs font-black">
          <button 
            onClick={() => router.push('/')} 
            className={`transition-colors ${(!mode && !isAdminView) ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}
          >
            활동보고(홈)
          </button>
          <button 
            onClick={() => router.push('?mode=hq')} 
            className={`transition-colors ${mode === 'hq' ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}
          >
            운영본부
          </button>
          <button 
            onClick={() => router.push('?mode=guide')} 
            className={`transition-colors ${mode === 'guide' ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}
          >
            사용가이드
          </button>
          <button 
            onClick={() => router.push('?mode=vision')} 
            className={`transition-colors ${mode === 'vision' ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}
          >
            비전과 가치
          </button>
          <button 
            onClick={() => router.push('?admin=true')} 
            className={`transition-colors ${isAdminView ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}
          >
            승인 관리
          </button>
        </div>
      </div>
    </header>
  )

  // 각 모드별 화면 구성
  if (mode === 'hq') return ( <main className="bg-white min-h-screen"><Header /><div className="max-w-2xl mx-auto p-10 font-black text-2xl text-[#5D4037]">운영본부 센터입니다. 각 메뉴를 통해 시스템을 관리하세요.</div></main> )
  
  if (mode === 'vision') return (
    <main className="bg-white min-h-screen"><Header />
      <div className="max-w-3xl mx-auto py-12 px-6">
        <h2 className="text-3xl font-black text-[#5D4037] mb-8 text-center">투명한 기록이 시민의 힘이 됩니다</h2>
        <div className="space-y-6">
          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-2 text-[#FF7043]">📊 디지털 투명성</h3>
            <p className="text-gray-600 text-sm leading-relaxed">모든 활동을 데이터로 기록하여 단체의 신뢰도를 높이고 후원자들에게 확실한 지표를 제공합니다.</p>
          </div>
          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-lg mb-2 text-[#4CAF50]">⚖️ 공정한 인정</h3>
            <p className="text-gray-600 text-sm leading-relaxed">보이지 않는 헌신까지 정량화하여 모든 활동가들에게 공정한 보상과 명예를 드립니다.</p>
          </div>
        </div>
      </div>
    </main>
  )

  if (mode === 'guide') return (
    <main className="bg-white min-h-screen"><Header />
      <div className="max-w-2xl mx-auto py-12 px-6">
        <h2 className="text-2xl font-black mb-8 text-gray-800">시스템 사용 가이드</h2>
        <div className="space-y-6 text-gray-600">
          <p><strong>1. QR 인증:</strong> 현장 QR 스캔 시 즉시 포인트가 지급됩니다.</p>
          <p><strong>2. 사후 보고:</strong> QR을 놓친 경우 홈에서 보고서를 제출하면 관리자 승인 후 반영됩니다.</p>
        </div>
      </div>
    </main>
  )

  if (isAdminView) return (
    <main className="bg-gray-50 min-h-screen"><Header />
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-red-600 uppercase tracking-tighter">Admin | 승인 관리</h2>
          <button onClick={fetchPending} className="bg-white border px-4 py-2 rounded-xl text-xs font-bold shadow-sm">새로고침</button>
        </div>
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border">
          <table className="w-full text-left">
            <thead className="bg-gray-800 text-white text-xs uppercase tracking-widest">
              <tr><th className="p-4">활동가</th><th className="p-4">활동 내용</th><th className="p-4 text-center">처리</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingReports.length === 0 ? <tr><td colSpan={3} className="p-20 text-center text-gray-400">대기 중인 보고가 없습니다.</td></tr> : 
                pendingReports.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50/50"><td className="p-4 font-bold text-gray-700">{r.user_name}</td><td className="p-4 text-gray-500">{r.activity_types?.name}</td>
                  <td className="p-4 text-center"><button onClick={() => handleApprove(r.id)} className="bg-green-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md">승인완료</button></td></tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )

  // --- 기본 메인 화면 (활동보고) ---
  return (
    <main className="min-h-screen bg-[#FFFDE7]">
      <Header />
      <div className={`py-16 text-center ${mode === 'qr' ? 'bg-[#FF8A65] text-white' : 'bg-[#FFE0B2] text-[#5D4037]'}`}>
        <h1 className="text-4xl font-black mb-2">활동 보고서 제출</h1>
        <p className="opacity-80 font-medium">시민의 힘이 데이터로 기록되는 공간입니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-10 px-4 pb-24">
        <div className="bg-white p-10 rounded-[40px] shadow-2xl border border-orange-50/50">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Name</label>
              <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#FF7043] focus:bg-white transition-all font-bold" />
            </div>
            <div className={`space-y-1 ${presetActivity ? 'hidden' : 'block'}`}>
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-1">Activity</label>
              <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#FF7043] focus:bg-white transition-all font-bold appearance-none">
                <option value="">활동 종류 선택</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[#FF7043] text-white py-5 rounded-3xl font-black text-xl shadow-xl hover:bg-[#F4511E] transition-all active:scale-95">
              🚀 활동 인증하기
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return ( <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-bold text-gray-300 italic">SYSTEM LOADING...</div>}><HomeContent /></Suspense> )
}