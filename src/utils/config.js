// js/config.js
const API_URL = import.meta.env?.VITE_API_URL || "https://82e29984-9ee4-4727-929e-57421b477e7a-00-2bi525obh81pp.worf.replit.dev";

// Função para pegar o usuário logado com segurança
function getUser() {
    const user = localStorage.getItem('ssw_user');
    return user ? JSON.parse(user) : null;
}

// Redireciona se não estiver logado (Segurança básica)
function checkAuth() {
    if (!getUser() && !window.location.href.includes('index.html')) {
        window.location.href = 'index.html';
    }
}