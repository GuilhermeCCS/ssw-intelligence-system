(function() {
    const CONSENT_KEY = 'SSW_COOKIE_CONSENT';
    const CONSENT_VERSION = 1;
    const DEFAULT_CATEGORIES = {
        necessary: true,
        preferences: false,
        analytics: false,
        marketing: false
    };
    const ALL_CATEGORIES = {
        necessary: true,
        preferences: true,
        analytics: true,
        marketing: true
    };
    const OPTIONAL_STORAGE_KEYS = {
        preferences: ['SSW_DEBUG', 'SSW_SIDEBAR_COLLAPSED'],
        analytics: ['SSW_ANALYTICS_SESSION', 'SSW_ANALYTICS_ID'],
        marketing: ['SSW_MARKETING_SOURCE', 'SSW_CAMPAIGN_OPT_IN']
    };

    let storage = null;
    let lastFocusedElement = null;

    function getStorage() {
        if (storage) return storage;
        try {
            const testKey = '__SSW_COOKIE_TEST__';
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
            storage = window.localStorage;
        } catch (error) {
            storage = {
                getItem: function() { return null; },
                setItem: function() {},
                removeItem: function() {}
            };
        }
        return storage;
    }

    function normalizeCategories(categories) {
        return {
            necessary: true,
            preferences: Boolean(categories && categories.preferences),
            analytics: Boolean(categories && categories.analytics),
            marketing: Boolean(categories && categories.marketing)
        };
    }

    function readConsent() {
        try {
            const raw = getStorage().getItem(CONSENT_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!parsed || parsed.version !== CONSENT_VERSION || !parsed.categories) return null;
            return {
                version: CONSENT_VERSION,
                categories: normalizeCategories(parsed.categories),
                source: parsed.source || 'saved',
                createdAt: parsed.createdAt || parsed.updatedAt || null,
                updatedAt: parsed.updatedAt || null
            };
        } catch (error) {
            return null;
        }
    }

    function cleanupRejectedCategories(categories) {
        Object.keys(OPTIONAL_STORAGE_KEYS).forEach(function(category) {
            if (categories[category]) return;
            OPTIONAL_STORAGE_KEYS[category].forEach(function(key) {
                try {
                    getStorage().removeItem(key);
                } catch (error) {}
            });
        });
    }

    function applyConsent(consent) {
        const categories = normalizeCategories(consent && consent.categories);
        cleanupRejectedCategories(categories);

        document.documentElement.dataset.cookiePreferences = categories.preferences ? 'on' : 'off';
        document.documentElement.dataset.cookieAnalytics = categories.analytics ? 'on' : 'off';
        document.documentElement.dataset.cookieMarketing = categories.marketing ? 'on' : 'off';

        window.dispatchEvent(new CustomEvent('ssw:cookie-consent-updated', {
            detail: {
                version: CONSENT_VERSION,
                categories: categories,
                consent: consent || null
            }
        }));
    }

    function saveConsent(categories, source) {
        const existing = readConsent();
        const now = new Date().toISOString();
        const consent = {
            version: CONSENT_VERSION,
            categories: normalizeCategories(categories),
            source: source || 'custom',
            createdAt: existing && existing.createdAt ? existing.createdAt : now,
            updatedAt: now
        };

        try {
            getStorage().setItem(CONSENT_KEY, JSON.stringify(consent));
        } catch (error) {}

        applyConsent(consent);
        hideBanner();
        hideSettings();
        return consent;
    }

    function hasConsent(category) {
        if (category === 'necessary') return true;
        const consent = readConsent();
        return Boolean(consent && consent.categories && consent.categories[category]);
    }

    function buildCategoryRows() {
        return [
            {
                key: 'necessary',
                title: 'Necess&aacute;rios',
                description: 'Mant&ecirc;m a base operacional da SSW: sess&atilde;o autenticada, prote&ccedil;&atilde;o contra abuso, valida&ccedil;&otilde;es de seguran&ccedil;a, pagamentos e o registro da sua escolha de privacidade.',
                disabled: true
            },
            {
                key: 'preferences',
                title: 'Prefer&ecirc;ncias',
                description: 'Preservam ajustes que tornam o uso mais cont&iacute;nuo, como escolhas de interface, estado de componentes, prefer&ecirc;ncias de navega&ccedil;&atilde;o e configura&ccedil;&otilde;es que evitam retrabalho.',
                disabled: false
            },
            {
                key: 'analytics',
                title: 'Analytics e desempenho',
                description: 'Coletam sinais agregados de uso, estabilidade, velocidade e erros para identificar gargalos reais e priorizar melhorias que afetam a experi&ecirc;ncia de auditoria.',
                disabled: false
            },
            {
                key: 'marketing',
                title: 'Marketing e comunica&ccedil;&atilde;o',
                description: 'Ajudam a calibrar comunica&ccedil;&otilde;es sobre planos, cr&eacute;ditos, conte&uacute;dos e novidades para que voc&ecirc; receba mensagens mais pertinentes ao seu momento na plataforma.',
                disabled: false
            }
        ].map(function(item) {
            const toggleId = 'cookieToggle' + item.key.charAt(0).toUpperCase() + item.key.slice(1);
            return [
                '<article class="cookie-category-card">',
                    '<div class="cookie-category-copy">',
                        '<div class="cookie-category-title-row">',
                            '<h3>', item.title, '</h3>',
                        '</div>',
                        '<p>', item.description, '</p>',
                    '</div>',
                    '<label class="cookie-toggle" for="', toggleId, '">',
                        '<input id="', toggleId, '" class="cookie-toggle-input" type="checkbox" data-cookie-toggle="', item.key, '"', item.disabled ? ' checked disabled' : '', '>',
                        '<span class="cookie-toggle-track" aria-hidden="true"><span></span></span>',
                    '</label>',
                '</article>'
            ].join('');
        }).join('');
    }

    function ensureElements() {
        if (!document.getElementById('cookieConsentBanner')) {
            document.body.insertAdjacentHTML('beforeend', [
                '<div id="cookieConsentBanner" class="cookie-consent-banner hidden" role="dialog" aria-labelledby="cookieConsentTitle" aria-describedby="cookieConsentDescription">',
                    '<div class="cookie-consent-shell">',
                        '<div class="cookie-consent-copy">',
                            '<p class="cookie-consent-kicker">Privacidade SSW</p>',
                            '<h2 id="cookieConsentTitle">Cookies e privacidade</h2>',
                            '<p id="cookieConsentDescription">Usamos cookies essenciais para manter login, seguran&ccedil;a, auditorias e pagamentos funcionando com estabilidade. Com sua permiss&atilde;o, tamb&eacute;m usamos dados opcionais para lembrar prefer&ecirc;ncias, medir desempenho e tornar comunica&ccedil;&otilde;es mais relevantes.</p>',
                        '</div>',
                        '<div class="cookie-consent-actions">',
                            '<button type="button" class="cookie-btn cookie-btn-ghost" data-cookie-action="reject">Recusar tudo</button>',
                            '<button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="settings">Configura&ccedil;&otilde;es</button>',
                            '<button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="accept">Aceitar cookies</button>',
                        '</div>',
                    '</div>',
                '</div>'
            ].join(''));
        }

        if (!document.getElementById('cookieSettingsModal')) {
            document.body.insertAdjacentHTML('beforeend', [
                '<div id="cookieSettingsModal" class="cookie-settings-modal hidden" aria-hidden="true">',
                    '<div class="cookie-settings-backdrop" data-cookie-action="close-settings"></div>',
                    '<section class="cookie-settings-card" role="dialog" aria-modal="true" aria-labelledby="cookieSettingsTitle" tabindex="-1">',
                        '<button type="button" class="cookie-settings-close" data-cookie-action="close-settings" aria-label="Fechar configura&ccedil;&otilde;es">',
                            '<i data-lucide="x"></i>',
                        '</button>',
                        '<div class="cookie-settings-head">',
                            '<p class="cookie-consent-kicker">Central de privacidade</p>',
                            '<h2 id="cookieSettingsTitle">Gerenciar cookies</h2>',
                            '<p>Escolha quais recursos opcionais podem ficar ativos neste navegador. A categoria necess&aacute;ria permanece ligada para preservar conta, seguran&ccedil;a, cobran&ccedil;as e funcionamento b&aacute;sico do sistema.</p>',
                            '<p class="cookie-reject-note"><strong>Se voc&ecirc; recusar tudo:</strong> o acesso principal continua funcionando, mas a SSW n&atilde;o poder&aacute; lembrar prefer&ecirc;ncias opcionais, medir com precis&atilde;o pontos de lentid&atilde;o ou adaptar comunica&ccedil;&otilde;es sobre planos, cr&eacute;ditos e novidades ao seu uso.</p>',
                        '</div>',
                        '<div class="cookie-category-list">',
                            buildCategoryRows(),
                        '</div>',
                        '<div class="cookie-settings-actions">',
                            '<button type="button" class="cookie-btn cookie-btn-ghost" data-cookie-action="reject">Recusar tudo</button>',
                            '<button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="save">Salvar prefer&ecirc;ncias</button>',
                            '<button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="accept">Aceitar todos</button>',
                        '</div>',
                    '</section>',
                '</div>'
            ].join(''));
        }

        bindEvents();
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function bindEvents() {
        document.querySelectorAll('[data-cookie-action]').forEach(function(button) {
            if (button.dataset.cookieReady === 'true') return;
            button.dataset.cookieReady = 'true';
            button.addEventListener('click', function(event) {
                const action = event.currentTarget.dataset.cookieAction;
                if (action === 'accept') {
                    saveConsent(ALL_CATEGORIES, 'accept_all');
                } else if (action === 'reject') {
                    saveConsent(DEFAULT_CATEGORIES, 'reject_all');
                } else if (action === 'settings') {
                    openSettings(event.currentTarget);
                } else if (action === 'save') {
                    saveSettings();
                } else if (action === 'close-settings') {
                    hideSettings();
                }
            });
        });

        if (document.body.dataset.cookieEscapeReady === 'true') return;
        document.body.dataset.cookieEscapeReady = 'true';
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') hideSettings();
        });
    }

    function setToggleState(categories) {
        const normalized = normalizeCategories(categories);
        document.querySelectorAll('[data-cookie-toggle]').forEach(function(input) {
            const key = input.dataset.cookieToggle;
            input.checked = key === 'necessary' ? true : Boolean(normalized[key]);
        });
    }

    function showBanner() {
        ensureElements();
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) banner.classList.remove('hidden');
    }

    function hideBanner() {
        const banner = document.getElementById('cookieConsentBanner');
        if (banner) banner.classList.add('hidden');
    }

    function openSettings(trigger) {
        ensureElements();
        lastFocusedElement = trigger || document.activeElement;
        const consent = readConsent();
        setToggleState(consent ? consent.categories : DEFAULT_CATEGORIES);

        const modal = document.getElementById('cookieSettingsModal');
        const card = modal ? modal.querySelector('.cookie-settings-card') : null;
        if (modal) {
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('cookie-settings-open');
        }
        if (card) card.focus({ preventScroll: true });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function hideSettings() {
        const modal = document.getElementById('cookieSettingsModal');
        if (!modal || modal.classList.contains('hidden')) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cookie-settings-open');
        if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
            lastFocusedElement.focus({ preventScroll: true });
        }
    }

    function saveSettings() {
        const categories = { necessary: true };
        document.querySelectorAll('[data-cookie-toggle]').forEach(function(input) {
            categories[input.dataset.cookieToggle] = input.dataset.cookieToggle === 'necessary' ? true : input.checked;
        });
        saveConsent(categories, 'custom');
    }

    function initCookieConsent() {
        ensureElements();
        const consent = readConsent();
        if (consent) {
            applyConsent(consent);
        } else {
            applyConsent({ categories: DEFAULT_CATEGORIES });
            showBanner();
        }
    }

    window.SSWCookieConsent = {
        acceptAll: function() { return saveConsent(ALL_CATEGORIES, 'accept_all'); },
        rejectAll: function() { return saveConsent(DEFAULT_CATEGORIES, 'reject_all'); },
        getConsent: readConsent,
        hasConsent: hasConsent,
        openSettings: openSettings,
        reset: function() {
            try {
                getStorage().removeItem(CONSENT_KEY);
            } catch (error) {}
            showBanner();
        }
    };
    window.sswHasCookieConsent = hasConsent;
    window.openCookieSettings = openSettings;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCookieConsent);
    } else {
        initCookieConsent();
    }
})();
