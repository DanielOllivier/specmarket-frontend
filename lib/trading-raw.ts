import { Connection, PublicKey, SystemProgram, TransactionInstruction, Transaction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token'
import { BN } from '@coral-xyz/anchor'

const RPC_URL = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com'
const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!)
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU')
const VAULT_PDA = new PublicKey('A3b81FMrSgteaMsQffU7Kqh2QRT5QzM1VLzFFnyesuVX')
const MARKET_PDA = new PublicKey('CA9LFZPdowzA6d3sMwTZo8s8cCLB3etj17MPsMkf6GbL')

// Discriminadores de las instrucciones (del IDL)
const OPEN_POSITION_DISCRIMINATOR = Buffer.from([135, 128, 47, 77, 15, 152, 240, 49])
const CLOSE_POSITION_DISCRIMINATOR = Buffer.from([123, 134, 81, 0, 49, 68, 98, 98])

async function findUserPosition(connection: Connection, userPubkey: PublicKey): Promise<PublicKey | null> {
  try {
    const accounts = await connection.getProgramAccounts(PROGRAM_ID, {
      filters: [
        {
          memcmp: {
            offset: 8, // Después del discriminator
            bytes: userPubkey.toBase58(),
          },
        },
      ],
    })

    if (accounts.length > 0) {
      console.log('Found position PDA:', accounts[0].pubkey.toString())
      return accounts[0].pubkey
    }

    return null
  } catch (error) {
    console.error('Error finding position:', error)
    return null
  }
}

export async function openPositionRaw(
  wallet: any,
  marketPda: PublicKey,  // ← AGREGAR
  size: number = 1.0,
  isLong: boolean = true,
  leverage: number = 5
) {
  try {
    const connection = new Connection(RPC_URL, 'confirmed')
    
    if (!wallet.publicKey) {
      throw new Error('Wallet not connected')
    }
    const userPubkey = new PublicKey(wallet.publicKey.toString())
    
    const sizeUnits = new BN(Math.floor(size * 10))
    const positionId = new BN(0) // Siempre 0, el smart contract lo ignora

    const data = Buffer.concat([
      OPEN_POSITION_DISCRIMINATOR,
      positionId.toArrayLike(Buffer, 'le', 8),      // position_id (ignorado)
      sizeUnits.toArrayLike(Buffer, 'le', 8),        // size_units
      Buffer.from([isLong ? 1 : 0]),                 // is_long
      Buffer.from([leverage])                        // leverage
    ])

    const [positionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('position'),
        userPubkey.toBuffer(),
        MARKET_PDA.toBuffer()
        // NO incluir position_id
      ],
      PROGRAM_ID
    )

    const userUsdcAta = await getAssociatedTokenAddress(
      USDC_MINT,
      userPubkey
    )

    const vaultUsdcAta = await getAssociatedTokenAddress(
      USDC_MINT,
      VAULT_PDA,
      true
    )

    
    console.log('Opening position RAW (WITHOUT position_id):', {
      size,
      sizeUnits: sizeUnits.toString(),
      isLong,
      leverage,
      dataLength: data.length
    })

    // Crear instrucción manualmente - ORDEN EXACTO DEL IDL
    const keys = [
      // 1. market (PRIMERO)
      { pubkey: MARKET_PDA, isSigner: false, isWritable: true },
      // 2. position (SEGUNDO)
      { pubkey: positionPda, isSigner: false, isWritable: true },
      // 3. user
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      // 4. user_collateral
      { pubkey: userUsdcAta, isSigner: false, isWritable: true },
      // 5. vault
      { pubkey: VAULT_PDA, isSigner: false, isWritable: true },
      // 6. vault_token_account (AGREGAR - faltaba!)
      //{ pubkey: vaultUsdcAta, isSigner: false, isWritable: true },
      // 7. usdc_mint
      { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      // 8. token_program
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      // 9. associated_token_program
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      // 10. system_program
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ]
    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data
    })

    // Crear y enviar transacción
    const { blockhash } = await connection.getLatestBlockhash()
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: userPubkey
    }).add(instruction)

    const signedTx = await wallet.signTransaction(transaction)
    const signature = await connection.sendRawTransaction(signedTx.serialize())
    
    await connection.confirmTransaction(signature, 'confirmed')

    console.log('Transaction signature:', signature)

    return {
      success: true,
      signature,
      positionPda: positionPda.toString()
    }

  } catch (error: any) {
    console.error('Error opening position RAW:', error)
    throw error
  }
}

export async function closePositionRaw(wallet: any, marketPda: PublicKey, positionPdaStr?: string) {
  try {
    const connection = new Connection(RPC_URL, 'confirmed')

    if (!wallet.publicKey) {
      throw new Error('Wallet not connected')
    }

    const userPubkey = new PublicKey(wallet.publicKey.toString())

    const [positionPda] = PublicKey.findProgramAddressSync(
          [Buffer.from('position'), userPubkey.toBuffer(), MARKET_PDA.toBuffer()],
      PROGRAM_ID
    )

    console.log('=== DEBUG CLOSE POSITION ===')
    console.log('Calculated PDA:', positionPda.toString())
    console.log('Provided PDA:', positionPdaStr)
    console.log('User:', userPubkey.toString())
    console.log('Market:', MARKET_PDA.toString())
    console.log('Program ID:', PROGRAM_ID.toString())

    // Verificar si la cuenta existe
    const accountInfo = await connection.getAccountInfo(positionPda)
    console.log('Account exists?', accountInfo !== null)
    if (accountInfo) {
      console.log('Account data length:', accountInfo.data.length)
      console.log('First 8 bytes (discriminator):', Array.from(accountInfo.data.slice(0, 8)))
    }

    const userUsdcAta = await getAssociatedTokenAddress(
      USDC_MINT,
      userPubkey
    )

    const vaultUsdcAta = await getAssociatedTokenAddress(
      USDC_MINT,
      VAULT_PDA,
      true
    )

    console.log('Closing position RAW:', {
      userPubkey: userPubkey.toString(),
      positionPda: positionPda.toString()
    })

    // Crear instrucción manualmente (sin argumentos, solo discriminator)
    const data = CLOSE_POSITION_DISCRIMINATOR

    const keys = [
      { pubkey: positionPda, isSigner: false, isWritable: true },
      { pubkey: MARKET_PDA, isSigner: false, isWritable: true },
      { pubkey: userPubkey, isSigner: true, isWritable: true },
      { pubkey: userUsdcAta, isSigner: false, isWritable: true },
      { pubkey: VAULT_PDA, isSigner: false, isWritable: true },
      { pubkey: vaultUsdcAta, isSigner: false, isWritable: true },
      { pubkey: USDC_MINT, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    ]

    const instruction = new TransactionInstruction({
      keys,
      programId: PROGRAM_ID,
      data
    })

    const { blockhash } = await connection.getLatestBlockhash()
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: userPubkey
    }).add(instruction)

    const signedTx = await wallet.signTransaction(transaction)
    const signature = await connection.sendRawTransaction(signedTx.serialize())

    await connection.confirmTransaction(signature, 'confirmed')

    console.log('Close transaction signature:', signature)

    return {
      success: true,
      signature
    }

  } catch (error: any) {
    console.error('Error closing position RAW:', error)
    throw error
  }
}
