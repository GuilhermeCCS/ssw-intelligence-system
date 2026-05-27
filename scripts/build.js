/**
 * Script de Build para Cloudflare Pages
 * Injeta variáveis de ambiente no HTML antes do deploy
 */

const fs = require('fs');
const path = require('path');

// Lê variáveis de ambiente
const mpPublicKey = process.env.VITE_MP_PUBLIC_KEY;
const encryptionKey = process.env.ENCRYPTION_KEY || 'ssw-secure-key-2024';
const apiUrl = process.env.API_URL || 'https://ssw-intelligence-api.onrender.com';

// Validação crítica para VITE_MP_PUBLIC_KEY
if (!mpPublicKey) {
  console.error('❌ ERRO: VITE_MP_PUBLIC_KEY não configurada!');
  console.error('Configure esta variável de ambiente no Cloudflare Pages ou .env');
  process.exit(1);
}

console.log('🔧 Injetando variáveis de ambiente...');

// Caminho do HTML (agora apenas na raiz)
const htmlPaths = [
  path.join(__dirname, 'index.html')
];

htmlPaths.forEach(htmlPath => {
  if (!fs.existsSync(htmlPath)) {
    console.log(`⚠️ Arquivo não encontrado: ${htmlPath}`);
    return;
  }

  // Lê o HTML
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Injeta meta tags com as variáveis de ambiente
  const mpMetaTag = `<meta name="env-mp-public-key" content="${mpPublicKey}">`;
  const encryptionMetaTag = `<meta name="env-encryption-key" content="${encryptionKey}">`;
  const apiUrlMetaTag = `<meta name="env-api-url" content="${apiUrl}">`;

  // Adiciona meta tags após o charset
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n    ${mpMetaTag}\n    ${encryptionMetaTag}\n    ${apiUrlMetaTag}`);

  // Escreve o HTML modificado
  fs.writeFileSync(htmlPath, html);

  console.log(`✅ Variáveis injetadas em: ${htmlPath}`);
});

console.log(`🔑 MP Public Key: ${mpPublicKey.substring(0, 20)}...`);
