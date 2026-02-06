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

  // 운영본부 하부 메뉴 노출 조건
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

  // --- 🎨 통합 헤더 컴포넌트 ---
  const GlobalHeader = () => (
    <header className="bg-white sticky top-0 z-50 border-b-4 border-[#FF8A65] shadow-md">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-20">
        <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2 group">
           <div className="bg-[#FF8A65] text-white px-3 py-2 font-black text-xl rounded-xl group-hover:bg-[#FF7043] transition-colors">참여연대</div>
           <span className="text-2xl font-bold tracking-tighter text-[#4E342E]">시민연결</span>
        </div>
        <div className="flex gap-4 items-center font-bold">
          <button onClick={() => router.push('/')} className={`text-sm transition ${!isHQView ? "text-[#FF7043]" : "text-[#8D6E63]"}`}>활동보고</button>
          <div className="h-4 w-[1px] bg-gray-200"></div>
          <button 
            onClick={() => router.push('?mode=hq')}
            className={`px-4 py-2 rounded-full text-sm transition-all ${isHQView ? "bg-[#5D4037] text-white shadow-lg" : "text-[#BCAAA4] hover:text-[#FF8A65]"}`}
          >
            운영본부 ⚙️
          </button>
        </div>
      </div>
      
      {/* ⭐ 운영본부 클릭 시 나타나는 3가지 주제 디렉토리 */}
      {isHQView && (
        <div className="bg-[#FFF8E1] border-t border-[#FFE0B2]">
          <div className="max-w-5xl mx-auto px-4 flex justify-around h-14 items-center">
            <button onClick={() => router.push('?mode=guide')} className={`text-sm font-black transition-all ${mode === 'guide' ? "text-[#FF7043] scale-110" : "text-[#8D6E63] opacity-60"}`}>📖 사용자 가이드</button>
            <button onClick={() => router.push('?mode=vision')} className={`text-sm font-black transition-all ${mode === 'vision' ? "text-[#FF7043] scale-110" : "text-[#8D6E63] opacity-60"}`}>💎 비전과 가치</button>
            <button onClick={() => router.push('?admin=true')} className={`text-sm font-black transition-all ${isAdminView ? "text-[#FF7043] scale-110" : "text-[#8D6E63] opacity-60"}`}>⚙️ 승인 관리</button>
          </div>
        </div>
      )}
    </header>
  )

  const Footer = () => (
    <footer className="bg-white border-t border-[#FFE0B2] py-10 mt-20">
      <div className="max-w-5xl mx-auto px-4 text-center">
        <p className="text-[#A1887F] text-sm">우리의 연대가 세상을 바꿉니다. 참여연대 시민연결 시스템</p>
        <p className="text-[#D7CCC8] text-[10px] mt-2 italic font-serif">Developed for Solidarity and Coexistence</p>
      </div>
    </footer>
  )

  // --- 1. 사용자 가이드 ---
  if (mode === 'guide') return (
    <main className="min-h-screen bg-white font-sans text-[#5D4037]"><GlobalHeader />
      <div className="max-w-2xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-black mb-12 text-center">시민 참여 매뉴얼</h2>
        <div className="space-y-12">
          <section className="bg-orange-50 p-8 rounded-[40px] border border-orange-100 shadow-sm">
            <h3 className="text-xl font-bold text-[#E65100] mb-4 flex items-center gap-2">📸 현장 QR: "정신없이 바쁜 순간에도"</h3>
            <p className="leading-relaxed text-sm mb-4">
              집회 현장에서 구호를 외치거나, 행사장에서 주차 안내를 맡아 땀 흘리고 계신가요? 폰을 꺼내 현장 배너의 **전용 QR**을 찍기만 하세요. 성함만 입력하면 활동 내역이 즉시 기록됩니다. 5초면 충분합니다!
            </p>
          </section>
          <section className="bg-blue-50 p-8 rounded-[40px] border border-blue-100 shadow-sm">
            <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">🏠 사후 보고: "깜빡하고 놓쳤다면?"</h3>
            <p className="leading-relaxed text-sm">
              너무 바빠서 혹은 배터리가 없어서 현장 인증을 못 하셨나요? 괜찮습니다. 지금 보고 계신 이 홈페이지의 **[활동보고]** 버튼을 통해 언제든 보고서를 제출해 주세요. 운영본부 활동가가 정성껏 검토한 뒤 승인해 드립니다.
            </p>
          </section>
        </div>
      </div><Footer /></main>
  )

  // --- 2. 비전과 가치 ---
  if (mode === 'vision') return (
    <main className="min-h-screen bg-white font-sans text-[#5D4037]"><GlobalHeader />
      <div className="max-w-3xl mx-auto py-20 px-6">
        <h2 className="text-4xl font-black mb-16 text-center italic">"우리는 보이지 않는<br/>연대의 무게를 기록합니다"</h2>
        <div className="grid gap-16">
          <div className="border-l-4 border-[#FF8A65] pl-8">
            <h3 className="text-2xl font-bold mb-4">⚖️ 공정하고 따뜻한 인정</h3>
            <p className="text-[#8D6E63] leading-relaxed">
              화려한 무대 위 발언자뿐만 아니라, 가장자리에서 묵묵히 주차를 돕고 쓰레기를 줍는 분들이 참여연대의 진짜 기둥입니다. **시민연결 시스템은 이 보이지 않는 헌신을 디지털로 정량화**하여, 모두가 평등하게 빛나는 연대 문화를 만듭니다.
            </p>
          </div>
          <div className="border-l-4 border-[#4CAF50] pl-8">
            <h3 className="text-2xl font-bold mb-4">📊 데이터로 증명하는 신뢰</h3>
            <p className="text-[#8D6E63] leading-relaxed">
              막연한 "열심히 했다"는 말 대신 **"이번 달에 500명의 시민이 1,200시간을 연대했습니다"**라는 정직한 숫자를 후원자들께 보여드립니다. 이 투명한 리포트는 참여연대를 향한 신뢰를 지키고, 더 큰 후원을 이끄는 가장 강력한 무기가 됩니다.
            </p>
          </div>
        </div>
      </div><Footer /></main>
  )

  // --- 3. 승인 관리 (Admin) ---
  if (isAdminView || mode === 'hq') return (
    <main className="min-h-screen bg-gray-50 font-sans text-[#5D4037]"><GlobalHeader />
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="flex justify-between items-end mb-8">
          <div><h2 className="text-3xl font-black text-[#5D4037]">승인 관리 센터</h2><p className="text-sm text-gray-400 mt-2 italic font-bold tracking-widest uppercase">Admin Approval List</p></div>
          <button onClick={fetchPending} className="bg-white border-2 border-gray-100 px-6 py-2 rounded-2xl font-black text-[11px] shadow-sm hover:bg-gray-50 transition-all">RELOAD</button>
        </div>
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-[#5D4037] text-white">
              <tr><th className="p-6 font-bold text-xs uppercase tracking-widest text-center">활동가</th><th className="p-6 font-bold text-xs uppercase tracking-widest">활동 상세</th><th className="p-6 font-bold text-xs text-center uppercase tracking-widest">액션</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {pendingReports.length === 0 ? (
                <tr><td colSpan={3} className="p-32 text-center text-gray-300 font-bold text-lg italic">모든 시민의 활동이 승인되었습니다! 😊</td></tr>
              ) : (
                pendingReports.map(r => (
                  <tr key={r.id} className="hover:bg-orange-50/50 transition-colors">
                    <td className="p-6 font-black text-gray-700 text-lg text-center">{r.user_name}</td>
                    <td className="p-6 text-gray-500">{r.activity_types?.name}</td>
                    <td className="p-6 text-center"><button onClick={() => handleApprove(r.id)} className="bg-[#00C853] text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all">최종 승인</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div><Footer /></main>
  )

  // --- 🏠 기본 메인 화면 (활동보고) ---
  return (
    <main className="min-h-screen bg-[#FFFDE7] font-sans text-[#5D4037]">
      <GlobalHeader />
      <div className={`py-24 text-center transition-all ${mode === 'qr' ? 'bg-[#FF8A65] text-white' : 'bg-[#FFE0B2]'}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] mb-4 opacity-50 font-mono">Participatory Democracy Data</p>
        <h1 className="text-5xl font-black mb-4 tracking-tighter">참여연대 활동보고</h1>
        <p className="opacity-80 font-medium text-lg leading-relaxed max-w-xs mx-auto text-balance">우리의 작고 평범한 활동들이<br/>세상을 바꾸는 거대한 데이터가 됩니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-16 px-6 pb-32">
        <div className="bg-white p-12 rounded-[50px] shadow-2xl border-4 border-[#FF8A65]">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest ml-2 italic">Name of Citizen</label>
              <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-[#FF8A65] focus:bg-white transition-all font-bold text-xl placeholder:text-gray-200" />
            </div>
            <div className={`space-y-2 ${presetActivity ? 'hidden' : 'block'}`}>
              <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest ml-2 italic">Activity Type</label>
              <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-[#FF8A65] focus:bg-white transition-all font-bold text-xl appearance-none text-gray-700">
                <option value="">수행하신 활동을 선택하세요</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[#FF8A65] text-white py-7 rounded-[35px] font-black text-2xl shadow-xl hover:bg-[#FF7043] transition-all active:scale-[0.98]">
               시민 연대 인증 🚀
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  )
}

export default function Home() {
  return ( <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold text-[#FF8A65] tracking-widest uppercase italic animate-pulse">Connecting to Solidarity...</div>}><HomeContent /></Suspense> )
}