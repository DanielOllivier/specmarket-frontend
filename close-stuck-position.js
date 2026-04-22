const { Connection, PublicKey, Keypair, Transaction, TransactionInstruction, SystemProgram } = require('@solana/web3.js');
const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');

const RPC_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('3kNV71kdLVjDnYHmQfq22hqku5wQNVjrWFr51JCyc79G');
const MARKET_PDA = new PublicKey('CA9LFZPdowzA6d3sMwTZo8s8cCLB3etj17MPsMkf6GbL');
const VAULT_PDA = new PublicKey('A3b81FMrSgteaMsQffU7Kqh2QRT5QzM1VLzFFnyesuVX');
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
const CLOSE_DISCRIMINATOR = Buffer.from([123, 134, 81, 0, 49, 68, 98, 98]);

async function closePosition() {
  // Lee tu keypair de Phantom (necesitarás exportarla)
  console.log('\n⚠️  NECESITAS EXPORTAR TU PRIVATE KEY DE PHANTOM:');
  console.log('1. Abre Phantom');
  console.log('2. Settings → Export Private Key');
  console.log('3. Copia el array de bytes');
  console.log('4. Guárdalo en wallet.json como: [1,2,3,...]');
  console.log('\nLuego ejecuta: node close-stuck-position.js\n');
  
  if (!fs.existsSync('wallet.json')) {
    console.error('❌ wallet.json no encontrado');
    process.exit(1);
  }

  const secretKey = JSON.parse(fs.readFileSync('wallet.json'));
  const wallet = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  const connection = new Connection(RPC_URL, 'confirmed');

  console.log('Wallet:', wallet.publicKey.toString());

  const [positionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('position'), wallet.publicKey.toBuffer(), MARKET_PDA.toBuffer()],
    PROGRAM_ID
  );

  const userUsdcAta = await getAssociatedTokenAddress(USDC_MINT, wallet.publicKey);
  const vaultUsdcAta = await getAssociatedTokenAddress(USDC_MINT, VAULT_PDA, true);

  const keys = [
    { pubkey: positionPda, isSigner: false, isWritable: true },
    { pubkey: MARKET_PDA, isSigner: false, isWritable: true },
    { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
    { pubkey: userUsdcAta, isSigner: false, isWritable: true },
    { pubkey: VAULT_PDA, isSigner: false, isWritable: true },
    { pubkey: vaultUsdcAta, isSigner: false, isWritable: true },
    { pubkey: USDC_MINT, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  const instruction = new TransactionInstruction({
    keys,
    programId: PROGRAM_ID,
    data: CLOSE_DISCRIMINATOR
  });

  const tx = new Transaction().add(instruction);
  tx.feePayer = wallet.publicKey;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  console.log('Enviando transacción...');
  const sig = await connection.sendTransaction(tx, [wallet]);
  console.log('✅ Transacción enviada:', sig);
  
  await connection.confirmTransaction(sig);
  console.log('✅ Posición cerrada!');
}

closePosition().catch(console.error);
