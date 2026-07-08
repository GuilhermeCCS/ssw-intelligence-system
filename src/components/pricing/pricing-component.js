// =============================================================
//  pricing-component.js — SSW Pricing Section
//  Estrutura idêntica ao original: estilos injetados no <head>,
//  lógica de FAQ inicializada via evento loadPricingSection
// =============================================================

function sswPricingNotify(type, message) {
    if (typeof Toast !== 'undefined' && Toast && typeof Toast[type] === 'function') {
        Toast[type](message);
        return;
    }
    if (type === 'error') console.error(message);
    else console.log(message);
}

async function getSswPricingUser() {
    if (typeof USER !== 'undefined' && USER && USER.email) return USER;
    if (window.USER && window.USER.email) return window.USER;

    try {
        if (typeof secureStorage !== 'undefined' && secureStorage && typeof secureStorage.getItem === 'function') {
            const storedUser = await secureStorage.getItem('USER');
            if (storedUser && storedUser.email) return storedUser;
        }
    } catch (error) {
        console.warn('Não foi possível ler o usuário criptografado para checkout:', error);
    }

    try {
        const rawUser = localStorage.getItem('USER');
        if (rawUser) {
            const parsedUser = JSON.parse(rawUser);
            if (parsedUser && parsedUser.email) return parsedUser;
        }
    } catch (error) {
        console.warn('Não foi possível ler o usuário local para checkout:', error);
    }

    return null;
}

function redirectSswPricingAuth() {
    if (typeof showAuthScreen === 'function') {
        showAuthScreen('register');
        return;
    }
    window.location.href = '/cadastro';
}

const SSW_PRICING_PACKAGES = {
    freelancer_10_mensal: { id: 'freelancer_10_mensal', nome: 'Freelancer Mensal - 10 Créditos', preco: 99.00, creditos: 10 },
    freelancer_15_mensal: { id: 'freelancer_15_mensal', nome: 'Freelancer Mensal - 15 Créditos', preco: 129.00, creditos: 15 },
    freelancer_20_mensal: { id: 'freelancer_20_mensal', nome: 'Freelancer Mensal - 20 Créditos', preco: 159.00, creditos: 20 },
    freelancer_10_anual: { id: 'freelancer_10_anual', nome: 'Freelancer Anual - 120 Créditos', preco: 948.00, creditos: 120 },
    freelancer_15_anual: { id: 'freelancer_15_anual', nome: 'Freelancer Anual - 180 Créditos', preco: 1236.00, creditos: 180 },
    freelancer_20_anual: { id: 'freelancer_20_anual', nome: 'Freelancer Anual - 240 Créditos', preco: 1524.00, creditos: 240 },
    agencia_20_mensal: { id: 'agencia_20_mensal', nome: 'Agência Mensal - 20 Créditos', preco: 149.00, creditos: 20 },
    agencia_30_mensal: { id: 'agencia_30_mensal', nome: 'Agência Mensal - 30 Créditos', preco: 179.00, creditos: 30 },
    agencia_40_mensal: { id: 'agencia_40_mensal', nome: 'Agência Mensal - 40 Créditos', preco: 219.00, creditos: 40 },
    agencia_20_anual: { id: 'agencia_20_anual', nome: 'Agência Anual - 240 Créditos', preco: 1428.00, creditos: 240 },
    agencia_30_anual: { id: 'agencia_30_anual', nome: 'Agência Anual - 360 Créditos', preco: 1716.00, creditos: 360 },
    agencia_40_anual: { id: 'agencia_40_anual', nome: 'Agência Anual - 480 Créditos', preco: 2100.00, creditos: 480 },
    agencia_50_mensal: { id: 'agencia_20_mensal', nome: 'Agência Mensal - 20 Créditos', preco: 149.00, creditos: 20 },
    agencia_75_mensal: { id: 'agencia_30_mensal', nome: 'Agência Mensal - 30 Créditos', preco: 179.00, creditos: 30 },
    agencia_100_mensal: { id: 'agencia_40_mensal', nome: 'Agência Mensal - 40 Créditos', preco: 219.00, creditos: 40 },
    agencia_50_anual: { id: 'agencia_20_anual', nome: 'Agência Anual - 240 Créditos', preco: 1428.00, creditos: 240 },
    agencia_75_anual: { id: 'agencia_30_anual', nome: 'Agência Anual - 360 Créditos', preco: 1716.00, creditos: 360 },
    agencia_100_anual: { id: 'agencia_40_anual', nome: 'Agência Anual - 480 Créditos', preco: 2100.00, creditos: 480 },
    pacote_basico: { id: 'freelancer_10_mensal', nome: 'Freelancer Mensal - 10 Créditos', preco: 99.00, creditos: 10 },
    pacote_recomendado: { id: 'agencia_20_mensal', nome: 'Agência Mensal - 20 Créditos', preco: 149.00, creditos: 20 },
    basico: { id: 'freelancer_10_mensal', nome: 'Freelancer Mensal - 10 Créditos', preco: 99.00, creditos: 10 },
    recomendado: { id: 'agencia_20_mensal', nome: 'Agência Mensal - 20 Créditos', preco: 149.00, creditos: 20 },
    recarga_10: { id: 'recarga_10', nome: 'Recarga 10 Créditos', preco: 47.00, creditos: 10 },
    recarga_40: { id: 'recarga_40', nome: 'Recarga 40 Créditos', preco: 167.00, creditos: 40 },
    recarga_90: { id: 'recarga_90', nome: 'Recarga 90 Créditos', preco: 347.00, creditos: 90 },
};

// --- FUNÇÃO DE COMPRA (CHECKOUT MERCADO PAGO) ---
async function comprarPlano(pacoteId) {
    const activeUser = await getSswPricingUser();
    if (!activeUser || !activeUser.email) {
        redirectSswPricingAuth();
        return;
    }
    const pacoteSelecionado = SSW_PRICING_PACKAGES[pacoteId];
    if (!pacoteSelecionado) { sswPricingNotify('error', "Pacote não encontrado."); return; }
    try {
        await openCheckout(pacoteSelecionado, activeUser);
    } catch (error) {
        console.error('Erro ao abrir checkout:', error);
        sswPricingNotify('error', "Erro ao abrir checkout. Tente novamente.");
    }
}

// --- FUNÇÃO PARA FALAR COM VENDAS ---
function falarComVendas() {
    window.open('https://wa.me/5582991301991?text=Olá! gostaria de saber um pouco mais sobre o pacote empresarial', '_blank');
}

// --- FAQ ACCORDION (escopo ssw para não conflitar) ---
function sswToggleFAQ(trigger) {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    const root = trigger.closest('#view-precos') || document;
    // Fecha todos dentro da seção de preços
    root.querySelectorAll('.ssw-faq-trigger').forEach(t => {
        t.setAttribute('aria-expanded', 'false');
        if (t.nextElementSibling) t.nextElementSibling.style.maxHeight = '0';
    });
    // Abre o clicado (se estava fechado)
    if (!isOpen) {
        trigger.setAttribute('aria-expanded', 'true');
        const body = trigger.nextElementSibling;
        if (body) body.style.maxHeight = body.scrollHeight + 'px';
    }
    // Recriar ícones Lucide após mudança de estado
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function sswSetBillingCycle(cycle = 'monthly') {
    const root = document.getElementById('view-precos');
    if (!root) return;
    const selectedCycle = cycle === 'annual' ? 'annual' : 'monthly';
    root.dataset.billingCycle = selectedCycle;
    root.querySelectorAll('.ssw-billing-toggle button').forEach(button => {
        button.classList.toggle('is-active', button.dataset.cycle === selectedCycle);
    });
    root.querySelectorAll('[data-plan-card]').forEach(card => sswUpdatePlanCard(card));
}

function sswGetBillingCycle() {
    const root = document.getElementById('view-precos');
    return root?.dataset.billingCycle === 'annual' ? 'annual' : 'monthly';
}

function sswUpdatePlanCard(card) {
    if (!card) return;
    const selectedCycle = sswGetBillingCycle();
    const selectedOption = card.querySelector('.ssw-credit-options button.is-active') || card.querySelector('.ssw-credit-options button');
    const amount = card.querySelector('.ssw-amount');
    const creditNote = card.querySelector('.ssw-credit-note');
    const installment = card.querySelector('.ssw-installment');

    if (!selectedOption || !amount) return;

    const price = selectedCycle === 'annual'
        ? selectedOption.dataset.annualPrice
        : selectedOption.dataset.monthlyPrice;
    const label = selectedCycle === 'annual'
        ? selectedOption.dataset.annualLabel
        : selectedOption.dataset.monthlyLabel;

    if (price) amount.textContent = price;
    if (creditNote && label) creditNote.textContent = label;
    if (installment) {
        const packageId = selectedOption.dataset.packageAnnual || selectedOption.dataset.packageMonthly || '';
        const packageData = SSW_PRICING_PACKAGES[packageId];
        if (selectedCycle === 'annual' && packageData?.preco) {
            installment.textContent = `Plano anual: R$ ${Number(packageData.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (price) {
            const monthlyPrice = Number(price);
            installment.textContent = `ou 12x de R$ ${(monthlyPrice / 10).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sem juros`;
        }
    }
}

function sswSelectCreditOption(button) {
    const group = button?.closest('.ssw-credit-options');
    const card = button?.closest('[data-plan-card]');
    if (!group || !card) return;
    group.querySelectorAll('button').forEach(option => {
        option.classList.toggle('is-active', option === button);
    });
    sswUpdatePlanCard(card);
}

function comprarPlanoFromCard(button) {
    const card = button?.closest('[data-plan-card]');
    const selectedOption = card?.querySelector('.ssw-credit-options button.is-active') || card?.querySelector('.ssw-credit-options button');
    if (!selectedOption) {
        comprarPlano(card?.dataset.planCard === 'agencia' ? 'agencia_20_mensal' : 'freelancer_10_mensal');
        return;
    }
    const selectedCycle = sswGetBillingCycle();
    const packageId = selectedCycle === 'annual'
        ? selectedOption.dataset.packageAnnual
        : selectedOption.dataset.packageMonthly;
    comprarPlano(packageId);
}

function comprarPlanoRecomendadoAtual() {
    comprarPlano(sswGetBillingCycle() === 'annual' ? 'agencia_20_anual' : 'agencia_20_mensal');
}

// --- INICIALIZAÇÃO DA SEÇÃO DE PREÇOS ---
function initPricingSection() {
    // Recriar ícones Lucide após injeção do HTML
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Inicializar FAQ: garantir que todos os bodies começam fechados
    document.querySelectorAll('.ssw-faq-body').forEach(body => {
        body.style.maxHeight = '0';
        body.style.overflow = 'hidden';
        body.style.transition = 'max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1)';
    });

    sswSetBillingCycle('monthly');

    const animatedPricingElements = '.ssw-hero-inner, .ssw-billing-toggle, .ssw-plan-card, .ssw-table-section, .ssw-cta-card, .ssw-faq-section';

    // Inicializar animações de entrada (Intersection Observer)
    if ('IntersectionObserver' in window) {
        document.getElementById('view-precos')?.classList.add('ssw-observe');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('ssw-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.16, rootMargin: '0px 0px -14% 0px' });

        // Hero e CTA sem delay
        document.querySelectorAll('.ssw-hero-inner, .ssw-billing-toggle, .ssw-cta-card, .ssw-table-section').forEach(el => {
            observer.observe(el);
        });

        // Cards de planos com delay sequencial
        document.querySelectorAll('.ssw-plan-card').forEach((el, index) => {
            el.style.transitionDelay = `${index * 0.38}s`;
            observer.observe(el);
        });

        // FAQ com delay
        document.querySelectorAll('.ssw-faq-section').forEach(el => {
            el.style.transitionDelay = '0.45s';
            observer.observe(el);
        });

        setTimeout(() => {
            document.querySelectorAll('.ssw-hero-inner').forEach(el => {
                el.classList.add('ssw-visible');
            });
        }, 900);
    } else {
        document.querySelectorAll(animatedPricingElements).forEach(el => {
            el.classList.add('ssw-visible');
        });
    }
}

document.addEventListener('DOMContentLoaded', initPricingSection);
window.addEventListener('loadPricingSection', initPricingSection);

// =============================================================
//  CSS — injetado no <head> (mesmo padrão do original)
// =============================================================
const sswPricingStyles = `<style>
/* ── RESET DE ESCOPO ── */
#view-precos * { box-sizing: border-box; }

/* ── VARIÁVEIS ── */
#view-precos {
    --ssw-bg:        #020408;
    --ssw-surface:   #070707;
    --ssw-card:      #050505;
    --ssw-card-h:    #0b0b0d;
    --ssw-border:    rgba(255,255,255,0.10);
    --ssw-border-a:  rgba(255,255,255,0.22);
    --ssw-t1:        #f0f4ff;
    --ssw-t2:        #8292a8;
    --ssw-t3:        #3d4f63;
    --ssw-cyan:      #22d3ee;
    --ssw-cyan-dim:  rgba(34,211,238,0.12);
    --ssw-cyan-glow: rgba(34,211,238,0.22);
    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
    color: var(--ssw-t1);
    -webkit-font-smoothing: antialiased;
    width: 100%;
    max-width: 100%;
    overflow-x: hidden;
}

/* Controle de background quando view de preços está ativa */
body.pricing-view-active {
    background: #020408 !important;
}

body.pricing-view-active #appSidebar,
body.pricing-view-active aside#appSidebar {
    background: transparent !important;
}

body.pricing-view-active #appSidebar > div:first-child {
    background: transparent !important;
}

/* Garante que o modal de pagamento não seja afetado */
body.pricing-view-active #checkout-modal,
body.pricing-view-active #checkout-modal > div,
body.pricing-view-active #checkout-modal .bg-\[\#0F1117\] {
    background: #0F1117 !important;
}

/* ── ANIMAÇÕES ── */
@keyframes ssw-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}
.ssw-plan-card, .ssw-hero-inner, .ssw-cta-card, .ssw-faq-section {
    opacity: 1;
    transform: translateY(0);
    transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1);
}
#view-precos.ssw-observe .ssw-plan-card:not(.ssw-visible),
#view-precos.ssw-observe .ssw-hero-inner:not(.ssw-visible),
#view-precos.ssw-observe .ssw-cta-card:not(.ssw-visible),
#view-precos.ssw-observe .ssw-faq-section:not(.ssw-visible) {
    opacity: 0;
    transform: translateY(18px);
}
.ssw-plan-card.ssw-visible,
.ssw-hero-inner.ssw-visible,
.ssw-cta-card.ssw-visible,
.ssw-faq-section.ssw-visible { opacity: 1 !important; transform: translateY(0) !important; }

/* ── HERO ── */
.ssw-pricing-hero {
    padding: 50px 24px 40px;
    text-align: center;
    position: relative;
}
.ssw-hero-glow {
    position: absolute;
    top: -100px; left: 50%; transform: translateX(-50%);
    width: 1200px; height: 600px;
    max-width: 100vw;
    background: radial-gradient(ellipse at center, rgba(34,211,238,0.03) 0%, rgba(34,211,238,0.01) 40%, transparent 70%);
    pointer-events: none;
    filter: blur(60px);
}
.ssw-hero-inner { max-width: 980px; margin: 0 auto 10px; }

.ssw-badge {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 5px 16px;
    border-radius: 99px;
    border: 1px solid var(--ssw-border-a);
    background: var(--ssw-cyan-dim);
    font-size: 12px;
    font-weight: 500;
    color: var(--ssw-cyan);
    letter-spacing: 0.04em;
    margin-bottom: 28px;
}
.ssw-badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--ssw-cyan);
    box-shadow: 0 0 6px var(--ssw-cyan);
    flex-shrink: 0;
}
.ssw-hero-title {
    display: block;
    font-size: 72px;
    font-weight: 800;
    line-height: 0.96;
    letter-spacing: 0;
    color: var(--ssw-t1);
    margin: 0 auto 14px;
    text-wrap: balance;
}
.ssw-hero-title em {
    display: inline;
    font-style: normal;
    color: inherit;
}
.ssw-hero-sub {
    font-size: 16.5px;
    color: var(--ssw-t2);
    max-width: 520px;
    margin: 0 auto;
    line-height: 1.7;
}
.ssw-guarantees {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 28px;
    margin-top: 20px;
    flex-wrap: wrap;
}
.ssw-guarantee-item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 13px;
    font-weight: 500;
    color: var(--ssw-t2);
}
.ssw-g-icon { width: 14px; height: 14px; color: var(--ssw-cyan); }
.ssw-free-trial-banner {
    max-width: 720px;
    margin: 24px auto 0;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 18px;
    border: 1px solid rgba(34,211,238,0.24);
    border-radius: 8px;
    background: rgba(34,211,238,0.07);
    padding: 16px;
    text-align: left;
}
.ssw-free-trial-banner strong {
    display: block;
    color: var(--ssw-t1);
    font-size: 15px;
    font-weight: 800;
    margin-bottom: 4px;
}
.ssw-free-trial-banner span {
    display: block;
    color: var(--ssw-t2);
    font-size: 13px;
    line-height: 1.5;
}
.ssw-free-trial-banner button {
    min-height: 40px;
    border: 1px solid rgba(34,211,238,0.42);
    border-radius: 8px;
    background: #bdf4ff;
    color: #031018;
    cursor: pointer;
    font-size: 13px;
    font-weight: 900;
    padding: 0 16px;
    white-space: nowrap;
}

/* ── PLANS GRID ── */
.ssw-plans-section {
    padding: 28px 24px 52px;
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
}
.ssw-plans-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    align-items: stretch;
    width: 100%;
    min-width: 0;
}

/* CARD BASE */
.ssw-plan-card {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--ssw-card);
    border: 1px solid var(--ssw-border);
    border-radius: 20px;
    padding: 34px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s, transform 0.3s, background 0.3s, opacity 0.6s, box-shadow 0.3s;
}
.ssw-card-top-shine {
    display: none;
}
.ssw-plan-card:hover {
    border-color: rgba(255,255,255,0.18);
    background: var(--ssw-card-h);
    transform: translateY(-3px) !important;
    box-shadow: 0 12px 40px rgba(0,0,0,0.35);
}

/* CARD DESTAQUE */
.ssw-plan-featured {
    border-color: rgba(255,255,255,0.18) !important;
    background: var(--ssw-card) !important;
    transform: none !important;
}
.ssw-plan-featured:hover {
    transform: translateY(-3px) !important;
}
/* BADGE DO PLANO */
.ssw-plan-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 13px;
    border-radius: 99px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.16);
    color: var(--ssw-t1);
    width: fit-content;
    margin-bottom: 22px;
}
.ssw-star-icon { width: 12px; height: 12px; }

/* NOMES */
.ssw-plan-name {
    font-size: 26px;
    font-weight: 800;
    color: var(--ssw-t1);
    margin-bottom: 10px;
}
.ssw-name-accent { color: var(--ssw-t1); }

.ssw-plan-desc {
    font-size: 15px;
    color: var(--ssw-t2);
    line-height: 1.65;
    min-height: 52px;
    margin-bottom: 32px;
}

/* PREÇO */
.ssw-price-block { margin-bottom: 32px; }
.ssw-price-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    gap: 4px;
    margin-bottom: 8px;
    min-width: 0;
}
.ssw-currency { font-size: 22px; font-weight: 800; color: var(--ssw-t3); }
.ssw-currency-accent { color: var(--ssw-t2) !important; }
.ssw-amount {
    font-size: 64px;
    font-weight: 850;
    letter-spacing: 0;
    color: var(--ssw-t1);
    line-height: 1;
}
.ssw-cents { font-size: 23px; font-weight: 800; color: var(--ssw-t3); align-self: flex-start; margin-top: 10px; }
.ssw-cents-accent { color: var(--ssw-t2) !important; }
.ssw-price-note { font-size: 13px; color: var(--ssw-t3); font-weight: 600; }
.ssw-price-tag {
    display: inline-flex;
    align-items: center;
    padding: 5px 12px;
    border-radius: 6px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.12);
    font-size: 12.5px;
    font-weight: 700;
    color: var(--ssw-t1);
    margin-top: 10px;
}
.ssw-price-consult-wrap { display: flex; align-items: center; height: 82px; }
.ssw-price-consult { font-size: 36px; font-weight: 850; color: var(--ssw-t1); letter-spacing: 0; }

/* BOTÕES */
.ssw-btn {
    display: block;
    width: 100%;
    min-height: 54px;
    padding: 15px 22px;
    border-radius: 14px;
    font-size: 16px;
    font-weight: 750;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    text-align: center;
    border: none;
    margin-bottom: 32px;
    font-family: inherit;
}
.ssw-btn-default {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--ssw-t1);
}
.ssw-btn-default:hover {
    background: rgba(255,255,255,0.09);
    border-color: rgba(255,255,255,0.18);
}
.ssw-btn-primary {
    background: #ffffff;
    color: #020408;
    font-weight: 700;
    box-shadow: 0 10px 24px rgba(0,0,0,0.36);
}
.ssw-btn-primary:hover {
    background: #e8edf4;
    box-shadow: 0 14px 30px rgba(0,0,0,0.42);
    transform: translateY(-1px);
}
.ssw-btn-outline {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--ssw-t1);
}
.ssw-btn-outline:hover {
    border-color: rgba(255,255,255,0.2);
    background: rgba(255,255,255,0.04);
}

/* DIVISOR E FEATURES */
.ssw-divider { border: none; border-top: 1px solid var(--ssw-border); margin-bottom: 26px; }
.ssw-features-label {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ssw-t3);
    margin-bottom: 18px;
}
.ssw-features-label-bright { color: rgba(255,255,255,0.45) !important; }
.ssw-feature-list { list-style: none; display: flex; flex-direction: column; gap: 15px; flex: 1; }
.ssw-feature-item {
    display: flex;
    align-items: flex-start;
    gap: 11px;
    font-size: 15px;
    color: var(--ssw-t2);
    line-height: 1.55;
}
.ssw-feature-item strong { color: var(--ssw-t1); font-weight: 600; }
.ssw-check-dim  { width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; color: rgba(255,255,255,0.28); }
.ssw-check-accent { width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; color: var(--ssw-t1); }

/* ── TABELA ── */
.ssw-table-section {
    padding: 72px 24px 72px;
    max-width: 1140px;
    margin: 0 auto;
    display: block;
}
@media (max-width: 900px) { .ssw-table-section { display: none; } }
.ssw-table-header { text-align: center; margin-bottom: 44px; }
.ssw-section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ssw-cyan);
    margin-bottom: 10px;
}
.ssw-section-title {
    font-size: 34px;
    font-weight: 800;
    letter-spacing: 0;
    color: var(--ssw-t1);
    margin-bottom: 8px;
}
.ssw-section-sub { font-size: 15px; color: var(--ssw-t2); }
.ssw-table-wrap {
    border: 1px solid var(--ssw-border);
    border-radius: 18px;
    overflow-x: auto;
    overflow-y: hidden;
    background: var(--ssw-card);
}
.ssw-table { width: 100%; border-collapse: collapse; }
.ssw-table thead tr th {
    padding: 18px 22px;
    font-size: 14px;
    font-weight: 700;
    border-bottom: 1px solid var(--ssw-border);
    text-align: center;
    color: var(--ssw-t1);
}
.ssw-th-feature { text-align: left !important; color: var(--ssw-t3) !important; font-size: 11px !important; text-transform: uppercase; letter-spacing: 0.08em; }
.ssw-th-featured {
    background: rgba(255,255,255,0.035);
    color: var(--ssw-t1) !important;
    border-left: 1px solid var(--ssw-border-a);
    border-right: 1px solid var(--ssw-border-a);
    position: relative;
}
.ssw-th-featured::before {
    display: none;
}
.ssw-group-row td {
    padding: 9px 22px;
    font-size: 10.5px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ssw-t3);
    background: rgba(255,255,255,0.018);
    border-bottom: 1px solid var(--ssw-border);
    border-top: 1px solid var(--ssw-border);
}
.ssw-table tbody tr:not(.ssw-group-row) td {
    padding: 13px 22px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    font-size: 13.5px;
    color: var(--ssw-t2);
    text-align: center;
    transition: background 0.15s;
}
.ssw-table tbody tr:not(.ssw-group-row):hover td { background: rgba(255,255,255,0.02); }
.ssw-td-feature { text-align: left !important; color: var(--ssw-t1) !important; padding-left: 30px !important; }
.ssw-td-featured {
    background: rgba(255,255,255,0.025);
    border-left: 1px solid var(--ssw-border-a);
    border-right: 1px solid var(--ssw-border-a);
    color: var(--ssw-t1) !important;
    font-weight: 600;
}
.ssw-table tbody tr:last-child td { border-bottom: none; }
.ssw-tcheck     { color: var(--ssw-t1); display: flex; justify-content: center; }
.ssw-tcheck-dim { color: rgba(255,255,255,0.25); display: flex; justify-content: center; }
.ssw-tminus     { color: var(--ssw-t3); display: flex; justify-content: center; }
.ssw-ti { width: 15px; height: 15px; }

/* ── FAQ ── */
.ssw-faq-section {
    padding: 72px 24px 90px;
}
.ssw-faq-inner { max-width: 740px; margin: 0 auto; }
.ssw-faq-item { border-bottom: 1px solid var(--ssw-border); }
.ssw-faq-trigger {
    width: 100%;
    background: none;
    border: none;
    padding: 20px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
}
.ssw-faq-question {
    font-size: 15px;
    font-weight: 500;
    color: var(--ssw-t1);
    line-height: 1.5;
    transition: color 0.2s;
}
.ssw-faq-trigger:hover .ssw-faq-question { color: var(--ssw-cyan); }
.ssw-faq-icon {
    flex-shrink: 0;
    width: 18px; height: 18px;
    color: var(--ssw-t3);
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), color 0.2s;
}
.ssw-faq-trigger[aria-expanded="true"] .ssw-faq-icon {
    transform: rotate(45deg);
    color: var(--ssw-cyan);
}
.ssw-faq-body {
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}
.ssw-faq-answer {
    padding: 0 0 20px;
    font-size: 14px;
    color: var(--ssw-t2);
    line-height: 1.8;
}
.ssw-faq-answer strong { color: var(--ssw-t1); font-weight: 600; }

/* ── CTA FINAL ── */
.ssw-cta-section {
    padding: 0 24px 90px;
    width: 100%;
    max-width: 1140px;
    margin: 0 auto;
}
.ssw-cta-card {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
    min-width: 0;
    padding: 68px 48px;
    text-align: center;
    background: linear-gradient(135deg, #0a1628 0%, #0c1a2e 50%, #071220 100%);
    border: 1px solid rgba(34,211,238,0.15);
}
.ssw-cta-grid {
    position: absolute;
    inset: 0;
    background-image: linear-gradient(var(--ssw-border) 1px, transparent 1px), linear-gradient(90deg, var(--ssw-border) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
    pointer-events: none;
}
.ssw-cta-glow {
    position: absolute;
    top: -100px; left: 50%; transform: translateX(-50%);
    width: 700px; height: 400px;
    max-width: 100vw;
    background: radial-gradient(ellipse, rgba(34,211,238,0.09) 0%, transparent 70%);
    pointer-events: none;
}
.ssw-cta-content { position: relative; z-index: 1; }
.ssw-cta-title {
    font-size: 36px;
    font-weight: 800;
    letter-spacing: 0;
    margin-bottom: 14px;
    color: var(--ssw-t1);
}
.ssw-cta-sub {
    font-size: 15.5px;
    color: var(--ssw-t2);
    max-width: 500px;
    margin: 0 auto 32px;
    line-height: 1.7;
}
.ssw-btn-cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    max-width: 100%;
    padding: 15px 30px;
    border-radius: 14px;
    background: white;
    color: #020408;
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    border: none;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    box-shadow: 0 0 30px rgba(255,255,255,0.14), 0 8px 24px rgba(0,0,0,0.4);
}
.ssw-btn-cta:hover {
    background: #e2e8f0;
    transform: translateY(-2px);
    box-shadow: 0 0 42px rgba(255,255,255,0.2), 0 12px 32px rgba(0,0,0,0.45);
}
.ssw-cta-icon { width: 16px; height: 16px; }
.ssw-cta-note { margin-top: 16px; font-size: 13px; color: var(--ssw-t3); }

/* ── RESPONSIVO ── */
@media (max-width: 900px) {
    .ssw-plans-grid { grid-template-columns: 1fr; width: 100%; max-width: min(100%, 460px); margin: 0 auto; }
    .ssw-plan-featured { transform: none !important; }
    .ssw-plan-featured:hover { transform: translateY(-3px) !important; }
    .ssw-cta-card { padding: 48px 24px; }
    .ssw-guarantees { gap: 14px; flex-direction: column; align-items: center; }
    .ssw-free-trial-banner { grid-template-columns: 1fr; text-align: center; }
    .ssw-free-trial-banner button { width: 100%; }
    .ssw-hero-title { font-size: 44px; }
    .ssw-section-title, .ssw-cta-title { font-size: 30px; }
}
@media (max-width: 600px) {
    .ssw-pricing-hero { padding: 40px 16px 30px; }
    .ssw-plans-section, .ssw-faq-section, .ssw-cta-section { padding-left: 16px; padding-right: 16px; }
    .ssw-hero-title { font-size: 32px; }
    .ssw-plan-card { padding: 24px; border-radius: 18px; }
    .ssw-plan-desc { min-height: 0; }
    .ssw-amount { font-size: 50px; }
    .ssw-price-consult { font-size: 30px; }
    .ssw-cta-card { padding: 40px 20px; border-radius: 18px; }
    .ssw-btn-cta { width: 100%; padding-left: 18px; padding-right: 18px; }
}

/* ─────────────────────────────────────────────
   PRICING 2026 — visual claro, conversão e agência
   ───────────────────────────────────────────── */
body.pricing-view-active {
    background: #f8fafc !important;
    color: #0f172a !important;
}

body.pricing-view-active .pricing-page-shell {
    background:
        radial-gradient(circle at 50% 4%, rgba(38, 99, 235, 0.08), transparent 30%),
        linear-gradient(180deg, #ffffff 0%, #f8fafc 56%, #ffffff 100%) !important;
}

body.pricing-view-active .terms-topbar {
    border-bottom: 1px solid #e5eaf0 !important;
    background: rgba(255, 255, 255, 0.92) !important;
}

body.pricing-view-active .terms-brand {
    color: #0f172a !important;
}

body.pricing-view-active .terms-top-actions a {
    color: #111827 !important;
    background: #ffffff !important;
    border-color: #dbe4ee !important;
}

body.pricing-view-active .terms-top-actions a:last-child {
    color: #ffffff !important;
    background: #111827 !important;
    border-color: #111827 !important;
}

#view-precos {
    --ssw-page: #f8fafc;
    --ssw-white: #ffffff;
    --ssw-ink: #0f172a;
    --ssw-muted: #5f6b7a;
    --ssw-soft: #eef4ff;
    --ssw-blue: #3367d6;
    --ssw-blue-2: #2563eb;
    --ssw-line: #dce5ef;
    --ssw-shadow: 0 24px 70px rgba(15, 23, 42, 0.08);
    width: 100%;
    color: var(--ssw-ink) !important;
    background: transparent !important;
    font-family: Inter, 'DM Sans', system-ui, -apple-system, sans-serif !important;
}

#view-precos .ssw-hero-glow,
#view-precos .ssw-card-top-shine,
#view-precos .ssw-cta-glow,
#view-precos .ssw-cta-grid {
    display: none !important;
}

#view-precos .ssw-pricing-hero,
#view-precos .ssw-plans-section,
#view-precos .ssw-fit-section,
#view-precos .ssw-table-section,
#view-precos .ssw-report-proof,
#view-precos .ssw-trust-section,
#view-precos .ssw-faq-section,
#view-precos .ssw-cta-section {
    width: min(1120px, calc(100% - 32px)) !important;
    margin-inline: auto !important;
    padding-inline: 0 !important;
}

#view-precos .ssw-pricing-hero {
    padding-top: 42px !important;
    padding-bottom: 18px !important;
    text-align: center !important;
}

#view-precos .ssw-hero-inner {
    max-width: 980px !important;
    margin: 0 auto !important;
}

#view-precos .ssw-hero-eyebrow {
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    margin: 0 0 14px !important;
    color: var(--ssw-blue) !important;
    font-size: 0.76rem !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.12em !important;
}

#view-precos .ssw-hero-eyebrow::before,
#view-precos .ssw-hero-eyebrow::after {
    content: "✦" !important;
    font-size: 0.78em !important;
}

#view-precos .ssw-hero-title {
    max-width: 760px !important;
    margin: 0 auto !important;
    color: #111827 !important;
    font-size: clamp(2.4rem, 5vw, 4.15rem) !important;
    line-height: 1.04 !important;
    font-weight: 900 !important;
    letter-spacing: -0.055em !important;
}

#view-precos .ssw-hero-title span {
    color: var(--ssw-blue) !important;
}

#view-precos .ssw-hero-sub {
    max-width: 680px !important;
    margin: 18px auto 0 !important;
    color: var(--ssw-muted) !important;
    font-size: 1rem !important;
    line-height: 1.7 !important;
}

#view-precos .ssw-value-strip {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 0 !important;
    max-width: 930px !important;
    margin: 32px auto 0 !important;
    padding: 12px 14px !important;
    border: 1px solid var(--ssw-line) !important;
    border-radius: 14px !important;
    background: rgba(255, 255, 255, 0.78) !important;
    box-shadow: 0 14px 34px rgba(15, 23, 42, 0.045) !important;
}

#view-precos .ssw-value-strip article {
    display: grid !important;
    grid-template-columns: 44px minmax(0, 1fr) !important;
    gap: 12px !important;
    align-items: center !important;
    padding: 8px 14px !important;
    text-align: left !important;
}

#view-precos .ssw-value-strip article:not(:last-child) {
    border-right: 1px solid #e8edf4 !important;
}

#view-precos .ssw-value-strip i {
    width: 38px !important;
    height: 38px !important;
    display: grid !important;
    place-items: center !important;
    padding: 9px !important;
    border-radius: 999px !important;
    color: var(--ssw-blue) !important;
    background: #edf3ff !important;
}

#view-precos .ssw-value-strip strong {
    display: block !important;
    color: #111827 !important;
    font-size: 0.78rem !important;
    font-weight: 850 !important;
}

#view-precos .ssw-value-strip span {
    display: block !important;
    margin-top: 3px !important;
    color: #64748b !important;
    font-size: 0.68rem !important;
    line-height: 1.35 !important;
}

#view-precos .ssw-plans-section {
    padding-top: 26px !important;
    padding-bottom: 28px !important;
}

#view-precos .ssw-plans-grid {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 22px !important;
}

#view-precos .ssw-plan-card {
    position: relative !important;
    min-height: 520px !important;
    display: flex !important;
    flex-direction: column !important;
    padding: 28px !important;
    border-radius: 16px !important;
    background: #ffffff !important;
    border: 1px solid var(--ssw-line) !important;
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.055) !important;
    color: var(--ssw-ink) !important;
    transform: none !important;
}

#view-precos .ssw-plan-featured {
    border-color: #9db7ff !important;
    box-shadow: 0 24px 70px rgba(37, 99, 235, 0.13) !important;
}

#view-precos .ssw-plan-badge {
    position: absolute !important;
    top: -12px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    padding: 5px 14px !important;
    border-radius: 999px !important;
    background: #111827 !important;
    color: #ffffff !important;
    border: 0 !important;
    font-size: 0.66rem !important;
    font-weight: 900 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
}

#view-precos .ssw-plan-badge i {
    width: 13px !important;
    height: 13px !important;
}

#view-precos .ssw-plan-icon {
    width: 62px !important;
    height: 62px !important;
    display: grid !important;
    place-items: center !important;
    margin-bottom: 14px !important;
    border-radius: 999px !important;
    color: var(--ssw-blue) !important;
    background: linear-gradient(135deg, #f3f7ff, #e9f0ff) !important;
}

#view-precos .ssw-plan-icon i {
    width: 30px !important;
    height: 30px !important;
}

#view-precos .ssw-plan-name {
    color: #111827 !important;
    font-size: 1.36rem !important;
    font-weight: 900 !important;
    letter-spacing: -0.025em !important;
}

#view-precos .ssw-plan-desc {
    min-height: 44px !important;
    margin-top: 7px !important;
    color: #5f6b7a !important;
    font-size: 0.88rem !important;
    line-height: 1.5 !important;
}

#view-precos .ssw-price-block {
    margin: 28px 0 18px !important;
}

#view-precos .ssw-price-row {
    display: flex !important;
    align-items: flex-end !important;
    gap: 4px !important;
}

#view-precos .ssw-currency,
#view-precos .ssw-cents,
#view-precos .ssw-period {
    color: #111827 !important;
    font-size: 0.95rem !important;
    font-weight: 800 !important;
}

#view-precos .ssw-amount {
    color: #111827 !important;
    font-size: clamp(3rem, 4.4vw, 4.1rem) !important;
    line-height: 0.88 !important;
    font-weight: 950 !important;
    letter-spacing: -0.06em !important;
}

#view-precos .ssw-period {
    color: #4b5563 !important;
    padding-bottom: 5px !important;
}

#view-precos .ssw-credit-note {
    margin-top: 12px !important;
    color: #4b5563 !important;
    font-size: 0.84rem !important;
    font-weight: 650 !important;
}

#view-precos .ssw-price-chip {
    display: inline-flex !important;
    align-items: center !important;
    gap: 12px !important;
    margin-top: 13px !important;
    padding: 7px 16px !important;
    border-radius: 999px !important;
    color: var(--ssw-blue) !important;
    background: #eef4ff !important;
    font-size: 0.79rem !important;
    font-weight: 850 !important;
}

#view-precos .ssw-price-chip b {
    color: var(--ssw-blue-2) !important;
    font-weight: 900 !important;
}

#view-precos .ssw-price-consult {
    min-height: 74px !important;
    display: flex !important;
    align-items: center !important;
    color: #111827 !important;
    font-size: clamp(2rem, 3vw, 2.45rem) !important;
    font-weight: 900 !important;
    letter-spacing: -0.045em !important;
}

#view-precos .ssw-btn,
#view-precos .ssw-btn-cta {
    min-height: 48px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 10px !important;
    width: 100% !important;
    border-radius: 8px !important;
    padding: 0 18px !important;
    font-family: inherit !important;
    font-size: 0.92rem !important;
    font-weight: 900 !important;
    cursor: pointer !important;
    transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease, background .18s ease !important;
}

#view-precos .ssw-btn:hover,
#view-precos .ssw-btn-cta:hover {
    transform: translateY(-1px) !important;
}

#view-precos .ssw-btn-default,
#view-precos .ssw-btn-primary {
    color: #ffffff !important;
    background: #111827 !important;
    border: 1px solid #111827 !important;
    box-shadow: 0 14px 30px rgba(17, 24, 39, 0.14) !important;
}

#view-precos .ssw-btn-outline {
    color: #111827 !important;
    background: #ffffff !important;
    border: 1px solid #111827 !important;
}

#view-precos .ssw-features-label {
    margin: 28px 0 14px !important;
    color: var(--ssw-blue) !important;
    font-size: 0.72rem !important;
    font-weight: 950 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em !important;
}

#view-precos .ssw-feature-list {
    display: grid !important;
    gap: 12px !important;
    margin: 0 !important;
    padding: 0 !important;
    list-style: none !important;
}

#view-precos .ssw-feature-list li,
#view-precos .ssw-feature-item {
    display: grid !important;
    grid-template-columns: 18px minmax(0, 1fr) !important;
    align-items: start !important;
    gap: 9px !important;
    color: #374151 !important;
    font-size: 0.84rem !important;
    line-height: 1.45 !important;
}

#view-precos .ssw-feature-list i {
    width: 16px !important;
    height: 16px !important;
    margin-top: 2px !important;
    color: var(--ssw-blue) !important;
    background: #eef4ff !important;
    border-radius: 999px !important;
    padding: 2px !important;
}

#view-precos .ssw-fit-section,
#view-precos .ssw-table-section,
#view-precos .ssw-report-proof,
#view-precos .ssw-trust-section,
#view-precos .ssw-faq-section,
#view-precos .ssw-cta-section {
    padding-top: 18px !important;
    padding-bottom: 18px !important;
}

#view-precos .ssw-fit-card,
#view-precos .ssw-trust-card,
#view-precos .ssw-cta-card {
    border: 1px solid var(--ssw-line) !important;
    border-radius: 16px !important;
    background: rgba(255, 255, 255, 0.88) !important;
    box-shadow: 0 18px 50px rgba(15, 23, 42, 0.045) !important;
}

#view-precos .ssw-fit-card {
    padding: 24px 34px !important;
}

#view-precos .ssw-fit-card h2,
#view-precos .ssw-section-title,
#view-precos .ssw-trust-card h2 {
    margin: 0 !important;
    color: #111827 !important;
    font-size: clamp(1.45rem, 2.4vw, 2rem) !important;
    line-height: 1.16 !important;
    font-weight: 900 !important;
    text-align: center !important;
    letter-spacing: -0.035em !important;
}

#view-precos .ssw-fit-grid {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 22px !important;
    margin-top: 24px !important;
}

#view-precos .ssw-fit-grid article {
    display: grid !important;
    grid-template-columns: 64px minmax(0, 1fr) !important;
    gap: 18px !important;
    align-items: center !important;
    padding: 0 20px !important;
}

#view-precos .ssw-fit-grid article:not(:last-child) {
    border-right: 1px solid #e8edf4 !important;
}

#view-precos .ssw-fit-grid i {
    width: 58px !important;
    height: 58px !important;
    color: var(--ssw-blue) !important;
}

#view-precos .ssw-fit-grid strong {
    display: block !important;
    color: #111827 !important;
    font-size: 0.95rem !important;
    font-weight: 900 !important;
}

#view-precos .ssw-fit-grid span {
    display: block !important;
    margin-top: 6px !important;
    color: #4b5563 !important;
    font-size: 0.78rem !important;
    line-height: 1.5 !important;
}

#view-precos .ssw-table-header {
    margin-bottom: 16px !important;
}

#view-precos .ssw-table-wrap {
    overflow: hidden !important;
    border: 1px solid var(--ssw-line) !important;
    border-radius: 14px !important;
    background: #ffffff !important;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.045) !important;
}

#view-precos .ssw-table {
    width: 100% !important;
    border-collapse: collapse !important;
    color: #111827 !important;
    font-size: 0.83rem !important;
}

#view-precos .ssw-table th,
#view-precos .ssw-table td {
    padding: 14px 18px !important;
    border: 1px solid #eef2f7 !important;
    text-align: center !important;
}

#view-precos .ssw-table th:first-child,
#view-precos .ssw-table td:first-child {
    text-align: left !important;
    color: #374151 !important;
    font-weight: 750 !important;
}

#view-precos .ssw-table th {
    color: #111827 !important;
    background: #fbfdff !important;
    font-weight: 900 !important;
}

#view-precos .ssw-group-row td {
    color: #64748b !important;
    background: #f8fafc !important;
    font-size: 0.72rem !important;
    font-weight: 950 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em !important;
}

#view-precos .ssw-table i {
    width: 18px !important;
    height: 18px !important;
    color: var(--ssw-blue) !important;
}

#view-precos .ssw-report-proof {
    display: grid !important;
    grid-template-columns: 0.75fr 1.25fr !important;
    gap: 34px !important;
    align-items: center !important;
    padding-top: 34px !important;
}

#view-precos .ssw-report-copy h2 {
    margin: 0 0 14px !important;
    color: #111827 !important;
    font-size: clamp(1.8rem, 3vw, 2.35rem) !important;
    line-height: 1.08 !important;
    font-weight: 900 !important;
    letter-spacing: -0.045em !important;
}

#view-precos .ssw-report-copy p {
    margin: 0 0 22px !important;
    color: #4b5563 !important;
    line-height: 1.7 !important;
}

#view-precos .ssw-report-copy ul {
    display: grid !important;
    gap: 10px !important;
    margin: 0 !important;
    padding: 0 !important;
    list-style: none !important;
}

#view-precos .ssw-report-copy li {
    display: flex !important;
    align-items: center !important;
    gap: 9px !important;
    color: #374151 !important;
    font-size: 0.9rem !important;
    font-weight: 650 !important;
}

#view-precos .ssw-report-copy i {
    width: 18px !important;
    height: 18px !important;
    color: var(--ssw-blue) !important;
}

#view-precos .ssw-report-preview {
    display: grid !important;
    grid-template-columns: 0.82fr repeat(3, 1fr) !important;
    gap: 12px !important;
    align-items: stretch !important;
}

#view-precos .ssw-report-cover,
#view-precos .ssw-report-page {
    min-height: 245px !important;
    border-radius: 10px !important;
    background: #ffffff !important;
    border: 1px solid var(--ssw-line) !important;
    box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08) !important;
}

#view-precos .ssw-report-cover {
    display: grid !important;
    place-items: center !important;
    align-content: center !important;
    gap: 8px !important;
    color: #ffffff !important;
    background: linear-gradient(180deg, #101827, #050810) !important;
}

#view-precos .ssw-report-cover strong {
    width: 96px !important;
    height: 96px !important;
    display: grid !important;
    place-items: center !important;
    border-radius: 999px !important;
    color: #22c55e !important;
    border: 4px solid #22c55e !important;
    font-size: 2rem !important;
}

#view-precos .ssw-report-cover span {
    font-size: 0.76rem !important;
    font-weight: 800 !important;
}

#view-precos .ssw-report-cover small {
    color: #94a3b8 !important;
}

#view-precos .ssw-report-page {
    padding: 20px !important;
}

#view-precos .ssw-report-page strong {
    display: block !important;
    margin-bottom: 20px !important;
    color: #111827 !important;
    font-size: 0.86rem !important;
}

#view-precos .ssw-report-page span {
    display: block !important;
    height: 12px !important;
    margin-bottom: 12px !important;
    border-radius: 999px !important;
    background: #e8eef7 !important;
}

#view-precos .ssw-report-page span:nth-child(2) {
    width: 86% !important;
    background: #dbeafe !important;
}

#view-precos .ssw-report-page span:nth-child(3) {
    width: 64% !important;
    background: #bfdbfe !important;
}

#view-precos .ssw-report-page span:nth-child(4) {
    width: 78% !important;
}

#view-precos .ssw-report-caption {
    grid-column: 1 / -1 !important;
    margin: 0 !important;
    text-align: center !important;
    color: #64748b !important;
    font-size: 0.82rem !important;
}

#view-precos .ssw-trust-card {
    padding: 28px 34px !important;
}

#view-precos .ssw-trust-grid {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 18px !important;
    margin-top: 26px !important;
}

#view-precos .ssw-trust-grid article {
    display: grid !important;
    grid-template-columns: 54px minmax(0, 1fr) !important;
    gap: 12px !important;
    align-items: center !important;
}

#view-precos .ssw-trust-grid i {
    grid-row: span 2 !important;
    width: 48px !important;
    height: 48px !important;
    padding: 11px !important;
    border-radius: 999px !important;
    color: var(--ssw-blue) !important;
    background: #eef4ff !important;
}

#view-precos .ssw-trust-grid strong {
    color: #111827 !important;
    font-size: 1.9rem !important;
    line-height: 1 !important;
    font-weight: 900 !important;
}

#view-precos .ssw-trust-grid span {
    color: #64748b !important;
    font-size: 0.82rem !important;
}

#view-precos .ssw-trust-card > p {
    margin: 28px auto 0 !important;
    max-width: 720px !important;
    color: #374151 !important;
    text-align: center !important;
    font-size: 0.92rem !important;
}

#view-precos .ssw-faq-inner {
    max-width: none !important;
    margin: 0 !important;
}

#view-precos .ssw-faq-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 14px 22px !important;
    margin-top: 24px !important;
}

#view-precos .ssw-faq-item {
    overflow: hidden !important;
    border: 1px solid var(--ssw-line) !important;
    border-radius: 12px !important;
    background: #ffffff !important;
    box-shadow: 0 12px 30px rgba(15, 23, 42, 0.035) !important;
}

#view-precos .ssw-faq-trigger {
    width: 100% !important;
    min-height: 62px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 16px !important;
    padding: 0 20px !important;
    color: #111827 !important;
    background: transparent !important;
    border: 0 !important;
    font-family: inherit !important;
    font-size: 0.92rem !important;
    font-weight: 800 !important;
    text-align: left !important;
    cursor: pointer !important;
}

#view-precos .ssw-faq-trigger i {
    width: 17px !important;
    height: 17px !important;
    color: #111827 !important;
}

#view-precos .ssw-faq-body p {
    margin: 0 !important;
    padding: 0 20px 18px !important;
    color: #5f6b7a !important;
    line-height: 1.65 !important;
    font-size: 0.88rem !important;
}

#view-precos .ssw-cta-card {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto !important;
    gap: 28px !important;
    align-items: center !important;
    padding: 42px !important;
    text-align: left !important;
}

#view-precos .ssw-cta-card h2 {
    margin: 0 !important;
    color: #111827 !important;
    font-size: clamp(2rem, 3.4vw, 3rem) !important;
    line-height: 1.08 !important;
    font-weight: 900 !important;
    letter-spacing: -0.05em !important;
}

#view-precos .ssw-cta-card h2 span {
    color: var(--ssw-blue) !important;
}

#view-precos .ssw-cta-card p {
    max-width: 520px !important;
    margin: 18px 0 0 !important;
    color: #4b5563 !important;
    line-height: 1.7 !important;
}

#view-precos .ssw-btn-cta {
    width: auto !important;
    min-width: 330px !important;
    color: #ffffff !important;
    background: #111827 !important;
    border: 1px solid #111827 !important;
    box-shadow: 0 18px 38px rgba(17, 24, 39, 0.16) !important;
}

#view-precos .ssw-btn-cta i {
    width: 17px !important;
    height: 17px !important;
}

#view-precos .ssw-cta-card > div:last-child span {
    display: block !important;
    margin-top: 14px !important;
    color: #64748b !important;
    font-size: 0.78rem !important;
    text-align: center !important;
}

/* Refinamento de espaçamento — inspirado na landing de Sites */
#view-precos .ssw-pricing-hero,
#view-precos .ssw-plans-section,
#view-precos .ssw-fit-section,
#view-precos .ssw-table-section,
#view-precos .ssw-report-proof,
#view-precos .ssw-trust-section,
#view-precos .ssw-faq-section,
#view-precos .ssw-cta-section {
    width: min(1180px, calc(100% - 40px)) !important;
}

#view-precos .ssw-pricing-hero {
    padding-top: clamp(66px, 7vw, 112px) !important;
    padding-bottom: clamp(38px, 5vw, 72px) !important;
}

#view-precos .ssw-hero-eyebrow {
    margin-bottom: 20px !important;
}

#view-precos .ssw-hero-sub {
    margin-top: 24px !important;
}

#view-precos .ssw-value-strip {
    max-width: 1010px !important;
    margin-top: 46px !important;
    padding: 18px 20px !important;
}

#view-precos .ssw-value-strip article {
    gap: 16px !important;
    padding: 12px 18px !important;
}

#view-precos .ssw-plans-section {
    padding-top: clamp(34px, 5vw, 70px) !important;
    padding-bottom: clamp(72px, 8vw, 112px) !important;
}

#view-precos .ssw-plans-grid {
    gap: clamp(28px, 3.2vw, 42px) !important;
}

#view-precos .ssw-plan-card {
    min-height: 560px !important;
    padding: clamp(32px, 3.2vw, 42px) !important;
}

#view-precos .ssw-plan-icon {
    margin-bottom: 20px !important;
}

#view-precos .ssw-plan-desc {
    margin-top: 12px !important;
    line-height: 1.62 !important;
}

#view-precos .ssw-price-block {
    margin: 34px 0 26px !important;
}

#view-precos .ssw-features-label {
    margin-top: 34px !important;
    margin-bottom: 18px !important;
}

#view-precos .ssw-feature-list {
    gap: 15px !important;
}

#view-precos .ssw-feature-list li,
#view-precos .ssw-feature-item {
    gap: 11px !important;
    line-height: 1.55 !important;
}

#view-precos .ssw-fit-section,
#view-precos .ssw-table-section,
#view-precos .ssw-report-proof,
#view-precos .ssw-trust-section,
#view-precos .ssw-faq-section,
#view-precos .ssw-cta-section {
    padding-top: clamp(66px, 7vw, 104px) !important;
    padding-bottom: clamp(66px, 7vw, 104px) !important;
}

#view-precos .ssw-fit-card,
#view-precos .ssw-trust-card,
#view-precos .ssw-cta-card {
    padding: clamp(36px, 4vw, 56px) !important;
}

#view-precos .ssw-fit-grid {
    gap: clamp(32px, 4vw, 52px) !important;
    margin-top: 38px !important;
}

#view-precos .ssw-fit-grid article {
    gap: 22px !important;
    padding: 0 26px !important;
}

#view-precos .ssw-table-header {
    margin-bottom: 28px !important;
}

#view-precos .ssw-table th,
#view-precos .ssw-table td {
    padding: 18px 22px !important;
}

#view-precos .ssw-report-proof {
    gap: clamp(48px, 6vw, 76px) !important;
}

#view-precos .ssw-report-copy h2 {
    margin-bottom: 22px !important;
}

#view-precos .ssw-report-copy p {
    margin-bottom: 30px !important;
}

#view-precos .ssw-report-copy ul {
    gap: 14px !important;
}

#view-precos .ssw-report-preview {
    gap: 18px !important;
}

#view-precos .ssw-report-caption {
    margin-top: 6px !important;
}

#view-precos .ssw-trust-grid {
    gap: clamp(26px, 4vw, 44px) !important;
    margin-top: 38px !important;
}

#view-precos .ssw-faq-grid {
    gap: 20px 30px !important;
    margin-top: 36px !important;
}

#view-precos .ssw-faq-trigger {
    min-height: 72px !important;
    padding: 0 24px !important;
}

#view-precos .ssw-faq-trigger:focus {
    outline: none !important;
}

#view-precos .ssw-faq-trigger:focus-visible {
    box-shadow: inset 0 0 0 2px rgba(37, 99, 235, 0.22) !important;
}

#view-precos .ssw-faq-body p {
    padding: 0 24px 24px !important;
}

#view-precos .ssw-cta-card {
    gap: clamp(34px, 5vw, 72px) !important;
}

#view-precos .ssw-cta-card p {
    margin-top: 22px !important;
}

/* Dobra inicial mais limpa + elementos maiores */
#view-precos .ssw-pricing-hero {
    min-height: calc(100svh - 68px) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
}

#view-precos .ssw-hero-inner {
    transform-origin: center !important;
}

#view-precos .ssw-hero-title {
    max-width: 880px !important;
    font-size: clamp(3.05rem, 6vw, 5.35rem) !important;
    line-height: 0.98 !important;
}

#view-precos .ssw-hero-sub {
    max-width: 760px !important;
    font-size: clamp(1.06rem, 1.35vw, 1.2rem) !important;
}

#view-precos .ssw-value-strip {
    max-width: 1120px !important;
    border-radius: 18px !important;
}

#view-precos .ssw-value-strip i {
    width: 48px !important;
    height: 48px !important;
    padding: 11px !important;
}

#view-precos .ssw-value-strip strong {
    font-size: 0.92rem !important;
}

#view-precos .ssw-value-strip span {
    font-size: 0.78rem !important;
    line-height: 1.45 !important;
}

#view-precos .ssw-plans-section {
    padding-top: clamp(92px, 10vw, 148px) !important;
}

#view-precos .ssw-plans-grid {
    gap: clamp(34px, 4vw, 56px) !important;
}

#view-precos .ssw-plan-card {
    min-height: 660px !important;
    border-radius: 22px !important;
    padding: clamp(40px, 4vw, 56px) !important;
}

#view-precos .ssw-plan-icon {
    width: 78px !important;
    height: 78px !important;
    margin-bottom: 28px !important;
}

#view-precos .ssw-plan-icon i {
    width: 36px !important;
    height: 36px !important;
}

#view-precos .ssw-plan-name {
    font-size: 1.62rem !important;
}

#view-precos .ssw-plan-desc {
    min-height: 58px !important;
    font-size: 1rem !important;
}

#view-precos .ssw-amount {
    font-size: clamp(4rem, 5vw, 5.3rem) !important;
}

#view-precos .ssw-price-consult {
    min-height: 106px !important;
    font-size: clamp(2.35rem, 3.5vw, 3.05rem) !important;
}

#view-precos .ssw-btn,
#view-precos .ssw-btn-cta {
    min-height: 56px !important;
    border-radius: 11px !important;
    font-size: 1rem !important;
}

#view-precos .ssw-feature-list li,
#view-precos .ssw-feature-item {
    font-size: 0.94rem !important;
}

#view-precos .ssw-plan-badge {
    display: none !important;
}

/* Entrada suave dos cards, da esquerda para a direita */
#view-precos.ssw-observe .ssw-plan-card {
    will-change: transform, opacity !important;
    transition:
        opacity .82s cubic-bezier(0.22, 1, 0.36, 1),
        transform .82s cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow .22s ease,
        border-color .22s ease !important;
}

#view-precos.ssw-observe .ssw-plan-card:not(.ssw-visible) {
    opacity: 0 !important;
    transform: translate3d(-64px, 0, 0) scale(0.98) !important;
}

#view-precos.ssw-observe .ssw-plan-card:nth-child(2):not(.ssw-visible) {
    transform: translate3d(-48px, 0, 0) scale(0.98) !important;
}

#view-precos.ssw-observe .ssw-plan-card:nth-child(3):not(.ssw-visible) {
    transform: translate3d(-32px, 0, 0) scale(0.98) !important;
}

#view-precos .ssw-plan-card.ssw-visible {
    opacity: 1 !important;
    transform: translate3d(0, 0, 0) scale(1) !important;
}

#view-precos .ssw-plan-card.ssw-visible:hover {
    transform: translate3d(0, -4px, 0) scale(1) !important;
}

#view-precos .ssw-faq-grid {
    align-items: start !important;
}

#view-precos .ssw-faq-item {
    align-self: start !important;
}

/* Refinamento v4 — leitura maior, cards menos esticados e rolagem com presença */
#view-precos .ssw-plans-section {
    min-height: clamp(860px, 132svh, 1180px) !important;
    padding-top: clamp(86px, 9vw, 126px) !important;
    padding-bottom: clamp(120px, 14vw, 190px) !important;
}

#view-precos .ssw-plans-grid {
    position: sticky !important;
    top: clamp(82px, 10vh, 118px) !important;
    align-items: stretch !important;
}

#view-precos .ssw-plan-card {
    min-height: 540px !important;
    padding: clamp(34px, 3.2vw, 44px) !important;
}

#view-precos .ssw-plan-icon {
    width: 70px !important;
    height: 70px !important;
    margin-bottom: 22px !important;
}

#view-precos .ssw-plan-icon i {
    width: 32px !important;
    height: 32px !important;
}

#view-precos .ssw-plan-name {
    font-size: clamp(1.55rem, 1.8vw, 1.85rem) !important;
}

#view-precos .ssw-plan-desc {
    min-height: 50px !important;
    font-size: 0.98rem !important;
}

#view-precos .ssw-price-block {
    margin: 26px 0 22px !important;
}

#view-precos .ssw-amount {
    font-size: clamp(3.45rem, 4.2vw, 4.55rem) !important;
}

#view-precos .ssw-price-consult {
    min-height: 82px !important;
    font-size: clamp(2.15rem, 3vw, 2.8rem) !important;
}

#view-precos .ssw-features-label {
    margin-top: 26px !important;
}

#view-precos .ssw-feature-list {
    gap: 13px !important;
}

#view-precos.ssw-observe .ssw-plan-card {
    transition:
        opacity 1.35s cubic-bezier(0.16, 1, 0.3, 1),
        transform 1.35s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow .28s ease,
        border-color .28s ease !important;
}

#view-precos.ssw-observe .ssw-plan-card:not(.ssw-visible) {
    transform: translate3d(-92px, 0, 0) scale(0.965) !important;
}

#view-precos.ssw-observe .ssw-plan-card:nth-child(2):not(.ssw-visible) {
    transform: translate3d(-72px, 0, 0) scale(0.965) !important;
}

#view-precos.ssw-observe .ssw-plan-card:nth-child(3):not(.ssw-visible) {
    transform: translate3d(-52px, 0, 0) scale(0.965) !important;
}

#view-precos .ssw-fit-section {
    padding-top: clamp(110px, 11vw, 164px) !important;
    padding-bottom: clamp(110px, 11vw, 164px) !important;
}

#view-precos .ssw-fit-card {
    padding: clamp(54px, 5vw, 78px) clamp(58px, 6vw, 92px) !important;
    border-radius: 24px !important;
}

#view-precos .ssw-fit-card h2 {
    font-size: clamp(2.25rem, 3.2vw, 3.3rem) !important;
    margin-bottom: 8px !important;
}

#view-precos .ssw-fit-grid {
    margin-top: clamp(48px, 5vw, 72px) !important;
    gap: clamp(42px, 5vw, 74px) !important;
}

#view-precos .ssw-fit-grid article {
    grid-template-columns: 92px minmax(0, 1fr) !important;
    gap: 28px !important;
    padding: 0 clamp(24px, 3vw, 42px) !important;
}

#view-precos .ssw-fit-grid i {
    width: 78px !important;
    height: 78px !important;
    padding: 14px !important;
    border-radius: 18px !important;
    background: #eef4ff !important;
}

#view-precos .ssw-fit-grid strong {
    font-size: 1.22rem !important;
}

#view-precos .ssw-fit-grid span {
    font-size: 0.98rem !important;
    line-height: 1.68 !important;
}

#view-precos .ssw-table-section {
    width: min(1280px, calc(100% - 40px)) !important;
    padding-top: clamp(110px, 11vw, 164px) !important;
    padding-bottom: clamp(110px, 11vw, 164px) !important;
}

#view-precos .ssw-table-header {
    margin-bottom: 42px !important;
}

#view-precos .ssw-table-section .ssw-section-title {
    font-size: clamp(2.45rem, 3.6vw, 3.7rem) !important;
}

#view-precos .ssw-table-wrap {
    border-radius: 20px !important;
}

#view-precos .ssw-table {
    font-size: 1rem !important;
}

#view-precos .ssw-table th,
#view-precos .ssw-table td {
    padding: 24px 28px !important;
}

#view-precos .ssw-group-row td {
    font-size: 0.86rem !important;
    padding-top: 22px !important;
    padding-bottom: 22px !important;
}

#view-precos .ssw-table i {
    width: 24px !important;
    height: 24px !important;
    stroke-width: 2.2 !important;
}

#view-precos .ssw-report-proof {
    width: min(1280px, calc(100% - 40px)) !important;
    grid-template-columns: minmax(340px, 0.82fr) minmax(640px, 1.18fr) !important;
    gap: clamp(70px, 8vw, 112px) !important;
    padding-top: clamp(120px, 12vw, 176px) !important;
    padding-bottom: clamp(120px, 12vw, 176px) !important;
}

#view-precos .ssw-report-copy h2 {
    font-size: clamp(2.65rem, 4vw, 4.1rem) !important;
}

#view-precos .ssw-report-copy p {
    font-size: 1.14rem !important;
    line-height: 1.82 !important;
}

#view-precos .ssw-report-copy li {
    font-size: 1.05rem !important;
}

#view-precos .ssw-report-copy i {
    width: 26px !important;
    height: 26px !important;
}

#view-precos .ssw-report-preview {
    gap: 24px !important;
}

#view-precos .ssw-report-cover,
#view-precos .ssw-report-page {
    min-height: 330px !important;
    border-radius: 16px !important;
}

#view-precos .ssw-report-page {
    padding: 30px !important;
}

#view-precos .ssw-report-page strong {
    font-size: 1.02rem !important;
    line-height: 1.4 !important;
}

#view-precos .ssw-report-page span {
    height: 15px !important;
    margin-bottom: 16px !important;
}

#view-precos .ssw-report-cover strong {
    width: 126px !important;
    height: 126px !important;
    font-size: 2.55rem !important;
}

#view-precos .ssw-report-caption {
    margin-top: 16px !important;
    font-size: 0.95rem !important;
}

#view-precos .ssw-faq-section {
    width: min(1320px, calc(100% - 40px)) !important;
    padding-top: clamp(130px, 13vw, 194px) !important;
    padding-bottom: clamp(130px, 13vw, 194px) !important;
}

#view-precos .ssw-faq-section .ssw-section-title {
    font-size: clamp(3rem, 4.8vw, 5rem) !important;
    margin-bottom: clamp(54px, 6vw, 88px) !important;
}

#view-precos .ssw-faq-grid {
    gap: 28px 38px !important;
    margin-top: 0 !important;
}

#view-precos .ssw-faq-item {
    border-radius: 18px !important;
    box-shadow: 0 18px 46px rgba(15, 23, 42, 0.055) !important;
}

#view-precos .ssw-faq-trigger {
    min-height: 92px !important;
    padding: 0 34px !important;
    font-size: 1.08rem !important;
}

#view-precos .ssw-faq-trigger i {
    width: 24px !important;
    height: 24px !important;
}

#view-precos .ssw-faq-body p {
    padding: 0 34px 34px !important;
    font-size: 1rem !important;
    line-height: 1.78 !important;
}

/* Bloco de confiança no padrão da referência */
#view-precos .ssw-trust-section {
    width: min(1180px, calc(100% - 40px)) !important;
    padding-top: clamp(72px, 8vw, 118px) !important;
    padding-bottom: clamp(72px, 8vw, 118px) !important;
}

#view-precos .ssw-trust-card {
    padding: clamp(28px, 3vw, 42px) clamp(34px, 4.5vw, 64px) !important;
    border-radius: 18px !important;
    background: rgba(255, 255, 255, 0.94) !important;
    border: 1px solid #dbe4ee !important;
    box-shadow: 0 20px 56px rgba(15, 23, 42, 0.05) !important;
}

#view-precos .ssw-trust-card h2 {
    font-size: clamp(1.45rem, 2vw, 1.9rem) !important;
    margin-bottom: clamp(28px, 3vw, 42px) !important;
    text-align: center !important;
}

#view-precos .ssw-trust-grid {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    align-items: center !important;
    gap: clamp(28px, 4vw, 58px) !important;
    margin: 0 !important;
}

#view-precos .ssw-trust-grid article {
    display: grid !important;
    grid-template-columns: 54px minmax(0, 1fr) !important;
    grid-template-rows: auto auto !important;
    align-items: center !important;
    column-gap: 16px !important;
    row-gap: 2px !important;
    min-width: 0 !important;
}

#view-precos .ssw-trust-grid i {
    grid-row: 1 / span 2 !important;
    width: 44px !important;
    height: 44px !important;
    padding: 10px !important;
    color: #2563eb !important;
    background: #eef4ff !important;
    border-radius: 999px !important;
    stroke: #2563eb !important;
    stroke-width: 2.25 !important;
}

#view-precos .ssw-trust-grid svg,
#view-precos .ssw-trust-grid i svg {
    color: #2563eb !important;
    stroke: #2563eb !important;
}

#view-precos .ssw-trust-grid strong {
    color: #111827 !important;
    font-size: clamp(1.8rem, 2.4vw, 2.45rem) !important;
    line-height: 1 !important;
    font-weight: 900 !important;
    letter-spacing: -0.04em !important;
}

#view-precos .ssw-trust-grid span {
    color: #64748b !important;
    font-size: 0.82rem !important;
    line-height: 1.25 !important;
    font-weight: 650 !important;
}

#view-precos .ssw-trust-testimonial {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 18px !important;
    margin-top: clamp(26px, 3vw, 38px) !important;
    text-align: left !important;
}

#view-precos .ssw-trust-avatars {
    display: flex !important;
    align-items: center !important;
    flex: 0 0 auto !important;
}

#view-precos .ssw-trust-avatars span {
    width: 34px !important;
    height: 34px !important;
    display: block !important;
    margin-left: -8px !important;
    border: 2px solid #ffffff !important;
    border-radius: 999px !important;
    background:
        radial-gradient(circle at 50% 36%, #f8fafc 0 18%, transparent 19%),
        radial-gradient(circle at 50% 76%, #e2e8f0 0 30%, transparent 31%),
        linear-gradient(135deg, #94a3b8, #cbd5e1) !important;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12) !important;
}

#view-precos .ssw-trust-avatars span:first-child {
    margin-left: 0 !important;
}

#view-precos .ssw-trust-avatars span:nth-child(2) {
    background:
        radial-gradient(circle at 50% 36%, #f8fafc 0 18%, transparent 19%),
        radial-gradient(circle at 50% 76%, #e2e8f0 0 30%, transparent 31%),
        linear-gradient(135deg, #64748b, #cbd5e1) !important;
}

#view-precos .ssw-trust-avatars span:nth-child(3) {
    background:
        radial-gradient(circle at 50% 36%, #f8fafc 0 18%, transparent 19%),
        radial-gradient(circle at 50% 76%, #e2e8f0 0 30%, transparent 31%),
        linear-gradient(135deg, #475569, #94a3b8) !important;
}

#view-precos .ssw-trust-avatars span:nth-child(4) {
    background:
        radial-gradient(circle at 50% 36%, #f8fafc 0 18%, transparent 19%),
        radial-gradient(circle at 50% 76%, #e2e8f0 0 30%, transparent 31%),
        linear-gradient(135deg, #334155, #94a3b8) !important;
}

#view-precos .ssw-trust-avatars span:nth-child(5) {
    background:
        radial-gradient(circle at 50% 36%, #f8fafc 0 18%, transparent 19%),
        radial-gradient(circle at 50% 76%, #e2e8f0 0 30%, transparent 31%),
        linear-gradient(135deg, #6b7280, #d1d5db) !important;
}

#view-precos .ssw-trust-testimonial p {
    max-width: 660px !important;
    margin: 0 !important;
    color: #374151 !important;
    font-size: 0.92rem !important;
    line-height: 1.55 !important;
}

#view-precos .ssw-trust-testimonial strong {
    color: #111827 !important;
    font-weight: 850 !important;
}

@media (max-width: 980px) {
    #view-precos .ssw-value-strip,
    #view-precos .ssw-plans-grid,
    #view-precos .ssw-fit-grid,
    #view-precos .ssw-report-proof,
    #view-precos .ssw-trust-grid,
    #view-precos .ssw-faq-grid,
    #view-precos .ssw-cta-card {
        grid-template-columns: 1fr !important;
    }

    #view-precos .ssw-value-strip article:not(:last-child),
    #view-precos .ssw-fit-grid article:not(:last-child) {
        border-right: 0 !important;
        border-bottom: 1px solid #e8edf4 !important;
    }

    #view-precos .ssw-report-preview {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    #view-precos .ssw-trust-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }

    #view-precos .ssw-trust-testimonial {
        flex-direction: column !important;
        text-align: center !important;
    }

    #view-precos .ssw-btn-cta {
        width: 100% !important;
        min-width: 0 !important;
    }
}

@media (max-width: 640px) {
    #view-precos .ssw-pricing-hero,
    #view-precos .ssw-plans-section,
    #view-precos .ssw-fit-section,
    #view-precos .ssw-table-section,
    #view-precos .ssw-report-proof,
    #view-precos .ssw-trust-section,
    #view-precos .ssw-faq-section,
    #view-precos .ssw-cta-section {
        width: min(100% - 24px, 1120px) !important;
    }

    #view-precos .ssw-value-strip,
    #view-precos .ssw-fit-card,
    #view-precos .ssw-trust-card,
    #view-precos .ssw-cta-card {
        padding: 20px !important;
    }

    #view-precos .ssw-plan-card {
        padding: 24px !important;
    }

    #view-precos .ssw-report-preview {
        grid-template-columns: 1fr !important;
    }

    #view-precos .ssw-trust-grid {
        grid-template-columns: 1fr !important;
        gap: 24px !important;
    }

    #view-precos .ssw-table-wrap {
        overflow-x: auto !important;
    }

    #view-precos .ssw-table {
        min-width: 680px !important;
    }
}

/* ─────────────────────────────────────────────────────────────
   PRICING EXACT 2026 — layout claro conforme referência
   ───────────────────────────────────────────────────────────── */
body.pricing-view-active,
body.pricing-view-active .pricing-page-shell {
    background: #ffffff !important;
}

body.pricing-view-active .terms-topbar {
    background: rgba(255, 255, 255, 0.94) !important;
    border-bottom: 1px solid #edf1f7 !important;
    box-shadow: 0 10px 34px rgba(15, 23, 42, 0.035) !important;
}

#view-precos {
    --ssw-page: #ffffff;
    --ssw-ink: #111827;
    --ssw-muted: #667085;
    --ssw-blue: #1267f3;
    --ssw-blue-2: #2f7dff;
    --ssw-blue-soft: #edf5ff;
    --ssw-line: #dce5f1;
    --ssw-soft-line: #edf2f7;
    --ssw-shadow: 0 24px 65px rgba(17, 24, 39, 0.075);
    --ssw-shadow-soft: 0 14px 40px rgba(17, 24, 39, 0.055);
    background:
        radial-gradient(circle at 50% 7%, rgba(47, 125, 255, 0.10), transparent 34%),
        linear-gradient(180deg, #ffffff 0%, #f8fbff 50%, #ffffff 100%) !important;
    color: var(--ssw-ink) !important;
    font-family: Inter, 'DM Sans', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
    min-height: 100vh !important;
    overflow-x: hidden !important;
}

#view-precos .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
}

#view-precos .ssw-pricing-hero,
#view-precos .ssw-plans-section,
#view-precos .ssw-table-section,
#view-precos .ssw-trust-section,
#view-precos .ssw-faq-section,
#view-precos .ssw-cta-section {
    width: min(1120px, calc(100% - 48px)) !important;
    margin-inline: auto !important;
    padding-inline: 0 !important;
}

#view-precos .ssw-pricing-hero {
    padding-top: 84px !important;
    padding-bottom: 66px !important;
    text-align: center !important;
}

#view-precos .ssw-hero-inner {
    max-width: 1060px !important;
    margin: 0 auto !important;
}

#view-precos .ssw-hero-eyebrow,
#view-precos .ssw-section-kicker {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 7px 18px !important;
    border-radius: 999px !important;
    background: #eef5ff !important;
    color: var(--ssw-blue) !important;
    font-size: 0.73rem !important;
    font-weight: 900 !important;
    letter-spacing: 0.13em !important;
    text-transform: uppercase !important;
    margin: 0 0 20px !important;
}

#view-precos .ssw-hero-eyebrow::before,
#view-precos .ssw-hero-eyebrow::after {
    display: none !important;
}

#view-precos .ssw-hero-title {
    max-width: 760px !important;
    margin: 0 auto !important;
    color: #111827 !important;
    font-size: clamp(3rem, 6.1vw, 5rem) !important;
    line-height: 0.98 !important;
    font-weight: 900 !important;
    letter-spacing: -0.065em !important;
    text-wrap: balance !important;
}

#view-precos .ssw-hero-title span,
#view-precos .ssw-trust-copy h2 span,
#view-precos .ssw-cta-card h2 span {
    color: var(--ssw-blue) !important;
}

#view-precos .ssw-hero-sub {
    max-width: 640px !important;
    margin: 22px auto 0 !important;
    color: #64748b !important;
    font-size: 1.02rem !important;
    line-height: 1.72 !important;
}

#view-precos .ssw-value-strip {
    width: min(980px, 100%) !important;
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 38px !important;
    margin: 64px auto 0 !important;
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
}

#view-precos .ssw-value-strip article {
    display: grid !important;
    grid-template-columns: 48px minmax(0, 1fr) !important;
    align-items: center !important;
    gap: 14px !important;
    padding: 0 !important;
    text-align: left !important;
    border: 0 !important;
}

#view-precos .ssw-value-strip article:not(:last-child) {
    border-right: 0 !important;
}

#view-precos .ssw-value-strip i,
#view-precos .ssw-plan-icon,
#view-precos .ssw-trust-grid i {
    color: var(--ssw-blue) !important;
    background: #edf5ff !important;
}

#view-precos .ssw-value-strip i {
    width: 48px !important;
    height: 48px !important;
    display: grid !important;
    place-items: center !important;
    padding: 13px !important;
    border-radius: 12px !important;
}

#view-precos .ssw-value-strip strong {
    display: block !important;
    color: #111827 !important;
    font-size: 0.82rem !important;
    font-weight: 900 !important;
}

#view-precos .ssw-value-strip span {
    display: block !important;
    margin-top: 4px !important;
    color: #667085 !important;
    font-size: 0.7rem !important;
    line-height: 1.35 !important;
}

#view-precos .ssw-plans-section {
    padding-top: 8px !important;
    padding-bottom: 78px !important;
}

#view-precos .ssw-billing-toggle {
    width: max-content !important;
    margin: 0 auto 28px !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    padding: 5px !important;
    border-radius: 999px !important;
    background: #ffffff !important;
    border: 1px solid #dde7f3 !important;
    box-shadow: 0 12px 28px rgba(15, 23, 42, 0.07) !important;
}

#view-precos .ssw-billing-toggle button {
    height: 34px !important;
    min-width: 78px !important;
    border: 0 !important;
    border-radius: 999px !important;
    background: transparent !important;
    color: #111827 !important;
    font-size: 0.78rem !important;
    font-weight: 800 !important;
    cursor: pointer !important;
}

#view-precos .ssw-billing-toggle button.is-active {
    background: var(--ssw-blue) !important;
    color: #ffffff !important;
    box-shadow: 0 10px 18px rgba(18, 103, 243, 0.25) !important;
}

#view-precos .ssw-billing-toggle span {
    margin-left: 8px !important;
    padding: 6px 10px !important;
    border-radius: 999px !important;
    background: #eafff1 !important;
    color: #15935f !important;
    font-size: 0.67rem !important;
    font-weight: 900 !important;
}

#view-precos .ssw-plans-grid {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 28px !important;
    align-items: stretch !important;
}

#view-precos .ssw-plan-card {
    min-height: 600px !important;
    padding: 36px 32px !important;
    border-radius: 16px !important;
    background: rgba(255, 255, 255, 0.94) !important;
    border: 1px solid #dde7f3 !important;
    box-shadow: var(--ssw-shadow-soft) !important;
    color: var(--ssw-ink) !important;
    overflow: visible !important;
    transform: none !important;
}

#view-precos .ssw-plan-card:hover {
    transform: translateY(-4px) !important;
    box-shadow: var(--ssw-shadow) !important;
}

#view-precos .ssw-plan-featured {
    border-color: #6ea2ff !important;
    box-shadow: 0 28px 80px rgba(18, 103, 243, 0.13) !important;
}

#view-precos .ssw-plan-badge {
    position: absolute !important;
    top: -16px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    padding: 7px 22px !important;
    border-radius: 0 0 11px 11px !important;
    background: var(--ssw-blue) !important;
    color: #ffffff !important;
    border: 0 !important;
    font-size: 0.68rem !important;
    font-weight: 900 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.08em !important;
    white-space: nowrap !important;
}

#view-precos .ssw-plan-icon {
    width: 62px !important;
    height: 62px !important;
    display: grid !important;
    place-items: center !important;
    border-radius: 999px !important;
    margin-bottom: 34px !important;
}

#view-precos .ssw-plan-icon i {
    width: 28px !important;
    height: 28px !important;
}

#view-precos .ssw-plan-name {
    color: #111827 !important;
    font-size: 1.55rem !important;
    font-weight: 900 !important;
    letter-spacing: -0.035em !important;
    margin-bottom: 13px !important;
}

#view-precos .ssw-plan-desc {
    min-height: 58px !important;
    color: #667085 !important;
    font-size: 0.91rem !important;
    line-height: 1.55 !important;
    margin: 0 0 36px !important;
}

#view-precos .ssw-price-block {
    margin: 0 0 24px !important;
}

#view-precos .ssw-price-row {
    display: flex !important;
    align-items: baseline !important;
    gap: 8px !important;
    color: #111827 !important;
}

#view-precos .ssw-currency {
    font-size: 0.92rem !important;
    font-weight: 900 !important;
}

#view-precos .ssw-amount,
#view-precos .ssw-price-consult {
    color: #111827 !important;
    font-size: 4.1rem !important;
    line-height: 0.95 !important;
    font-weight: 900 !important;
    letter-spacing: -0.065em !important;
}

#view-precos .ssw-price-consult {
    font-size: 2.2rem !important;
    letter-spacing: -0.045em !important;
}

#view-precos .ssw-period,
#view-precos .ssw-credit-note,
#view-precos .ssw-installment {
    color: #667085 !important;
    font-size: 0.86rem !important;
    font-weight: 700 !important;
}

#view-precos .ssw-credit-note {
    margin-top: 12px !important;
}

#view-precos .ssw-installment {
    display: block !important;
    margin: 10px 0 4px !important;
    color: var(--ssw-blue) !important;
    text-align: center !important;
    font-size: 0.73rem !important;
}

#view-precos .ssw-btn,
#view-precos .ssw-btn-primary,
#view-precos .ssw-btn-outline {
    width: 100% !important;
    height: 50px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 8px !important;
    font-size: 0.88rem !important;
    font-weight: 900 !important;
    cursor: pointer !important;
    transition: transform .2s ease, box-shadow .2s ease, background .2s ease !important;
}

#view-precos .ssw-btn-primary {
    background: var(--ssw-blue) !important;
    color: #ffffff !important;
    border: 1px solid var(--ssw-blue) !important;
    box-shadow: 0 14px 28px rgba(18, 103, 243, 0.18) !important;
}

#view-precos .ssw-btn-outline {
    background: #ffffff !important;
    color: #111827 !important;
    border: 1px solid #111827 !important;
    box-shadow: none !important;
}

#view-precos .ssw-btn:hover,
#view-precos .ssw-btn-cta:hover {
    transform: translateY(-2px) !important;
}

#view-precos .ssw-feature-list {
    display: grid !important;
    gap: 16px !important;
    margin: 34px 0 0 !important;
    padding: 0 !important;
    list-style: none !important;
}

#view-precos .ssw-feature-list li {
    display: grid !important;
    grid-template-columns: 18px 1fr !important;
    align-items: start !important;
    gap: 11px !important;
    color: #344054 !important;
    font-size: 0.87rem !important;
    line-height: 1.45 !important;
    font-weight: 700 !important;
}

#view-precos .ssw-feature-list i {
    width: 17px !important;
    height: 17px !important;
    color: var(--ssw-blue) !important;
    margin-top: 1px !important;
}

#view-precos .ssw-table-section {
    padding-top: 0 !important;
    padding-bottom: 86px !important;
}

#view-precos .ssw-table-header {
    text-align: center !important;
    margin-bottom: 42px !important;
}

#view-precos .ssw-section-title {
    color: #111827 !important;
    font-size: clamp(2.1rem, 4vw, 3rem) !important;
    line-height: 1.05 !important;
    font-weight: 900 !important;
    letter-spacing: -0.055em !important;
    margin: 0 !important;
}

#view-precos .ssw-table-header p {
    margin: 12px 0 0 !important;
    color: #667085 !important;
    font-size: 0.98rem !important;
}

#view-precos .ssw-table-wrap {
    overflow: hidden !important;
    border: 1px solid #dbe5f1 !important;
    border-radius: 14px !important;
    background: #ffffff !important;
    box-shadow: var(--ssw-shadow-soft) !important;
}

#view-precos .ssw-table {
    width: 100% !important;
    border-collapse: collapse !important;
    color: #111827 !important;
    min-width: 0 !important;
}

#view-precos .ssw-table th,
#view-precos .ssw-table td {
    height: 58px !important;
    padding: 0 28px !important;
    border: 1px solid #e7edf5 !important;
    background: #ffffff !important;
    color: #334155 !important;
    font-size: 0.87rem !important;
    font-weight: 800 !important;
    text-align: center !important;
    vertical-align: middle !important;
}

#view-precos .ssw-table th:first-child,
#view-precos .ssw-table td:first-child {
    width: 37% !important;
    text-align: left !important;
    color: #344054 !important;
}

#view-precos .ssw-table th {
    background: #fbfdff !important;
    color: #111827 !important;
    text-transform: none !important;
    letter-spacing: 0 !important;
}

#view-precos .ssw-table th:not(:first-child) {
    color: var(--ssw-blue) !important;
    text-transform: uppercase !important;
    font-size: 0.68rem !important;
    letter-spacing: 0.08em !important;
}

#view-precos .ssw-table th i {
    display: block !important;
    width: 22px !important;
    height: 22px !important;
    margin: 0 auto 6px !important;
    color: var(--ssw-blue) !important;
}

#view-precos .ssw-table td i {
    display: block !important;
    width: 22px !important;
    height: 22px !important;
    margin: 0 auto !important;
    color: var(--ssw-blue) !important;
}

#view-precos .ssw-trust-section {
    width: 100% !important;
    max-width: none !important;
    padding: 90px max(24px, calc((100vw - 1120px) / 2)) !important;
    display: grid !important;
    grid-template-columns: minmax(280px, 0.9fr) minmax(520px, 1.6fr) !important;
    gap: 70px !important;
    align-items: center !important;
    background:
        radial-gradient(circle at 70% 35%, rgba(47, 125, 255, 0.08), transparent 28%),
        linear-gradient(180deg, #f7fbff 0%, #ffffff 100%) !important;
}

#view-precos .ssw-trust-copy {
    max-width: 410px !important;
}

#view-precos .ssw-trust-copy .ssw-section-kicker {
    margin-bottom: 18px !important;
}

#view-precos .ssw-trust-copy h2 {
    color: #111827 !important;
    font-size: clamp(2.25rem, 4vw, 3.55rem) !important;
    line-height: 1.02 !important;
    font-weight: 900 !important;
    letter-spacing: -0.06em !important;
    margin: 0 0 24px !important;
}

#view-precos .ssw-trust-copy p {
    color: #667085 !important;
    font-size: 1rem !important;
    line-height: 1.72 !important;
    margin: 0 !important;
}

#view-precos .ssw-trust-card {
    padding: 0 !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
}

#view-precos .ssw-trust-grid {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    gap: 18px !important;
}

#view-precos .ssw-trust-grid article {
    min-height: 160px !important;
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    padding: 24px 14px !important;
    border: 1px solid #edf2f7 !important;
    border-radius: 16px !important;
    background: rgba(255,255,255,0.9) !important;
    box-shadow: 0 16px 42px rgba(15, 23, 42, 0.045) !important;
    text-align: center !important;
}

#view-precos .ssw-trust-grid i {
    width: 50px !important;
    height: 50px !important;
    display: grid !important;
    place-items: center !important;
    padding: 14px !important;
    border-radius: 999px !important;
}

#view-precos .ssw-trust-grid strong {
    color: #111827 !important;
    font-size: 1.75rem !important;
    line-height: 1 !important;
    font-weight: 900 !important;
    letter-spacing: -0.04em !important;
}

#view-precos .ssw-trust-grid span {
    max-width: 92px !important;
    color: #667085 !important;
    font-size: 0.73rem !important;
    line-height: 1.28 !important;
    font-weight: 800 !important;
}

#view-precos .ssw-trust-testimonial {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    align-items: center !important;
    gap: 18px !important;
    margin-top: 30px !important;
}

#view-precos .ssw-trust-avatars {
    display: flex !important;
    align-items: center !important;
    padding-left: 10px !important;
}

#view-precos .ssw-trust-avatars span {
    width: 34px !important;
    height: 34px !important;
    border-radius: 999px !important;
    border: 2px solid #ffffff !important;
    margin-left: -10px !important;
    background: linear-gradient(135deg, #dbeafe, #f1f5f9) !important;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12) !important;
}

#view-precos .ssw-trust-avatars span:nth-child(2) { background: linear-gradient(135deg, #fde68a, #fecaca) !important; }
#view-precos .ssw-trust-avatars span:nth-child(3) { background: linear-gradient(135deg, #bfdbfe, #ddd6fe) !important; }
#view-precos .ssw-trust-avatars span:nth-child(4) { background: linear-gradient(135deg, #bbf7d0, #e0f2fe) !important; }
#view-precos .ssw-trust-avatars span:nth-child(5) { background: linear-gradient(135deg, #fecdd3, #dbeafe) !important; }

#view-precos .ssw-trust-testimonial p {
    color: #344054 !important;
    font-size: 0.82rem !important;
    line-height: 1.55 !important;
    margin: 0 !important;
}

#view-precos .ssw-trust-testimonial strong {
    color: #111827 !important;
}

#view-precos .ssw-faq-section {
    padding-top: 82px !important;
    padding-bottom: 82px !important;
    text-align: center !important;
}

#view-precos .ssw-faq-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 16px 28px !important;
    margin-top: 44px !important;
}

#view-precos .ssw-faq-item {
    border: 1px solid #dfe8f3 !important;
    border-radius: 12px !important;
    background: #ffffff !important;
    box-shadow: 0 14px 36px rgba(15, 23, 42, 0.035) !important;
    overflow: hidden !important;
}

#view-precos .ssw-faq-trigger {
    width: 100% !important;
    min-height: 70px !important;
    display: grid !important;
    grid-template-columns: 1fr 22px !important;
    align-items: center !important;
    gap: 18px !important;
    padding: 0 26px !important;
    border: 0 !important;
    background: #ffffff !important;
    color: #111827 !important;
    font-size: 0.9rem !important;
    font-weight: 900 !important;
    text-align: left !important;
    cursor: pointer !important;
}

#view-precos .ssw-faq-trigger i {
    width: 20px !important;
    height: 20px !important;
    color: #111827 !important;
}

#view-precos .ssw-faq-body p {
    margin: 0 !important;
    padding: 0 26px 22px !important;
    color: #667085 !important;
    font-size: 0.92rem !important;
    line-height: 1.65 !important;
    text-align: left !important;
}

#view-precos .ssw-faq-help {
    display: inline-flex !important;
    align-items: center !important;
    gap: 9px !important;
    margin: 50px auto 0 !important;
    color: #667085 !important;
    font-size: 0.9rem !important;
    font-weight: 700 !important;
}

#view-precos .ssw-faq-help i {
    width: 20px !important;
    height: 20px !important;
    color: #111827 !important;
}

#view-precos .ssw-cta-section {
    padding-top: 0 !important;
    padding-bottom: 100px !important;
}

#view-precos .ssw-cta-card {
    display: grid !important;
    grid-template-columns: 1.25fr 0.75fr !important;
    align-items: center !important;
    gap: 44px !important;
    min-height: 224px !important;
    padding: 54px 68px !important;
    border-radius: 14px !important;
    border: 1px solid #dbe7f5 !important;
    background:
        radial-gradient(circle at 92% 95%, rgba(18, 103, 243, 0.13), transparent 28%),
        linear-gradient(135deg, #f1f7ff 0%, #ffffff 62%, #eef6ff 100%) !important;
    box-shadow: var(--ssw-shadow-soft) !important;
}

#view-precos .ssw-cta-card h2 {
    color: #111827 !important;
    font-size: clamp(2rem, 4vw, 3.25rem) !important;
    line-height: 1.02 !important;
    font-weight: 900 !important;
    letter-spacing: -0.06em !important;
    margin: 0 0 18px !important;
}

#view-precos .ssw-cta-card p {
    max-width: 480px !important;
    color: #667085 !important;
    font-size: 1rem !important;
    line-height: 1.65 !important;
    margin: 0 !important;
}

#view-precos .ssw-btn-cta {
    min-width: 220px !important;
    height: 58px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 12px !important;
    border-radius: 8px !important;
    border: 1px solid #111827 !important;
    background: #111827 !important;
    color: #ffffff !important;
    box-shadow: 0 18px 40px rgba(17, 24, 39, 0.18) !important;
    cursor: pointer !important;
    font-size: 0.93rem !important;
    font-weight: 900 !important;
}

#view-precos .ssw-btn-cta i {
    width: 18px !important;
    height: 18px !important;
}

#view-precos .ssw-cta-card > div:last-child {
    display: grid !important;
    justify-items: center !important;
    gap: 16px !important;
}

#view-precos .ssw-cta-card > div:last-child > span {
    display: inline-flex !important;
    align-items: center !important;
    gap: 7px !important;
    color: #667085 !important;
    font-size: 0.78rem !important;
    font-weight: 700 !important;
}

#view-precos .ssw-cta-card > div:last-child > span i {
    width: 15px !important;
    height: 15px !important;
    color: #667085 !important;
}

#view-precos.ssw-observe .ssw-hero-inner:not(.ssw-visible),
#view-precos.ssw-observe .ssw-billing-toggle:not(.ssw-visible),
#view-precos.ssw-observe .ssw-plan-card:not(.ssw-visible),
#view-precos.ssw-observe .ssw-table-section:not(.ssw-visible),
#view-precos.ssw-observe .ssw-trust-section:not(.ssw-visible),
#view-precos.ssw-observe .ssw-faq-section:not(.ssw-visible),
#view-precos.ssw-observe .ssw-cta-card:not(.ssw-visible) {
    opacity: 0 !important;
    transform: translateY(26px) !important;
}

#view-precos .ssw-hero-inner,
#view-precos .ssw-billing-toggle,
#view-precos .ssw-plan-card,
#view-precos .ssw-table-section,
#view-precos .ssw-trust-section,
#view-precos .ssw-faq-section,
#view-precos .ssw-cta-card {
    opacity: 1 !important;
    transition: opacity .85s cubic-bezier(.22,1,.36,1), transform .85s cubic-bezier(.22,1,.36,1), box-shadow .25s ease !important;
}

#view-precos .ssw-plan-card:nth-child(1) { transition-delay: .05s !important; }
#view-precos .ssw-plan-card:nth-child(2) { transition-delay: .22s !important; }
#view-precos .ssw-plan-card:nth-child(3) { transition-delay: .39s !important; }

@media (max-width: 1060px) {
    #view-precos .ssw-value-strip,
    #view-precos .ssw-plans-grid,
    #view-precos .ssw-trust-section,
    #view-precos .ssw-faq-grid,
    #view-precos .ssw-cta-card {
        grid-template-columns: 1fr !important;
    }

    #view-precos .ssw-trust-section {
        width: 100% !important;
        padding-inline: 24px !important;
    }

    #view-precos .ssw-trust-copy {
        max-width: 640px !important;
        text-align: center !important;
        margin: 0 auto !important;
    }

    #view-precos .ssw-trust-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
}

@media (max-width: 720px) {
    #view-precos .ssw-pricing-hero,
    #view-precos .ssw-plans-section,
    #view-precos .ssw-table-section,
    #view-precos .ssw-faq-section,
    #view-precos .ssw-cta-section {
        width: min(100% - 28px, 1120px) !important;
    }

    #view-precos .ssw-pricing-hero {
        padding-top: 56px !important;
        padding-bottom: 44px !important;
    }

    #view-precos .ssw-value-strip {
        margin-top: 42px !important;
        gap: 22px !important;
    }

    #view-precos .ssw-billing-toggle {
        max-width: 100% !important;
        flex-wrap: wrap !important;
        justify-content: center !important;
    }

    #view-precos .ssw-plan-card,
    #view-precos .ssw-cta-card {
        padding: 28px !important;
    }

    #view-precos .ssw-table-wrap {
        overflow-x: auto !important;
    }

    #view-precos .ssw-table {
        min-width: 760px !important;
    }

    #view-precos .ssw-trust-grid {
        grid-template-columns: 1fr !important;
    }
}

/* Overrides finais — créditos por plano e centralização real dos checks */
#view-precos .ssw-credit-options {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 8px !important;
    margin: -14px 0 18px !important;
}

#view-precos .ssw-credit-options button {
    min-height: 42px !important;
    border: 1px solid #dbe5f1 !important;
    border-radius: 12px !important;
    background: #ffffff !important;
    color: #42526b !important;
    cursor: pointer !important;
    font-family: inherit !important;
    font-size: 0.78rem !important;
    font-weight: 900 !important;
    transition: border-color .2s ease, background .2s ease, color .2s ease, box-shadow .2s ease, transform .2s ease !important;
}

#view-precos .ssw-credit-options button:hover {
    border-color: rgba(37, 99, 235, .45) !important;
    color: var(--ssw-blue) !important;
    transform: translateY(-1px) !important;
}

#view-precos .ssw-credit-options button.is-active {
    border-color: rgba(37, 99, 235, .72) !important;
    background: #eef4ff !important;
    color: var(--ssw-blue) !important;
    box-shadow: 0 10px 24px rgba(37, 99, 235, .10) !important;
}

#view-precos .ssw-table td:not(:first-child),
#view-precos .ssw-table th:not(:first-child) {
    text-align: center !important;
    vertical-align: middle !important;
}

#view-precos .ssw-table td:not(:first-child) > svg,
#view-precos .ssw-table td:not(:first-child) .lucide,
#view-precos .ssw-table td:not(:first-child) i,
#view-precos .ssw-table td:not(:first-child) i svg {
    display: block !important;
    width: 22px !important;
    height: 22px !important;
    margin: 0 auto !important;
    color: var(--ssw-blue) !important;
    stroke: currentColor !important;
    float: none !important;
    position: static !important;
}

#view-precos .ssw-table th:not(:first-child) > svg,
#view-precos .ssw-table th:not(:first-child) .lucide,
#view-precos .ssw-table th:not(:first-child) i,
#view-precos .ssw-table th:not(:first-child) i svg {
    display: block !important;
    margin: 0 auto 6px !important;
    color: var(--ssw-blue) !important;
    float: none !important;
    position: static !important;
}
</style>`;

document.head.insertAdjacentHTML('beforeend', sswPricingStyles);
