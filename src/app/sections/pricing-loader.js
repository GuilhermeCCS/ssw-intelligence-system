// Carrega a seção de preços dinamicamente
async function loadPricingSection() {
    try {
        const response = await fetch('src/components/pricing/pricing-component.html');
        if (!response.ok) {
            throw new Error(`Falha ao carregar preços: ${response.status}`);
        }
        const html = await response.text();
        document.getElementById('view-precos-container').innerHTML = html;
        // Recria ícones Lucide após carregar
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        // Dispara evento para inicializar o carrossel
        window.dispatchEvent(new Event('loadPricingSection'));
        if (window.location.pathname.replace('/', '') === 'precos' && typeof nav === 'function') {
            nav('precos');
        }
    } catch (error) {
        console.error('Erro ao carregar seção de preços:', error);
    }
}

// Carrega a seção quando a página estiver pronta
document.addEventListener('DOMContentLoaded', loadPricingSection);
