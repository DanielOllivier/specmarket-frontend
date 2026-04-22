'use client'

import { useEffect, useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { LimitOrdersModal } from '@/components/LimitOrdersModal'
import { MARKETS, PROGRAM_ID } from '@/lib/constants'
import { PublicKey } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { getUserPosition, closePosition } from '@/lib/trading'

interface Position {
  marketId: string
  marketName: string
  pda: PublicKey
  sizeUnits: number
  isLong: boolean
  leverage: number
  entryPrice: number
  currentPrice: number
  pnl: number
  pnlPercent: number
  takeProfitPrice: number | null
  stopLossPrice: number | null
}

export default function PositionsPageContent() {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [closingPosition, setClosingPosition] = useState<string | null>(null)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  useEffect(() => {
    if (publicKey) {
      loadPositions()
    } else {
      setPositions([])
    }
  }, [publicKey])

  const loadPositions = async () => {
    if (!publicKey) return

    setLoading(true)
    try {
      const allPositions: Position[] = []

      for (const market of MARKETS) {
        const marketPda = new PublicKey(market.marketPda)
        
        const position = await getUserPosition(connection, publicKey, marketPda)
        
        if (position) {
          const marketAccount = await connection.getAccountInfo(marketPda)
          let currentPrice = market.currentPrice
          
          if (marketAccount) {
            const data = marketAccount.data
            const priceCents = new anchor.BN(data.slice(40, 48), 'le').toNumber()
            currentPrice = priceCents / 100
          }

          const priceDiff = position.isLong 
            ? (currentPrice - position.entryPrice)
            : (position.entryPrice - currentPrice)
          
          const pnl = priceDiff * position.sizeUnits * position.leverage
          const pnlPercent = (priceDiff / position.entryPrice) * 100 * position.leverage

          allPositions.push({
            marketId: market.id,
            marketName: market.name,
            pda: position.pda,
            sizeUnits: position.sizeUnits,
            isLong: position.isLong,
            leverage: position.leverage,
            entryPrice: position.entryPrice,
            currentPrice,
            pnl,
            pnlPercent,
            takeProfitPrice: position.takeProfitPrice,
            stopLossPrice: position.stopLossPrice,
          })
        }
      }

      setPositions(allPositions)
    } catch (error) {
      console.error('Error loading positions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleClosePosition = async (marketId: string) => {
    if (!publicKey || !signTransaction) return

    const market = MARKETS.find(m => m.id === marketId)
    if (!market) return

    setClosingPosition(marketId)
    try {
      const marketPda = new PublicKey(market.marketPda)
      
      const signature = await closePosition(
        connection,
        { publicKey, signTransaction },
        marketPda
      )

      alert(`Position closed!\nTX: https://explorer.solana.com/tx/${signature}?cluster=devnet`)
      
      await loadPositions()
      
    } catch (error: any) {
      console.error('Error closing position:', error)
      
      if (error.message?.includes('already been processed')) {
        alert('Position closed successfully!')
        await loadPositions()
      } else {
        alert(`Error: ${error.message || 'Failed to close position'}`)
      }
    } finally {
      setClosingPosition(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-white hover:text-purple-300 transition">
              ← SpecMarket
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">My Positions</h1>
          <p className="text-gray-400">Manage your open positions across all markets</p>
        </div>

        {!publicKey ? (
          <div className="bg-white/10 backdrop-blur rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
            <p className="text-gray-400 mb-6">Connect your wallet to view your positions</p>
            <WalletButton />
          </div>
        ) : loading ? (
          <div className="bg-white/10 backdrop-blur rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <div className="text-white text-xl">Loading positions...</div>
          </div>
        ) : positions.length === 0 ? (
          <div className="bg-white/10 backdrop-blur rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-white mb-4">No Open Positions</h2>
            <p className="text-gray-400 mb-6">You don't have any open positions yet</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:opacity-90 transition"
            >
              Browse Markets
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {positions.map((position) => (
              <div
                key={position.marketId}
                className="bg-white/10 backdrop-blur rounded-lg p-6 hover:bg-white/15 transition"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-white">{position.marketName}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        position.isLong 
                          ? 'bg-green-600/30 text-green-200' 
                          : 'bg-red-600/30 text-red-200'
                      }`}>
                        {position.isLong ? 'LONG' : 'SHORT'} {position.leverage}x
                      </span>
                      {(position.takeProfitPrice || position.stopLossPrice) && (
                        <span className="px-2 py-1 bg-blue-600/30 text-blue-200 rounded text-xs">
                          TP/SL Set
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-gray-400 text-sm mb-1">Size</div>
                        <div className="text-white font-semibold">{position.sizeUnits} units</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-1">Entry Price</div>
                        <div className="text-white font-semibold">${position.entryPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-1">Current Price</div>
                        <div className="text-white font-semibold">${position.currentPrice.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm mb-1">PnL</div>
                        <div className={`font-bold text-lg ${
                          position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)}
                          <span className="text-sm ml-2">
                            ({position.pnl >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => setSelectedPosition(position)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-sm"
                    >
                      Set TP/SL
                    </button>
                    <Link
                      href={`/trade/${position.marketId}`}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition text-sm"
                    >
                      View Market
                    </Link>
                    <button
                      onClick={() => handleClosePosition(position.marketId)}
                      disabled={closingPosition === position.marketId}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50 text-sm"
                    >
                      {closingPosition === position.marketId ? 'Closing...' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {positions.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Total Positions</div>
              <div className="text-3xl font-bold text-white">{positions.length}</div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Total PnL</div>
              <div className={`text-3xl font-bold ${
                positions.reduce((sum, p) => sum + p.pnl, 0) >= 0 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {positions.reduce((sum, p) => sum + p.pnl, 0) >= 0 ? '+' : ''}
                ${positions.reduce((sum, p) => sum + p.pnl, 0).toFixed(2)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-6">
              <div className="text-gray-400 text-sm mb-2">Win Rate</div>
              <div className="text-3xl font-bold text-white">
                {((positions.filter(p => p.pnl > 0).length / positions.length) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedPosition && (
        <LimitOrdersModal
          marketPda={MARKETS.find(m => m.id === selectedPosition.marketId)!.marketPda}
          marketName={selectedPosition.marketName}
          currentPrice={selectedPosition.currentPrice}
          entryPrice={selectedPosition.entryPrice}
          isLong={selectedPosition.isLong}
          existingTP={selectedPosition.takeProfitPrice}
          existingSL={selectedPosition.stopLossPrice}
          onClose={() => setSelectedPosition(null)}
          onSuccess={() => loadPositions()}
        />
      )}
    </div>
  )
}
