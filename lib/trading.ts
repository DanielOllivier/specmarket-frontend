import { 
  Connection, 
  PublicKey, 
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction
} from '@solana/spl-token'
import { PROGRAM_ID, USDC_MINT, VAULT_PDA } from './constants'
import * as anchor from '@coral-xyz/anchor'

// Discriminadores
const OPEN_POSITION_DISCRIMINATOR = Buffer.from([135, 128, 47, 77, 15, 152, 240, 49])
const CLOSE_POSITION_DISCRIMINATOR = Buffer.from([123, 134, 81, 0, 49, 68, 98, 98])

export async function openPosition(
  connection: Connection,
  wallet: any,
  marketPda: PublicKey,
  sizeUnits: number,
  isLong: boolean,
  leverage: number
) {
  if (!wallet.publicKey) throw new Error('Wallet not connected')

  // 1. Calcular Position PDA
  const [positionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('position'),
      wallet.publicKey.toBuffer(),
      marketPda.toBuffer()
    ],
    PROGRAM_ID
  )

  // 2. Get user's USDC token account
  const userUsdcAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  // 3. Get vault's USDC token account (allowOwnerOffCurve = true para PDA)
  const vaultUsdcAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    VAULT_PDA,
    true, // allowOwnerOffCurve
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  // 4. Verificar si vault token account existe
  const vaultAccountInfo = await connection.getAccountInfo(vaultUsdcAccount)
  const instructions: TransactionInstruction[] = []

  if (!vaultAccountInfo) {
    console.log('Creating vault token account...')
    instructions.push(
      createAssociatedTokenAccountInstruction(
        wallet.publicKey,
        vaultUsdcAccount,
        VAULT_PDA,
        USDC_MINT,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    )
  }

  // 5. Serializar datos
  const sizeBuffer = Buffer.alloc(8)
  sizeBuffer.writeBigUInt64LE(BigInt(sizeUnits), 0)

  const isLongBuffer = Buffer.from([isLong ? 1 : 0])
  const leverageBuffer = Buffer.from([leverage])

  const data = Buffer.concat([
    OPEN_POSITION_DISCRIMINATOR,
    sizeBuffer,
    isLongBuffer,
    leverageBuffer
  ])

  // 6. Construir cuentas
  const keys = [
    { pubkey: marketPda, isSigner: false, isWritable: true },
    { pubkey: positionPda, isSigner: false, isWritable: true },
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
    { pubkey: userUsdcAccount, isSigner: false, isWritable: true },
    { pubkey: VAULT_PDA, isSigner: false, isWritable: false },
    { pubkey: vaultUsdcAccount, isSigner: false, isWritable: true },
    { pubkey: USDC_MINT, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
  ]

  const openPositionIx = new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data
  })

  instructions.push(openPositionIx)

  // 7. Crear y enviar transacción
  const transaction = new Transaction().add(...instructions)
  transaction.feePayer = wallet.publicKey

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash

  // 8. Firmar y enviar
  const signed = await wallet.signTransaction(transaction)
  const signature = await connection.sendRawTransaction(signed.serialize())

  // 9. Confirmar
  await connection.confirmTransaction(signature, 'confirmed')

  return signature
}

export async function closePosition(
  connection: Connection,
  wallet: any,
  marketPda: PublicKey
) {
  if (!wallet.publicKey) throw new Error('Wallet not connected')

  const [positionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('position'),
      wallet.publicKey.toBuffer(),
      marketPda.toBuffer()
    ],
    PROGRAM_ID
  )

  const userUsdcAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  const vaultUsdcAccount = getAssociatedTokenAddressSync(
    USDC_MINT,
    VAULT_PDA,
    true,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  )

  const data = CLOSE_POSITION_DISCRIMINATOR

  const keys = [
    { pubkey: positionPda, isSigner: false, isWritable: true },
    { pubkey: marketPda, isSigner: false, isWritable: true },
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
    { pubkey: userUsdcAccount, isSigner: false, isWritable: true },
    { pubkey: VAULT_PDA, isSigner: false, isWritable: false },
    { pubkey: vaultUsdcAccount, isSigner: false, isWritable: true },
    { pubkey: USDC_MINT, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ]

  const closePositionIx = new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data
  })

  const transaction = new Transaction().add(closePositionIx)
  transaction.feePayer = wallet.publicKey

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash

  const signed = await wallet.signTransaction(transaction)
  const signature = await connection.sendRawTransaction(signed.serialize())

  await connection.confirmTransaction(signature, 'confirmed')

  return signature
}

export async function getUserPosition(
  connection: Connection,
  userPubkey: PublicKey,
  marketPda: PublicKey
) {
  const [positionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('position'),
      userPubkey.toBuffer(),
      marketPda.toBuffer()
    ],
    PROGRAM_ID
  )

  try {
    const accountInfo = await connection.getAccountInfo(positionPda)
    if (!accountInfo) return null

    const data = accountInfo.data

    const user = new PublicKey(data.slice(8, 40))
    const market = new PublicKey(data.slice(40, 72))
    const sizeUnits = new anchor.BN(data.slice(72, 80), 'le').toNumber()
    const isLong = data[80] === 1
    const leverage = data[81]
    const entryPriceCents = new anchor.BN(data.slice(82, 90), 'le').toNumber()
    const takeProfitPriceCents = new anchor.BN(data.slice(90, 98), 'le').toNumber()
    const stopLossPriceCents = new anchor.BN(data.slice(98, 106), 'le').toNumber()

    return {
      pda: positionPda,
      user,
      market,
      sizeUnits,
      isLong,
      leverage,
      entryPrice: entryPriceCents / 100,
      takeProfitPrice: takeProfitPriceCents > 0 ? takeProfitPriceCents / 100 : null,
      stopLossPrice: stopLossPriceCents > 0 ? stopLossPriceCents / 100 : null,
    }
  } catch (error) {
    return null
  }
}

// Discriminador de set_limit_orders
const SET_LIMIT_ORDERS_DISCRIMINATOR = Buffer.from([65, 128, 90, 161, 171, 133, 122, 255])

export async function setLimitOrders(
  connection: Connection,
  wallet: any,
  marketPda: PublicKey,
  takeProfitPrice: number,
  stopLossPrice: number
) {
  if (!wallet.publicKey) throw new Error('Wallet not connected')

  const [positionPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('position'),
      wallet.publicKey.toBuffer(),
      marketPda.toBuffer()
    ],
    PROGRAM_ID
  )

  // Convertir precios a cents
  const takeProfitPriceCents = Math.floor(takeProfitPrice * 100)
  const stopLossPriceCents = Math.floor(stopLossPrice * 100)

  // Serializar datos
  const tpBuffer = Buffer.alloc(8)
  tpBuffer.writeBigUInt64LE(BigInt(takeProfitPriceCents), 0)

  const slBuffer = Buffer.alloc(8)
  slBuffer.writeBigUInt64LE(BigInt(stopLossPriceCents), 0)

  const data = Buffer.concat([
    SET_LIMIT_ORDERS_DISCRIMINATOR,
    tpBuffer,
    slBuffer
  ])

  const keys = [
    { pubkey: positionPda, isSigner: false, isWritable: true },
    { pubkey: marketPda, isSigner: false, isWritable: false },
    { pubkey: wallet.publicKey, isSigner: true, isWritable: false },
  ]

  const instruction = new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data
  })

  const transaction = new Transaction().add(instruction)
  transaction.feePayer = wallet.publicKey

  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash

  const signed = await wallet.signTransaction(transaction)
  const signature = await connection.sendRawTransaction(signed.serialize())

  await connection.confirmTransaction(signature, 'confirmed')

  return signature
}
