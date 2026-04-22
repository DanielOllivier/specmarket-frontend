'use client'

import dynamic from 'next/dynamic'

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
)

export function WalletButton() {
  return (
    <WalletMultiButtonDynamic className="!bg-gradient-to-r !from-purple-600 !to-pink-600 !text-white !rounded-lg !font-medium hover:!opacity-90 !transition" />
  )
}
