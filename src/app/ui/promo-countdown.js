// Optional campaign countdown: only use an explicit campaign end date.
let countdownInterval;
function updateCountdown() {
    const banner = document.getElementById('promo-banner');
    const deadline = Date.parse(banner?.dataset.endsAt || '');
    if (!Number.isFinite(deadline) || deadline <= Date.now()) {
        if (banner) banner.style.display = 'none';
        clearInterval(countdownInterval);
        countdownInterval = null;
        return;
    }
    const totalSeconds = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
    const values = { hours: Math.floor(totalSeconds / 3600), minutes: Math.floor((totalSeconds % 3600) / 60), seconds: totalSeconds % 60 };
    Object.entries(values).forEach(([name, value]) => {
        const element = document.getElementById(`countdown-${name}`);
        if (element) element.textContent = String(value).padStart(2, '0');
    });
}
function startCountdown() {
    clearInterval(countdownInterval);
    updateCountdown();
    const banner = document.getElementById('promo-banner');
    if (banner && Date.parse(banner.dataset.endsAt || '') > Date.now()) {
        countdownInterval = setInterval(updateCountdown, 1000);
    }
}
function updateContadorPessoas() {
    // No verified live purchase count is supplied by the API.
    const counter = document.getElementById('contador-pessoas');
    if (counter) counter.parentElement.hidden = true;
}
document.addEventListener('DOMContentLoaded', updateContadorPessoas);
