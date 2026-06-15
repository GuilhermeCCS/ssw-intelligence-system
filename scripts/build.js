/**
 * Script de Build para Cloudflare Pages
 * Injeta variáveis de ambiente no HTML antes do deploy
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Carrega variáveis de ambiente do .env

// Lê variáveis de ambiente
const mpPublicKey = process.env.VITE_MP_PUBLIC_KEY;
const apiUrl = process.env.API_URL || 'https://ssw-intelligence-api.onrender.com';
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';

// Validação crítica para VITE_MP_PUBLIC_KEY
if (!mpPublicKey) {
  console.error('❌ ERRO: VITE_MP_PUBLIC_KEY não configurada!');
  console.error('Configure esta variável de ambiente no Cloudflare Pages ou .env');
  process.exit(1);
}

console.log('🔧 Injetando variáveis de ambiente...');

// Caminho do HTML (volta um nível para encontrar na raiz)
const htmlPaths = [
  path.join(__dirname, '..', 'index.html'),
  path.join(__dirname, '..', 'precos.html')
];

htmlPaths.forEach(htmlPath => {
  if (!fs.existsSync(htmlPath)) {
    console.log(`⚠️ Arquivo não encontrado: ${htmlPath}`);
    return;
  }

  // Lê o HTML
  let html = fs.readFileSync(htmlPath, 'utf8');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';

  // Injeta meta tags com as variáveis de ambiente
  const mpMetaTag = `<meta name="env-mp-public-key" content="${mpPublicKey}">`;
  const apiUrlMetaTag = `<meta name="env-api-url" content="${apiUrl}">`;
  const googleClientMetaTag = googleClientId ? `<meta name="env-google-client-id" content="${googleClientId}">` : '';

  // Remove injeções anteriores para o build ser idempotente em desenvolvimento
  html = html
    .replace(/^\s*<meta name="env-mp-public-key" content="[^"]*">\r?\n?/gm, '')
    .replace(/^\s*<meta name="env-api-url" content="[^"]*">\r?\n?/gm, '')
    .replace(/^\s*<meta name="env-google-client-id" content="[^"]*">\r?\n?/gm, '');

  // Adiciona meta tags após o charset
  const metaTags = [mpMetaTag, apiUrlMetaTag, googleClientMetaTag].filter(tag => tag).join(`${eol}    `);
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">${eol}    ${metaTags}`);

  // Escreve o HTML modificado
  fs.writeFileSync(htmlPath, html);

  console.log(`✅ Variáveis injetadas em: ${htmlPath}`);
});

console.log(`🔑 MP Public Key: ${mpPublicKey.substring(0, 20)}...`);
