async function loadStandalonePricingPage() {
    const container = document.getElementById('pricingPageRoot');
    if (!container) return;

    try {
        const response = await fetch('/src/components/pricing/pricing-component.fragment?v=20260628-pricing-trust-v5', { redirect: 'error', cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`Falha ao carregar preços: ${response.status}`);
        }

        const html = await response.text();
        if (!html.includes('id="view-precos"') || /<html[\s>]/i.test(html)) {
            throw new Error('Resposta inválida ao carregar preços.');
        }

        container.innerHTML = html;
        document.getElementById('view-precos')?.classList.remove('hidden');

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        window.dispatchEvent(new Event('loadPricingSection'));
    } catch (error) {
        console.error('Erro ao carregar página de preços:', error);
        container.innerHTML = `
            <section class="pricing-page-error">
                <h1>Não foi possível carregar os preços</h1>
                <p>Recarregue a página ou tente novamente em alguns instantes.</p>
                <a href="/home">Voltar para a plataforma</a>
            </section>
        `;
    }
}

document.addEventListener('DOMContentLoaded', loadStandalonePricingPage);
