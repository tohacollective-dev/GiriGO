'use client'
import { Construction } from 'lucide-react'

export default function ComingSoonPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center p-8">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
        <Construction size={32} className="text-gray-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-800">Coming Soon</h2>
        <p className="text-sm text-gray-400 mt-1">Halaman ini sedang dalam pengembangan.</p>
      </div>
    </div>
  )
}
