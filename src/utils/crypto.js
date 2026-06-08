/**
 * Utilitário de Criptografia para Dados Sensíveis
 * Usa Web Crypto API para criptografia AES-GCM
 * Vanilla JS - compatível com script tags
 */

const DEVICE_KEY_NAME = 'SSW_STORAGE_DEVICE_KEY';

function generateStorageKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function getStorageEncryptionKey() {
  try {
    let localKey = localStorage.getItem(DEVICE_KEY_NAME);
    if (!localKey || localKey.length < 32) {
      localKey = generateStorageKey();
      localStorage.setItem(DEVICE_KEY_NAME, localKey);
    }
    return localKey;
  } catch (error) {
    console.warn('Não foi possível persistir a chave local do storage. Usando chave de sessão.');
    return generateStorageKey();
  }
}

const STORAGE_ENCRYPTION_KEY = getStorageEncryptionKey();

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
  // Fallback de compatibilidade caso a chave local não esteja disponível.
  if (!STORAGE_ENCRYPTION_KEY || STORAGE_ENCRYPTION_KEY.length < 32) {
    return btoa(JSON.stringify(data));
  }

  try {
    const key = await deriveKey(STORAGE_ENCRYPTION_KEY);
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
  // Fallback de compatibilidade para dados antigos em base64.
  if (!STORAGE_ENCRYPTION_KEY || STORAGE_ENCRYPTION_KEY.length < 32) {
    try {
      return JSON.parse(atob(encryptedData));
    } catch (error) {
      console.error('Erro ao decodificar dados (sem criptografia):', error);
      return null;
    }
  }

  try {
    const key = await deriveKey(STORAGE_ENCRYPTION_KEY);
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
