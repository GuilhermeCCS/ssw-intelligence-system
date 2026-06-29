// ========== RANKING FUNCTIONS ==========
console.log('ranking-component.js carregado');

let rankingData = [];
let activeRankingFilter = 'todos';
let currentRankingType = 'all';
let rankingMinimumScore = 0;
let rankingInteractionsReady = false;

const rankingFilterLabels = {
    todos: 'Todos os sites',
    comercio: 'Comércio',
    servicos: 'Serviços',
    digital: 'Digital',
    financas: 'B2B',
    educacao: 'Educação',
    imoveis: 'Imóveis'
};

const rankingTypeLabels = {
    all: 'Todos',
    landing: 'Landing pages',
    complex: 'Sites completos'
};

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
    const value = Number(site && (
        site.score ??
        site.score_geral ??
        site.overall_score ??
        site.conversion_score ??
        site.final_score
    ));
    return Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : null;
}

function formatScore(site) {
    const value = scoreValue(site);
    return value === null ? '--' : Math.round(value);
}

function scoreWidth(siteOrNumber) {
    const value = typeof siteOrNumber === 'number' ? siteOrNumber : scoreValue(siteOrNumber);
    return Math.max(0, Math.min(100, Number(value) || 0));
}

function metricValue(site, keys, offset = 0) {
    for (const key of keys) {
        const value = Number(site?.[key]);
        if (Number.isFinite(value)) return Math.round(Math.max(0, Math.min(100, value)));
    }

    const base = scoreValue(site);
    if (base === null) return '--';
    return Math.round(Math.max(0, Math.min(100, base + offset)));
}

function siteName(site) {
    return rankingText(site?.site_name || site?.name || site?.title || site?.domain, 'Sem nome');
}

function siteUrl(site) {
    return rankingText(site?.url || site?.site_url || site?.analyzed_url || site?.domain || site?.site_name, '');
}

function siteDomain(site) {
    const raw = siteUrl(site) || siteName(site);
    try {
        const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
        const parsed = new URL(normalized);
        return parsed.hostname.replace(/^www\./i, '');
    } catch (_) {
        return raw
            .replace(/^https?:\/\//i, '')
            .replace(/^www\./i, '')
            .split('/')[0]
            .trim();
    }
}

function siteCategory(site) {
    return rankingText(site?.category || site?.niche || site?.segment || site?.business_type, 'Categoria não informada');
}

function siteInitial(site) {
    const name = normalizeRankingText(siteName(site));
    return (name.match(/[a-z0-9]/i)?.[0] || 'S').toUpperCase();
}

function faviconDomain(site) {
    const candidates = [
        site?.favicon_domain,
        site?.domain,
        site?.hostname,
        site?.host,
        site?.url,
        site?.site_url,
        site?.analyzed_url,
        site?.website,
        site?.site
    ];

    for (const candidate of candidates) {
        const raw = rankingText(candidate, '').trim();
        if (!raw) continue;

        try {
            const normalized = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
            const parsed = new URL(normalized);
            const host = parsed.hostname.replace(/^www\./i, '').toLowerCase();
            if (host.includes('.') && !host.includes(' ')) return host;
        } catch (_) {
            const host = raw
                .replace(/^https?:\/\//i, '')
                .replace(/^www\./i, '')
                .split('/')[0]
                .trim()
                .toLowerCase();

            if (host.includes('.') && !host.includes(' ')) return host;
        }
    }

    return '';
}

function siteIconUrl(site) {
    const explicitIcon = rankingText(
        site?.favicon_url ||
        site?.favicon ||
        site?.icon_url ||
        site?.site_icon ||
        site?.logo_url ||
        site?.logo,
        ''
    );

    if (explicitIcon && /^https?:\/\//i.test(explicitIcon)) {
        return explicitIcon;
    }

    const domain = faviconDomain(site);
    if (!domain) return '';

    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(`https://${domain}`)}&sz=128`;
}

function trendValue(site) {
    const possible = [
        site?.score_delta,
        site?.delta,
        site?.position_delta,
        site?.trend,
        site?.evolution,
        site?.ranking_delta
    ];

    for (const value of possible) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
}

function trendMarkup(site) {
    const value = trendValue(site);
    if (value > 0) return `<span class="ranking-evolution up">↑ ${Math.abs(value)}</span>`;
    if (value < 0) return `<span class="ranking-evolution down">↓ ${Math.abs(value)}</span>`;
    return `<span class="ranking-evolution same">—</span>`;
}

function refreshRankingIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

function setRankingLastUpdate() {
    const el = document.getElementById('rankingLastUpdate');
    if (!el) return;
    const now = new Date();
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    el.textContent = `Última atualização: ${date} às ${time}`;
}

async function loadRanking() {
    console.log('loadRanking chamado');
    const rankingList = document.getElementById('rankingList');
    const topThreeList = document.getElementById('topThreeList');

    initRankingInteractions();
    setRankingLastUpdate();
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
        currentRankingType = 'all';
        rankingMinimumScore = 0;
        syncRankingControls();
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
        topThreeList.innerHTML = Array.from({ length: 3 }).map(() => `
            <article class="ranking-card ranking-podium-card">
                <span class="ranking-position-badge">...</span>
                <div class="ranking-site-logo">S</div>
                <h3 class="ranking-site-name">Carregando</h3>
                <p class="ranking-site-domain">aguarde...</p>
                <strong class="ranking-score-big">--</strong>
                <div class="ranking-score-bar"><span style="width:35%"></span></div>
            </article>
        `).join('');
    }
    if (rankingList) {
        rankingList.innerHTML = `
            <div style="padding:34px;text-align:center;color:#9aabc0;">
                <i data-lucide="loader-2" style="width:26px;height:26px;color:#22f4ff;"></i>
                <p style="margin:10px 0 0;">Carregando dados do mercado...</p>
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
        topThreeList.innerHTML = `
            <article class="ranking-card ranking-podium-card" style="grid-column:1/-1;min-height:180px;">
                <div class="ranking-site-logo">!</div>
                <h3 class="ranking-site-name">Não foi possível carregar o ranking</h3>
                <p class="ranking-site-domain">Verifique a conexão com a API.</p>
            </article>
        `;
    }
    if (rankingList) {
        rankingList.innerHTML = `
            <div style="padding:34px;text-align:center;color:#ff8ca0;">
                <i data-lucide="wifi-off" style="width:26px;height:26px;"></i>
                <p style="margin:10px 0 0;">Erro ao carregar ranking. Verifique a conexão com a API.</p>
            </div>
        `;
    }
    refreshRankingIcons();
}

function updateRankingSummary(dataToRender) {
    const totalEl = document.getElementById('rankingTotalCount');
    const activeFilterEl = document.getElementById('rankingActiveFilter');
    if (totalEl) totalEl.textContent = `${dataToRender.length}`;
    if (activeFilterEl) {
        const categoryLabel = rankingFilterLabels[activeRankingFilter] || 'Todos os sites';
        const typeLabel = rankingTypeLabels[currentRankingType] || 'Todos';
        activeFilterEl.textContent = activeRankingFilter === 'todos' ? `${typeLabel}` : `${typeLabel} · ${categoryLabel}`;
    }
}

function renderRankingView(dataToRender) {
    updateRankingSummary(dataToRender);
    renderTopThree(dataToRender.slice(0, 3));
    renderRankingRows(dataToRender);
}

function logoMarkup(site, className = 'ranking-site-logo') {
    const initial = escapeHtml(siteInitial(site));
    const iconUrl = siteIconUrl(site);

    if (!iconUrl) {
        return `<div class="${className}" aria-hidden="true">${initial}</div>`;
    }

    return `
        <div class="${className}" aria-hidden="true">
            <img
                src="${escapeHtml(iconUrl)}"
                alt=""
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                onerror="this.parentElement.textContent='${initial}'"
            >
        </div>
    `;
}

function podiumMetric(label, value) {
    return `
        <div class="ranking-mini-metric">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(value)}</strong>
        </div>
    `;
}

function renderTopThree(topSites) {
    const topThreeList = document.getElementById('topThreeList');
    if (!topThreeList) return;

    if (!topSites.length) {
        topThreeList.innerHTML = `
            <article class="ranking-card ranking-podium-card" style="grid-column:1/-1;min-height:190px;">
                <div class="ranking-site-logo">?</div>
                <h3 class="ranking-site-name">Nenhum site encontrado</h3>
                <p class="ranking-site-domain">Ajuste os filtros para ver os competidores.</p>
            </article>
        `;
        refreshRankingIcons();
        return;
    }

    const ordered = [
        { site: topSites[1], position: 2, tone: 'is-second' },
        { site: topSites[0], position: 1, tone: 'is-leader' },
        { site: topSites[2], position: 3, tone: 'is-third' }
    ].filter(item => item.site);

    topThreeList.innerHTML = ordered.map(({ site, position, tone }) => {
        const score = scoreValue(site) || 0;
        const metrics = [
            podiumMetric('SEO', metricValue(site, ['seo', 'seo_score', 'seoScore'], 2)),
            podiumMetric('Performance', metricValue(site, ['performance', 'performance_score', 'perf_score'], -3)),
            podiumMetric('Acessibilidade', metricValue(site, ['accessibility', 'accessibility_score', 'a11y_score'], 1)),
            podiumMetric('Segurança', metricValue(site, ['security', 'security_score', 'best_practices'], 0))
        ].join('');

        return `
            <article class="ranking-card ranking-podium-card ${tone}">
                <span class="ranking-position-badge">${position}</span>
                ${logoMarkup(site)}
                <h3 class="ranking-site-name">${escapeHtml(siteName(site))}</h3>
                <p class="ranking-site-domain">${escapeHtml(siteDomain(site))}</p>
                <strong class="ranking-score-big">${formatScore(site)}</strong>
                <div class="ranking-score-bar"><span style="width:${scoreWidth(score)}%"></span></div>
                <div class="ranking-metric-grid">${metrics}</div>
            </article>
        `;
    }).join('');

    refreshRankingIcons();
}

function renderRankingRows(dataToRender) {
    const rankingList = document.getElementById('rankingList');
    if (!rankingList) return;

    if (!dataToRender.length) {
        rankingList.innerHTML = `
            <div style="padding:34px;text-align:center;color:#9aabc0;">
                <i data-lucide="search-x" style="width:26px;height:26px;"></i>
                <p style="margin:10px 0 0;">Nenhum competidor encontrado neste filtro.</p>
            </div>
        `;
        refreshRankingIcons();
        return;
    }

    const rows = dataToRender.slice(3, 10);
    if (!rows.length) {
        rankingList.innerHTML = `
            <div style="padding:24px;text-align:center;color:#9aabc0;">Apenas os destaques do pódio estão disponíveis neste filtro.</div>
        `;
        refreshRankingIcons();
        return;
    }

    rankingList.innerHTML = rows.map((site, idx) => {
        const position = idx + 4;
        const score = scoreValue(site) || 0;

        return `
            <article class="ranking-row">
                <strong style="color:#ffffff;text-align:center;">${position}</strong>
                <div class="ranking-row-site">
                    ${logoMarkup(site, 'ranking-row-logo')}
                    <div class="ranking-row-title">
                        <strong>${escapeHtml(siteName(site))}</strong>
                        <span>${escapeHtml(siteDomain(site))}</span>
                    </div>
                </div>
                <span class="ranking-row-category">${escapeHtml(siteCategory(site))}</span>
                <div class="ranking-row-score">
                    <strong>${formatScore(site)}</strong>
                    <div class="ranking-score-bar"><span style="width:${scoreWidth(score)}%"></span></div>
                </div>
                ${trendMarkup(site)}
            </article>
        `;
    }).join('');

    refreshRankingIcons();
}

function syncRankingControls() {
    const typeSelect = document.getElementById('rankingTypeSelect');
    const categorySelect = document.getElementById('rankingCategorySelect');
    const minimumSelect = document.getElementById('rankingMinimumScore');
    const legacyLabel = document.getElementById('rankingFilterButtonLabel');

    if (typeSelect) typeSelect.value = currentRankingType;
    if (categorySelect) categorySelect.value = activeRankingFilter;
    if (minimumSelect) minimumSelect.value = String(rankingMinimumScore);
    if (legacyLabel) legacyLabel.textContent = rankingFilterLabels[activeRankingFilter] || 'Todos os sites';
}

function setActiveRankingFilterOption() {
    syncRankingControls();
}

function toggleRankingFilterMenu(forceOpen) {
    const menu = document.getElementById('rankingFilterMenu');
    if (!menu) return;
    const shouldOpen = forceOpen === undefined ? menu.classList.contains('hidden') : forceOpen;
    menu.classList.toggle('hidden', !shouldOpen);
}

function setRankingType(type) {
    currentRankingType = ['all', 'landing', 'complex'].includes(type) ? type : 'all';
    syncRankingControls();
    applyRankingFilters();
}

function setRankingTypeButtonState() {
    syncRankingControls();
}

function setRankingMinimumScore(value) {
    const parsed = Number(value);
    rankingMinimumScore = Number.isFinite(parsed) ? parsed : 0;
    syncRankingControls();
    applyRankingFilters();
}

function filterRankingData(category, btnElement) {
    activeRankingFilter = category || 'todos';
    setActiveRankingFilterOption(btnElement);
    toggleRankingFilterMenu(false);
    applyRankingFilters();
}

function applyRankingFilters() {
    let filteredData = window.rankingData || [];

    filteredData = filteredData.filter(site => {
        const count = Number(site.page_count || site.pages || 1);
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

    if (activeRankingFilter !== 'todos' && cats[activeRankingFilter]) {
        filteredData = filteredData.filter(site => {
            const niche = normalizeRankingText(`${siteCategory(site)} ${siteName(site)} ${siteDomain(site)}`);
            return cats[activeRankingFilter].some(term => niche.includes(term));
        });
    }

    if (rankingMinimumScore > 0) {
        filteredData = filteredData.filter(site => (scoreValue(site) || 0) >= rankingMinimumScore);
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
            <div style="padding:16px;border:1px solid rgba(255,79,109,.32);border-radius:12px;background:rgba(255,79,109,.09);color:#ffb4c0;">
                <strong>Dados do ranking não disponíveis.</strong>
                <p style="margin:4px 0 0;">Aguarde o carregamento do ranking e tente novamente.</p>
            </div>
        `;
        return;
    }

    const foundSite = window.rankingData.find(site => {
        const haystack = normalizeRankingText(`${siteName(site)} ${siteDomain(site)} ${siteCategory(site)}`);
        return haystack.includes(searchTerm);
    });

    if (foundSite) {
        const position = window.rankingData.indexOf(foundSite) + 1;
        const score = scoreValue(foundSite) || 0;

        searchResultContainer.classList.remove('hidden');
        searchResultContainer.innerHTML = `
            <div style="padding:16px;border:1px solid rgba(34,244,255,.22);border-radius:12px;background:rgba(34,244,255,.07);">
                <div class="ranking-row-site">
                    ${logoMarkup(foundSite, 'ranking-row-logo')}
                    <div class="ranking-row-title">
                        <strong>#${position} · ${escapeHtml(siteName(foundSite))}</strong>
                        <span>${escapeHtml(siteDomain(foundSite))}</span>
                    </div>
                    <div class="ranking-row-score" style="margin-left:auto;">
                        <strong>${formatScore(foundSite)}</strong>
                        <div class="ranking-score-bar"><span style="width:${scoreWidth(score)}%"></span></div>
                    </div>
                </div>
            </div>
        `;
    } else {
        searchResultContainer.classList.remove('hidden');
        searchResultContainer.innerHTML = `
            <div style="padding:16px;border:1px solid rgba(255,214,64,.28);border-radius:12px;background:rgba(255,214,64,.08);color:#ffe58a;">
                <strong>Site não encontrado.</strong>
                <p style="margin:4px 0 0;">A busca não retornou resultados no ranking atual.</p>
            </div>
        `;
    }
    refreshRankingIcons();
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
        .filter(site => normalizeRankingText(`${siteName(site)} ${siteDomain(site)}`).includes(searchTerm))
        .sort((a, b) => normalizeRankingText(siteName(a)).localeCompare(normalizeRankingText(siteName(b))))
        .slice(0, 6);

    if (!filteredSites.length) {
        suggestionsDropdown.classList.add('hidden');
        suggestionsList.innerHTML = '';
        return;
    }

    suggestionsList.innerHTML = filteredSites.map(site => {
        const position = window.rankingData.indexOf(site) + 1;
        const name = siteName(site);

        return `
            <li style="border-bottom:1px solid rgba(138,160,184,.1);">
                <button type="button" data-site="${escapeHtml(name)}" onclick="selectSuggestion(this.dataset.site)" style="width:100%;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:13px 14px;border:0;background:transparent;color:#f8fbff;text-align:left;cursor:pointer;">
                    <span style="min-width:0;">
                        <strong style="display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(name)}</strong>
                        <span style="display:block;margin-top:2px;color:#8fa0b7;font-size:.82rem;">${escapeHtml(siteDomain(site))}</span>
                    </span>
                    <span style="color:#22f4ff;font-weight:900;">#${position}</span>
                </button>
            </li>
        `;
    }).join('');

    suggestionsDropdown.classList.remove('hidden');
}

function selectSuggestion(siteNameValue) {
    const searchInput = document.getElementById('searchRankingInput');
    const suggestionsDropdown = document.getElementById('searchSuggestionsDropdown');
    if (!searchInput) return;

    searchInput.value = siteNameValue;
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
