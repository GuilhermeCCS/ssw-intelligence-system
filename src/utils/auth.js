// js/auth.js
const API_URL = window.ENV?.API_URL || "https://ssw-intelligence-api.onrender.com";
async function fazerLogin() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const msg = document.getElementById('msg');

    try {
        const res = await fetch(`${API_URL}/api/login`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email, senha })
        });
        const data = await res.json();
        
        if (res.ok) {
            // Criptografa dados sensíveis antes de salvar
            if (typeof secureStorage !== 'undefined') {
                await secureStorage.setItem('USER', data);
            } else {
                localStorage.setItem('USER', JSON.stringify(data));
            }
            window.location.href = '/home';
        } else {
            msg.innerText = "Não foi possível entrar. Confira os dados e tente novamente.";
        }
    } catch (e) { 
        console.error('Erro de login:');
        
        // Verifica se é erro de rede/conexão
        if (e.name === 'TypeError' && e.message.includes('fetch')) {
            msg.innerText = "Sem conexão com o servidor.";
        } else if (e.name === 'SyntaxError') {
            msg.innerText = "Erro na resposta do servidor.";
        } else {
            msg.innerText = "Ocorreu um erro inesperado.";
        }
    }
}

async function fazerCadastro() {
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    // Para simplificar, usamos o email como nome no cadastro rápido
    try {
        const res = await fetch(`${API_URL}/api/register`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ nome: email.split('@')[0], email, senha })
        });
        const data = await res.json();
        alert(res.ok ? "Cadastro iniciado. Verifique seu e-mail." : "Não foi possível iniciar o cadastro. Confira seus dados e tente novamente.");
    } catch (e) { 
        console.error('Erro de cadastro:');
        
        // Verifica se é erro de rede/conexão
        if (e.name === 'TypeError' && e.message.includes('fetch')) {
            alert("Sem conexão com o servidor.");
        } else if (e.name === 'SyntaxError') {
            alert("Erro na resposta do servidor.");
        } else {
            alert("Ocorreu um erro inesperado.");
        }
    }
}