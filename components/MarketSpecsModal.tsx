'use client'

interface MarketSpecsModalProps {
  market: {
    name: string
    displayName: string
    category: string
    currentPrice: number
    marketPda: string
    seed: string
  }
  onClose: () => void
}

export function MarketSpecsModal({ market, onClose }: MarketSpecsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-purple-900 to-blue-900 rounded-lg p-6 max-w-2xl w-full border border-white/20 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Contract Specifications</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Market Info */}
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <h3 className="text-xl font-bold text-white mb-2">{market.displayName}</h3>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm">
              {market.name}
            </span>
            <span className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full text-sm">
              {market.category}
            </span>
          </div>
        </div>

        {/* Contract Details */}
        <div className="space-y-4">
          {/* Trading Specifications */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              📊 Trading Specifications
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Contract Type</span>
                <span className="text-white font-semibold">Perpetual Futures</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Underlying Asset</span>
                <span className="text-white font-semibold">{market.displayName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Mark Price</span>
                <span className="text-white font-semibold">${market.currentPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Minimum Size</span>
                <span className="text-white font-semibold">10 units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Available Leverage</span>
                <span className="text-white font-semibold">1x - 10x</span>
              </div>
            </div>
          </div>

          {/* Settlement & Collateral */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              💰 Settlement & Collateral
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Settlement Type</span>
                <span className="text-white font-semibold">Cash Settled</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Collateral Currency</span>
                <span className="text-white font-semibold">USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Initial Margin</span>
                <span className="text-white font-semibold">1/Leverage (e.g., 10% at 10x)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Liquidation</span>
                <span className="text-white font-semibold">When margin exhausted</span>
              </div>
            </div>
          </div>

          {/* Order Types */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              📝 Order Types
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Market Orders</span>
                <span className="text-green-400 font-semibold">✓ Supported</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Take Profit</span>
                <span className="text-green-400 font-semibold">✓ Supported</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Stop Loss</span>
                <span className="text-green-400 font-semibold">✓ Supported</span>
              </div>
            </div>
          </div>

          {/* Smart Contract Info */}
          <div className="bg-white/5 rounded-lg p-4">
            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              ⛓️ On-Chain Information
            </h4>
            <div className="space-y-3">
              <div>
                <div className="text-gray-400 text-sm mb-1">Market PDA</div>
                <div className="text-white font-mono text-xs bg-black/30 p-2 rounded break-all">
                  {market.marketPda}
                </div>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">Market Seed</div>
                <div className="text-white font-mono text-xs bg-black/30 p-2 rounded">
                  {market.seed}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Network</span>
                <span className="text-white font-semibold">Solana Devnet</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Program ID</span>
                <a 
                  href="https://explorer.solana.com/address/9JsjBXM4HetB33ojaGMEwqJMqJY2DkFG6oHctCfASU3X?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 font-mono text-xs"
                >
                  9Jsj...SU3X ↗
                </a>
              </div>
            </div>
          </div>

          {/* Risk Disclaimer */}
          <div className="bg-red-900/20 border border-red-600/50 rounded-lg p-4">
            <h4 className="text-lg font-bold text-red-200 mb-2 flex items-center gap-2">
              ⚠️ Risk Disclosure
            </h4>
            <p className="text-red-200/80 text-sm leading-relaxed">
              Trading with leverage involves significant risk of loss. You can lose more than your initial investment. 
              This is a testnet deployment - do not use real funds. Not financial advice.
            </p>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
