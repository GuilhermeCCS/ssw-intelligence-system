// ========== RANKING FUNCTIONS ==========
console.log('📦 ranking-component.js carregado');

// Variáveis globais para ranking
let rankingData = [];

// A variável API_URL já foi declarada no index.html ou config.js. 
// Apagámos a declaração daqui para resolver o erro "Identifier has already been declared".

// Função para carregar o ranking
async function loadRanking() {
    console.log("📊 loadRanking chamado");
    const rankingList = document.getElementById('rankingList');
    const rankingTotalCount = document.getElementById('rankingTotalCount');

    // Estado inicial de "Carregando"
    const setLoadingState = () => {
        const elements = [
            document.getElementById('podiumFirstName'),
            document.getElementById('podiumFirstScore'),
            document.getElementById('podiumSecondName'),
            document.getElementById('podiumSecondScore'),
            document.getElementById('podiumThirdName'),
            document.getElementById('podiumThirdScore')
        ];
        elements.forEach(el => {
            if (el) el.textContent = '--';
        });
        if (rankingTotalCount) rankingTotalCount.textContent = '0';
        if (rankingList) {
            rankingList.innerHTML = '<div class="p-6 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/60 to-blue-950/40 text-center text-slate-300">Carregando dados do mercado...</div>';
        }
    };

    setLoadingState();

    console.log('🔄 Iniciando fetch para a API de ranking...');

    try {
        const res = await fetch(`${API_URL}/api/ranking`);
        console.log('📡 Resposta recebida, status:', res.status);
        const rawData = await res.json();

        if (!res.ok) {
            throw new Error("Erro na API");
        }

        // PROTEÇÃO: Garante que os dados são lidos como array, independentemente de como a API os envie
        const data = Array.isArray(rawData) ? rawData : (rawData.ranking || rawData.data || []);

        // Ordenar do maior score para o menor
        data.sort((a, b) => b.score - a.score);
        
        // Armazenar os dados globalmente para uso na busca e nos filtros
        window.rankingData = data;
        rankingData = data;

        // Delega a renderização do HTML à função de visualização
        renderRankingView(data);

        console.log("✅ ranking carregado com sucesso");
    } catch (e) {
        console.error("❌ Erro no loadRanking:", e);
        if (rankingList) {
            rankingList.innerHTML = '<div class="p-4 rounded-2xl border border-red-500 bg-red-500/10 text-red-400 text-center">Erro ao carregar ranking. Verifique a conexão com a API.</div>';
        }
        if (rankingTotalCount) rankingTotalCount.textContent = '0';

        // Reseta pódio em caso de erro
        const setPodium = (nameId, scoreId, placeholder) => {
            const nEl = document.getElementById(nameId);
            const sEl = document.getElementById(scoreId);
            if(nEl) nEl.textContent = placeholder;
            if(sEl) sEl.textContent = '--';
        };
        setPodium('podiumFirstName', 'podiumFirstScore', 'Sem dados');
        setPodium('podiumSecondName', 'podiumSecondScore', 'Sem dados');
        setPodium('podiumThirdName', 'podiumThirdScore', 'Sem dados');
    }
}

// --- FUNÇÃO DE RENDERIZAÇÃO: Desenha os dados na tela ---
function renderRankingView(dataToRender) {
    const firstName = document.getElementById('podiumFirstName');
    const firstScore = document.getElementById('podiumFirstScore');
    const secondName = document.getElementById('podiumSecondName');
    const secondScore = document.getElementById('podiumSecondScore');
    const thirdName = document.getElementById('podiumThirdName');
    const thirdScore = document.getElementById('podiumThirdScore');
    const rankingList = document.getElementById('rankingList');
    const rankingTotalCount = document.getElementById('rankingTotalCount');

    // Preenche um lugar do pódio
    const setPodium = (nameEl, scoreEl, site, placeholder) => {
        if (!nameEl || !scoreEl) return;
        if (!site) {
            nameEl.textContent = placeholder;
            scoreEl.textContent = '--';
            return;
        }
        nameEl.textContent = site.site_name || 'Sem Nome';
        scoreEl.textContent = site.score !== undefined ? site.score : '--';
    };

    if (rankingTotalCount) rankingTotalCount.textContent = `${dataToRender.length}`;

    // Extrai o Top 3
    const [first, second, third, ...others] = dataToRender;

    setPodium(firstName, firstScore, first, 'Nenhum');
    setPodium(secondName, secondScore, second, 'Nenhum');
    setPodium(thirdName, thirdScore, third, 'Nenhum');

    // Desenha a lista dos demais colocados com a nova tabela estilizada
    if (rankingList) {
        if (others.length === 0) {
            rankingList.innerHTML = '<div class="p-6 rounded-2xl border border-slate-700/50 bg-slate-800/30 text-slate-400 text-center">Nenhum outro colocado neste nicho.</div>';
        } else {
            rankingList.innerHTML = others.map((site, idx) => {
                let scoreColor = 'text-slate-300';
                if (site.score >= 50) scoreColor = 'text-cyan-300';
                if (site.score >= 80) scoreColor = 'text-emerald-400';

                return `
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border border-slate-700/30 bg-slate-800/40 transition-all hover:bg-slate-700/40 hover:border-slate-600/50 hover:translate-x-1">
                        <div class="flex items-center gap-4">
                            <span class="font-mono text-slate-500 font-bold text-sm w-8 text-center bg-slate-900/50 py-1 rounded-md">#${idx + 4}</span>
                            <div>
                                <div class="font-bold text-white text-base">${site.site_name || 'Sem Nome'}</div>
                                <div class="text-slate-400 text-xs mt-0.5">${site.niche || 'Nicho não informado'}</div>
                            </div>
                        </div>
                        <div class="text-right mt-2 sm:mt-0">
                            <span class="font-black ${scoreColor} text-xl">${site.score !== undefined ? site.score : '--'}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// --- FUNÇÃO DE FILTRO: Acionada ao clicar nas Tabs ---
function filterRankingData(category, btnElement) {
    // Reseta visual dos botões
    document.querySelectorAll('.ranking-tab').forEach(btn => {
        btn.className = "ranking-tab px-6 py-2.5 rounded-full text-sm font-medium transition-all bg-slate-800/50 text-slate-300 border border-slate-700 hover:text-white hover:border-slate-500 hover:bg-slate-700 hover:scale-105";
    });
    
    // Adiciona brilho ao botão clicado
    if (btnElement) {
        btnElement.className = "ranking-tab active px-6 py-2.5 rounded-full text-sm font-bold transition-all bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:scale-105";
    }

    // Termos de busca de nicho
    const cats = {
        comercio:   ['roupa', 'loja', 'commerce', 'eletronico', 'farmacia', 'restaurante', 'varejo', 'produto', 'moda'],
        servicos:   ['advogado', 'dentista', 'clinica', 'servico', 'carro', 'turismo', 'hotel', 'saude', 'médico'],
        digital:    ['sistema', 'software', 'curso', 'landing page', 'online', 'tech', 'digital', 'saas'],
        financas:   ['banco', 'financa', 'consultoria', 'imobiliaria', 'b2b', 'negócio']
    };

    let filteredData = window.rankingData || [];
    
    if (category !== 'todos') {
        filteredData = window.rankingData.filter(site => {
            const niche = (site.niche || '').toLowerCase();
            return cats[category].some(term => niche.includes(term));
        });
    }

    renderRankingView(filteredData);
}

// --- FUNÇÃO DE PESQUISA (Search Bar) ---
function searchRankingSite() {
    const searchInput = document.getElementById('searchRankingInput');
    const searchResultContainer = document.getElementById('searchResultContainer');
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm) {
        searchResultContainer.classList.add('hidden');
        searchResultContainer.innerHTML = '';
        return;
    }

    if (!window.rankingData || window.rankingData.length === 0) {
        searchResultContainer.classList.remove('hidden');
        searchResultContainer.innerHTML = `
            <div class="p-6 rounded-2xl border border-red-500/50 bg-red-500/10 text-red-400 text-center">
                <p class="font-bold">Dados do ranking não disponíveis</p>
                <p class="text-sm mt-1">Por favor, aguarde o carregamento do ranking.</p>
            </div>
        `;
        return;
    }

    const foundSite = window.rankingData.find(site =>
        site.site_name.toLowerCase().includes(searchTerm)
    );

    if (foundSite) {
        const position = window.rankingData.indexOf(foundSite) + 1;
        let positionColor = 'text-slate-400';
        let positionBgColor = 'bg-slate-900/50 border-slate-700';
        let scoreColor = 'text-white';

        // Lógica de cores baseada no Pódio
        if (position === 1) {
            positionColor = 'text-yellow-400';
            positionBgColor = 'bg-yellow-900/40 border-yellow-500/50';
            scoreColor = 'text-yellow-400';
        } else if (position === 2) {
            positionColor = 'text-slate-300';
            positionBgColor = 'bg-slate-700/80 border-slate-400/40';
            scoreColor = 'text-slate-300';
        } else if (position === 3) {
            positionColor = 'text-orange-400';
            positionBgColor = 'bg-orange-950/40 border-orange-500/40';
            scoreColor = 'text-orange-400';
        } else {
            if (foundSite.score >= 50) scoreColor = 'text-cyan-300';
            if (foundSite.score >= 80) scoreColor = 'text-emerald-400';
        }

        searchResultContainer.classList.remove('hidden');
        searchResultContainer.innerHTML = `
            <div class="p-6 rounded-2xl border border-slate-600 bg-slate-800/80 backdrop-blur-sm shadow-xl animate-fade-in-up">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div class="flex items-start gap-4 flex-1">
                        <div class="flex items-center justify-center w-16 h-16 rounded-full ${positionBgColor} border shadow-inner">
                            <span class="text-2xl font-black ${positionColor}">#${position}</span>
                        </div>
                        <div>
                            <h4 class="text-xl font-bold text-white">${foundSite.site_name || 'Sem Nome'}</h4>
                            <p class="text-slate-400 text-sm mt-1">${foundSite.niche || 'Nicho não informado'}</p>
                        </div>
                    </div>
                    <div class="text-right mt-2 sm:mt-0">
                        <p class="text-slate-500 text-xs mb-1 uppercase font-bold tracking-wider">Score Oficial</p>
                        <span class="text-4xl font-black ${scoreColor}">${foundSite.score !== undefined ? foundSite.score : '--'}</span>
                    </div>
                </div>
            </div>
        `;
    } else {
        searchResultContainer.classList.remove('hidden');
        searchResultContainer.innerHTML = `
            <div class="p-6 rounded-2xl border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-center animate-fade-in-up">
                <p class="font-bold text-lg"><i data-lucide="alert-triangle" class="w-5 h-5 inline-block -mt-1 mr-1"></i> Site não encontrado</p>
                <p class="text-sm mt-2 text-yellow-200/80">A busca por "<strong>${searchTerm}</strong>" não retornou resultados no ranking global.</p>
            </div>
        `;
        lucide.createIcons();
    }
}

function showSearchSuggestions() {
    const searchInput = document.getElementById('searchRankingInput');
    const suggestionsDropdown = document.getElementById('searchSuggestionsDropdown');
    const suggestionsList = document.getElementById('suggestionsList');
    const searchTerm = searchInput.value.toLowerCase().trim();

    if (!searchTerm || !window.rankingData || window.rankingData.length === 0) {
        suggestionsDropdown.classList.add('hidden');
        suggestionsList.innerHTML = '';
        return;
    }

    const sitesStartingWith = window.rankingData.filter(site =>
        site.site_name.toLowerCase().startsWith(searchTerm)
    ).sort((a, b) => a.site_name.toLowerCase().localeCompare(b.site_name.toLowerCase()));

    const sitesContaining = window.rankingData.filter(site =>
        site.site_name.toLowerCase().includes(searchTerm) &&
        !site.site_name.toLowerCase().startsWith(searchTerm)
    ).sort((a, b) => a.site_name.toLowerCase().localeCompare(b.site_name.toLowerCase()));

    const filteredSites = [...sitesStartingWith, ...sitesContaining].slice(0, 5);

    if (filteredSites.length === 0) {
        suggestionsDropdown.classList.add('hidden');
        suggestionsList.innerHTML = '';
        return;
    }

    suggestionsList.innerHTML = filteredSites.map((site, idx) => {
        const position = window.rankingData.indexOf(site) + 1;
        let scoreColor = 'text-slate-300';
        if (site.score >= 50) scoreColor = 'text-cyan-300';
        if (site.score >= 80) scoreColor = 'text-emerald-400';

        return `
            <li class="border-b border-slate-700/50 last:border-b-0 hover:bg-slate-700/50 cursor-pointer transition p-3" onclick="selectSuggestion('${site.site_name.replace(/'/g, "\\'")}')">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex-1">
                        <div class="text-white font-semibold text-sm">${site.site_name}</div>
                        <div class="text-slate-400 text-xs mt-0.5">${site.niche || 'Nicho não informado'}</div>
                    </div>
                    <div class="text-right flex items-center gap-2">
                        <span class="font-mono text-xs text-slate-500 bg-slate-900/50 px-2 py-0.5 rounded">#${position}</span>
                        <span class="font-bold ${scoreColor}">${site.score || '--'}</span>
                    </div>
                </div>
            </li>
        `;
    }).join('');

    suggestionsDropdown.classList.remove('hidden');
}

function selectSuggestion(siteName) {
    const searchInput = document.getElementById('searchRankingInput');
    searchInput.value = siteName;
    document.getElementById('searchSuggestionsDropdown').classList.add('hidden');
    searchRankingSite();
}

// Event Listeners base
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchRankingInput');
    if (searchInput) {
        searchInput.addEventListener('input', showSearchSuggestions);

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchRankingSite();
                document.getElementById('searchSuggestionsDropdown').classList.add('hidden');
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('#searchRankingInput') && !e.target.closest('#searchSuggestionsDropdown')) {
                document.getElementById('searchSuggestionsDropdown').classList.add('hidden');
            }
        });
    }
});