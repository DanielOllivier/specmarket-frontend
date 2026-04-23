export const dynamic = 'force-dynamic'
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { MARKETS } from '@/lib/constants'

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const categories = ['all', ...new Set(MARKETS.map(m => m.category))]
  
  const filteredMarkets = selectedCategory === 'all' 
    ? MARKETS 
    : MARKETS.filter(m => m.category === selectedCategory)

  // Solo generar cambios en client-side después de mount
  const get24hChange = () => {
    if (!mounted) return '0.00'
    return (Math.random() * 10 - 5).toFixed(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-4 md:py-6">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-2xl md:text-3xl font-bold text-white">
            SpecMarket
          </Link>

          <div className="hidden md:flex gap-4 items-center">
            <Link href="/positions" className="text-white hover:text-purple-300 transition">
              My Positions
            </Link>
            <WalletButton />
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-white p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div className="hidden md:flex gap-4 items-center">
          <Link href="/analytics" className="text-white hover:text-purple-300 transition">
            Analytics
          </Link>
          <Link href="/positions" className="text-white hover:text-purple-300 transition">
            My Positions
          </Link>
          <WalletButton />
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/10">
            <nav className="flex flex-col gap-3 mt-4">
              <Link 
                href="/positions" 
                className="text-white hover:text-purple-300 transition py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Positions
              </Link>
              <div className="pt-2">
                <WalletButton />
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="container mx-auto px-4 py-6 md:py-12">
        {/* Hero */}
        <div className="text-center mb-8 md:mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-3 md:mb-4 leading-tight">
            Trade Collectibles{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
              On-Chain
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-6 md:mb-8 px-4">
            Perpetual futures for Rolex, Nike, Pokémon, and more
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
            <Link
              href={`/trade/${MARKETS[0].id}`}
              className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold text-base md:text-lg hover:opacity-90 transition text-center"
            >
              Start Trading
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 md:mb-12">
          {[
            { label: 'Total Markets', value: MARKETS.length },
            { label: '24h Volume', value: '$125K' },
            { label: 'Total OI', value: '$450K' },
            { label: 'Active Traders', value: '1.2K' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 backdrop-blur rounded-lg p-4 md:p-6 text-center">
              <div className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{stat.label}</div>
              <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Markets */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white">Available Markets</h2>
            
            <div className="w-full sm:w-auto overflow-x-auto">
              <div className="flex gap-2 pb-2 sm:pb-0 min-w-max sm:min-w-0">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 md:px-4 py-2 rounded-lg font-semibold transition capitalize whitespace-nowrap text-sm md:text-base ${
                      selectedCategory === category
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/10 text-gray-300 hover:bg-white/20'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredMarkets.map((market) => {
              const change = parseFloat(get24hChange())
              return (
                <Link
                  key={market.id}
                  href={`/trade/${market.id}`}
                  className="bg-white/10 backdrop-blur rounded-lg p-5 md:p-6 hover:bg-white/20 transition group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-bold text-white group-hover:text-purple-300 transition truncate">
                        {market.name}
                      </h3>
                      <p className="text-gray-400 text-sm truncate">{market.displayName}</p>
                    </div>
                    <div className="flex gap-2 ml-2 flex-shrink-0">
                      <span className="px-2 md:px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-xs capitalize">
                        {market.category}
                      </span>
                      <span className="px-2 md:px-3 py-1 bg-green-600/30 text-green-200 rounded-full text-xs">
                        ⛓️
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <div className="text-gray-400 text-xs mb-1">Mark Price</div>
                      <div className="text-white text-xl md:text-2xl font-bold">
                        ${market.currentPrice.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs mb-1">24h Change</div>
                      <div className={`text-lg md:text-xl font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {mounted ? `${change >= 0 ? '+' : ''}${change}%` : '...'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Source</span>
                      <span className="text-white capitalize">{market.priceSource}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-12 md:mt-16">
          {[
            { icon: '⚡', title: 'Up to 10x Leverage', desc: 'Amplify positions with flexible leverage' },
            { icon: '🔒', title: 'On-Chain Settlement', desc: 'All positions on Solana blockchain' },
            { icon: '📊', title: 'Multiple Markets', desc: 'Trade Rolex, Nike, Pokémon, and more' }
          ].map((feature, i) => (
            <div key={i} className="text-center p-4">
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">{feature.icon}</div>
              <h3 className="text-lg md:text-xl font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm md:text-base">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="container mx-auto px-4 py-6 md:py-8 mt-12 md:mt-16 border-t border-white/10">
        <div className="text-center text-gray-400">
          <p className="text-sm md:text-base">SpecMarket - Multi-Asset Perpetuals DEX</p>
          <p className="text-xs md:text-sm mt-2">10 Markets On-Chain • Solana Devnet</p>
        </div>
      </footer>
    </div>
  )
}
