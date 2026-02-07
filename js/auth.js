// js/auth.js
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
            localStorage.setItem('ssw_user', JSON.stringify(data));
            window.location.href = 'dashboard.html';
        } else {
            msg.innerText = data.detail || "Erro ao entrar.";
        }
    } catch (e) { msg.innerText = "Sem conexão com o servidor."; }
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
        alert(data.msg || data.detail);
    } catch (e) { alert("Erro de conexão"); }
}