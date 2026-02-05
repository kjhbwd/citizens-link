'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function RankingPage() {
  const [rankings, setRankings] = useState<any[]>([])

  useEffect(() => {
    async function fetchRankings() {
      // 1. 승인된(approved) 모든 활동 내역과 포인트 가져오기
      const { data } = await supabase
        .from('activity_reports')
        .select('user_name, activity_types(base_points)')
        .eq('status', 'approved')

      if (data) {
        // 2. 이름별로 점수 합산하기
        const totals: any = {}
        data.forEach((report: any) => {
          const name = report.user_name
          const points = report.activity_types?.base_points || 0
          totals[name] = (totals[name] || 0) + points
        })

        // 3. 점수 높은 순으로 정렬해서 배열로 만들기
        const sorted = Object.entries(totals)
          .map(([name, points]) => ({ name, points }))
          .sort((a: any, b: any) => b.points - a.points)

        setRankings(sorted)
      }
    }
    fetchRankings()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-900 to-black p-10 text-white">
      <div className="max-w-xl mx-auto">
        <h1 className="text-4xl font-black text-center mb-12 text-yellow-400 italic">
          🏆 CITIZENS-LINK 명예의 전당
        </h1>

        <div className="space-y-4">
          {rankings.length > 0 ? (
            rankings.map((user, index) => (
              <div 
                key={user.name}
                className={`flex items-center justify-between p-6 rounded-2xl border-2 ${
                  index === 0 ? 'border-yellow-400 bg-yellow-400/10' : 'border-gray-700 bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-2xl font-black ${index === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>
                    {index + 1}위
                  </span>
                  <span className="text-xl font-bold">{user.name} 활동가</span>
                </div>
                <div className="text-2xl font-black text-blue-400">
                  {user.points.toLocaleString()} <span className="text-sm">CP</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center p-20 text-gray-500 italic border-2 border-dashed border-gray-800 rounded-3xl">
              아직 승인된 활동이 없습니다.<br/>관리자 페이지에서 승인을 진행해주세요!
            </div>
          )}
        </div>
        
        <p className="text-center mt-10 text-gray-500 text-sm">
          * 승인된 활동 포인트만 실시간으로 합산됩니다.
        </p>
      </div>
    </main>
  )
}