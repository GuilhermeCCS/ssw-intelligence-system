/**
 * Utilitário de Criptografia para Dados Sensíveis
 * Usa Web Crypto API para criptografia AES-GCM
 * Vanilla JS - compatível com script tags
 */

const ENCRYPTION_KEY = window.ENV?.ENCRYPTION_KEY;

// Validação crítica - exige chave forte
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error('❌ ERRO CRÍTICO: ENCRYPTION_KEY não configurada ou muito curta!');
  console.error('Configure ENCRYPTION_KEY como variável de ambiente (mínimo 32 caracteres)');
  console.error('Gere uma chave forte: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  throw new Error('ENCRYPTION_KEY não configurada ou muito curta. Configure no .env ou Cloudflare Pages.');
}

// Converte string para ArrayBuffer
const strToBuffer = (str) => new TextEncoder().encode(str);

// Converte ArrayBuffer para string
const bufferToStr = (buffer) => new TextDecoder().decode(buffer);

// Deriva chave a partir de senha
async function deriveKey(password) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    strToBuffer(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: strToBuffer('ssw-salt-2024'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Criptografa dados
async function encrypt(data) {
  try {
    const key = await deriveKey(ENCRYPTION_KEY);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      strToBuffer(JSON.stringify(data))
    );

    // Combina IV + dados criptografados e converte para base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    return null;
  }
}

// Descriptografa dados
async function decrypt(encryptedData) {
  try {
    const key = await deriveKey(ENCRYPTION_KEY);
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return JSON.parse(bufferToStr(decrypted));
  } catch (error) {
    console.error('Erro ao descriptografar:', error);
    return null;
  }
}

// Wrapper seguro para localStorage
const secureStorage = {
  async setItem(key, value) {
    const encrypted = await encrypt(value);
    if (encrypted) {
      localStorage.setItem(key, encrypted);
    }
  },

  async getItem(key) {
    const encrypted = localStorage.getItem(key);
    if (encrypted) {
      return await decrypt(encrypted);
    }
    return null;
  },

  removeItem(key) {
    localStorage.removeItem(key);
  }
};

// Torna disponível globalmente
window.secureStorage = secureStorage;
