export const dynamic = 'force-dynamic'
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { WalletButton } from '@/components/WalletButton'
import { PublicKey, Connection } from '@solana/web3.js'

interface Market {
  id: string
  name: string
  displayName: string
  marketPda: string
  currentPrice: number
  priceSource: string
  category: string
  enabled: boolean
  createdAt: number
}

interface DiscoverableMarket {
  seed: string
  name: string
  displayName: string
  category: string
  description: string
  marketPda: string
  isInitialized: boolean
  currentPrice?: number
}

const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!)
const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

// Mercados predefinidos conocidos
const DISCOVERABLE_MARKETS: DiscoverableMarket[] = [
  {
    seed: 'pok_bb_modern_market',
    name: 'POK-BB-MODERN',
    displayName: 'Pokémon Modern Booster Box',
    category: 'pokemon',
    description: 'Latest Pokémon booster box release',
    marketPda: 'CA9LFZPdowzA6d3sMwTZo8s8cCLB3etj17MPsMkf6GbL',
    isInitialized: true,
    currentPrice: 269.22
  },
  {
    seed: 'pok_bb_twilight_market',
    name: 'POK-BB-TWILIGHT',
    displayName: 'Pokémon Twilight Masquerade',
    category: 'pokemon',
    description: 'Twilight Masquerade booster box',
    marketPda: '',
    isInitialized: false
  },
  {
    seed: 'pok_bb_shrouded_market',
    name: 'POK-BB-SHROUDED',
    displayName: 'Pokémon Shrouded Fable',
    category: 'pokemon',
    description: 'Shrouded Fable booster box',
    marketPda: '',
    isInitialized: false
  },
  {
    seed: 'mtg_commander_market',
    name: 'MTG-COMMANDER',
    displayName: 'Magic Commander Deck',
    category: 'mtg',
    description: 'MTG Commander Masters deck',
    marketPda: '',
    isInitialized: false
  },
  {
    seed: 'yugioh_starter_market',
    name: 'YUGIOH-STARTER',
    displayName: 'Yu-Gi-Oh! Starter Deck',
    category: 'yugioh',
    description: 'Yu-Gi-Oh! latest starter deck',
    marketPda: '',
    isInitialized: false
  },
]

export default function MarketsPage() {
  const [markets, setMarkets] = useState<Market[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [modalTab, setModalTab] = useState<'discover' | 'create'>('discover')
  const [discoverableMarkets, setDiscoverableMarkets] = useState<DiscoverableMarket[]>([])
  const [checkingBlockchain, setCheckingBlockchain] = useState(false)
  const [newMarket, setNewMarket] = useState({
    id: '',
    name: '',
    displayName: '',
    marketSeed: '',
    currentPrice: 0,
    priceSource: 'manual',
    category: 'pokemon'
  })

  useEffect(() => {
    loadMarkets()
  }, [])

  useEffect(() => {
    if (showAddModal && modalTab === 'discover') {
      checkDiscoverableMarkets()
    }
  }, [showAddModal, modalTab])

  const loadMarkets = () => {
    const stored = localStorage.getItem('specmarket_markets')
    if (stored) {
      setMarkets(JSON.parse(stored))
    } else {
      const defaultMarket: Market = {
        id: 'pok-bb-modern',
        name: 'POK-BB-MODERN',
        displayName: 'Pokémon Modern Booster Box',
        marketPda: 'CA9LFZPdowzA6d3sMwTZo8s8cCLB3etj17MPsMkf6GbL',
        currentPrice: 269.22,
        priceSource: 'tcgplayer',
        category: 'pokemon',
        enabled: true,
        createdAt: Date.now()
      }
      setMarkets([defaultMarket])
      localStorage.setItem('specmarket_markets', JSON.stringify([defaultMarket]))
    }
  }

  const checkDiscoverableMarkets = async () => {
    setCheckingBlockchain(true)
    const connection = new Connection(RPC_URL, 'confirmed')

    const updatedMarkets = await Promise.all(
      DISCOVERABLE_MARKETS.map(async (market) => {
        // Calcular PDA si no está definido
        let marketPda = market.marketPda
        if (!marketPda) {
          const [pda] = PublicKey.findProgramAddressSync(
            [Buffer.from(market.seed)],
            PROGRAM_ID
          )
          marketPda = pda.toString()
        }

        // Verificar si existe on-chain
        try {
          const accountInfo = await connection.getAccountInfo(new PublicKey(marketPda))
          const isInitialized = accountInfo !== null

          // Si existe, intentar leer el precio
          let currentPrice = market.currentPrice
          if (isInitialized && accountInfo && accountInfo.data.length >= 24) {
            try {
              const markPriceCents = Number(accountInfo.data.readBigUInt64LE(8))
              currentPrice = markPriceCents / 100
            } catch (e) {
              // Usar precio default
            }
          }

          return {
            ...market,
            marketPda,
            isInitialized,
            currentPrice
          }
        } catch (error) {
          return {
            ...market,
            marketPda,
            isInitialized: false
          }
        }
      })
    )

    setDiscoverableMarkets(updatedMarkets)
    setCheckingBlockchain(false)
  }

  const calculateMarketPda = (seed: string) => {
    try {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from(seed)],
        PROGRAM_ID
      )
      return pda.toString()
    } catch (error) {
      return 'Invalid seed'
    }
  }

  const handleAddDiscoveredMarket = (discovered: DiscoverableMarket) => {
    // Verificar si ya está agregado
    if (markets.some(m => m.marketPda === discovered.marketPda)) {
      alert('⚠️ This market is already added')
      return
    }

    const market: Market = {
      id: discovered.name.toLowerCase().replace(/-/g, '_'),
      name: discovered.name,
      displayName: discovered.displayName,
      marketPda: discovered.marketPda,
      currentPrice: discovered.currentPrice || 0,
      priceSource: discovered.isInitialized ? 'blockchain' : 'manual',
      category: discovered.category,
      enabled: true,
      createdAt: Date.now()
    }

    const updatedMarkets = [...markets, market]
    setMarkets(updatedMarkets)
    localStorage.setItem('specmarket_markets', JSON.stringify(updatedMarkets))

    setShowAddModal(false)
    alert(`✅ ${market.displayName} added successfully!`)
  }

  const handleAddMarket = () => {
    const marketPda = calculateMarketPda(newMarket.marketSeed)
    
    if (marketPda === 'Invalid seed') {
      alert('❌ Invalid market seed')
      return
    }

    const market: Market = {
      id: newMarket.id,
      name: newMarket.name,
      displayName: newMarket.displayName,
      marketPda,
      currentPrice: newMarket.currentPrice,
      priceSource: newMarket.priceSource,
      category: newMarket.category,
      enabled: true,
      createdAt: Date.now()
    }

    const updatedMarkets = [...markets, market]
    setMarkets(updatedMarkets)
    localStorage.setItem('specmarket_markets', JSON.stringify(updatedMarkets))

    setShowAddModal(false)
    setNewMarket({
      id: '',
      name: '',
      displayName: '',
      marketSeed: '',
      currentPrice: 0,
      priceSource: 'manual',
      category: 'pokemon'
    })

    alert('✅ Market added successfully!')
  }

  const toggleMarket = (id: string) => {
    const updatedMarkets = markets.map(m =>
      m.id === id ? { ...m, enabled: !m.enabled } : m
    )
    setMarkets(updatedMarkets)
    localStorage.setItem('specmarket_markets', JSON.stringify(updatedMarkets))
  }

  const deleteMarket = (id: string) => {
    if (!confirm('Are you sure you want to delete this market?')) return
    
    const updatedMarkets = markets.filter(m => m.id !== id)
    setMarkets(updatedMarkets)
    localStorage.setItem('specmarket_markets', JSON.stringify(updatedMarkets))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-purple-900">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="text-3xl font-bold text-white">
          SpecMarket
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/positions" className="text-white hover:text-purple-300 transition">
            My Positions
          </Link>
          <WalletButton />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-white">Markets Management</h1>
            <button
              onClick={() => {
                setShowAddModal(true)
                setModalTab('discover')
              }}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:opacity-90 transition"
            >
              ➕ Add Market
            </button>
          </div>

          {markets.length === 0 ? (
            <div className="bg-white/10 backdrop-blur rounded-lg p-12 text-center">
              <p className="text-gray-300 text-lg">No markets configured</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {markets.map((market) => (
                <div
                  key={market.id}
                  className={`bg-white/10 backdrop-blur rounded-lg p-6 ${
                    !market.enabled ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-white">{market.displayName}</h3>
                        <span className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-sm">
                          {market.category}
                        </span>
                        {market.enabled ? (
                          <span className="px-3 py-1 bg-green-600/30 text-green-200 rounded-full text-sm">
                            Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-600/30 text-gray-200 rounded-full text-sm">
                            Disabled
                          </span>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div>
                          <div className="text-gray-400 text-sm">Market ID</div>
                          <div className="text-white font-mono text-sm">{market.name}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Current Price</div>
                          <div className="text-white font-bold">${market.currentPrice.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Price Source</div>
                          <div className="text-white capitalize">{market.priceSource}</div>
                        </div>
                        <div>
                          <div className="text-gray-400 text-sm">Market PDA</div>
                          <div className="text-white font-mono text-xs truncate">
                            {market.marketPda.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/trade/${market.id}`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                      >
                        Trade
                      </Link>
                      <button
                        onClick={() => toggleMarket(market.id)}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          market.enabled
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {market.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteMarket(market.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Add Market Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Add Market</h3>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-white/10">
              <button
                onClick={() => setModalTab('discover')}
                className={`px-6 py-3 font-semibold transition ${
                  modalTab === 'discover'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                🔍 Discover Markets
              </button>
              <button
                onClick={() => setModalTab('create')}
                className={`px-6 py-3 font-semibold transition ${
                  modalTab === 'create'
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                ✨ Create Custom
              </button>
            </div>

            {/* Discover Tab */}
            {modalTab === 'discover' && (
              <div>
                {checkingBlockchain ? (
                  <div className="text-center py-12">
                    <div className="text-white mb-4">🔍 Checking blockchain...</div>
                    <div className="text-gray-400 text-sm">Verifying which markets exist on-chain</div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {discoverableMarkets
                      .filter(market => market.isInitialized) // ← AGREGAR ESTA LÍNEA
                      .map((market) => (
                      <div
                        key={market.seed}
                        className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-white">{market.displayName}</h4>
                              <span className="px-2 py-1 bg-purple-600/30 text-purple-200 rounded text-xs capitalize">
                                {market.category}
                              </span>
                              {market.isInitialized ? (
                                <span className="px-2 py-1 bg-green-600/30 text-green-200 rounded text-xs flex items-center gap-1">
                                  ✅ On-Chain
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-yellow-600/30 text-yellow-200 rounded text-xs flex items-center gap-1">
                                  ⚠️ Demo Only
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-3">{market.description}</p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className="text-gray-400">Ticker:</span>
                                <span className="text-white ml-2 font-mono">{market.name}</span>
                              </div>
                              {market.currentPrice && (
                                <div>
                                  <span className="text-gray-400">Price:</span>
                                  <span className="text-white ml-2 font-bold">${market.currentPrice.toFixed(2)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleAddDiscoveredMarket(market)}
                            disabled={markets.some(m => m.marketPda === market.marketPda)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ml-4"
                          >
                            {markets.some(m => m.marketPda === market.marketPda) ? 'Added' : 'Add Market'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Create Tab */}
            {modalTab === 'create' && (
              <div className="space-y-4">
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Market ID (URL slug)</label>
                  <input
                    type="text"
                    placeholder="pok-bb-twilight"
                    value={newMarket.id}
                    onChange={(e) => setNewMarket({ ...newMarket, id: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Market Name (ticker)</label>
                  <input
                    type="text"
                    placeholder="POK-BB-TWILIGHT"
                    value={newMarket.name}
                    onChange={(e) => setNewMarket({ ...newMarket, name: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Display Name</label>
                  <input
                    type="text"
                    placeholder="Pokémon Twilight Masquerade Booster Box"
                    value={newMarket.displayName}
                    onChange={(e) => setNewMarket({ ...newMarket, displayName: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Market Seed (for PDA calculation)</label>
                  <input
                    type="text"
                    placeholder="pok_bb_twilight_market"
                    value={newMarket.marketSeed}
                    onChange={(e) => setNewMarket({ ...newMarket, marketSeed: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-mono"
                  />
                  {newMarket.marketSeed && (
                    <div className="mt-2 text-sm">
                      <div className="text-gray-400">Calculated PDA:</div>
                      <div className="text-purple-300 font-mono break-all">
                        {calculateMarketPda(newMarket.marketSeed)}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Current Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMarket.currentPrice}
                      onChange={(e) => setNewMarket({ ...newMarket, currentPrice: parseFloat(e.target.value) })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    />
                  </div>

                  <div>
                    <label className="text-gray-300 text-sm mb-2 block">Category</label>
                    <select
                      value={newMarket.category}
                      onChange={(e) => setNewMarket({ ...newMarket, category: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                      <option value="pokemon">Pokémon</option>
                      <option value="mtg">Magic: The Gathering</option>
                      <option value="yugioh">Yu-Gi-Oh!</option>
                      <option value="sports">Sports Cards</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-gray-300 text-sm mb-2 block">Price Source</label>
                  <select
                    value={newMarket.priceSource}
                    onChange={(e) => setNewMarket({ ...newMarket, priceSource: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value="manual">Manual Entry</option>
                    <option value="tcgplayer">TCGPlayer Scraper</option>
                    <option value="api">External API</option>
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddMarket}
                    disabled={!newMarket.id || !newMarket.name || !newMarket.marketSeed}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Market
                  </button>
                </div>
              </div>
            )}

            {modalTab === 'discover' && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
