import { Connection, PublicKey } from '@solana/web3.js'

export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!)
export const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'

export const connection = new Connection(RPC_URL, 'confirmed')

export const MARKET_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from('pok_bb_modern_market')],
  PROGRAM_ID
)[0]

export const VAULT_PDA = PublicKey.findProgramAddressSync(
  [Buffer.from('vault')],
  PROGRAM_ID
)[0]

export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')

export function getPositionPda(userPubkey: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from('position'),
      userPubkey.toBuffer(),
      MARKET_PDA.toBuffer(),
    ],
    PROGRAM_ID
  )[0]
}
