// =============================================================
//  pricing-component.js — SSW Pricing Section
//  Estrutura idêntica ao original: estilos injetados no <head>,
//  lógica de FAQ/Marquee inicializada via evento loadPricingSection
// =============================================================

// --- FUNÇÃO DE COMPRA (CHECKOUT MERCADO PAGO) ---
async function comprarPlano(pacoteId) {
    if (!USER || !USER.email) {
        showAuthScreen();
        return;
    }
    const pacotes = {
        'basico':         { id: 'pacote_basico',     nome: 'Pacote Básico',      preco: 99.99  },
        'recomendado':    { id: 'pacote_recomendado', nome: 'Pacote Recomendado', preco: 149.99 },
        'plano_mensal':   { id: 'plano_mensal',       nome: 'Plano Mensal',       preco: 120.00 },
        'plano_anual':    { id: 'plano_anual',        nome: 'Plano Anual',        preco: 997.00 },
        'plano_semestral':{ id: 'plano_semestral',    nome: 'Plano Semestral',    preco: 597.00 },
        'recarga_10':     { id: 'recarga_10',         nome: 'Recarga 10 Créditos',preco: 47.00  },
        'recarga_40':     { id: 'recarga_40',         nome: 'Recarga 40 Créditos',preco: 167.00 },
        'recarga_90':     { id: 'recarga_90',         nome: 'Recarga 90 Créditos',preco: 347.00 },
    };
    const pacoteSelecionado = pacotes[pacoteId];
    if (!pacoteSelecionado) { Toast.error("Pacote não encontrado."); return; }
    try {
        await openCheckout(pacoteSelecionado, USER);
    } catch (error) {
        console.error('Erro ao abrir checkout:', error);
        Toast.error("Erro ao abrir checkout. Tente novamente.");
    }
}

// --- FUNÇÃO PARA FALAR COM VENDAS ---
function falarComVendas() {
    window.open('https://wa.me/5582991301991?text=Olá! gostaria de saber um pouco mais sobre o pacote enterprise', '_blank');
}

// --- FAQ ACCORDION (escopo ssw para não conflitar) ---
function sswToggleFAQ(trigger) {
    const isOpen = trigger.getAttribute('aria-expanded') === 'true';
    // Fecha todos
    document.querySelectorAll('.ssw-faq-trigger').forEach(t => {
        t.setAttribute('aria-expanded', 'false');
        t.nextElementSibling.style.maxHeight = '0';
    });
    // Abre o clicado (se estava fechado)
    if (!isOpen) {
        trigger.setAttribute('aria-expanded', 'true');
        const body = trigger.nextElementSibling;
        body.style.maxHeight = body.scrollHeight + 'px';
    }
    // Recriar ícones Lucide após mudança de estado
    if (typeof lucide !== 'undefined') lucide.createIcons();
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

    // Inicializar animações de entrada (Intersection Observer)
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('ssw-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08 });
        document.querySelectorAll('.ssw-plan-card, .ssw-hero-inner, .ssw-cta-card').forEach(el => {
            observer.observe(el);
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
    --ssw-surface:   #080d16;
    --ssw-card:      #0c1220;
    --ssw-card-h:    #101828;
    --ssw-border:    rgba(255,255,255,0.07);
    --ssw-border-a:  rgba(34,211,238,0.35);
    --ssw-t1:        #f0f4ff;
    --ssw-t2:        #8292a8;
    --ssw-t3:        #3d4f63;
    --ssw-cyan:      #22d3ee;
    --ssw-cyan-dim:  rgba(34,211,238,0.12);
    --ssw-cyan-glow: rgba(34,211,238,0.22);
    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
    background: var(--ssw-bg);
    color: var(--ssw-t1);
    -webkit-font-smoothing: antialiased;
}

/* ── ANIMAÇÕES ── */
@keyframes ssw-fade-up {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes ssw-glow-pulse {
    0%,100% { box-shadow: 0 0 22px var(--ssw-cyan-glow), 0 0 60px rgba(34,211,238,0.05); }
    50%      { box-shadow: 0 0 38px var(--ssw-cyan-glow), 0 0 90px rgba(34,211,238,0.10); }
}
@keyframes ssw-marquee {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
}
.ssw-plan-card, .ssw-hero-inner, .ssw-cta-card {
    opacity: 0;
    transform: translateY(18px);
    transition: opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1);
}
.ssw-plan-card.ssw-visible,
.ssw-hero-inner.ssw-visible,
.ssw-cta-card.ssw-visible { opacity: 1; transform: translateY(0); }

/* ── HERO ── */
.ssw-pricing-hero {
    padding: 90px 24px 72px;
    text-align: center;
    position: relative;
    background: var(--ssw-bg);
}
.ssw-hero-glow {
    position: absolute;
    top: 0; left: 50%; transform: translateX(-50%);
    width: 900px; height: 480px;
    background: radial-gradient(ellipse at center top, rgba(34,211,238,0.08) 0%, transparent 70%);
    pointer-events: none;
}
.ssw-hero-inner { max-width: 820px; margin: 0 auto; }

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
    font-size: clamp(34px, 5.5vw, 66px);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.03em;
    margin: 0 auto 20px;
}
.ssw-hero-title em {
    font-style: normal;
    background: linear-gradient(135deg, var(--ssw-cyan) 0%, #818cf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
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
    margin-top: 36px;
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

/* ── PLANS GRID ── */
.ssw-plans-section {
    padding: 0 24px 72px;
    max-width: 1140px;
    margin: 0 auto;
    background: var(--ssw-bg);
}
.ssw-plans-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    align-items: stretch;
}

/* CARD BASE */
.ssw-plan-card {
    display: flex;
    flex-direction: column;
    background: var(--ssw-card);
    border: 1px solid var(--ssw-border);
    border-radius: 20px;
    padding: 30px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.3s, transform 0.3s, background 0.3s, opacity 0.6s, box-shadow 0.3s;
}
.ssw-card-top-shine {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.025), transparent 60%);
    pointer-events: none;
}
.ssw-plan-card:hover:not(.ssw-plan-featured) {
    border-color: rgba(255,255,255,0.13);
    background: var(--ssw-card-h);
    transform: translateY(-3px) !important;
    box-shadow: 0 12px 40px rgba(0,0,0,0.35);
}

/* CARD DESTAQUE */
.ssw-plan-featured {
    border-color: var(--ssw-border-a) !important;
    background: linear-gradient(160deg, #0d1825 0%, #0c1220 100%) !important;
    animation: ssw-glow-pulse 4s ease-in-out infinite;
    transform: scale(1.025) !important;
}
.ssw-plan-featured:hover {
    transform: scale(1.025) translateY(-3px) !important;
}
.ssw-featured-top-line {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--ssw-cyan), transparent);
    border-radius: 20px 20px 0 0;
}

/* BADGE DO PLANO */
.ssw-plan-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 11px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--ssw-cyan-dim);
    border: 1px solid var(--ssw-border-a);
    color: var(--ssw-cyan);
    width: fit-content;
    margin-bottom: 18px;
}
.ssw-star-icon { width: 10px; height: 10px; }

/* NOMES */
.ssw-plan-name {
    font-size: 20px;
    font-weight: 700;
    color: var(--ssw-t1);
    margin-bottom: 6px;
}
.ssw-name-accent { color: var(--ssw-cyan); }

.ssw-plan-desc {
    font-size: 13.5px;
    color: var(--ssw-t2);
    line-height: 1.6;
    min-height: 44px;
    margin-bottom: 26px;
}

/* PREÇO */
.ssw-price-block { margin-bottom: 26px; }
.ssw-price-row {
    display: flex;
    align-items: baseline;
    gap: 3px;
    margin-bottom: 5px;
}
.ssw-currency { font-size: 18px; font-weight: 700; color: var(--ssw-t3); }
.ssw-currency-accent { color: var(--ssw-cyan) !important; }
.ssw-amount {
    font-size: 50px;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: var(--ssw-t1);
    line-height: 1;
}
.ssw-cents { font-size: 19px; font-weight: 700; color: var(--ssw-t3); align-self: flex-start; margin-top: 8px; }
.ssw-cents-accent { color: var(--ssw-cyan) !important; }
.ssw-price-note { font-size: 12px; color: var(--ssw-t3); font-weight: 500; }
.ssw-price-tag {
    display: inline-flex;
    align-items: center;
    padding: 3px 10px;
    border-radius: 6px;
    background: var(--ssw-cyan-dim);
    border: 1px solid rgba(34,211,238,0.2);
    font-size: 11.5px;
    font-weight: 600;
    color: var(--ssw-cyan);
    margin-top: 7px;
}
.ssw-price-consult-wrap { display: flex; align-items: center; height: 68px; }
.ssw-price-consult { font-size: 28px; font-weight: 800; color: var(--ssw-t1); letter-spacing: -0.02em; }

/* BOTÕES */
.ssw-btn {
    display: block;
    width: 100%;
    padding: 13px 20px;
    border-radius: 12px;
    font-size: 14.5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
    text-align: center;
    border: none;
    margin-bottom: 26px;
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
    background: var(--ssw-cyan);
    color: #020408;
    font-weight: 700;
    box-shadow: 0 0 20px rgba(34,211,238,0.28), 0 4px 12px rgba(0,0,0,0.3);
}
.ssw-btn-primary:hover {
    background: #67e8f9;
    box-shadow: 0 0 32px rgba(34,211,238,0.38), 0 6px 18px rgba(0,0,0,0.35);
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
.ssw-divider { border: none; border-top: 1px solid var(--ssw-border); margin-bottom: 22px; }
.ssw-features-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--ssw-t3);
    margin-bottom: 14px;
}
.ssw-features-label-bright { color: rgba(255,255,255,0.45) !important; }
.ssw-feature-list { list-style: none; display: flex; flex-direction: column; gap: 11px; flex: 1; }
.ssw-feature-item {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    font-size: 13.5px;
    color: var(--ssw-t2);
    line-height: 1.5;
}
.ssw-feature-item strong { color: var(--ssw-t1); font-weight: 600; }
.ssw-check-dim  { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; color: rgba(255,255,255,0.28); }
.ssw-check-accent { width: 15px; height: 15px; flex-shrink: 0; margin-top: 1px; color: var(--ssw-cyan); }

/* ── TABELA ── */
.ssw-table-section {
    padding: 72px 24px 72px;
    max-width: 1140px;
    margin: 0 auto;
    background: var(--ssw-bg);
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
    font-size: clamp(24px, 3.5vw, 38px);
    font-weight: 800;
    letter-spacing: -0.025em;
    color: var(--ssw-t1);
    margin-bottom: 8px;
}
.ssw-section-sub { font-size: 15px; color: var(--ssw-t2); }
.ssw-table-wrap {
    border: 1px solid var(--ssw-border);
    border-radius: 18px;
    overflow: hidden;
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
    background: rgba(34,211,238,0.04);
    color: var(--ssw-cyan) !important;
    border-left: 1px solid var(--ssw-border-a);
    border-right: 1px solid var(--ssw-border-a);
    position: relative;
}
.ssw-th-featured::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--ssw-cyan), transparent);
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
    background: rgba(34,211,238,0.03);
    border-left: 1px solid var(--ssw-border-a);
    border-right: 1px solid var(--ssw-border-a);
    color: var(--ssw-t1) !important;
    font-weight: 600;
}
.ssw-table tbody tr:last-child td { border-bottom: none; }
.ssw-tcheck     { color: var(--ssw-cyan); display: flex; justify-content: center; }
.ssw-tcheck-dim { color: rgba(255,255,255,0.25); display: flex; justify-content: center; }
.ssw-tminus     { color: var(--ssw-t3); display: flex; justify-content: center; }
.ssw-ti { width: 15px; height: 15px; }

/* ── MARQUEE ── */
.ssw-marquee-section {
    padding: 56px 0;
    border-top: 1px solid var(--ssw-border);
    border-bottom: 1px solid var(--ssw-border);
    background: var(--ssw-bg);
    overflow: hidden;
}
.ssw-marquee-label {
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--ssw-t3);
    margin-bottom: 30px;
}
.ssw-marquee-outer { position: relative; overflow: hidden; }
.ssw-marquee-fade-left, .ssw-marquee-fade-right {
    position: absolute;
    top: 0; bottom: 0;
    width: 160px;
    pointer-events: none;
    z-index: 10;
}
.ssw-marquee-fade-left  { left: 0;  background: linear-gradient(to right, var(--ssw-bg), transparent); }
.ssw-marquee-fade-right { right: 0; background: linear-gradient(to left, var(--ssw-bg), transparent); }
.ssw-marquee-track {
    display: flex;
    animation: ssw-marquee 28s linear infinite;
    width: max-content;
}
.ssw-marquee-track:hover { animation-play-state: paused; }
.ssw-marquee-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 44px;
    opacity: 0.4;
    transition: opacity 0.3s;
    white-space: nowrap;
    cursor: default;
}
.ssw-marquee-item:hover { opacity: 0.9; }
.ssw-marquee-item span { font-size: 15px; font-weight: 700; color: var(--ssw-t1); letter-spacing: -0.01em; }
.ssw-mi-icon { width: 18px; height: 18px; }
.ssw-mi-cyan   { color: var(--ssw-cyan); }
.ssw-mi-purple { color: #a78bfa; }
.ssw-mi-amber  { color: #fbbf24; }
.ssw-mi-green  { color: #34d399; }
.ssw-mi-blue   { color: #60a5fa; }

/* ── FAQ ── */
.ssw-faq-section {
    padding: 72px 24px 90px;
    background: var(--ssw-bg);
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
    max-width: 1140px;
    margin: 0 auto;
    background: var(--ssw-bg);
}
.ssw-cta-card {
    position: relative;
    border-radius: 24px;
    overflow: hidden;
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
    background: radial-gradient(ellipse, rgba(34,211,238,0.09) 0%, transparent 70%);
    pointer-events: none;
}
.ssw-cta-content { position: relative; z-index: 1; }
.ssw-cta-title {
    font-size: clamp(24px, 3.5vw, 40px);
    font-weight: 800;
    letter-spacing: -0.025em;
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
    gap: 8px;
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
    .ssw-plans-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; }
    .ssw-plan-featured { transform: none !important; }
    .ssw-plan-featured:hover { transform: translateY(-3px) !important; }
    .ssw-cta-card { padding: 48px 24px; }
    .ssw-guarantees { gap: 14px; flex-direction: column; align-items: center; }
}
@media (max-width: 600px) {
    .ssw-pricing-hero { padding: 64px 16px 52px; }
    .ssw-plans-section, .ssw-faq-section, .ssw-cta-section { padding-left: 16px; padding-right: 16px; }
    .ssw-hero-title { font-size: 32px; }
}
</style>`;

document.head.insertAdjacentHTML('beforeend', sswPricingStyles);