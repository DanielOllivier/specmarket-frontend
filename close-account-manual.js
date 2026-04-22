const { Connection, PublicKey, Transaction, SystemProgram, Keypair } = require('@solana/web3.js');

const RPC_URL = 'https://api.devnet.solana.com';
const PROGRAM_ID = new PublicKey('3kNV71kdLVjDnYHmQfq22hqku5wQNVjrWFr51JCyc79G');
const MARKET_PDA = new PublicKey('CA9LFZPdowzA6d3sMwTZo8s8cCLB3etj17MPsMkf6GbL');
const USER_PUBKEY = new PublicKey('AUswJ9KRZ6sLsbG5gt9L7wsFE7zt1ibFndgkLJLs8ur3');

async function closeAccountManual() {
  const connection = new Connection(RPC_URL, 'confirmed');

  // Calcular PDA
  const [positionPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('position'), USER_PUBKEY.toBuffer(), MARKET_PDA.toBuffer()],
    PROGRAM_ID
  );

  console.log('Position PDA:', positionPda.toString());

  // Verificar saldo antes
  const accountInfo = await connection.getAccountInfo(positionPda);
  if (!accountInfo) {
    console.log('Account does not exist');
    return;
  }

  console.log('Account lamports:', accountInfo.lamports);
  console.log('Account owner:', accountInfo.owner.toString());

  // Intentar cerrar la cuenta manualmente (transferir lamports de vuelta)
  // Esto solo funciona si el programa lo permite
  console.log('\nNOTA: No podemos cerrar la cuenta directamente porque el programa es el owner.');
  console.log('La cuenta debe ser cerrada usando el programa close_position con datos correctos.');
  console.log('\nLa única opción es:');
  console.log('1. Contactar al equipo que deployó el programa');
  console.log('2. O hacer upgrade del programa para agregar función de recuperación');
  console.log('3. O usar un nuevo wallet sin posiciones stuck');
}

closeAccountManual().catch(console.error);
