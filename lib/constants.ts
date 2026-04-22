import { PublicKey } from '@solana/web3.js'

// Programa multi-mercados con limit orders
export const PROGRAM_ID = new PublicKey('9JsjBXM4HetB33ojaGMEwqJMqJY2DkFG6oHctCfASU3X')

export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')

export const VAULT_PDA = new PublicKey('3HKj1oiVdrUDiB9x4J5iPnWdkhhjji7nggZhDKQ4kt8q')

// Mercados on-chain con PDAs actualizados
export const MARKETS = [
  {
    id: 'pok-bb-modern',
    name: 'POK-BB-MODERN',
    displayName: 'Pokémon Modern Booster Box',
    seed: 'pok_bb_modern_market',
    marketPda: 'C7JGhTHfPoF2KNgiqYNXhYw3AqN2F5BBVaeF5osgoo6L',
    category: 'pokemon',
    currentPrice: 269.22,
    priceSource: 'blockchain',
  },
  {
    id: 'rolex-submariner',
    name: 'ROLEX-SUB',
    displayName: 'Rolex Submariner Date 41mm',
    seed: 'rolex_submariner_market',
    marketPda: '3xQ1JsNp598RHFhJE7zdyDbcv9HvStDdzUyZZuPW2v75',
    category: 'luxury',
    currentPrice: 12500,
    priceSource: 'blockchain',
  },
  {
    id: 'nike-jordan1',
    name: 'NIKE-J1',
    displayName: 'Nike Air Jordan 1 Retro High OG',
    seed: 'nike_jordan1_market',
    marketPda: 'GExxe3atR5mAvZQnPHEPWvy3gPEskqmmySv8Y1rKZt96',
    category: 'sneakers',
    currentPrice: 450,
    priceSource: 'blockchain',
  },
  {
    id: 'rolex-daytona',
    name: 'ROLEX-DAYTONA',
    displayName: 'Rolex Cosmograph Daytona',
    seed: 'rolex_daytona_market',
    marketPda: '53y6k2iL1cqmxDfR3tdd7MvNuficjaviTqiLzb7Fyms7',
    category: 'luxury',
    currentPrice: 35000,
    priceSource: 'blockchain',
  },
  {
    id: 'nike-dunk',
    name: 'NIKE-DUNK',
    displayName: 'Nike Dunk Low Black/White Panda',
    seed: 'nike_dunk_market',
    marketPda: 'HpqmMVs2ZsBM77aeG7VFQFxNsgqv5Qn5PL6x65jMa5Ds',
    category: 'sneakers',
    currentPrice: 180,
    priceSource: 'blockchain',
  },
  {
    id: 'adidas-yeezy',
    name: 'YEEZY-350',
    displayName: 'Adidas Yeezy Boost 350 V2',
    seed: 'adidas_yeezy_market',
    marketPda: '8j3ZEtggzDjSKWHV9UMpDuLRixnzVaRRqqPuNaDQGEuY',
    category: 'sneakers',
    currentPrice: 320,
    priceSource: 'blockchain',
  },
  {
    id: 'patek-nautilus',
    name: 'PATEK-NAU',
    displayName: 'Patek Philippe Nautilus 5711',
    seed: 'patek_nautilus_market',
    marketPda: '58SJkHZQ6ADtRh26rm9vWARai1Yx6yp5ZhnggDMK7Ngw',
    category: 'luxury',
    currentPrice: 85000,
    priceSource: 'blockchain',
  },
  {
    id: 'ap-royal-oak',
    name: 'AP-ROYAL',
    displayName: 'Audemars Piguet Royal Oak 41mm',
    seed: 'ap_royal_oak_market',
    marketPda: '3RV5dwFYGQfzprh9n5bNRGwg8xdmkvVJzFWmbu4Af3X4',
    category: 'luxury',
    currentPrice: 45000,
    priceSource: 'blockchain',
  },
  {
    id: 'pok-bb-twilight',
    name: 'POK-BB-TWILIGHT',
    displayName: 'Pokémon Twilight Masquerade Booster',
    seed: 'pok_bb_twilight_market',
    marketPda: 'ArxKTeNeZqd8pRb8NY6vAaqSsRRwgEbQLruEvoJ4eMPE',
    category: 'pokemon',
    currentPrice: 145,
    priceSource: 'blockchain',
  },
  {
    id: 'mtg-commander',
    name: 'MTG-COMMANDER',
    displayName: 'Magic Commander Masters Deck',
    seed: 'mtg_commander_market',
    marketPda: '4739eZNXagncJSXNS6c1fezbJ4jAKzS5Ey4oFK9ncYtb',
    category: 'mtg',
    currentPrice: 89,
    priceSource: 'blockchain',
  },
]
