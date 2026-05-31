// ========== RANKING FUNCTIONS ==========
console.log('ranking-component.js carregado');

let rankingData = [];
let activeRankingFilter = 'todos';
let currentRankingType = 'landing';
let rankingInteractionsReady = false;

const rankingFilterLabels = {
    todos: 'Todos',
    comercio: 'Comercio',
    servicos: 'Servicos',
    digital: 'Digital',
    financas: 'B2B',
    educacao: 'Educacao',
    imoveis: 'Imoveis'
};

const rankingFilterOptionBaseClass = 'ranking-filter-option flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-300 transition hover:bg-white/[0.04] hover:text-white';
const rankingFilterOptionActiveClass = 'ranking-filter-option flex w-full items-center justify-between rounded-lg bg-cyan-300/[0.12] px-3 py-2.5 text-left text-sm font-black text-white transition hover:bg-cyan-300/[0.16]';

function rankingText(value, fallback = '') {
    return value === undefined || value === null || value === '' ? fallback : String(value);
}

function escapeHtml(value) {
    return rankingText(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeRankingText(value) {
    return rankingText(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function scoreValue(site) {
    const value = Number(site && site.score);
    return Number.isFinite(value) ? value : null;
}

function formatScore(site) {
    const value = scoreValue(site);
    return value === null ? '--' : Math.round(value);
}

function scoreWidth(site) {
    const value = scoreValue(site);
    return Math.max(0, Math.min(100, value || 0));
}

function refreshRankingIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

async function loadRanking() {
    console.log('loadRanking chamado');
    const rankingList = document.getElementById('rankingList');
    const topThreeList = document.getElementById('topThreeList');

    initRankingInteractions();
    setLoadingState(rankingList, topThreeList);

    try {
        const res = await fetch(`${API_URL}/api/ranking`);
        const rawData = await res.json();

        if (!res.ok) {
            throw new Error('Erro na API');
        }

        const data = Array.isArray(rawData) ? rawData : (rawData.ranking || rawData.data || []);
        data.sort((a, b) => (scoreValue(b) || 0) - (scoreValue(a) || 0));

        window.rankingData = data;
        rankingData = data;
        activeRankingFilter = 'todos';
        currentRankingType = 'landing';
        setRankingTypeButtonState();
        setActiveRankingFilterOption();
        applyRankingFilters();

        console.log('ranking carregado com sucesso');
    } catch (e) {
        console.error('Erro no loadRanking:', e);
        renderRankingError();
    }
}

function setLoadingState(rankingList, topThreeList) {
    updateRankingSummary([]);
    if (topThreeList) {
        topThreeList.innerHTML = `
            <div class="rounded-xl border border-white/[0.07] bg-[#080d16] p-4 text-sm text-slate-400">
                Carregando destaques...
            </div>
        `;
    }
    if (rankingList) {
        rankingList.innerHTML = `
            <div class="p-8 text-center text-slate-400">
                <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-[#080d16]">
                    <i data-lucide="loader-2" class="h-5 w-5 text-cyan-300"></i>
                </div>
                Carregando dados do mercado...
            </div>
        `;
    }
    refreshRankingIcons();
}

function renderRankingError() {
    const rankingList = document.getElementById('rankingList');
    const topThreeList = document.getElementById('topThreeList');
    updateRankingSummary([]);

    if (topThreeList) {
        topThreeList.innerHTML = '<div class="rounded-xl border border-white/[0.07] bg-[#080d16] p-4 text-sm text-slate-400">Sem dados para exibir.</div>';
    }
    if (rankingList) {
        rankingList.innerHTML = `
            <div class="p-8 text-center text-red-300">
                <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10">
                    <i data-lucide="wifi-off" class="h-5 w-5"></i>
                </div>
                Erro ao carregar ranking. Verifique a conexao com a API.
            </div>
        `;
    }
    refreshRankingIcons();
}

function updateRankingSummary(dataToRender) {
    const totalEl = document.getElementById('rankingTotalCount');
    const activeFilterEl = document.getElementById('rankingActiveFilter');
    if (totalEl) totalEl.textContent = `${dataToRender.length}`;
    if (activeFilterEl) activeFilterEl.textContent = rankingFilterLabels[activeRankingFilter] || 'Todos';
}

function renderRankingView(dataToRender) {
    updateRankingSummary(dataToRender);
    renderTopThree(dataToRender.slice(0, 3));
    renderRankingRows(dataToRender);
}

function renderTopThree(topSites) {
    const topThreeList = document.getElementById('topThreeList');
    if (!topThreeList) return;

    if (!topSites.length) {
        topThreeList.innerHTML = `
            <div class="rounded-xl border border-white/[0.07] bg-[#080d16] p-4 text-sm text-slate-400">
                Nenhum competidor encontrado neste filtro.
            </div>
        `;
        return;
    }

    topThreeList.innerHTML = [0, 1, 2].map(index => {
        const site = topSites[index];
        const position = index + 1;
        if (!site) {
            return `
                <div class="rounded-xl border border-white/[0.07] bg-[#080d16] p-4 text-sm text-slate-500">
                    #${position} ainda sem registro
                </div>
            `;
        }

        const isLeader = position === 1;
        const rankClass = isLeader ? 'border-cyan-300/35 bg-gradient-to-br from-[#0d1825] to-[#0c1220] text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.14)]' : 'border-white/[0.07] bg-[#080d16] text-slate-300';

        return `
            <article class="rounded-xl border ${rankClass} p-4">
                <div class="mb-3 flex items-start justify-between gap-3">
                    <span class="inline-flex h-8 min-w-10 items-center justify-center rounded-lg border border-white/[0.07] bg-[#020408] font-mono text-sm font-black">#${position}</span>
                    <span class="text-2xl font-black text-white">${formatScore(site)}</span>
                </div>
                <h4 class="line-clamp-2 text-base font-black leading-tight text-white">${escapeHtml(site.site_name || 'Sem nome')}</h4>
                <p class="mt-1 truncate text-sm text-slate-500">${escapeHtml(site.niche || 'Nicho nao informado')}</p>
                <div class="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div class="h-full rounded-full bg-cyan-300" style="width: ${scoreWidth(site)}%"></div>
                </div>
            </article>
        `;
    }).join('');
}

function renderRankingRows(dataToRender) {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

    if (!dataToRender.length) {
        rankingList.innerHTML = `
            <div class="p-8 text-center text-slate-400">
                <div class="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-[#080d16]">
                    <i data-lucide="search-x" class="h-5 w-5"></i>
                </div>
                Nenhum competidor encontrado neste filtro.
            </div>
        `;
        refreshRankingIcons();
        return;
    }

    rankingList.innerHTML = dataToRender.map((site, idx) => {
        const position = idx + 1;
        const isTopTen = position <= 10;
        const rowTone = isTopTen ? 'hover:bg-[#101828]' : 'opacity-85 hover:opacity-100 hover:bg-[#101828]';

        return `
            <article class="grid min-h-[3.75rem] gap-3 px-4 py-3 transition ${rowTone} lg:grid-cols-[76px_minmax(0,1fr)_150px_96px] lg:items-center">
                <div class="flex items-center gap-3">
                    <span class="inline-flex h-8 min-w-12 items-center justify-center rounded-lg border border-white/[0.07] bg-[#020408] font-mono text-sm font-black text-slate-300">#${position}</span>
                    <span class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 lg:hidden">Rank</span>
                </div>
                <div class="min-w-0">
                    <h4 class="truncate text-sm font-black text-white">${escapeHtml(site.site_name || 'Sem nome')}</h4>
                    <p class="mt-1 truncate text-xs text-slate-500 lg:hidden">${escapeHtml(site.niche || 'Nicho nao informado')}</p>
                </div>
                <div class="hidden truncate text-sm text-slate-400 lg:block">${escapeHtml(site.niche || 'Nicho nao informado')}</div>
                <div class="lg:text-right">
                    <div class="mb-1.5 flex items-center justify-between gap-3 lg:justify-end">
                        <span class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500 lg:hidden">Score</span>
                        <span class="text-xl font-black text-white">${formatScore(site)}</span>
                    </div>
                    <div class="h-1 overflow-hidden rounded-full bg-white/[0.07]">
                        <div class="h-full rounded-full bg-slate-300" style="width: ${scoreWidth(site)}%"></div>
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

function setActiveRankingFilterOption(btnElement) {
    const activeLabel = rankingFilterLabels[activeRankingFilter] || 'Todos';
    const labelEl = document.getElementById('rankingFilterButtonLabel');
    if (labelEl) labelEl.textContent = activeLabel;

    document.querySelectorAll('.ranking-filter-option').forEach(btn => {
        const isActive = btnElement ? btn === btnElement : btn.dataset.filter === activeRankingFilter;
        btn.className = isActive ? rankingFilterOptionActiveClass : rankingFilterOptionBaseClass;

        const checkIcon = btn.querySelector('.ranking-filter-check');
        if (checkIcon) {
            checkIcon.classList.toggle('hidden', !isActive);
        }
    });
}

function toggleRankingFilterMenu(forceOpen) {
    const menu = document.getElementById('rankingFilterMenu');
    if (!menu) return;

    const shouldOpen = forceOpen === undefined ? menu.classList.contains('hidden') : forceOpen;
    menu.classList.toggle('hidden', !shouldOpen);
    refreshRankingIcons();
}

function setRankingType(type) {
    currentRankingType = type;
    setRankingTypeButtonState();
    applyRankingFilters();
}

function setRankingTypeButtonState() {
    const btnLanding = document.getElementById('toggleLanding');
    const btnComplex = document.getElementById('toggleComplex');
    if (!btnLanding || !btnComplex) return;

    const activeClass = 'flex-1 rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-black text-[#020408] shadow-[0_0_20px_rgba(34,211,238,0.20)] transition sm:flex-none';
    const inactiveClass = 'flex-1 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-400 transition hover:bg-white/[0.04] hover:text-white sm:flex-none';

    btnLanding.className = currentRankingType === 'landing' ? activeClass : inactiveClass;
    btnComplex.className = currentRankingType === 'complex' ? activeClass : inactiveClass;
}

function filterRankingData(category, btnElement) {
    activeRankingFilter = category;
    setActiveRankingFilterOption(btnElement);
    toggleRankingFilterMenu(false);
    applyRankingFilters();
}

function applyRankingFilters() {
    let filteredData = window.rankingData || [];

    filteredData = filteredData.filter(site => {
        const count = Number(site.page_count || 1);
        if (currentRankingType === 'landing') return count <= 4;
        if (currentRankingType === 'complex') return count >= 5;
        return true;
    });

    const cats = {
        comercio: ['roupa', 'loja', 'commerce', 'eletronico', 'farmacia', 'restaurante', 'varejo', 'produto', 'moda'],
        servicos: ['advogado', 'dentista', 'clinica', 'servico', 'carro', 'turismo', 'hotel', 'saude', 'medico'],
        digital: ['sistema', 'software', 'curso', 'landing page', 'online', 'tech', 'digital', 'saas'],
        financas: ['banco', 'financa', 'consultoria', 'imobiliaria', 'b2b', 'negocio', 'contabilidade'],
        educacao: ['curso', 'educacao', 'escola', 'faculdade', 'treinamento', 'ensino', 'ead'],
        imoveis: ['imovel', 'imobiliaria', 'corretor', 'apartamento', 'casa', 'condominio']
    };

    if (activeRankingFilter !== 'todos') {
        filteredData = filteredData.filter(site => {
            const niche = normalizeRankingText(site.niche || '');
            return cats[activeRankingFilter].some(term => niche.includes(term));
        });
    }

    renderRankingView(filteredData);
}

function searchRankingSite() {
    const searchInput = document.getElementById('searchRankingInput');
    const searchResultContainer = document.getElementById('searchResultContainer');
    if (!searchInput || !searchResultContainer) return;

    const searchTerm = normalizeRankingText(searchInput.value.trim());

    if (!searchTerm) {
        searchResultContainer.classList.add('hidden');
        searchResultContainer.innerHTML = '';
        return;
    }

    if (!window.rankingData || window.rankingData.length === 0) {
        searchResultContainer.classList.remove('hidden');
        searchResultContainer.innerHTML = `
            <div class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
                <p class="font-black">Dados do ranking nao disponiveis</p>
                <p class="mt-1 text-sm text-red-200/80">Aguarde o carregamento do ranking e tente novamente.</p>
            </div>
        `;
        return;
    }

    const foundSite = window.rankingData.find(site =>
        normalizeRankingText(site.site_name || '').includes(searchTerm)
    );

    if (foundSite) {
        const position = window.rankingData.indexOf(foundSite) + 1;

        searchResultContainer.classList.remove('hidden');
        searchResultContainer.innerHTML = `
            <div class="rounded-xl border border-cyan-300/35 bg-gradient-to-br from-[#0d1825] to-[#0c1220] p-4 shadow-[0_0_22px_rgba(34,211,238,0.14)]">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div class="flex min-w-0 items-center gap-3">
                        <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-[#020408] font-mono text-lg font-black text-cyan-100">#${position}</div>
                        <div class="min-w-0">
                            <h4 class="truncate text-lg font-black text-white">${escapeHtml(foundSite.site_name || 'Sem nome')}</h4>
                            <p class="mt-1 truncate text-sm text-slate-400">${escapeHtml(foundSite.niche || 'Nicho nao informado')}</p>
                        </div>
                    </div>
                    <div class="sm:w-36 sm:text-right">
                        <p class="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Score</p>
                        <p class="text-3xl font-black text-white">${formatScore(foundSite)}</p>
                    </div>
                </div>
            </div>
        `;
    } else {
        searchResultContainer.classList.remove('hidden');
        searchResultContainer.innerHTML = `
            <div class="rounded-xl border border-amber-400/25 bg-amber-400/10 p-4 text-amber-200">
                <p class="flex items-center gap-2 font-black">
                    <i data-lucide="alert-triangle" class="h-5 w-5"></i>
                    Site nao encontrado
                </p>
                <p class="mt-1 text-sm text-amber-100/75">A busca nao retornou resultados no ranking global.</p>
            </div>
        `;
        refreshRankingIcons();
    }
}

function showSearchSuggestions() {
    const searchInput = document.getElementById('searchRankingInput');
    const suggestionsDropdown = document.getElementById('searchSuggestionsDropdown');
    const suggestionsList = document.getElementById('suggestionsList');
    if (!searchInput || !suggestionsDropdown || !suggestionsList) return;

    const searchTerm = normalizeRankingText(searchInput.value.trim());

    if (!searchTerm || !window.rankingData || window.rankingData.length === 0) {
        suggestionsDropdown.classList.add('hidden');
        suggestionsList.innerHTML = '';
        return;
    }

    const filteredSites = window.rankingData
        .filter(site => normalizeRankingText(site.site_name || '').includes(searchTerm))
        .sort((a, b) => normalizeRankingText(a.site_name || '').localeCompare(normalizeRankingText(b.site_name || '')))
        .slice(0, 6);

    if (!filteredSites.length) {
        suggestionsDropdown.classList.add('hidden');
        suggestionsList.innerHTML = '';
        return;
    }

    suggestionsList.innerHTML = filteredSites.map(site => {
        const position = window.rankingData.indexOf(site) + 1;
        const siteName = rankingText(site.site_name, 'Sem nome');

        return `
            <li class="border-b border-white/[0.07] last:border-b-0">
                <button type="button" class="flex w-full items-center justify-between gap-3 p-3 text-left transition hover:bg-[#101828]" data-site="${escapeHtml(siteName)}" onclick="selectSuggestion(this.dataset.site)">
                    <span class="min-w-0">
                        <span class="block truncate text-sm font-bold text-white">${escapeHtml(siteName)}</span>
                        <span class="mt-0.5 block truncate text-xs text-slate-500">${escapeHtml(site.niche || 'Nicho nao informado')}</span>
                    </span>
                    <span class="flex shrink-0 items-center gap-2">
                        <span class="rounded-lg bg-[#020408] px-2 py-1 font-mono text-xs font-black text-slate-400">#${position}</span>
                        <span class="text-sm font-black text-white">${formatScore(site)}</span>
                    </span>
                </button>
            </li>
        `;
    }).join('');

    suggestionsDropdown.classList.remove('hidden');
}

function selectSuggestion(siteName) {
    const searchInput = document.getElementById('searchRankingInput');
    const suggestionsDropdown = document.getElementById('searchSuggestionsDropdown');
    if (!searchInput) return;

    searchInput.value = siteName;
    if (suggestionsDropdown) suggestionsDropdown.classList.add('hidden');
    searchRankingSite();
}

function initRankingInteractions() {
    if (rankingInteractionsReady) return;

    const searchInput = document.getElementById('searchRankingInput');
    if (!searchInput) return;

    rankingInteractionsReady = true;
    searchInput.addEventListener('input', showSearchSuggestions);
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            searchRankingSite();
            const suggestionsDropdown = document.getElementById('searchSuggestionsDropdown');
            if (suggestionsDropdown) suggestionsDropdown.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        const suggestionsDropdown = document.getElementById('searchSuggestionsDropdown');
        if (suggestionsDropdown && !e.target.closest('#searchRankingInput') && !e.target.closest('#searchSuggestionsDropdown')) {
            suggestionsDropdown.classList.add('hidden');
        }
        if (!e.target.closest('#rankingFilter')) {
            toggleRankingFilterMenu(false);
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRankingInteractions);
} else {
    initRankingInteractions();
}
