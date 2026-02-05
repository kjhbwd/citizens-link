'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation' // 주소를 읽어오는 기능 추가
import { supabase } from '@/lib/supabase'

export default function Home() {
  const searchParams = useSearchParams()
  const isQRMode = searchParams.get('mode') === 'qr' // 주소 끝에 ?mode=qr이 있으면 true가 됩니다.

  const [activities, setActivities] = useState<any[]>([])
  const [userName, setUserName] = useState('')
  const [selectedActivity, setSelectedActivity] = useState<string | number>('')

  useEffect(() => {
    async function fetchPoints() {
      const { data } = await supabase.from('activity_types').select('*')
      if (data) setActivities(data)
    }
    fetchPoints()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName || !selectedActivity) return alert('성함과 활동을 선택해주세요!')

    // [핵심 로직] QR로 들어오면 'approved'(승인), 아니면 'pending'(대기)
    const finalStatus = isQRMode ? 'approved' : 'pending'

    const { error } = await supabase.from('activity_reports').insert([
      { 
        user_name: userName, 
        activity_id: Number(selectedActivity),
        status: finalStatus 
      }
    ])

    if (error) alert('오류가 발생했습니다.')
    else {
      const msg = isQRMode 
        ? '✨ 현장 확인이 완료되어 즉시 승인되었습니다!' 
        : '📝 보고서가 접수되었습니다. 운영본부 승인 후 합산됩니다.'
      alert(msg)
      setUserName('')
      setSelectedActivity('')
    }
  }

  return (
    <main className="min-h-screen bg-[#FFFDE7]">
      <div className={`py-16 px-4 text-center ${isQRMode ? 'bg-[#FF8A65] text-white' : 'bg-[#FFE0B2] text-[#5D4037]'}`}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-medium mb-2">{isQRMode ? '🧡 실시간 현장 확인 중' : '🧡 시민의 힘을 기록합니다'}</h2>
          <h1 className="text-4xl font-black mb-4">
            {isQRMode ? '참여연대 즉시 승인' : '참여연대 활동보고'}
          </h1>
          <p className="opacity-90">
            {isQRMode 
              ? '현장 QR을 통해 접속하셨습니다. 등록 즉시 점수가 반영됩니다!' 
              : '수행하신 활동을 보고해주세요. 운영본부 확인 후 승인됩니다.'}
          </p>
        </div>
      </div>
      
      {/* ... (이후 입력 폼 디자인은 이전과 동일) ... */}
      <div className="max-w-2xl mx-auto px-4 -mt-10 pb-20">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-[#FFE0B2]">
          <form onSubmit={handleSubmit} className="space-y-6">
            <input 
              type="text" placeholder="성함을 입력하세요" value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full p-4 border-2 border-[#FFF3E0] rounded-2xl outline-none focus:border-[#FF8A65] bg-[#FFFBFA] text-lg"
            />
            <select 
              value={selectedActivity} onChange={(e) => setSelectedActivity(e.target.value)}
              className="w-full p-4 border-2 border-[#FFF3E0] rounded-2xl outline-none focus:border-[#FF8A65] bg-[#FFFBFA] text-lg"
            >
              <option value="">활동 종류 선택</option>
              {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <button type="submit" className="w-full bg-[#FF7043] text-white py-5 rounded-2xl font-black text-xl shadow-lg">
              {isQRMode ? '💖 즉시 승인 및 등록' : '📝 활동 보고서 제출'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}