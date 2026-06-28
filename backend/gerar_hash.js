/**
 * Rode UMA VEZ para gerar o hash da sua senha:
 *   node gerar_hash.js SUA_SENHA_AQUI
 *
 * Copie o resultado para ADMIN_PASS_HASH no .env
 */
const bcrypt = require('bcryptjs');
const senha  = process.argv[2];

if (!senha) {
  console.error('Uso: node gerar_hash.js SUA_SENHA');
  process.exit(1);
}

const hash = bcrypt.hashSync(senha, 10);
console.log('\n✅ Adicione esta linha no seu .env:\n');
console.log(`ADMIN_PASS_HASH=${hash}\n`);
