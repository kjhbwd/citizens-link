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

  const isHQRelated = mode === 'hq' || mode === 'guide' || mode === 'vision' || isAdminView

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
    if (!userName || !selectedActivity) return alert('성함과 활동을 선택해주세요!')
    const finalStatus = mode === 'qr' ? 'approved' : 'pending'
    const { error } = await supabase.from('activity_reports').insert([{ user_name: userName, activity_id: Number(selectedActivity), status: finalStatus }])
    if (!error) { alert(mode === 'qr' ? '✨ 즉시 승인되었습니다!' : '📝 보고서가 제출되었습니다!'); setUserName(''); }
  }

  // --- 🎨 고정 통합 헤더 & 3대 하부 디렉토리 ---
  const UnifiedHeader = () => (
    <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 flex justify-between items-center h-16">
        <div onClick={() => router.push('/')} className="cursor-pointer flex items-center gap-2">
           <span className="bg-[#FF7043] text-white px-2 py-1 rounded-md font-black text-xs italic tracking-tighter text-center">CITIZENS<br/>LINK</span>
           <span className="font-extrabold text-[#5D4037] text-xl">시민연결 시스템</span>
        </div>
        <button 
          onClick={() => router.push('?mode=hq')}
          className={`px-5 py-2 rounded-2xl text-xs font-black transition-all border-2 ${isHQRelated ? "bg-[#5D4037] border-[#5D4037] text-white" : "border-gray-100 text-gray-400 hover:bg-gray-50"}`}
        >
          운영본부 센터
        </button>
      </div>
      
      {/* ⭐ 3개로 압축된 하부 디렉토리 (운영본부 진입 시 상시 노출) */}
      {isHQRelated && (
        <div className="bg-[#FDFCFB] border-t border-gray-100">
          <div className="max-w-5xl mx-auto px-4 flex justify-around h-14 items-center">
            <button onClick={() => router.push('?mode=guide')} className={`text-sm font-black transition-all ${mode === 'guide' ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}>사용자 가이드</button>
            <button onClick={() => router.push('?mode=vision')} className={`text-sm font-black transition-all ${mode === 'vision' ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}>비전과 가치</button>
            <button onClick={() => router.push('?admin=true')} className={`text-sm font-black transition-all ${isAdminView ? "text-[#FF7043] border-b-2 border-[#FF7043] h-full" : "text-gray-400"}`}>승인 관리</button>
          </div>
        </div>
      )}
    </header>
  )

  // --- [1] 사용자 가이드: 사례 중심 설명 ---
  if (mode === 'guide') return (
    <main className="bg-white min-h-screen"><UnifiedHeader />
      <div className="max-w-2xl mx-auto py-16 px-6">
        <h2 className="text-3xl font-black text-gray-900 mb-2">어떻게 사용하나요?</h2>
        <p className="text-gray-500 mb-12">활동가와 시민 모두를 위한 가장 쉬운 참여 방법입니다.</p>
        
        <div className="space-y-12">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-orange-100 text-[#FF7043] flex items-center justify-center font-black">1</span>
              <h3 className="text-xl font-bold">현장 QR 인증 (가장 빠른 방법)</h3>
            </div>
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
              <p className="text-gray-700 leading-relaxed italic mb-4">"집회 현장이나 행사 주차장에서 정신없이 바쁘시죠? 안내 배너에 붙은 QR을 찍고 성함만 입력하세요."</p>
              <ul className="text-sm text-gray-600 space-y-2 list-disc ml-5">
                <li>별도의 로그인이 필요 없습니다.</li>
                <li>QR로 접속하면 활동 내용이 자동으로 선택되어 있습니다.</li>
                <li>인증 즉시 포인트가 합산되며, 운영진의 별도 승인을 기다릴 필요가 없습니다.</li>
              </ul>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">2</span>
              <h3 className="text-xl font-bold">사후 활동 보고 (놓쳤을 때)</h3>
            </div>
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <p className="text-gray-700 leading-relaxed italic mb-4">"휴대폰 배터리가 나갔거나 데이터를 다 쓰셨나요? 집에 가서 PC나 모바일로 보고하세요."</p>
              <ul className="text-sm text-gray-600 space-y-2 list-disc ml-5">
                <li>메인 화면에서 성함과 활동 내용을 직접 선택합니다.</li>
                <li>보고서 제출 후 운영본부의 확인을 거쳐 승인됩니다.</li>
                <li>누락 없는 기록이 참여연대의 힘이 됩니다.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </main>
  )

  // --- [2] 비전과 가치: 공감과 설득 ---
  if (mode === 'vision') return (
    <main className="bg-white min-h-screen"><UnifiedHeader />
      <div className="max-w-3xl mx-auto py-16 px-6">
        <div className="text-center mb-16">
          <span className="text-[#FF7043] font-black tracking-widest uppercase text-sm">Vision & Philosophy</span>
          <h2 className="text-4xl font-black text-[#5D4037] mt-4 mb-6">우리는 왜 기록하나요?</h2>
          <p className="text-gray-500 text-lg leading-relaxed">우리의 데이터는 단순한 숫자가 아니라,<br/>세상을 바꾸는 시민들의 역동적인 발자취입니다.</p>
        </div>
        
        <div className="grid gap-10">
          <div className="group border-b border-gray-100 pb-10">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="text-3xl">⚖️</span> 보이지 않는 헌신을 조명합니다
            </h3>
            <p className="text-gray-600 leading-relaxed">
              무대 위 발언자만큼이나 중요한 분들은 행사 후 뒷정리를 하거나, 주차 안내를 맡은 분들입니다. 
              <strong> 시민연결 시스템은 보이지 않는 곳에서의 헌신도 빠짐없이 정량화</strong>하여, 모든 참여자가 평등하고 공정하게 인정받는 문화를 만듭니다.
            </p>
          </div>

          <div className="group border-b border-gray-100 pb-10">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="text-3xl">📊</span> 후원자의 신뢰를 숫자로 증명합니다
            </h3>
            <p className="text-gray-600 leading-relaxed">
              "우리는 열심히 활동합니다"라는 말보다 "이번 달 500명의 시민이 1,200시간 동안 연대했습니다"라는 데이터가 더 강력합니다. 
              <strong> 투명한 활동 기록은 후원자들에게 우리 단체의 역동성을 증명</strong>하고, 지속 가능한 후원을 이끄는 가장 정직한 근거가 됩니다.
            </p>
          </div>

          <div className="group">
            <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="text-3xl">🤝</span> 더 끈끈한 연대의 플랫폼
            </h3>
            <p className="text-gray-600 leading-relaxed">
              기록된 포인트는 단순한 점수가 아닙니다. 연말 '명예의 전당'이나 활동 리포트를 통해 서로의 노고를 격려하는 매개체가 됩니다. 
              데이터로 연결된 시민들은 더 큰 소속감과 자부심으로 더 오래 함께할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </main>
  )

  // --- [3] 승인 관리: Admin 테이블 ---
  if (isAdminView || mode === 'hq') return (
    <main className="bg-gray-50 min-h-screen"><UnifiedHeader />
      <div className="max-w-5xl mx-auto py-12 px-6">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-gray-900">승인 관리 센터</h2>
            <p className="text-sm text-gray-500 mt-2">현장에서 등록하지 못한 분들의 보고를 검토하고 승인합니다.</p>
          </div>
          <button onClick={fetchPending} className="bg-white border-2 border-gray-100 px-6 py-2 rounded-2xl font-black text-[11px] shadow-sm hover:bg-gray-50">새로고침</button>
        </div>
        
        <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-gray-100">
          <table className="w-full text-left">
            <thead className="bg-[#1F2937] text-white">
              <tr>
                <th className="p-6 font-bold text-xs uppercase tracking-widest">활동가 성함</th>
                <th className="p-6 font-bold text-xs uppercase tracking-widest">활동 내용</th>
                <th className="p-6 font-bold text-xs text-center uppercase tracking-widest">승인 처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingReports.length === 0 ? (
                <tr><td colSpan={3} className="p-32 text-center text-gray-400 font-bold italic text-lg">대기 중인 보고서가 없습니다. 😊</td></tr>
              ) : (
                pendingReports.map(r => (
                  <tr key={r.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="p-6 font-black text-gray-700 text-lg">{r.user_name}</td>
                    <td className="p-6 font-medium text-gray-500">{r.activity_types?.name}</td>
                    <td className="p-6 text-center">
                      <button onClick={() => handleApprove(r.id)} className="bg-[#4CAF50] text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg hover:scale-105 active:scale-95 transition-all">승인 완료</button>
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
      <UnifiedHeader />
      <div className={`py-24 text-center transition-all ${mode === 'qr' ? 'bg-[#FF8A65] text-white' : 'bg-[#FFE0B2] text-[#5D4037]'}`}>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-70 italic">Participatory Democracy System</p>
        <h1 className="text-5xl font-black mb-4 tracking-tighter">활동 보고서 제출</h1>
        <p className="opacity-80 font-medium text-lg max-w-sm mx-auto leading-relaxed">시민의 참여가 데이터가 되고,<br/>데이터가 세상을 바꾸는 힘이 됩니다.</p>
      </div>
      <div className="max-w-md mx-auto -mt-16 px-6 pb-32">
        <div className="bg-white p-12 rounded-[50px] shadow-2xl border border-orange-50/50">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest ml-2">Member Name</label>
              <input type="text" placeholder="성함을 입력하세요" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-[#FF7043] focus:bg-white transition-all font-bold text-xl placeholder:text-gray-300" />
            </div>
            <div className={`space-y-2 ${presetActivity ? 'hidden' : 'block'}`}>
              <label className="text-[11px] font-black text-gray-300 uppercase tracking-widest ml-2">Select Activity</label>
              <select value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)} className="w-full p-6 bg-gray-50 border-2 border-gray-100 rounded-3xl outline-none focus:border-[#FF7043] focus:bg-white transition-all font-bold text-xl appearance-none text-gray-700">
                <option value="">수행하신 활동을 선택하세요</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[#FF7043] text-white py-7 rounded-[35px] font-black text-2xl shadow-xl hover:bg-[#F4511E] transition-all active:scale-[0.98] flex justify-center items-center gap-3">
               참여 인증 완료 🚀
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default function Home() {
  return ( <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center font-bold text-gray-200 tracking-widest uppercase">Initializing System...</div>}><HomeContent /></Suspense> )
}