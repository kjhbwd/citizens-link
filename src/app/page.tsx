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

  const isHQView = mode === 'hq' || mode === 'guide' || mode === 'vision' || isAdminView

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
      if (isAdminView || mode === 'hq') fetchPending()
    }
    fetchData()
  }, [presetActivity, isAdminView, mode])

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

  // --- 🎨 헤더: 단어 끊김 방지(break-keep) 적용 ---
  const GlobalHeader = () => (
    <header className="bg-white sticky top-0 z-50 border-b-4 border-[#FF8A65] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-20">
        <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2 flex-shrink-0">
           <div className="bg-[#FF8A65] text-white px-2 py-1 font-black text-lg rounded-lg whitespace-nowrap">참여연대</div>
           <span className="text-xl font-bold tracking-tighter text-[#4E342E] whitespace-nowrap">시민연결</span>
        </div>
        <div className="flex gap-3 items-center font-bold flex-shrink-0">
          <button onClick={() => router.push('/')} className={`text-xs sm:text-sm whitespace-nowrap ${!isHQView ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>활동보고</button>
          <div className="h-3 w-[1px] bg-gray-200"></div>
          <button 
            onClick={() => router.push('?mode=hq')}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm whitespace-nowrap transition-all ${isHQView ? "bg-[#5D4037] text-white" : "text-[#BCAAA4]"}`}
          >
            운영본부 ⚙️
          </button>
        </div>
      </div>
      
      {/* 3대 하부 디렉토리: 모바일 가로 스크롤 대응 */}
      {isHQView && (
        <div className="bg-[#FFF8E1] border-t border-[#FFE0B2] overflow-x-auto">
          <div className="max-w-5xl mx-auto px-4 flex justify-around h-14 items-center gap-4 min-w-max">
            <button onClick={() => router.push('?mode=guide')} className={`text-xs font-black whitespace-nowrap px-2 ${mode === 'guide' ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63] opacity-60"}`}>📖 사용자 가이드</button>
            <button onClick={() => router.push('?mode=vision')} className={`text-xs font-black whitespace-nowrap px-2 ${mode === 'vision' ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63] opacity-60"}`}>💎 비전과 가치</button>
            <button onClick={() => router.push('?admin=true')} className={`text-xs font-black whitespace-nowrap px-2 ${isAdminView ? "text-[#FF7043] border-b-2 border-[#FF7043]" : "text-[#8D6E63] opacity-60"}`}>⚙️ 승인 관리</button>
          </div>
        </div>
      )}
    </header>
  )

  // --- [1] 사용자 가이드: 사례 중심 & 단어 끊김 방지 ---
  if (mode === 'guide') return (
    <main className="min-h-screen bg-white break-keep"><GlobalHeader />
      <div className="max-w-2xl mx-auto py-12 px-6">
        <h2 className="text-2xl font-black mb-10 text-center">시민 참여 매뉴얼</h2>
        <div className="space-y-10">
          <section className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
            <h3 className="text-lg font-bold text-[#E65100] mb-3">📸 현장 QR: 바쁜 순간에도 5초면 끝!</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              집회 현장에서 구호를 외치거나 주차 안내를 맡아 정신없이 바쁘실 때가 많죠? 그럴 땐 현장에 비치된 QR을 휴대폰으로 찍기만 하세요. 성함만 입력하면 별도의 선택 없이 활동이 즉시 기록됩니다.
            </p>
          </section>
          <section className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
            <h3 className="text-lg font-bold text-blue-700 mb-3">🏠 사후 보고: 인증을 놓쳤어도 걱정 마세요</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              배터리가 나갔거나 너무 바빠서 현장 인증을 못 하셨나요? 집에 돌아가셔서 이 사이트의 [활동보고] 메뉴를 통해 보고서를 제출해 주세요. 운영진이 확인 후 꼼꼼하게 승인해 드립니다.
            </p>
          </section>
        </div>
      </div>
    </main>
  )

  // --- [2] 비전과 가치: 철학 중심 ---
  if (mode === 'vision') return (
    <main className="min-h-screen bg-white break-keep"><GlobalHeader />
      <div className="max-w-3xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-black mb-12 text-center leading-tight">"우리는 시민들의 헌신적인<br/>발자취를 소중히 기록합니다"</h2>
        <div className="space-y-12">
          <section className="border-l-4 border-[#FF8A65] pl-6">
            <h3 className="text-xl font-bold mb-3">⚖️ 보이지 않는 곳의 정당한 인정</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              화려한 무대 위 발언자뿐만 아니라, 가장자리에서 묵묵히 주차를 돕고 쓰레기를 줍는 시민들이 참여연대를 지탱하는 진짜 기둥입니다. 우리는 모든 활동을 기록하여 누구 하나 소외되지 않는 공정한 공동체를 만듭니다.
            </p>
          </section>
          <section className="border-l-4 border-[#4CAF50] pl-6">
            <h3 className="text-xl font-bold mb-3">📊 데이터로 증명하는 투명한 연대</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              막연한 "열심히 했다"는 말 대신 "이번 달 500명의 시민이 1,200시간을 연대했습니다"라는 정직한 지표를 보여드립니다. 이 투명한 리포트는 후원자들께 우리 활동의 역동성을 증명하는 가장 강력한 근거가 됩니다.
            </p>
          </section>
        </div>
      </div>
    </main>
  )

  // --- [3] 승인 관리 (Admin) ---
  if (isAdminView || mode === 'hq') return (
    <main className="min-h-screen bg-gray-50 break-keep"><GlobalHeader />
      <div className="max-w-5xl mx-auto py-10 px-4">
        <h2 className="text-2xl font-black text-[#5D4037] mb-6">승인 관리 센터</h2>
        <div className="bg-white rounded-[30px] shadow-xl overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-[#5D4037] text-white text-xs uppercase tracking-widest">
                <tr><th className="p-4">활동가</th><th className="p-4">활동 내용</th><th className="p-4 text-center">처리</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {pendingReports.length === 0 ? (
                  <tr><td colSpan={3} className="p-20 text-center text-gray-300 font-bold">대기 중인 보고서가 없습니다. 😊</td></tr>
                ) : (
                  pendingReports.map(r => (
                    <tr key={r.id} className="hover:bg-orange-50/50">
                      <td className="p-4 font-bold text-gray-700 whitespace-nowrap">{r.user_name}</td>
                      <td className="p-4 text-gray-500">{r.activity_types?.name}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleApprove(r.id)} className="bg-[#00C853] text-white px-5 py-2 rounded-xl font-black text-xs whitespace-nowrap">승인완료</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )

  // --- 🏠 기본 메인 화면 (활동보고) ---
  return (
    <main className="min-h-screen bg-[#FFFDE7] break-keep">
      <GlobalHeader />
      <div className={`py-20 text-center transition-all ${mode === 'qr' ? 'bg-[#FF8A65] text-white' : 'bg-[#FFE0B2] text-[#5D4037]'}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-3 opacity-50">Citizens Link System</p>
        <h1 className="text-4xl font-black mb-3 tracking-tighter">참여연대 활동보고</h1>
        <p className="opacity-80 font-medium text-base px-6">우리의 일상이 데이터가 되어<br/>세상을 바꾸는 힘이 됩니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-12 px-6 pb-32">
        <div className="bg-white p-10 rounded-[45px] shadow-2xl border-4 border-[#FF8A65]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-2">Name</label>
              <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#FF8A65] focus:bg-white transition-all font-bold text-lg" />
            </div>
            <div className={`space-y-1 ${presetActivity ? 'hidden' : 'block'}`}>
              <label className="text-[10px] font-black text-gray-300 uppercase tracking-widest ml-2">Activity</label>
              <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-[#FF8A65] focus:bg-white transition-all font-bold text-lg appearance-none text-gray-700">
                <option value="">활동을 선택하세요</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[#FF8A65] text-white py-6 rounded-[30px] font-black text-2xl shadow-xl hover:bg-[#FF7043] transition-all active:scale-[0.98]">
               인증 완료 🚀
            </button>
          </form>
        </div>
      </div>
      <footer className="bg-white border-t border-[#FFE0B2] py-8 text-center px-4">
        <p className="text-[#A1887F] text-xs leading-relaxed">우리의 연대가 세상을 바꿉니다.<br/>참여연대 시민연결 시스템</p>
      </footer>
    </main>
  )
}

export default function Home() {
  return ( <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-bold text-[#FF8A65] tracking-widest animate-pulse">SYSTEM STARTING...</div>}><HomeContent /></Suspense> )
}