/**
 * Utilitário de Sanitização de Inputs
 * Usa DOMPurify para prevenir XSS attacks
 * Vanilla JS - compatível com script tags
 */

// Configurações de segurança
const MAX_STRING_LENGTH = 10000;
const MAX_URL_LENGTH = 2000;
const MAX_EMAIL_LENGTH = 254;

// Sistema de logging de tentativas de ataque (frontend)
const attackLog = [];

function logAttack(type, payload) {
  const entry = {
    timestamp: new Date().toISOString(),
    type,
    payload: typeof payload === 'string' ? payload.substring(0, 100) : JSON.stringify(payload).substring(0, 100),
    userAgent: navigator.userAgent
  };
  
  attackLog.push(entry);
  
  // Mantém apenas últimos 100 logs
  if (attackLog.length > 100) {
    attackLog.shift();
  }
  
  console.warn('🚨 Tentativa de ataque detectada:', entry);
}

// Sistema de rate limiting interno
const rateLimit = new Map();

function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const requests = rateLimit.get(identifier) || [];
  
  // Remove requisições antigas
  const recentRequests = requests.filter(time => now - time < windowMs);
  
  if (recentRequests.length >= maxRequests) {
    console.warn('⚠️ Rate limit excedido para:', identifier);
    logAttack('RATE_LIMIT', { identifier, count: recentRequests.length });
    return false;
  }
  
  recentRequests.push(now);
  rateLimit.set(identifier, recentRequests);
  return true;
}

// Carrega DOMPurify do CDN se não estiver disponível
if (typeof DOMPurify === 'undefined') {
  console.warn('⚠️ DOMPurify não carregado. Adicione <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script> ao HTML');
}

/**
 * Sanitiza HTML para prevenir XSS
 * @param {string} dirty - HTML sujo
 * @param {Object} options - Opções do DOMPurify
 * @returns {string} HTML limpo
 */
function sanitizeHTML(dirty, options = {}) {
  if (!dirty) return '';
  
  // Previne DoS via strings muito longas
  if (dirty.length > MAX_STRING_LENGTH) {
    console.warn('⚠️ HTML muito longo, truncando:', dirty.length);
    logAttack('LONG_HTML', { length: dirty.length });
    dirty = dirty.substring(0, MAX_STRING_LENGTH);
  }
  
  if (typeof DOMPurify === 'undefined') {
    console.error('❌ DOMPurify não disponível - bloqueando HTML');
    logAttack('DOMPURIFY_MISSING', { length: dirty.length });
    return ''; // Fallback seguro: retorna vazio em vez de HTML perigoso
  }

  const defaultOptions = {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 'a', 'ul', 'ol', 'li',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'span', 'div', 'blockquote', 'code', 'pre'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'id'],
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus', 'onblur'],
    ...options
  };

  return DOMPurify.sanitize(dirty, defaultOptions);
}

/**
 * Sanitiza URL para prevenir javascript: attacks
 * @param {string} url - URL para sanitizar
 * @returns {string} URL segura
 */
function sanitizeURL(url) {
  if (!url) return '';
  
  // Previne DoS via URLs muito longas
  if (url.length > MAX_URL_LENGTH) {
    console.warn('⚠️ URL muito longa, bloqueando:', url.length);
    logAttack('LONG_URL', { length: url.length });
    return '#';
  }
  
  // Valida formato de URL
  try {
    new URL(url);
  } catch {
    console.warn('⚠️ URL com formato inválido bloqueada:', url);
    logAttack('INVALID_URL', { url });
    return '#';
  }
  
  // Remove protocolos perigosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'blob:', 'about:'];
  const lowerUrl = url.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn('⚠️ URL com protocolo perigoso bloqueada:', url);
      logAttack('DANGEROUS_PROTOCOL', { protocol, url });
      return '#';
    }
  }
  
  // Apenas permite HTTP/HTTPS
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    console.warn('⚠️ URL com protocolo não permitido:', url);
    logAttack('INVALID_PROTOCOL', { url });
    return '#';
  }
  
  return url;
}

/**
 * Sanitiza input de texto simples
 * @param {string} text - Texto para sanitizar
 * @returns {string} Texto seguro
 */
function sanitizeText(text) {
  if (!text) return '';
  
  // Previne DoS via strings muito longas
  if (text.length > MAX_STRING_LENGTH) {
    console.warn('⚠️ Texto muito longo, truncando:', text.length);
    logAttack('LONG_TEXT', { length: text.length });
    text = text.substring(0, MAX_STRING_LENGTH);
  }
  
  // Remove caracteres Unicode perigosos (zero-width, RTL override, etc)
  const dangerousChars = /[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g;
  text = text.replace(dangerousChars, '');
  
  // Escapa caracteres HTML perigosos
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Sanitiza email
 * @param {string} email - Email para sanitizar
 * @returns {string} Email seguro
 */
function sanitizeEmail(email) {
  if (!email) return '';
  
  // Previne DoS via emails muito longos
  if (email.length > MAX_EMAIL_LENGTH) {
    console.warn('⚠️ Email muito longo, bloqueando:', email.length);
    logAttack('LONG_EMAIL', { length: email.length });
    return '';
  }
  
  // Valida formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.warn('⚠️ Email com formato inválido:', email);
    logAttack('INVALID_EMAIL', { email });
    return '';
  }
  
  // Remove caracteres Unicode perigosos
  const dangerousChars = /[\u200B-\u200D\uFEFF\u202A-\u202E\u2066-\u2069]/g;
  email = email.replace(dangerousChars, '');
  
  // Converte para lowercase e remove espaços
  return email.toLowerCase().trim();
}

/**
 * Sanitiza input de formulário
 * @param {string} input - Input para sanitizar
 * @param {string} type - Tipo de input (text, email, url, html, number)
 * @returns {string|number} Input sanitizado
 */
function sanitizeFormInput(input, type = 'text') {
  if (!input) return '';
  
  // Rate limiting por tipo de input
  const rateLimitKey = `form_${type}`;
  if (!checkRateLimit(rateLimitKey, 20, 60000)) {
    console.warn('⚠️ Muitas tentativas de input, bloqueando temporariamente');
    return type === 'number' ? 0 : '';
  }
  
  switch (type) {
    case 'email':
      return sanitizeEmail(input);
    case 'url':
      return sanitizeURL(input);
    case 'html':
      return sanitizeHTML(input);
    case 'number':
      const num = parseFloat(input);
      if (isNaN(num) || !isFinite(num)) {
        logAttack('INVALID_NUMBER', { input });
        return 0;
      }
      // Valida range razoável
      if (num < -Number.MAX_SAFE_INTEGER || num > Number.MAX_SAFE_INTEGER) {
        logAttack('NUMBER_OUT_OF_RANGE', { input });
        return 0;
      }
      return num;
    default:
      return sanitizeText(input);
  }
}

/**
 * Sanitiza objeto recursivamente
 * @param {Object} obj - Objeto para sanitizar
 * @returns {Object} Objeto sanitizado
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeText(value);
      } else if (typeof value === 'number') {
        // Valida números (previne injection)
        if (!isFinite(value) || isNaN(value)) {
          console.warn('⚠️ Número inválido:', value);
          logAttack('INVALID_NUMBER_IN_OBJECT', { key, value });
          sanitized[key] = 0;
        } else {
          sanitized[key] = value;
        }
      } else if (typeof value === 'boolean') {
        sanitized[key] = value; // Booleanos são seguros
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        console.warn('⚠️ Tipo não suportado em objeto:', typeof value);
        sanitized[key] = null;
      }
    }
  }
  
  return sanitized;
}

/**
 * Obtém logs de ataque (para debugging)
 * @returns {Array} Logs de ataque
 */
function getAttackLogs() {
  return [...attackLog];
}

/**
 * Limpa logs de ataque
 */
function clearAttackLogs() {
  attackLog.length = 0;
}

// Torna disponível globalmente
window.Sanitizer = {
  sanitizeHTML,
  sanitizeURL,
  sanitizeText,
  sanitizeEmail,
  sanitizeFormInput,
  sanitizeObject,
  getAttackLogs,
  clearAttackLogs,
  checkRateLimit
};
