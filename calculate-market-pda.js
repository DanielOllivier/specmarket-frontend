const { PublicKey } = require('@solana/web3.js');

const PROGRAM_ID = new PublicKey('3kNV71kdLVjDnYHmQfq22hqku5wQNVjrWFr51JCyc79G');

// Seeds del IDL: "pok_bb_modern_market"
const seeds = [Buffer.from('pok_bb_modern_market')];

const [marketPda, bump] = PublicKey.findProgramAddressSync(seeds, PROGRAM_ID);

console.log('Market PDA calculado:', marketPda.toString());
console.log('Bump:', bump);
console.log('');
console.log('Market PDA en código:', 'CA9LFZPdowzA6d3sMwTZo8s8cCLB3etj17MPsMkf6GbL');
console.log('¿Coinciden?', marketPda.toString() === 'CA9LFZPdowzA6d3sMwTZo8s8cCLB3etj17MPsMkf6GbL');
