'use client'

import { useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import { setLimitOrders } from '@/lib/trading'

interface LimitOrdersModalProps {
  marketPda: string
  marketName: string
  currentPrice: number
  entryPrice: number
  isLong: boolean
  existingTP: number | null
  existingSL: number | null
  onClose: () => void
  onSuccess: () => void
}

export function LimitOrdersModal({
  marketPda,
  marketName,
  currentPrice,
  entryPrice,
  isLong,
  existingTP,
  existingSL,
  onClose,
  onSuccess
}: LimitOrdersModalProps) {
  const { connection } = useConnection()
  const { publicKey, signTransaction } = useWallet()
  
  const [takeProfit, setTakeProfit] = useState(existingTP?.toString() || '')
  const [stopLoss, setStopLoss] = useState(existingSL?.toString() || '')
  const [loading, setLoading] = useState(false)

  const calculatePnL = (exitPrice: number) => {
    const priceDiff = isLong ? (exitPrice - entryPrice) : (entryPrice - exitPrice)
    return ((priceDiff / entryPrice) * 100).toFixed(2)
  }

  const validateOrders = () => {
    const tp = parseFloat(takeProfit)
    const sl = parseFloat(stopLoss)

    if (takeProfit && tp > 0) {
      if (isLong && tp <= entryPrice) {
        return 'Take Profit must be above entry price for LONG positions'
      }
      if (!isLong && tp >= entryPrice) {
        return 'Take Profit must be below entry price for SHORT positions'
      }
    }

    if (stopLoss && sl > 0) {
      if (isLong && sl >= entryPrice) {
        return 'Stop Loss must be below entry price for LONG positions'
      }
      if (!isLong && sl <= entryPrice) {
        return 'Stop Loss must be above entry price for SHORT positions'
      }
    }

    return null
  }

  const handleSubmit = async () => {
    if (!publicKey || !signTransaction) {
      alert('Please connect wallet')
      return
    }

    const error = validateOrders()
    if (error) {
      alert(error)
      return
    }

    setLoading(true)
    try {
      const marketPdaPubkey = new PublicKey(marketPda)
      const tp = takeProfit ? parseFloat(takeProfit) : 0
      const sl = stopLoss ? parseFloat(stopLoss) : 0

      const signature = await setLimitOrders(
        connection,
        { publicKey, signTransaction },
        marketPdaPubkey,
        tp,
        sl
      )

      console.log('Limit orders set:', signature)
      alert(`Limit orders set successfully!\nTX: ${signature}`)
      onSuccess()
      onClose()
      
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message || 'Failed to set limit orders'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    setTakeProfit('')
    setStopLoss('')
    
    if (!publicKey || !signTransaction) return

    setLoading(true)
    try {
      const marketPdaPubkey = new PublicKey(marketPda)
      
      const signature = await setLimitOrders(
        connection,
        { publicKey, signTransaction },
        marketPdaPubkey,
        0,
        0
      )

      alert(`Limit orders cleared!\nTX: ${signature}`)
      onSuccess()
      onClose()
      
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg p-6 max-w-md w-full border border-white/20">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Set Limit Orders</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Market Info */}
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 mb-2">{marketName}</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Position</div>
              <div className={`font-bold ${isLong ? 'text-green-400' : 'text-red-400'}`}>
                {isLong ? 'LONG' : 'SHORT'}
              </div>
            </div>
            <div>
              <div className="text-gray-400">Entry Price</div>
              <div className="text-white font-semibold">${entryPrice.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400">Current Price</div>
              <div className="text-white font-semibold">${currentPrice.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-400">Current PnL</div>
              <div className={`font-bold ${
                parseFloat(calculatePnL(currentPrice)) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {calculatePnL(currentPrice)}%
              </div>
            </div>
          </div>
        </div>

        {/* Take Profit */}
        <div className="mb-4">
          <label className="block text-white text-sm font-semibold mb-2">
            Take Profit Price (optional)
          </label>
          <input
            type="number"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            placeholder={isLong ? `> ${entryPrice}` : `< ${entryPrice}`}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-green-500"
          />
          {takeProfit && parseFloat(takeProfit) > 0 && (
            <div className="mt-2 text-sm text-green-400">
              📈 Exit at ${parseFloat(takeProfit).toLocaleString()} 
              ({calculatePnL(parseFloat(takeProfit))}% profit)
            </div>
          )}
        </div>

        {/* Stop Loss */}
        <div className="mb-6">
          <label className="block text-white text-sm font-semibold mb-2">
            Stop Loss Price (optional)
          </label>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            placeholder={isLong ? `< ${entryPrice}` : `> ${entryPrice}`}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
          />
          {stopLoss && parseFloat(stopLoss) > 0 && (
            <div className="mt-2 text-sm text-red-400">
              📉 Exit at ${parseFloat(stopLoss).toLocaleString()} 
              ({calculatePnL(parseFloat(stopLoss))}% loss)
            </div>
          )}
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <div className="text-sm text-gray-400 mb-2">Quick Presets</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const tp = isLong ? entryPrice * 1.5 : entryPrice * 0.5
                setTakeProfit(tp.toString())
              }}
              className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-200 rounded text-sm transition"
            >
              TP: +50%
            </button>
            <button
              onClick={() => {
                const tp = isLong ? entryPrice * 2 : entryPrice * 0
                setTakeProfit(tp.toString())
              }}
              className="px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-200 rounded text-sm transition"
            >
              TP: +100%
            </button>
            <button
              onClick={() => {
                const sl = isLong ? entryPrice * 0.9 : entryPrice * 1.1
                setStopLoss(sl.toString())
              }}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-200 rounded text-sm transition"
            >
              SL: -10%
            </button>
            <button
              onClick={() => {
                const sl = isLong ? entryPrice * 0.75 : entryPrice * 1.25
                setStopLoss(sl.toString())
              }}
              className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-200 rounded text-sm transition"
            >
              SL: -25%
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleClear}
            disabled={loading || (!existingTP && !existingSL)}
            className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            Clear All
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || (!takeProfit && !stopLoss)}
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Setting...' : 'Set Orders'}
          </button>
        </div>
      </div>
    </div>
  )
}
