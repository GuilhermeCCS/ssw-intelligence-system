// Carrega a seção de ranking dinamicamente
async function loadRankingSection() {
    console.log('🚀 loadRankingSection iniciado');
    try {
        const response = await fetch('/src/components/ranking/ranking-component.fragment?v=20260629-ranking-redesign-v4', { redirect: 'error' });
        if (!response.ok) {
            throw new Error(`Falha ao carregar ranking: ${response.status}`);
        }
        const html = await response.text();
        if (!html.includes('id="view-ranking"') || /<html[\s>]/i.test(html)) {
            throw new Error('Resposta inválida ao carregar ranking.');
        }
        console.log('📄 HTML do ranking carregado');
        document.getElementById('view-ranking-container').innerHTML = html;
        // Recria ícones Lucide após carregar
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        // Carrega o script JavaScript do ranking
        const script = document.createElement('script');
        script.src = '/src/components/ranking/ranking-component.js?v=20260629-ranking-redesign-v4';
        script.onload = () => {
            console.log('✅ Script do ranking carregado');
            console.log('🔍 Verificando se loadRanking existe:', typeof loadRanking);
            // Chama loadRanking diretamente após o script ser carregado
            if (typeof loadRanking === 'function') {
                console.log('📊 Chamando loadRanking()');
                loadRanking();
            } else {
                console.error('❌ loadRanking não é uma função');
            }
            if (window.location.pathname.replace('/', '') === 'ranking' && typeof nav === 'function') {
                nav('ranking');
            }
        };
        script.onerror = () => {
            console.error('❌ Erro ao carregar script do ranking');
        };
        document.head.appendChild(script);
    } catch (error) {
        console.error('Erro ao carregar seção de ranking:', error);
    }
}

// Carrega a seção quando a página estiver pronta
document.addEventListener('DOMContentLoaded', loadRankingSection);
