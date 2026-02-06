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

  // 운영본부 하부 메뉴가 보여야 하는 상태인지 확인
  const isHQMode = mode === 'hq' || mode === 'guide' || mode === 'vision' || isAdminView

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
    if (!error) { alert('✅ 승인이 완료되었습니다!'); fetchPending(); }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !selectedActivity) return alert('성함과 활동을 입력해주세요!')
    const finalStatus = mode === 'qr' ? 'approved' : 'pending'
    const { error } = await supabase.from('activity_reports').insert([{ user_name: userName, activity_id: Number(selectedActivity), status: finalStatus }])
    if (!error) { alert(mode === 'qr' ? '✨ 즉시 인증되었습니다!' : '📝 보고서가 제출되었습니다!'); setUserName(''); }
  }

  // --- 🎨 단일 통합 헤더 & 스마트 하부 디렉토리 ---
  const Header = () => (
    <header className="bg-white sticky top-0 z-50 shadow-sm border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-16">
        <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2 font-black text-[#FF7043] text-xl">
          참여연대 <span className="text-gray-400 font-light text-lg">시민연결</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className={`text-sm font-bold ${!isHQMode ? "text-[#FF7043]" : "text-gray-400"}`}>활동보고</button>
          <button onClick={() => router.push('?mode=hq')} className={`text-sm font-bold ${isHQMode ? "text-[#5D4037] border-b-2 border-[#5D4037]" : "text-gray-400"}`}>운영본부</button>
        </div>
      </div>
      
      {/* 3대 하부 디렉토리 바 (운영본부 모드일 때만 노출) */}
      {isHQMode && (
        <div className="bg-[#FDFCFB] border-t border-gray-200 overflow-x-auto whitespace-nowrap">
          <div className="max-w-5xl mx-auto px-4 flex justify-around h-12 items-center text-xs font-bold">
            <button onClick={() => router.push('?mode=guide')} className={`transition-colors ${mode === 'guide' ? "text-[#FF7043]" : "text-gray-500"}`}>📖 사용자 가이드</button>
            <button onClick={() => router.push('?mode=vision')} className={`transition-colors ${mode === 'vision' ? "text-[#FF7043]" : "text-gray-500"}`}>💎 비전과 가치</button>
            <button onClick={() => router.push('?admin=true')} className={`transition-colors ${isAdminView ? "text-[#FF7043]" : "text-gray-500"}`}>⚙️ 승인 관리</button>
          </div>
        </div>
      )}
    </header>
  )

  // --- [1] 사용자 가이드: 실제 사례 중심 ---
  if (mode === 'guide') return (
    <main className="min-h-screen bg-white"><Header />
      <div className="max-w-2xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-black text-gray-900 mb-8 text-center">어떻게 참여하나요?</h2>
        
        <div className="space-y-10">
          <div className="p-8 bg-orange-50 rounded-[32px] border border-orange-100">
            <h3 className="text-xl font-bold text-[#E65100] mb-4 flex items-center gap-2">📸 사례 1: 행사 현장에서 바쁠 때</h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              "주차 안내나 행사장 뒷정리로 정신이 없으시죠? 이럴 땐 배치된 **전용 QR코드**를 스캔하세요. 별도의 활동 선택 없이 성함만 입력하면 즉시 포인트가 지급됩니다. 5초면 충분합니다!"
            </p>
          </div>

          <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100">
            <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">🏠 사례 2: 현장에서 인증을 놓쳤을 때</h3>
            <p className="text-gray-700 leading-relaxed text-sm">
              "배터리가 없거나 데이터를 다 쓰셨어도 괜찮습니다. 집에 돌아가셔서 메인 페이지의 **[활동보고]** 메뉴를 통해 직접 성함과 활동 내용을 선택해 제출해 주세요. 운영본부에서 확인 후 승인해 드립니다."
            </p>
          </div>
        </div>
      </div>
    </main>
  )

  // --- [2] 비전과 가치: 공감과 설득 ---
  if (mode === 'vision') return (
    <main className="min-h-screen bg-white"><Header />
      <div className="max-w-3xl mx-auto py-16 px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-[#5D4037] mb-4 italic">"시민의 평범한 일상이<br/>데이터로 모여 세상을 바꿉니다"</h2>
        </div>
        
        <div className="grid gap-12">
          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">⚖️ 보이지 않는 곳의 정당한 인정</h3>
            <p className="text-gray-600 leading-relaxed">
              화려한 무대 위의 발언자도 중요하지만, 추운 날씨에 주차 안내를 맡거나 행사 후 쓰레기를 줍는 시민들의 헌신은 더 귀합니다. 
              **시민연결 시스템은 눈에 띄지 않는 곳의 노고를 디지털 데이터로 정량화**하여, 모든 연대가 공정하게 인정받는 신뢰의 바탕이 됩니다.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">📊 투명성이 가져오는 후원의 힘</h3>
            <p className="text-gray-600 leading-relaxed">
              막연히 "열심히 활동했다"고 말하는 시대는 지났습니다. 후원자들에게 **"이번 달에 300명의 시민이 800시간 동안 연대했습니다"**라는 
              명확한 지표를 보여줌으로써 우리 단체의 역동성을 증명하고, 후원금이 얼마나 가치 있게 쓰이는지 정직하게 보고합니다.
            </p>
          </section>
        </div>
      </div>
    </main>
  )

  // --- [3] 승인 관리: Admin 대시보드 ---
  if (isAdminView || mode === 'hq') return (
    <main className="min-h-screen bg-gray-50"><Header />
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl font-black text-[#5D4037]">실시간 승인 현황</h2>
            <p className="text-sm text-gray-400 mt-2">사후 보고된 활동들을 검토하고 클릭 한 번으로 승인하세요.</p>
          </div>
          <button onClick={fetchPending} className="bg-white border-2 border-gray-200 px-5 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-gray-50 transition-all">RELOAD</button>
        </div>
        
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-[#1F2937] text-white">
              <tr>
                <th className="p-6 font-bold text-xs uppercase tracking-widest">활동가 성함</th>
                <th className="p-6 font-bold text-xs uppercase tracking-widest">활동 상세</th>
                <th className="p-6 font-bold text-xs text-center uppercase tracking-widest">처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingReports.length === 0 ? (
                <tr><td colSpan={3} className="p-32 text-center text-gray-400 font-bold italic">새로운 보고서가 없습니다. 😊</td></tr>
              ) : (
                pendingReports.map(r => (
                  <tr key={r.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-6 font-black text-gray-800 text-lg">{r.user_name}</td>
                    <td className="p-6 text-gray-500 font-medium">{r.activity_types?.name}</td>
                    <td className="p-6 text-center">
                      <button onClick={() => handleApprove(r.id)} className="bg-[#00C853] text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all">승인 완료</button>
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

  // --- 기본 메인 화면 (활동보고) ---
  return (
    <main className="min-h-screen bg-[#FFFDE7]">
      <Header />
      <div className={`py-24 text-center ${mode === 'qr' ? 'bg-[#FF8A65] text-white' : 'bg-[#FFE0B2] text-[#5D4037]'}`}>
        <h1 className="text-5xl font-black mb-4 tracking-tighter">참여연대 활동인증</h1>
        <p className="opacity-80 font-medium text-lg">기록이 모여 세상을 바꾸는 힘이 됩니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-16 px-6 pb-32">
        <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-orange-50/50">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest ml-2">Member Name</label>
              <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-[#FF7043] focus:bg-white transition-all font-bold text-xl" />
            </div>
            <div className={`space-y-2 ${presetActivity ? 'hidden' : 'block'}`}>
              <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest ml-2">Select Activity</label>
              <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-[#FF7043] focus:bg-white transition-all font-bold text-xl appearance-none">
                <option value="">수행한 활동을 선택하세요</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[#FF7043] text-white py-7 rounded-[32px] font-black text-2xl shadow-xl hover:bg-[#F4511E] transition-all active:scale-95 flex justify-center items-center gap-3">
               🚀 활동 인증 완료
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return ( <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-bold text-gray-200 uppercase tracking-widest italic">Loading System...</div>}><HomeContent /></Suspense> )
}