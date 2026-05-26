// js/config.js

const API_URL = "https://ssw-intelligence-api.onrender.com";



// Função para pegar o usuário logado com segurança

function getUser() {

    // Tenta descriptografar dados do secureStorage primeiro
    if (typeof secureStorage !== 'undefined' && secureStorage.getItem) {
        return secureStorage.getItem('ssw_user');
    }
    
    // Fallback para localStorage (dados não criptografados)
    const user = localStorage.getItem('ssw_user');

    return user ? JSON.parse(user) : null;

}



// Redireciona se não estiver logado (Segurança básica)

function checkAuth() {

    if (!getUser() && !window.location.href.includes('index.html')) {

        window.location.href = 'index.html';

    }

}