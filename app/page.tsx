'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { MARKETS } from '@/lib/constants'

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [])

  const categories = ['all', ...Array.from(new Set(MARKETS.map(m => m.category)))]

  const filteredMarkets = selectedCategory === 'all'
    ? MARKETS
    : MARKETS.filter(m => m.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                SpecMarket
              </h1>
              <span className="hidden md:block text-gray-400 text-sm">
                On-Chain Collectibles Futures
              </span>
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

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden text-white text-2xl"
            >
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden mt-4 pb-4 space-y-3">
              <Link
                href="/analytics"
                className="block text-white hover:text-purple-300 transition py-2"
                onClick={() => setMenuOpen(false)}
              >
                Analytics
              </Link>
              <Link
                href="/positions"
                className="block text-white hover:text-purple-300 transition py-2"
                onClick={() => setMenuOpen(false)}
              >
                My Positions
              </Link>
              <WalletButton />
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Trade Collectibles Futures
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Long or short your favorite collectibles with up to 10x leverage
          </p>
        </div>

        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {cat === 'all' ? 'All Markets' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMarkets.map((market) => (
            <Link
              key={market.id}
              href={`/trade/${market.id}`}
              className="bg-white/10 backdrop-blur rounded-lg p-6 hover:bg-white/15 transition border border-white/10 hover:border-purple-500/50"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">{market.name}</h3>
                  <p className="text-sm text-gray-400">{market.displayName}</p>
                </div>
                <span className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-xs">
                  {market.category}
                </span>
              </div>

              <div className="mb-4">
                <div className="text-sm text-gray-400 mb-1">Mark Price</div>
                <div className="text-3xl font-bold text-white">
                  ${market.currentPrice.toLocaleString()}
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <div>
                  <div className="text-gray-400">24h Change</div>
                  <div className="text-green-400 font-semibold">
                    +{(Math.random() * 5).toFixed(2)}%
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400">Volume</div>
                  <div className="text-white font-semibold">
                    ${(Math.random() * 50 + 10).toFixed(0)}K
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/10">
                <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition">
                  Trade Now →
                </button>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <footer className="border-t border-white/10 bg-black/20 backdrop-blur mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p>SpecMarket - On-Chain Collectibles Futures Platform</p>
          <p className="text-sm mt-2">Powered by Solana</p>
        </div>
      </footer>
    </div>
  )
}
