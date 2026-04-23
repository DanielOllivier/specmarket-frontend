export const dynamic = 'force-dynamic'
'use client'

import dynamic from 'next/dynamic'

const PositionsPageContent = dynamic(() => import('./PositionsPageContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  )
})

export default function PositionsPage() {
  return <PositionsPageContent />
}
