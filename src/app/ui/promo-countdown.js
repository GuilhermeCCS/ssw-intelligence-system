// SCRIPT DE CONTAGEM REGRESSIVA DA PROMOÇÃO
let countdownInterval;
let totalSeconds = 72 * 60 * 60; // 72 horas em segundos
function updateCountdown() {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const hoursEl = document.getElementById('countdown-hours');
    const minutesEl = document.getElementById('countdown-minutes');
    const secondsEl = document.getElementById('countdown-seconds');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, '0');
    if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, '0');
    if (totalSeconds > 0) {
        totalSeconds--;
    } else {
        clearInterval(countdownInterval);
        // Promoção expirada
        const promoBanner = document.getElementById('promo-banner');
        if (promoBanner) {
            promoBanner.innerHTML = `
                <div class="text-center py-3">
                    <h2 class="text-2xl font-black uppercase tracking-wider">PROMOÇÃO ENCERRADA!</h2>
                    <p class="text-lg">Não se preocupe, novas ofertas em breve!</p>
                </div>
            `;
        }
    }
}
// Iniciar contagem regressiva quando a seção de preços for visível
function startCountdown() {
    if (document.getElementById('countdown-hours')) {
        updateCountdown();
        countdownInterval = setInterval(updateCountdown, 1000);
    }
}
// Contador de pessoas comprando (efeito social proof)
let pessoasComprando = Math.floor(Math.random() * 81) + 20; // Valor inicial aleatório entre 20-100
function updateContadorPessoas() {
    const contadorEl = document.getElementById('contador-pessoas');
    if (contadorEl) {
        // Gera valor aleatório entre 20-80
        pessoasComprando = Math.floor(Math.random() * 61) + 20; // 20 a 80
        contadorEl.textContent = pessoasComprando;
    }
}
// Iniciar contadores quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        // Banner só aparece na seção de preços
        if (USER && USER.email) {
            const promoBanner = document.getElementById('promo-banner');
            if (promoBanner) {
                promoBanner.style.display = 'none'; // Escondido por padrão
                startCountdown();
                setInterval(updateContadorPessoas, 120000); // Atualiza a cada 2 minutos
            }
        }
    }, 1000);
});
