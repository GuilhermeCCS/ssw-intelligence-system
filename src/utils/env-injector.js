/**
 * Injeta variáveis de ambiente do Cloudflare Pages no window.ENV
 * Este script deve ser carregado antes dos outros scripts que dependem das variáveis
 */

// Cloudflare Pages injeta variáveis de ambiente durante o build
// Precisamos expor para o navegador via window.ENV
window.ENV = window.ENV || {};

// No Cloudflare Pages, as variáveis de ambiente podem ser injetadas via:
// 1. Headers (configurado em _headers)
// 2. Build script que substitui placeholders
// 3. Runtime environment variables

// Método 1: Tenta ler de meta tags injetadas durante build
const mpMetaEnv = document.querySelector('meta[name="env-mp-public-key"]');
if (mpMetaEnv) {
  window.ENV.VITE_MP_PUBLIC_KEY = mpMetaEnv.getAttribute('content');
}

const apiUrlMetaEnv = document.querySelector('meta[name="env-api-url"]');
if (apiUrlMetaEnv) {
  window.ENV.API_URL = apiUrlMetaEnv.getAttribute('content');
}

const googleClientMetaEnv = document.querySelector('meta[name="env-google-client-id"]');
if (googleClientMetaEnv) {
  const googleClientId = googleClientMetaEnv.getAttribute('content');
  window.ENV.GOOGLE_CLIENT_ID = googleClientId;
  window.ENV.VITE_GOOGLE_CLIENT_ID = googleClientId;
}

// Método 2: Tenta ler de headers (se disponível via fetch)
if (!window.ENV.VITE_MP_PUBLIC_KEY) {
  fetch(window.location.href, { method: 'HEAD' })
    .then(res => {
      const mpKey = res.headers.get('X-Env-MP-Public-Key');
      if (mpKey && mpKey !== '%VITE_MP_PUBLIC_KEY%') {
        window.ENV.VITE_MP_PUBLIC_KEY = mpKey;
        console.log('✅ Variável de ambiente carregada de header');
      }
    })
    .catch(() => {
      console.warn('Não foi possível carregar variáveis de ambiente de headers');
    });
}

// Método 3: Fallback para desenvolvimento local (lê de .env se disponível)
if (!window.ENV.VITE_MP_PUBLIC_KEY) {
  console.warn('⚠️ Variável de ambiente não encontrada - usando fallback hardcoded');
}
