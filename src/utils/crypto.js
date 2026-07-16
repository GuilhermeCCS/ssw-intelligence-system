/**
 * Utilitário de Criptografia para Dados Sensíveis
 * Usa Web Crypto API para criptografia AES-GCM
 * Segue as melhores práticas OWASP para derivação de chaves
 * Vanilla JS - compatível com script tags
 */

const DEVICE_KEY_NAME = 'SSW_STORAGE_DEVICE_KEY';
const SALT_LENGTH = 16; // 128 bits conforme OWASP
const IV_LENGTH = 12; // 96 bits para AES-GCM
const PBKDF2_ITERATIONS = 200000; // Recomendação OWASP 2024

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

// Gera salt aleatório conforme OWASP
function generateSalt() {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

// Deriva chave a partir de senha com salt aleatório (OWASP compliant)
async function deriveKey(password, salt) {
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
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Criptografa dados com salt aleatório (OWASP compliant)
async function encrypt(data) {
  // Fallback de compatibilidade caso a chave local não esteja disponível.
  if (!STORAGE_ENCRYPTION_KEY || STORAGE_ENCRYPTION_KEY.length < 32) {
    console.warn('Chave de criptografia inválida - dados não serão criptografados');
    return null; // Retorna null em vez de base64 inseguro
  }

  try {
    const salt = generateSalt();
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKey(STORAGE_ENCRYPTION_KEY, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      strToBuffer(JSON.stringify(data))
    );

    // Combina Salt + IV + dados criptografados e converte para base64
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Erro ao criptografar:', error);
    return null;
  }
}

// Descriptografa dados com suporte a formato novo (com salt) e legado (sem salt)
async function decrypt(encryptedData) {
  // Fallback de compatibilidade para dados antigos em base64 (sem salt)
  if (!STORAGE_ENCRYPTION_KEY || STORAGE_ENCRYPTION_KEY.length < 32) {
    console.warn('Chave de criptografia inválida - não é possível descriptografar');
    return null;
  }

  try {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Detecta formato: novo (28+ bytes) vs legado (12+ bytes)
    // Novo formato: 16 bytes salt + 12 bytes IV + dados
    // Legado formato: 12 bytes IV + dados
    let salt, iv, encrypted;
    
    if (combined.length >= SALT_LENGTH + IV_LENGTH) {
      // Formato novo com salt
      salt = combined.slice(0, SALT_LENGTH);
      iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      encrypted = combined.slice(SALT_LENGTH + IV_LENGTH);
    } else {
      // Formato legado sem salt (compatibilidade)
      console.warn('Formato legado detectado - usando salt fixo para compatibilidade');
      salt = strToBuffer('ssw-salt-2024-legacy'); // Salt fixo apenas para migração
      iv = combined.slice(0, IV_LENGTH);
      encrypted = combined.slice(IV_LENGTH);
    }

    const key = await deriveKey(STORAGE_ENCRYPTION_KEY, salt);
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

// Wrapper seguro para localStorage com tratamento de erros
const secureStorage = {
  async setItem(key, value) {
    try {
      const encrypted = await encrypt(value);
      if (encrypted) {
        localStorage.setItem(key, encrypted);
        return true;
      } else {
        console.error('Falha na criptografia - dados não foram salvos');
        return false;
      }
    } catch (error) {
      console.error('Erro ao salvar dados criptografados:', error);
      return false;
    }
  },

  async getItem(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (encrypted) {
        const decrypted = await decrypt(encrypted);
        return decrypted;
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar dados criptografados:', error);
      return null;
    }
  },

  removeItem(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Erro ao remover dados:', error);
      return false;
    }
  },

  // Método para limpar todos os dados criptografados
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Erro ao limpar storage:', error);
      return false;
    }
  },

  // Verifica se um dado está em formato legado (sem salt)
  isLegacyFormat(key) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return false;
      
      const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
      // Formato legado tem menos de 28 bytes (16 salt + 12 IV)
      return combined.length < SALT_LENGTH + IV_LENGTH;
    } catch (error) {
      return false;
    }
  },

  // Migra dados do formato legado para o novo formato
  async migrateItem(key) {
    try {
      if (!this.isLegacyFormat(key)) {
        return { success: true, migrated: false };
      }

      const encrypted = localStorage.getItem(key);
      const decrypted = await decrypt(encrypted);
      
      if (decrypted) {
        const success = await this.setItem(key, decrypted);
        return { success, migrated: success };
      }
      
      return { success: false, migrated: false };
    } catch (error) {
      console.error('Erro ao migrar dado:', error);
      return { success: false, migrated: false };
    }
  }
};

// Torna disponível globalmente
window.secureStorage = secureStorage;

// Função de migração automática ao carregar o script
(async function autoMigrate() {
  try {
    const keysToMigrate = ['USER', 'SSW_SESSION', 'SSW_PREFERENCES'];
    
    for (const key of keysToMigrate) {
      if (secureStorage.isLegacyFormat(key)) {
        console.log(`Migrando dado legado: ${key}`);
        const result = await secureStorage.migrateItem(key);
        if (result.migrated) {
          console.log(`✅ Migração bem-sucedida: ${key}`);
        } else {
          console.warn(`❌ Falha na migração: ${key}`);
        }
      }
    }
  } catch (error) {
    console.warn('Erro na migração automática:', error);
  }
})();
