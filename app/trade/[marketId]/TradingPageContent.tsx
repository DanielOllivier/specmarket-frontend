'use client'

import { useEffect, useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { PriceChart } from '@/components/PriceChart'
import { MARKETS } from '@/lib/constants'
import { PublicKey } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { openPosition, getUserPosition } from '@/lib/trading'

export default function TradingPageContent() {
  const params = useParams()
  const marketId = params?.marketId as string
  
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()

  const [market, setMarket] = useState<any>(null)
  const [size, setSize] = useState('')
  const [leverage, setLeverage] = useState(5)
  const [isLong, setIsLong] = useState(true)
  const [loading, setLoading] = useState(false)
  const [markPrice, setMarkPrice] = useState(0)
  const [existingPosition, setExistingPosition] = useState<any>(null)

  useEffect(() => {
    if (!marketId) return
    
    const foundMarket = MARKETS.find(m => m.id === marketId)
    if (foundMarket) {
      setMarket(foundMarket)
      setMarkPrice(foundMarket.currentPrice)
      fetchOnChainData(foundMarket)
    }
  }, [marketId, publicKey])

  const fetchOnChainData = async (marketData: any) => {
    try {
      const marketPda = new PublicKey(marketData.marketPda)
      
      const accountInfo = await connection.getAccountInfo(marketPda)
      if (accountInfo) {
        const data = accountInfo.data
        const priceCents = new anchor.BN(data.slice(40, 48), 'le').toNumber()
        setMarkPrice(priceCents / 100)
      }

      if (publicKey) {
        const position = await getUserPosition(connection, publicKey, marketPda)
        setExistingPosition(position)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const calculateMargin = () => {
    if (!size || !markPrice) return 0
    const sizeNum = parseFloat(size)
    const notional = sizeNum * markPrice
    return notional / leverage
  }

  const handleOpenPosition = async () => {
    if (!publicKey || !market || !signTransaction) {
      alert('Please connect wallet')
      return
    }

    if (!size || parseFloat(size) < 10) {
      alert('Minimum size is 10 units')
      return
    }

    if (existingPosition) {
      alert('You already have a position in this market. Close it first.')
      return
    }

    setLoading(true)
    try {
      const marketPda = new PublicKey(market.marketPda)
      const sizeUnits = parseFloat(size)

      const signature = await openPosition(
        connection,
        { publicKey, signTransaction },
        marketPda,
        sizeUnits,
        isLong,
        leverage
      )

      console.log('Position opened:', signature)
      alert(`Position opened!\nView on Explorer: https://explorer.solana.com/tx/${signature}?cluster=devnet`)

      await fetchOnChainData(market)
      setSize('')
      
      } catch (error: any) {
        console.error('Error:', error)
  
        // Ignorar error si la TX ya fue procesada
        if (error.message?.includes('already been processed')) {
          alert('Position opened successfully!')
          await fetchOnChainData(market)
          setSize('')
        } else {
          alert(`Error: ${error.message || 'Failed to open position'}`)
        }
      } finally {
        setLoading(false)
      }

  }

  if (!market) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading market...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xl font-bold text-white hover:text-purple-300 transition">
                ← SpecMarket
              </Link>
              <div className="hidden md:flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{market.name}</span>
                <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded text-xs">
                  {market.category}
                </span>
                <span className="px-2 py-1 bg-green-600/30 text-green-200 rounded text-xs">
                  ⛓️ On-Chain
                </span>
              </div>
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

      <main className="container mx-auto px-4 py-6">
        {existingPosition && (
          <div className="bg-yellow-600/20 border border-yellow-600/50 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl">⚠️</span>
              <div>
                <div className="text-yellow-200 font-bold">Active Position</div>
                <div className="text-yellow-200/80 text-sm">
                  {existingPosition.isLong ? 'LONG' : 'SHORT'} {existingPosition.sizeUnits} units @ 
                  ${existingPosition.entryPrice} ({existingPosition.leverage}x leverage)
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 mb-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-gray-400 text-sm mb-1">Mark Price</div>
                  <div className="text-3xl font-bold text-white">
                    ${markPrice.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">24h Change</div>
                  <div className="text-2xl font-bold text-green-400">
                    +{(Math.random() * 5).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">24h Volume</div>
                  <div className="text-2xl font-bold text-white">
                    ${(Math.random() * 50 + 10).toFixed(0)}K
                  </div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm mb-1">Open Interest</div>
                  <div className="text-2xl font-bold text-white">
                    ${(Math.random() * 100 + 50).toFixed(0)}K
                  </div>
                </div>
              </div>
            </div>

            <PriceChart marketName={market.name} currentPrice={markPrice} />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6 sticky top-6">
              <h2 className="text-2xl font-bold text-white mb-6">Open Position</h2>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setIsLong(true)}
                  disabled={!!existingPosition}
                  className={`py-3 rounded-lg font-bold transition ${
                    isLong
                      ? 'bg-green-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  } disabled:opacity-50`}
                >
                  Long
                </button>
                <button
                  onClick={() => setIsLong(false)}
                  disabled={!!existingPosition}
                  className={`py-3 rounded-lg font-bold transition ${
                    !isLong
                      ? 'bg-red-600 text-white'
                      : 'bg-white/10 text-gray-400 hover:bg-white/20'
                  } disabled:opacity-50`}
                >
                  Short
                </button>
              </div>

              <div className="mb-6">
                <label className="block text-white text-sm font-semibold mb-2">
                  Size (units)
                </label>
                <input
                  type="number"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="0.00"
                  disabled={!!existingPosition}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 disabled:opacity-50"
                />
                <div className="mt-2 text-sm text-gray-400">
                  Minimum: 10 units
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <label className="text-white text-sm font-semibold">
                    Leverage
                  </label>
                  <span className="text-purple-400 font-bold">{leverage}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={leverage}
                  onChange={(e) => setLeverage(parseInt(e.target.value))}
                  disabled={!!existingPosition}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1x</span>
                  <span>5x</span>
                  <span>10x</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Entry Price</span>
                  <span className="text-white font-semibold">
                    ${markPrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Notional Value</span>
                  <span className="text-white font-semibold">
                    ${size ? (parseFloat(size) * markPrice).toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Required Margin</span>
                  <span className="text-white font-bold">
                    ${calculateMargin().toFixed(2)} USDC
                  </span>
                </div>
              </div>

              {publicKey ? (
                <button
                  onClick={handleOpenPosition}
                  disabled={loading || !size || parseFloat(size) < 10 || !!existingPosition}
                  className={`w-full py-4 rounded-lg font-bold text-lg transition ${
                    isLong
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? 'Opening Position...' : 
                   existingPosition ? 'Position Already Open' :
                   `Open ${isLong ? 'Long' : 'Short'} Position`}
                </button>
              ) : (
                <div className="text-center">
                  <div className="text-gray-400 mb-3">Connect wallet to trade</div>
                  <WalletButton />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
