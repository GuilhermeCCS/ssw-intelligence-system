// Pricing Section - Componente Isolado
// Contém toda a lógica relacionada à seção de preços

// --- FUNÇÃO DE COMPRA COM CHECKOUT TRANSPARENTE MERCADO PAGO ---
async function comprarPlano(pacoteId) {
    if(!USER || !USER.email) {
        showAuthScreen(); 
        return;
    }
    // Definição dos pacotes
    const pacotes = {
        // Novos pacotes pay-as-you-go (IDs corrigidos para backend)
        'basico': { id: 'pacote_basico', nome: 'Pacote Básico', preco: 99.99 },
        'recomendado': { id: 'pacote_recomendado', nome: 'Pacote Recomendado', preco: 149.99 },
        // Antigos pacotes (mantidos para compatibilidade)
        'plano_mensal': { id: 'plano_mensal', nome: 'Plano Mensal', preco: 120.00 },
        'plano_anual': { id: 'plano_anual', nome: 'Plano Anual', preco: 997.00 },
        'plano_semestral': { id: 'plano_semestral', nome: 'Plano Semestral', preco: 597.00 },
        // Recargas
        'recarga_10': { id: 'recarga_10', nome: 'Recarga 10 Créditos', preco: 47.00 },
        'recarga_40': { id: 'recarga_40', nome: 'Recarga 40 Créditos', preco: 167.00 },
        'recarga_90': { id: 'recarga_90', nome: 'Recarga 90 Créditos', preco: 347.00 }
    };
    const pacoteSelecionado = pacotes[pacoteId];
    if (!pacoteSelecionado) {
        Toast.error("Pacote não encontrado.");
        return;
    }
    // Abrir checkout transparente
    try {
        await openCheckout(pacoteSelecionado, USER);
    } catch (error) {
        console.error('Erro ao abrir checkout:', error);
        Toast.error("Erro ao abrir checkout. Tente novamente.");
    }
}

// --- FUNÇÃO PARA FALAR COM VENDAS ---
function falarComVendas() {
    window.open(`https://wa.me/5582991301991?text=Olá! gostaria de saber um pouco mais sobre o pacote enterprise`, '_blank');
}

// --- FUNÇÕES DO TOGGLE DE PLANOS E FAQ ---
// Função para alternar entre Assinaturas e Recargas
function togglePlanType(type) {
    const assinaturasGrid = document.getElementById('assinaturasGrid');
    const recargasGrid = document.getElementById('recargasGrid');
    const toggleAssinaturas = document.getElementById('toggleAssinaturas');
    const toggleRecargas = document.getElementById('toggleRecargas');
    if (type === 'assinaturas') {
        // Mostrar assinaturas, esconder recargas
        assinaturasGrid.classList.remove('hidden');
        recargasGrid.classList.add('hidden');
        // Atualizar botões
        toggleAssinaturas.classList.add('bg-blue-600', 'text-white');
        toggleAssinaturas.classList.remove('text-slate-400', 'hover:text-white');
        toggleRecargas.classList.remove('bg-blue-600', 'text-white');
        toggleRecargas.classList.add('text-slate-400', 'hover:text-white');
    } else {
        // Mostrar recargas, esconder assinaturas
        recargasGrid.classList.remove('hidden');
        assinaturasGrid.classList.add('hidden');
        // Atualizar botões
        toggleRecargas.classList.add('bg-blue-600', 'text-white');
        toggleRecargas.classList.remove('text-slate-400', 'hover:text-white');
        toggleAssinaturas.classList.remove('bg-blue-600', 'text-white');
        toggleAssinaturas.classList.add('text-slate-400', 'hover:text-white');
    }
    // Recriar ícones Lucide após mudança
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Função para alternar FAQ accordion
function toggleFAQ(index) {
    const content = document.getElementById(`faq-content-${index}`);
    const icon = document.getElementById(`faq-icon-${index}`);
    if (!content || !icon) return;
    if (content.style.display === 'none' || content.style.display === '') {
        // Abrir
        content.style.display = 'block';
        icon.style.transform = 'rotate(180deg)';
        icon.style.transition = 'transform 0.3s ease';
    } else {
        // Fechar
        content.style.display = 'none';
        icon.style.transform = 'rotate(0deg)';
        icon.style.transition = 'transform 0.3s ease';
    }
}

// --- CARROUSEL JAVASCRIPT ---
let currentCarouselIndex = 0;
const totalCards = 5;

function initCarousel() {
    updateCarousel();
    createDots();
    // Adicionar evento de clique aos cards
    document.querySelectorAll('.carousel-card').forEach(card => {
        card.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            goToCard(index);
        });
    });
}

function createDots() {
    const dotsContainer = document.getElementById('carousel-dots');
    if (!dotsContainer) return;
    
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalCards; i++) {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot';
        dot.onclick = () => goToCard(i);
        dotsContainer.appendChild(dot);
    }
    updateDots();
}

function updateDots() {
    const dots = document.querySelectorAll('.carousel-dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentCarouselIndex);
    });
}

function updateCarousel() {
    const cards = document.querySelectorAll('.carousel-card');
    cards.forEach((card, index) => {
        // Remove todas as classes primeiro
        card.classList.remove('active', 'prev', 'next', 'hidden');
        // Calcula a posição relativa ao card atual
        const relativePosition = index - currentCarouselIndex;
        // Aplica as classes baseadas na posição
        if (relativePosition === 0) {
            card.classList.add('active');
        } else if (relativePosition === -1 || (currentCarouselIndex === 0 && index === totalCards - 1)) {
            card.classList.add('prev');
        } else if (relativePosition === 1 || (currentCarouselIndex === totalCards - 1 && index === 0)) {
            card.classList.add('next');
        } else {
            card.classList.add('hidden');
        }
    });
    updateDots();
}

function moveCarousel(direction) {
    currentCarouselIndex += direction;
    // Loop circular
    if (currentCarouselIndex < 0) {
        currentCarouselIndex = totalCards - 1;
    } else if (currentCarouselIndex >= totalCards) {
        currentCarouselIndex = 0;
    }
    updateCarousel();
}

function goToCard(index) {
    currentCarouselIndex = index;
    updateCarousel();
}

// Auto-play (opcional - comente se não quiser)
function startAutoPlay() {
    setInterval(() => {
        moveCarousel(1);
    }, 5000); // Muda a cada 5 segundos
}

// Inicializa o carrossel quando a página carrega ou quando o HTML é injetado
function initPricingSection() {
    // Inicializa apenas se o carrossel existir na página
    if (document.querySelector('.carousel-card')) {
        initCarousel();
        // startAutoPlay(); // Descomente para ativar auto-play
    }
}

document.addEventListener('DOMContentLoaded', initPricingSection);

// Também inicializa quando o HTML é carregado dinamicamente
window.addEventListener('loadPricingSection', initPricingSection);

// --- CSS PARA O CARROUSEL E SEÇÃO DE PREÇOS ---
const pricingStyles = `
<style>
/* Carrossel Styles */
.carousel-card {
    position: absolute;
    width: 320px;
    transition: all 700ms ease-in-out;
    opacity: 0;
    transform: scale(0.6) translateX(0);
    z-index: 1;
}

.carousel-card.active {
    opacity: 1;
    transform: scale(1) translateX(0);
    z-index: 10;
}

.carousel-card.prev {
    opacity: 0.5;
    transform: scale(0.7) translateX(-180px);
    z-index: 5;
}

.carousel-card.next {
    opacity: 0.5;
    transform: scale(0.7) translateX(180px);
    z-index: 5;
}

.carousel-card.hidden {
    opacity: 0;
    transform: scale(0.6);
    z-index: 0;
}

.carousel-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    cursor: pointer;
    transition: all 300ms ease;
}

.carousel-dot.active {
    background: white;
    transform: scale(1.2);
}

.carousel-dot:hover {
    background: rgba(255, 255, 255, 0.6);
}

/* Rolagem horizontal para planos em telas pequenas */
@media (max-width: 767px) {
    #view-precos .grid {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        min-width: fit-content;
    }
    #view-precos .grid > * {
        min-width: 280px;
        flex-shrink: 0;
    }
}
</style>
`;

// Injeta os estilos da seção de preços no head
document.head.insertAdjacentHTML('beforeend', pricingStyles);
