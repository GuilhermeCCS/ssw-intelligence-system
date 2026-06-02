// Variável global para o timer
let intervaloReenvio;
function iniciarContagemReenvio() {
    let tempo = 30;
    const link = document.getElementById('linkReenviar');
    const span = document.getElementById('timerReenvio');
    // Reseta estado visual (desabilitado)
    link.classList.add('pointer-events-none', 'opacity-50');
    link.classList.remove('text-primary', 'hover:underline');
    link.classList.add('text-slate-400');
    // Limpa intervalo anterior se existir
    if (intervaloReenvio) clearInterval(intervaloReenvio);
    // Inicia contagem
    intervaloReenvio = setInterval(() => {
        tempo--;
        span.innerText = tempo;
        if (tempo <= 0) {
            clearInterval(intervaloReenvio);
            // Habilita o link
            link.innerHTML = "Reenviar código agora";
            link.classList.remove('pointer-events-none', 'opacity-50', 'text-slate-400');
            link.classList.add('text-primary', 'hover:underline');
        }
    }, 1000);
}
async function reenviarCodigo() {
    const link = document.getElementById('linkReenviar');

    // Determina qual email usar (fluxo de login ou cadastro)
    let emailParaReenviar;

    if (USER && USER.email) {
        // Fluxo normal de login (usuário já logado)
        emailParaReenviar = USER.email;
    } else if (emailTemporario) {
        // Fluxo de cadastro (usuário acabou de se cadastrar)
        emailParaReenviar = emailTemporario;
    } else {
        Toast.error("Usuário não encontrado. Faça login novamente.");
        logout();
        return;
    }

    // Efeito visual de "Enviando..."
    link.innerHTML = "Enviando...";
    link.classList.add('pointer-events-none', 'opacity-50');
    try {
        const res = await fetch(`${API_URL}/api/reenviar_codigo`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ email: emailParaReenviar })
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            Toast.success("Novo código enviado! Verifique seu e-mail.");
            // Reinicia a contagem de 30s
            link.innerHTML = 'Reenviar código em <span id="timerReenvio">30</span>s';
            iniciarContagemReenvio();
        } else {
            Toast.error(data.detail || "Erro ao reenviar. Tente novamente.");
            link.innerHTML = "Tentar novamente";
            link.classList.remove('pointer-events-none', 'opacity-50');
        }
    } catch (error) {
        console.error("Erro ao reenviar código:", error);
        Toast.error("Erro de conexão. Tente novamente.");
        link.innerHTML = "Tentar novamente";
        link.classList.remove('pointer-events-none', 'opacity-50');
    }
}
// Inicializa o sistema de autenticação
document.addEventListener('DOMContentLoaded', function() {
    // Inicializa o formulário de login com a view padrão
    if (document.getElementById('loginContent')) {
        renderAuthView();
    }
});
