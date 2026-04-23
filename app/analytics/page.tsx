export const dynamic = 'force-dynamic'
'use client'

import { useEffect, useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { MARKETS, PROGRAM_ID } from '@/lib/constants'
import { PublicKey } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface MarketMetrics {
  marketId: string
  name: string
  category: string
  price: number
  totalOILong: number
  totalOIShort: number
  totalOI: number
  isActive: boolean
}

export default function AnalyticsPage() {
  const { connection } = useConnection()
  const [metrics, setMetrics] = useState<MarketMetrics[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  useEffect(() => {
    loadMetrics()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const marketMetrics: MarketMetrics[] = []

      for (const market of MARKETS) {
        const marketPda = new PublicKey(market.marketPda)
        
        try {
          const accountInfo = await connection.getAccountInfo(marketPda)
          
          if (accountInfo) {
            const data = accountInfo.data
            
            // Parse Market account
            // Skip 8 bytes discriminator
            // authority: 32 bytes (skip)
            // mark_price_cents: 8 bytes
            // index_price_cents: 8 bytes (skip)
            // total_oi_long: 8 bytes
            // total_oi_short: 8 bytes
            // is_active: 1 byte
            
            const priceCents = new anchor.BN(data.slice(40, 48), 'le').toNumber()
            const totalOILong = new anchor.BN(data.slice(56, 64), 'le').toNumber()
            const totalOIShort = new anchor.BN(data.slice(64, 72), 'le').toNumber()
            const isActive = data[72] === 1

            marketMetrics.push({
              marketId: market.id,
              name: market.name,
              category: market.category,
              price: priceCents / 100,
              totalOILong,
              totalOIShort,
              totalOI: totalOILong + totalOIShort,
              isActive,
            })
          }
        } catch (error) {
          console.error(`Error loading market ${market.name}:`, error)
        }
      }

      setMetrics(marketMetrics)
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals
  const totalOI = metrics.reduce((sum, m) => sum + m.totalOI, 0)
  const totalOILong = metrics.reduce((sum, m) => sum + m.totalOILong, 0)
  const totalOIShort = metrics.reduce((sum, m) => sum + m.totalOIShort, 0)
  const totalTVL = metrics.reduce((sum, m) => sum + (m.totalOI * m.price), 0)
  const activeMarkets = metrics.filter(m => m.isActive).length

  // Volume by category
  const categoryData = metrics.reduce((acc, m) => {
    if (!acc[m.category]) {
      acc[m.category] = { oi: 0, tvl: 0, count: 0 }
    }
    acc[m.category].oi += m.totalOI
    acc[m.category].tvl += m.totalOI * m.price
    acc[m.category].count += 1
    return acc
  }, {} as Record<string, { oi: number; tvl: number; count: number }>)

  // Top markets by OI
  const topMarkets = [...metrics]
    .sort((a, b) => b.totalOI - a.totalOI)
    .slice(0, 5)

  // Charts data
  const volumeByMarketData = {
    labels: topMarkets.map(m => m.name),
    datasets: [
      {
        label: 'Open Interest (units)',
        data: topMarkets.map(m => m.totalOI),
        backgroundColor: 'rgba(168, 85, 247, 0.6)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1,
      },
    ],
  }

  const longShortData = {
    labels: ['Long Positions', 'Short Positions'],
    datasets: [
      {
        data: [totalOILong, totalOIShort],
        backgroundColor: ['rgba(16, 185, 129, 0.6)', 'rgba(239, 68, 68, 0.6)'],
        borderColor: ['rgba(16, 185, 129, 1)', 'rgba(239, 68, 68, 1)'],
        borderWidth: 1,
      },
    ],
  }

  const categoryDistributionData = {
    labels: Object.keys(categoryData).map(cat => cat.toUpperCase()),
    datasets: [
      {
        data: Object.values(categoryData).map(d => d.tvl),
        backgroundColor: [
          'rgba(168, 85, 247, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(245, 158, 11, 0.6)',
          'rgba(239, 68, 68, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#fff',
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      y: {
        ticks: { color: '#9ca3af' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#fff',
        },
      },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-white hover:text-purple-300 transition">
                ← SpecMarket
              </Link>
              <span className="text-2xl font-bold text-white">Analytics</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/positions" className="text-white hover:text-purple-300 transition hidden md:block">
                Positions
              </Link>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Protocol Analytics</h1>
            <p className="text-gray-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
          <button
            onClick={loadMetrics}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? '⏳ Updating...' : '🔄 Refresh'}
          </button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total TVL</span>
              <span className="text-2xl">💰</span>
            </div>
            <div className="text-3xl font-bold text-white">
              ${totalTVL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className="text-sm text-gray-400 mt-1">Total Value Locked</div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Total OI</span>
              <span className="text-2xl">📊</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {totalOI.toLocaleString()}
            </div>
            <div className="text-sm text-gray-400 mt-1">Total units</div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Active Markets</span>
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {activeMarkets} / {metrics.length}
            </div>
            <div className="text-sm text-gray-400 mt-1">Markets available</div>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Long/Short Ratio</span>
              <span className="text-2xl">⚖️</span>
            </div>
            <div className="text-3xl font-bold text-white">
              {totalOIShort > 0 ? (totalOILong / totalOIShort).toFixed(2) : '∞'}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {totalOILong} L / {totalOIShort} S
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Markets by OI */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Top Markets by Open Interest</h3>
            <div className="h-[300px]">
              <Bar data={volumeByMarketData} options={chartOptions} />
            </div>
          </div>

          {/* Long vs Short */}
          <div className="bg-white/10 backdrop-blur rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Long vs Short Positions</h3>
            <div className="h-[300px]">
              <Doughnut data={longShortData} options={doughnutOptions} />
            </div>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-white mb-4">TVL by Category</h3>
          <div className="h-[300px]">
            <Doughnut data={categoryDistributionData} options={doughnutOptions} />
          </div>
        </div>

        {/* Markets Table */}
        <div className="bg-white/10 backdrop-blur rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">All Markets</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 font-semibold py-3 px-4">Market</th>
                  <th className="text-left text-gray-400 font-semibold py-3 px-4">Category</th>
                  <th className="text-right text-gray-400 font-semibold py-3 px-4">Price</th>
                  <th className="text-right text-gray-400 font-semibold py-3 px-4">OI Long</th>
                  <th className="text-right text-gray-400 font-semibold py-3 px-4">OI Short</th>
                  <th className="text-right text-gray-400 font-semibold py-3 px-4">Total OI</th>
                  <th className="text-right text-gray-400 font-semibold py-3 px-4">TVL</th>
                  <th className="text-center text-gray-400 font-semibold py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((market) => (
                  <tr key={market.marketId} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-3 px-4">
                      <Link href={`/trade/${market.marketId}`} className="text-white font-semibold hover:text-purple-300">
                        {market.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-400 capitalize">{market.category}</span>
                    </td>
                    <td className="text-right py-3 px-4 text-white font-semibold">
                      ${market.price.toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4 text-green-400">
                      {market.totalOILong}
                    </td>
                    <td className="text-right py-3 px-4 text-red-400">
                      {market.totalOIShort}
                    </td>
                    <td className="text-right py-3 px-4 text-white font-semibold">
                      {market.totalOI}
                    </td>
                    <td className="text-right py-3 px-4 text-white font-semibold">
                      ${(market.totalOI * market.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        market.isActive 
                          ? 'bg-green-600/30 text-green-200' 
                          : 'bg-gray-600/30 text-gray-400'
                      }`}>
                        {market.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
