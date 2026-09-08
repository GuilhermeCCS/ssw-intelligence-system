function closePromoBanner() {
    document.getElementById('promo-banner')?.remove();
}
function showPromoBanner() {
    const banner = document.getElementById('promo-banner');
    if (!banner || Date.parse(banner.dataset.endsAt || '') <= Date.now() || !Number.isFinite(Date.parse(banner.dataset.endsAt || ''))) return;
    banner.style.display = 'block';
    updateContadorPessoas();
    startCountdown();
}
