/**
 * Utilitário de Sanitização de Inputs
 * Usa DOMPurify para prevenir XSS attacks
 * Vanilla JS - compatível com script tags
 */

// Carrega DOMPurify do CDN se não estiver disponível
if (typeof DOMPurify === 'undefined') {
  // DOMPurify será carregado via script tag no HTML
  console.warn('⚠️ DOMPurify não carregado. Adicione <script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.6/purify.min.js"></script> ao HTML');
}

/**
 * Sanitiza HTML para prevenir XSS
 * @param {string} dirty - HTML sujo
 * @param {Object} options - Opções do DOMPurify
 * @returns {string} HTML limpo
 */
function sanitizeHTML(dirty, options = {}) {
  if (typeof DOMPurify === 'undefined') {
    console.error('❌ DOMPurify não disponível');
    return dirty; // Fallback: retorna HTML não sanitizado
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
    FORBID_ATTR: ['onclick', 'onerror', 'onload', 'onmouseover'],
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
  
  // Remove protocolos perigosos
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn('⚠️ URL com protocolo perigoso bloqueada:', url);
      return '#';
    }
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
  
  // Escapa caracteres HTML perigosos
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

// Torna disponível globalmente
window.Sanitizer = {
  sanitizeHTML,
  sanitizeURL,
  sanitizeText,
  sanitizeObject
};
