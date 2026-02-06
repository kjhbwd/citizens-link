'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function HomeContent() {
  const searchParams = useSearchParams()
  const isQRMode = searchParams.get('mode') === 'qr'
  const isAdmin = searchParams.get('admin') === 'true'
  const presetActivity = searchParams.get('activity')

  const [activities, setActivities] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<string | number>('')
  const [pendingReports, setPendingReports] = useState<any[]>([])

  // 데이터 로딩 (활동 종류 및 대기 목록)
  useEffect(() => {
    async function fetchData() {
      const { data: acts } = await supabase.from('activity_types').select('*')
      if (acts) {
        setActivities(acts)
        if (presetActivity) setSelectedActivity(presetActivity)
      }
      if (isAdmin) fetchPending()
    }
    fetchData()
  }, [presetActivity, isAdmin])

  const fetchPending = async () => {
    const { data } = await supabase
      .from('activity_reports')
      .select('*, activity_types(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (data) setPendingReports(data)
  }

  const handleApprove = async (id: number) => {
    const { error } = await supabase
      .from('activity_reports')
      .update({ status: 'approved' })
      .eq('id', id)
    
    if (error) alert('승인 오류')
    else {
      alert('✅ 승인 완료!');
      fetchPending()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !selectedActivity) return alert('성함과 활동을 선택해주세요!')

    const finalStatus = isQRMode ? 'approved' : 'pending'

    const { error } = await supabase.from('activity_reports').insert([
      { 
        user_name: userName, 
        activity_id: Number(selectedActivity),
        status: finalStatus 
      }
    ])

    if (error) alert('등록 중 오류가 발생했습니다.')
    else {
      alert(isQRMode ? '✨ 즉시 승인되었습니다!' : '📝 보고서가 제출되었습니다. 관리자 승인을 기다려주세요.')
      setUserName('')
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFDE7] pb-20">
      {/* 헤더 섹션 */}
      <div className={`py-12 px-4 text-center transition-colors ${isAdmin ? 'bg-[#5D4037] text-white' : isQRMode ? 'bg-[#FF8A65] text-white' : 'bg-[#FFE0B2] text-[#5D4037]'}`}>
        <h1 className="text-3xl font-black mb-2">
          {isAdmin ? '🛠️ 운영진 통합 관리' : isQRMode ? '✅ 현장 즉시 인증' : '📝 활동 보고서'}
        </h1>
        <p className="opacity-90 font-medium">참여연대 시민연결 시스템</p>
      </div>
      
      <div className="max-w-md mx-auto px-4 -mt-8">
        {/* 관리자 모드: 대기 목록 */}
        {isAdmin && (
          <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-[#5D4037] mb-8">
            <h2 className="text-xl font-bold mb-4 flex justify-between items-center text-[#5D4037]">
              승인 대기 목록
              <button onClick={fetchPending} className="text-xs bg-[#FFE0B2] px-2 py-1 rounded">새로고침</button>
            </h2>
            {pendingReports.length === 0 ? (
              <p className="text-center text-gray-400 py-10">대기 중인 보고가 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {pendingReports.map(report => (
                  <div key={report.id} className="p-4 bg-gray-50 rounded-2xl border flex justify-between items-center">
                    <div>
                      <p className="font-bold">{report.user_name}</p>
                      <p className="text-xs text-gray-500">{report.activity_types?.name}</p>
                    </div>
                    <button onClick={() => handleApprove(report.id)} className="bg-[#4CAF50] text-white px-4 py-2 rounded-xl text-sm font-bold">승인</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 사용자 보고 폼 */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-[#FFE0B2]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#8D6E63] mb-2 ml-1">작성자 성함</label>
              <input 
                type="text" placeholder="성함을 입력하세요" value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full p-4 border-2 border-[#FFF3E0] rounded-2xl outline-none focus:border-[#FF8A65] bg-[#FFFBFA]"
              />
            </div>
            <div className={presetActivity ? "hidden" : "block"}>
              <label className="block text-sm font-bold text-[#8D6E63] mb-2 ml-1">수행한 활동</label>
              <select 
                value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full p-4 border-2 border-[#FFF3E0] rounded-2xl outline-none focus:border-[#FF8A65] bg-[#FFFBFA]"
              >
                <option value="">활동 종류 선택</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <button type="submit" className="w-full bg-[#FF7043] hover:bg-[#F4511E] text-white py-5 rounded-2xl font-black text-xl shadow-lg transition-transform active:scale-95">
              {isQRMode ? '💖 즉시 승인 및 등록' : '📝 활동 보고서 제출'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

// 메인 페이지 - Suspense로 감싸서 배포 에러 방지
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FFFDE7] flex items-center justify-center font-bold text-[#8D6E63]">데이터 연결 중...</div>}>
      <HomeContent />
    </Suspense>
  )
}