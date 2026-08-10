/**
 * Build script for Cloudflare Pages.
 * Injects public runtime configuration into the static HTML files.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

const isProductionBuild = process.argv.includes('--production');
const mpPublicKey = process.env.VITE_MP_PUBLIC_KEY;
const apiUrl = process.env.API_URL || 'https://ssw-intelligence-api.onrender.com';
const googleClientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';

if (!mpPublicKey && isProductionBuild) {
  console.error('ERROR: VITE_MP_PUBLIC_KEY is required for a production build.');
  process.exit(1);
}

if (!mpPublicKey) {
  console.warn('WARNING: payment checkout will be unavailable in this local build.');
}

console.log('Injecting public runtime configuration...');

const htmlPaths = [
  path.join(__dirname, '..', 'index.html'),
  path.join(__dirname, '..', 'precos', 'index.html'),
  path.join(__dirname, '..', 'termos', 'index.html')
];

htmlPaths.forEach((htmlPath) => {
  if (!fs.existsSync(htmlPath)) {
    console.warn(`Skipping missing file: ${htmlPath}`);
    return;
  }

  let html = fs.readFileSync(htmlPath, 'utf8');
  const eol = html.includes('\r\n') ? '\r\n' : '\n';
  const mpMetaTag = `<meta name="env-mp-public-key" content="${mpPublicKey || ''}">`;
  const apiUrlMetaTag = `<meta name="env-api-url" content="${apiUrl}">`;
  const googleClientMetaTag = googleClientId
    ? `<meta name="env-google-client-id" content="${googleClientId}">`
    : '';

  html = html
    .replace(/^\s*<meta name="env-mp-public-key" content="[^"]*">\r?\n?/gm, '')
    .replace(/^\s*<meta name="env-api-url" content="[^"]*">\r?\n?/gm, '')
    .replace(/^\s*<meta name="env-google-client-id" content="[^"]*">\r?\n?/gm, '');

  const metaTags = [mpMetaTag, apiUrlMetaTag, googleClientMetaTag]
    .filter(Boolean)
    .join(`${eol}    `);
  html = html.replace('<meta charset="UTF-8">', `<meta charset="UTF-8">${eol}    ${metaTags}`);
  fs.writeFileSync(htmlPath, html);
});

console.log(mpPublicKey ? 'Build complete.' : 'Local build complete without payment configuration.');
