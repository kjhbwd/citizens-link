'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function VisionPage() {
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    async function fetchPoints() {
      const { data } = await supabase.from('activity_types').select('*')
      if (data) setActivities(data)
    }
    fetchPoints()
  }, [])

  return (
    <main className="min-h-screen bg-[#FFFDE7] pb-20">
      <div className="bg-gradient-to-r from-[#FFECB3] to-[#FFE0B2] py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-black text-[#4E342E] mb-6">시민연결(Citizens-Link) 연대 백서</h1>
          <p className="text-xl text-[#5D4037] font-light leading-relaxed">
            "우리의 헌신이 기록될 때, 연대의 힘은 배가 됩니다."<br/>
            이 시스템은 단체와 활동가가 함께 성장하기 위해 태어났습니다.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-10">
        {/* 1. 상호 윈윈(Win-Win) 분석 섹션 */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-12 border border-[#FFE0B2]">
          <h2 className="text-2xl font-bold text-[#FF7043] mb-8 flex items-center gap-2">
            🤝 우리가 함께 상생하는 이유
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#FFF8E1] p-6 rounded-2xl">
              <h3 className="text-lg font-black text-[#5D4037] mb-4">🏠 참여연대 운영진에게</h3>
              <ul className="space-y-3 text-[#795548] text-sm leading-relaxed">
                <li>• <b>행정 효율화:</b> 수기 장부 없이 실시간으로 활동 통계를 파악합니다.</li>
                <li>• <b>활동 분석:</b> 어떤 활동에 시민들이 가장 많이 참여하는지 데이터로 확인합니다.</li>
                <li>• <b>객관적 보상:</b> 주관을 배제한 공정한 포인트 지급으로 조직의 신뢰를 높입니다.</li>
              </ul>
            </div>
            <div className="bg-[#FFF3E0] p-6 rounded-2xl">
              <h3 className="text-lg font-black text-[#5D4037] mb-4">🧡 활동가 시민에게</h3>
              <ul className="space-y-3 text-[#795548] text-sm leading-relaxed">
                <li>• <b>존재의 증명:</b> 나의 작은 활동 하나하나가 단체의 역사에 기록됩니다.</li>
                <li>• <b>성취의 즐거움:</b> 명예의 전당을 통해 활동의 즐거움과 보람을 느낍니다.</li>
                <li>• <b>따뜻한 환대:</b> 현장 QR을 통해 "기다리고 있었습니다"라는 환대를 경험합니다.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. 점수표 섹션 */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#FFE0B2]">
          <div className="bg-[#6D4C41] p-6 text-[#FFF3E0]">
            <h2 className="text-xl font-bold text-center">📊 연대와 공존을 위한 지표 (점수표)</h2>
          </div>
          <div className="p-6">
            <p className="text-sm text-[#8D6E63] mb-6 text-center">
              아래 지표는 참여연대 운영위원회에서 의결한 공식 활동지수 배정 기준입니다.
            </p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-[#FFE0B2] text-[#5D4037]">
                  <th className="p-4 font-black text-lg">활동 종류</th>
                  <th className="p-4 text-right font-black text-lg">배정 지수</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FFF3E0]">
                {activities.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FFFDE7]">
                    <td className="p-5">
                      <div className="font-bold text-[#4E342E]">{item.name}</div>
                    </td>
                    <td className="p-5 text-right font-black text-[#FF7043] text-xl">
                      {item.base_points.toLocaleString()} <span className="text-sm font-normal text-gray-400 font-light">점</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 text-center text-[#BCAAA4] text-sm leading-relaxed">
          이 시스템은 기술을 통해 사람과 사람을 잇습니다.<br/>
          더 많은 시민이 즐겁게 연대하는 참여연대를 꿈꿉니다.
        </div>
      </div>
    </main>
  )
}