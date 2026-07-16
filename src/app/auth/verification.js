let intervaloReenvio;

function setReenviarButtonState(button, { disabled, label, muted = disabled }) {
    if (!button) return;
    button.disabled = disabled;
    button.innerHTML = label;
    button.classList.toggle('opacity-50', muted);
    button.classList.toggle('text-slate-400', muted);
    button.classList.toggle('text-primary', !muted);
    button.classList.toggle('hover:underline', !muted);
}

function iniciarContagemReenvio() {
    let tempo = 30;
    const button = document.getElementById('linkReenviar');
    if (!button) return;

    if (intervaloReenvio) clearInterval(intervaloReenvio);
    setReenviarButtonState(button, {
        disabled: true,
        label: 'Reenviar código em <span id="timerReenvio">30</span>s'
    });

    intervaloReenvio = setInterval(() => {
        tempo--;
        const timer = document.getElementById('timerReenvio');
        if (timer) timer.innerText = tempo;

        if (tempo <= 0) {
            clearInterval(intervaloReenvio);
            setReenviarButtonState(button, {
                disabled: false,
                label: 'Reenviar código agora',
                muted: false
            });
        }
    }, 1000);
}

async function reenviarCodigo() {
    const button = document.getElementById('linkReenviar');
    if (!button || button.disabled) return;

    let emailParaReenviar;

    if (typeof emailTemporario !== 'undefined' && emailTemporario) {
        emailParaReenviar = emailTemporario;
    } else if (USER && USER.email) {
        emailParaReenviar = USER.email;
    } else {
        Toast.error('Usuário não encontrado. Faça login novamente.');
        logout();
        return;
    }

    setReenviarButtonState(button, {
        disabled: true,
        label: 'Enviando...'
    });

    try {
        const res = await fetch(`${API_URL}/api/reenviar_codigo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: emailParaReenviar })
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok) {
            Toast.success('Novo código enviado! Verifique seu e-mail.');
            iniciarContagemReenvio();
            return;
        }

        Toast.error(data.detail || 'Erro ao reenviar. Tente novamente.');
        setReenviarButtonState(button, {
            disabled: false,
            label: 'Tentar novamente',
            muted: false
        });
    } catch (error) {
        console.error('Erro ao reenviar código:', error);
        Toast.error('Erro de conexão. Tente novamente.');
        setReenviarButtonState(button, {
            disabled: false,
            label: 'Tentar novamente',
            muted: false
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('loginContent')) {
        renderAuthView();
    }
});
