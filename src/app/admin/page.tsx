'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AdminPage() {
  const [reports, setReports] = useState<any[]>([])

  // 1. 대기 중인 신청 목록 불러오기
  const fetchReports = async () => {
    const { data } = await supabase
      .from('activity_reports')
      .select('*, activity_types(name, base_points)')
      .eq('status', 'pending')
    if (data) setReports(data)
  }

  useEffect(() => { fetchReports() }, [])

  // 2. 승인 버튼 기능
  const handleApprove = async (id: number) => {
    const { error } = await supabase
      .from('activity_reports')
      .update({ status: 'approved' })
      .eq('id', id)
    
    if (!error) {
      alert('승인되었습니다!')
      fetchReports() // 목록 새로고침
    }
  }

  return (
    <main className="p-10 bg-gray-100 min-h-screen text-black">
      <h1 className="text-3xl font-black mb-8 text-red-600">Admin | 포인트 승인 관리</h1>
      
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-white font-bold">
            <tr>
              <th className="p-4">활동가</th>
              <th className="p-4">활동 내용</th>
              <th className="p-4 text-center">승인 처리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reports.length > 0 ? (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-red-50">
                  <td className="p-4 font-bold">{report.user_name}</td>
                  <td className="p-4">{report.activity_types?.name}</td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => handleApprove(report.id)}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-600 transition"
                    >
                      승인 완료
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={3} className="p-10 text-center text-gray-400">대기 중인 신청이 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}