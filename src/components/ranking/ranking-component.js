// ========== RANKING FUNCTIONS ==========

// Variáveis globais para ranking
let rankingData = [];

// API URL - deve ser definida globalmente ou usar a do index.html
const API_URL = window.API_URL || 'https://sswintelligence.com.br';

// Função para carregar o ranking
async function loadRanking() {
    console.log("loadRanking chamado");
    const firstName = document.getElementById('podiumFirstName');
    const firstScore = document.getElementById('podiumFirstScore');
    const secondName = document.getElementById('podiumSecondName');
    const secondScore = document.getElementById('podiumSecondScore');
    const thirdName = document.getElementById('podiumThirdName');
    const thirdScore = document.getElementById('podiumThirdScore');
    const rankingList = document.getElementById('rankingList');
    const rankingTotalCount = document.getElementById('rankingTotalCount');

    const setLoadingState = () => {
        [firstName, firstScore, secondName, secondScore, thirdName, thirdScore].forEach(el => {
            if (el) el.textContent = '--';
        });
        if (rankingTotalCount) rankingTotalCount.textContent = '0';
        if (rankingList) {
            rankingList.innerHTML = '<div class="p-6 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/60 to-blue-950/40 text-center text-slate-300">Carregando dados do mercado...</div>';
        }
    };

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

    setLoadingState();

    try {
        const res = await fetch(`${API_URL}/api/ranking`);
        const data = await res.json();

        if (!res.ok) {
            throw new Error("Erro na API");
        }

        data.sort((a, b) => b.score - a.score);
        // Armazenar os dados do ranking globalmente para uso na busca
        window.rankingData = data;
        rankingData = data;

        if (rankingTotalCount) rankingTotalCount.textContent = `${data.length}`;

        const [first, second, third, ...others] = data;

        setPodium(firstName, firstScore, first, 'Sem dados');
        setPodium(secondName, secondScore, second, 'Sem dados');
        setPodium(thirdName, thirdScore, third, 'Sem dados');

        if (rankingList) {
            if (others.length === 0) {
                rankingList.innerHTML = '<div class="p-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/60 to-blue-950/40 text-slate-300">Nenhum outro colocado registrado ainda.</div>';
            } else {
                rankingList.innerHTML = others.map((site, idx) => {
                    let scoreColor = 'text-slate-300';
                    if (site.score >= 50) scoreColor = 'text-cyan-300';
                    if (site.score >= 80) scoreColor = 'text-emerald-300';

                    return `
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-950/60 to-blue-950/40 transition hover:border-cyan-400/40 hover:bg-gradient-to-br hover:from-cyan-950/80 hover:to-blue-950/60">
                            <div class="flex items-center gap-3">
                                <span class="font-mono text-cyan-300 text-xs">#${idx + 4}</span>
                                <div>
                                    <div class="font-semibold text-white">${site.site_name || 'Sem Nome'}</div>
                                    <div class="text-cyan-200 text-xs">${site.niche || 'Nicho não informado'}</div>
                                </div>
                            </div>
                            <span class="font-bold ${scoreColor} text-lg">${site.score !== undefined ? site.score : '--'}</span>
                        </div>
                    `;
                }).join('');
            }
        }

        console.log("ranking carregado com sucesso");
    } catch (e) {
        console.error("Erro no loadRanking:", e);
        if (rankingList) {
            rankingList.innerHTML = '<div class="p-4 rounded-2xl border border-red-500 bg-red-500/10 text-red-400 text-center">Erro ao carregar ranking.</div>';
        }
        if (rankingTotalCount) rankingTotalCount.textContent = '0';

        setPodium(firstName, firstScore, null, 'Sem dados');
        setPodium(secondName, secondScore, null, 'Sem dados');
        setPodium(thirdName, thirdScore, null, 'Sem dados');
    }
}

// Função para buscar um site no ranking
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
                <p class="font-semibold">Dados do ranking não disponíveis</p>
                <p class="text-sm mt-2">Por favor, aguarde o carregamento do ranking.</p>
            </div>
        `;
        return;
    }

    // Procurar pelo site
    const foundSite = window.rankingData.find(site =>
        site.site_name.toLowerCase().includes(searchTerm)
    );

    if (foundSite) {
        const position = window.rankingData.indexOf(foundSite) + 1;
        let positionColor = 'text-slate-400';
        let positionBgColor = 'bg-slate-950/50';
        let scoreColor = 'text-slate-300';

        if (position === 1) {
            positionColor = 'text-cyan-300';
            positionBgColor = 'bg-cyan-950/50 border-cyan-400/50';
            scoreColor = 'text-emerald-300';
        } else if (position === 2) {
            positionColor = 'text-cyan-400';
            positionBgColor = 'bg-blue-950/50 border-cyan-400/30';
            scoreColor = 'text-cyan-300';
        } else if (position === 3) {
            positionColor = 'text-cyan-400';
            positionBgColor = 'bg-blue-950/50 border-cyan-400/30';
            scoreColor = 'text-cyan-300';
        }

        if (foundSite.score >= 50) scoreColor = 'text-cyan-300';
        if (foundSite.score >= 80) scoreColor = 'text-emerald-300';

        searchResultContainer.classList.remove('hidden');
        searchResultContainer.innerHTML = `
            <div class="p-6 rounded-2xl border border-cyan-400/40 bg-gradient-to-br from-cyan-950/40 to-blue-950/30">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div class="flex items-start gap-4 flex-1">
                        <div class="flex items-center justify-center w-16 h-16 rounded-full ${positionBgColor} border border-cyan-400/30">
                            <span class="text-3xl font-black ${positionColor}">#${position}</span>
                        </div>
                        <div>
                            <h4 class="text-xl font-bold text-white">${foundSite.site_name || 'Sem Nome'}</h4>
                            <p class="text-cyan-200 text-sm mt-1">${foundSite.niche || 'Nicho não informado'}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-slate-400 text-xs mb-1">Score</p>
                        <span class="text-4xl font-black ${scoreColor}">${foundSite.score !== undefined ? foundSite.score : '--'}</span>
                    </div>
                </div>
                <div class="mt-5 pt-5 border-t border-cyan-400/20">
                    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div class="text-center">
                            <p class="text-slate-400 text-xs mb-1">Ranking</p>
                            <p class="text-white font-bold text-lg">${position} de ${window.rankingData.length}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-slate-400 text-xs mb-1">Acima</p>
                            <p class="text-emerald-300 font-bold text-lg">${position - 1}</p>
                        </div>
                        <div class="text-center">
                            <p class="text-slate-400 text-xs mb-1">Abaixo</p>
                            <p class="text-slate-300 font-bold text-lg">${window.rankingData.length - position}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        searchResultContainer.classList.remove('hidden');
        searchResultContainer.innerHTML = `
            <div class="p-6 rounded-2xl border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-center">
                <p class="font-semibold">Site não encontrado</p>
                <p class="text-sm mt-2">A busca por "<strong>${searchTerm}</strong>" não retornou resultados.</p>
                <p class="text-xs mt-3 text-yellow-300">Dica: Procure pelo nome exato do site ou parte dele.</p>
            </div>
        `;
    }
}

// Função para mostrar sugestões de busca em tempo real
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

    // Filtrar sites que INICIAM com o termo de busca (prioridade alta)
    const sitesStartingWith = window.rankingData.filter(site =>
        site.site_name.toLowerCase().startsWith(searchTerm)
    ).sort((a, b) => a.site_name.toLowerCase().localeCompare(b.site_name.toLowerCase()));

    // Filtrar sites que contêm o termo mas não iniciam (prioridade baixa)
    const sitesContaining = window.rankingData.filter(site =>
        site.site_name.toLowerCase().includes(searchTerm) &&
        !site.site_name.toLowerCase().startsWith(searchTerm)
    ).sort((a, b) => a.site_name.toLowerCase().localeCompare(b.site_name.toLowerCase()));

    // Combinar: primeiramente os que começam (alfabeticamente), depois os que contêm (alfabeticamente)
    const filteredSites = [...sitesStartingWith, ...sitesContaining].slice(0, 5);

    if (filteredSites.length === 0) {
        suggestionsDropdown.classList.add('hidden');
        suggestionsList.innerHTML = '';
        return;
    }

    // Construir lista de sugestões
    suggestionsList.innerHTML = filteredSites.map((site, idx) => {
        const position = window.rankingData.indexOf(site) + 1;
        let scoreColor = 'text-slate-300';
        if (site.score >= 50) scoreColor = 'text-cyan-300';
        if (site.score >= 80) scoreColor = 'text-emerald-300';

        return `
            <li class="border-b border-cyan-400/10 last:border-b-0 hover:bg-cyan-950/30 cursor-pointer transition" onclick="selectSuggestion('${site.site_name.replace(/'/g, "\\'")}')">
                <div class="p-3 flex items-center justify-between gap-3">
                    <div class="flex-1">
                        <div class="text-white font-semibold text-sm">${site.site_name}</div>
                        <div class="text-cyan-200 text-xs">${site.niche || 'Nicho não informado'}</div>
                    </div>
                    <div class="text-right">
                        <span class="font-mono text-xs text-slate-400">#${position}</span>
                        <div class="font-bold ${scoreColor}">${site.score || '--'}</div>
                    </div>
                </div>
            </li>
        `;
    }).join('');

    suggestionsDropdown.classList.remove('hidden');
}

// Função para selecionar uma sugestão
function selectSuggestion(siteName) {
    const searchInput = document.getElementById('searchRankingInput');
    searchInput.value = siteName;
    document.getElementById('searchSuggestionsDropdown').classList.add('hidden');
    searchRankingSite();
}

// Permitir busca ao pressionar Enter e mostrar sugestões em tempo real
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchRankingInput');
    if (searchInput) {
        // Mostrar sugestões enquanto digita
        searchInput.addEventListener('input', showSearchSuggestions);

        // Buscar ao pressionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchRankingSite();
                document.getElementById('searchSuggestionsDropdown').classList.add('hidden');
            }
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#searchRankingInput') && !e.target.closest('#searchSuggestionsDropdown')) {
                document.getElementById('searchSuggestionsDropdown').classList.add('hidden');
            }
        });
    }
});

// Carregar ranking quando a seção for carregada
window.addEventListener('loadRankingSection', () => {
    loadRanking();
});
