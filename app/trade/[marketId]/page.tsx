export const dynamic = 'force-dynamic'
'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { MARKETS } from '@/lib/constants'
import { PublicKey } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'

// Import dinámico para evitar SSR issues
const TradingPageContent = dynamic(() => import('./TradingPageContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 flex items-center justify-center">
      <div className="text-white text-xl">Loading...</div>
    </div>
  )
})

export default function TradingPage() {
  return <TradingPageContent />
}
