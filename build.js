/**
 * Script de Build para Cloudflare Pages
 * Injeta variáveis de ambiente no HTML antes do deploy
 */

const fs = require('fs');
const path = require('path');

// Lê variáveis de ambiente
const mpPublicKey = process.env.VITE_MP_PUBLIC_KEY || 'APP_USR-0666c374-0f5e-4421-b67d-f9879c8866ac';

console.log('🔧 Injetando variáveis de ambiente...');

// Caminhos dos HTMLs
const htmlPaths = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'src/pages/index.html')
];

htmlPaths.forEach(htmlPath => {
  if (!fs.existsSync(htmlPath)) {
    console.log(`⚠️ Arquivo não encontrado: ${htmlPath}`);
    return;
  }

  // Lê o HTML
  let html = fs.readFileSync(htmlPath, 'utf8');

  // Injeta meta tag com a variável de ambiente
  const metaTag = `<meta name="env-mp-public-key" content="${mpPublicKey}">`;

  // Adiciona meta tag após o charset
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">\n    ${metaTag}`);

  // Escreve o HTML modificado
  fs.writeFileSync(htmlPath, html);

  console.log(`✅ Variáveis injetadas em: ${htmlPath}`);
});

console.log(`🔑 MP Public Key: ${mpPublicKey.substring(0, 20)}...`);
