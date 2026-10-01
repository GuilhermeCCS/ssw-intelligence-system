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
    // First visit: let the page settle before asking.
    const BANNER_DELAY_MS = 700;
    const EXIT_FALLBACK_MS = 400;

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

    function prefersReducedMotion() {
        return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
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
                description: 'Mant&ecirc;m login, prote&ccedil;&atilde;o contra abuso, valida&ccedil;&otilde;es de seguran&ccedil;a, pagamentos e o registro desta escolha. Sem eles o site n&atilde;o funciona.',
                alwaysOn: true
            },
            {
                key: 'preferences',
                title: 'Prefer&ecirc;ncias',
                description: 'Lembram ajustes de interface e de navega&ccedil;&atilde;o, como o estado do menu lateral, para voc&ecirc; n&atilde;o refazer tudo a cada visita.'
            },
            {
                key: 'analytics',
                title: 'Desempenho',
                description: 'Medem uso, velocidade e erros de forma agregada, para encontrar lentid&otilde;es reais e priorizar melhorias.'
            },
            {
                key: 'marketing',
                title: 'Comunica&ccedil;&atilde;o',
                description: 'Ajudam a ajustar mensagens sobre planos, cr&eacute;ditos e novidades ao seu momento na plataforma.'
            }
        ].map(function(item) {
            const id = 'cookieCategory' + item.key.charAt(0).toUpperCase() + item.key.slice(1);
            const control = item.alwaysOn
                ? '<span class="cookie-always-on">Sempre ativo</span>'
                : [
                    '<label class="cookie-toggle">',
                        '<input class="cookie-toggle-input" type="checkbox" role="switch" data-cookie-toggle="', item.key, '" aria-labelledby="', id, 'Title" aria-describedby="', id, 'Text">',
                        '<span class="cookie-toggle-track" aria-hidden="true"><span></span></span>',
                    '</label>'
                ].join('');
            return [
                '<div class="cookie-category">',
                    '<div class="cookie-category-copy">',
                        '<h3 id="', id, 'Title">', item.title, '</h3>',
                        '<p id="', id, 'Text">', item.description, '</p>',
                    '</div>',
                    control,
                '</div>'
            ].join('');
        }).join('');
    }

    function ensureElements() {
        if (!document.getElementById('cookieConsentBanner')) {
            document.body.insertAdjacentHTML('beforeend', [
                '<section id="cookieConsentBanner" class="cookie-consent-banner hidden" aria-labelledby="cookieConsentTitle" aria-describedby="cookieConsentDescription">',
                    '<div class="cookie-consent-card">',
                        '<h2 id="cookieConsentTitle">Cookies</h2>',
                        '<p id="cookieConsentDescription">Usamos cookies necess&aacute;rios para login, seguran&ccedil;a e pagamentos. Prefer&ecirc;ncias, medi&ccedil;&atilde;o de desempenho e comunica&ccedil;&atilde;o s&oacute; s&atilde;o ativadas se voc&ecirc; permitir. <a href="/termos/">Termos e privacidade</a></p>',
                        '<div class="cookie-consent-actions">',
                            '<button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="reject">Recusar opcionais</button>',
                            '<button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="accept">Aceitar todos</button>',
                        '</div>',
                        '<button type="button" class="cookie-link-btn" data-cookie-action="settings">Escolher o que permitir</button>',
                    '</div>',
                '</section>'
            ].join(''));
        }

        if (!document.getElementById('cookieSettingsModal')) {
            document.body.insertAdjacentHTML('beforeend', [
                '<div id="cookieSettingsModal" class="cookie-settings-modal hidden" aria-hidden="true">',
                    '<div class="cookie-settings-backdrop" data-cookie-action="close-settings"></div>',
                    '<section class="cookie-settings-card" role="dialog" aria-modal="true" aria-labelledby="cookieSettingsTitle" aria-describedby="cookieSettingsDescription" tabindex="-1">',
                        '<button type="button" class="cookie-settings-close" data-cookie-action="close-settings" aria-label="Fechar prefer&ecirc;ncias de cookies">',
                            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
                        '</button>',
                        '<div class="cookie-settings-head">',
                            '<h2 id="cookieSettingsTitle">Prefer&ecirc;ncias de cookies</h2>',
                            '<p id="cookieSettingsDescription">Escolha o que fica ativo neste navegador. Voc&ecirc; pode mudar essa escolha quando quiser.</p>',
                        '</div>',
                        '<div class="cookie-category-list">',
                            buildCategoryRows(),
                        '</div>',
                        '<p class="cookie-reject-note">Se recusar os opcionais, tudo continua funcionando. S&oacute; deixamos de lembrar suas prefer&ecirc;ncias, medir lentid&otilde;es com precis&atilde;o e ajustar comunica&ccedil;&otilde;es ao seu uso.</p>',
                        '<div class="cookie-settings-actions">',
                            '<button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="reject">Recusar opcionais</button>',
                            '<button type="button" class="cookie-btn cookie-btn-secondary" data-cookie-action="accept">Aceitar todos</button>',
                            '<button type="button" class="cookie-btn cookie-btn-primary" data-cookie-action="save">Salvar escolhas</button>',
                        '</div>',
                    '</section>',
                '</div>'
            ].join(''));
        }

        bindEvents();
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
            const modal = document.getElementById('cookieSettingsModal');
            if (!modal || modal.classList.contains('hidden')) return;
            if (event.key === 'Escape') {
                hideSettings();
            } else if (event.key === 'Tab') {
                trapFocus(event, modal);
            }
        });
    }

    // aria-modal promises the rest of the page is out of reach, so Tab cycles inside the dialog.
    function trapFocus(event, modal) {
        const focusable = Array.prototype.filter.call(
            modal.querySelectorAll('button, [href], input:not([disabled])'),
            function(element) { return element.offsetParent !== null; }
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !modal.contains(document.activeElement))) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    // Plays the element's exit animation, then hides it. Reduced motion hides at once.
    function leave(element, onDone) {
        if (!element || element.classList.contains('hidden')) return;
        const finish = function() {
            if (!element.classList.contains('is-leaving')) return;
            element.classList.remove('is-leaving');
            element.classList.add('hidden');
            if (onDone) onDone();
        };
        if (prefersReducedMotion()) {
            element.classList.add('is-leaving');
            finish();
            return;
        }
        element.classList.add('is-leaving');
        element.addEventListener('animationend', function handler(event) {
            if (event.target !== element && !element.contains(event.target)) return;
            element.removeEventListener('animationend', handler);
            finish();
        });
        window.setTimeout(finish, EXIT_FALLBACK_MS);
    }

    function setToggleState(categories) {
        const normalized = normalizeCategories(categories);
        document.querySelectorAll('[data-cookie-toggle]').forEach(function(input) {
            input.checked = Boolean(normalized[input.dataset.cookieToggle]);
        });
    }

    function showBanner() {
        ensureElements();
        const banner = document.getElementById('cookieConsentBanner');
        if (!banner) return;
        banner.classList.remove('is-leaving');
        banner.classList.remove('hidden');
    }

    function hideBanner() {
        leave(document.getElementById('cookieConsentBanner'));
    }

    function openSettings(trigger) {
        ensureElements();
        lastFocusedElement = trigger || document.activeElement;
        const consent = readConsent();
        setToggleState(consent ? consent.categories : DEFAULT_CATEGORIES);

        const modal = document.getElementById('cookieSettingsModal');
        const card = modal ? modal.querySelector('.cookie-settings-card') : null;
        if (modal) {
            modal.classList.remove('is-leaving');
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('cookie-settings-open');
        }
        if (card) card.focus({ preventScroll: true });
    }

    function hideSettings() {
        const modal = document.getElementById('cookieSettingsModal');
        if (!modal || modal.classList.contains('hidden') || modal.classList.contains('is-leaving')) return;
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('cookie-settings-open');
        const returnFocus = lastFocusedElement;
        leave(modal);
        // The banner trigger may be gone after a choice; fall back to the page.
        if (returnFocus && typeof returnFocus.focus === 'function' && document.contains(returnFocus) && returnFocus.offsetParent !== null) {
            returnFocus.focus({ preventScroll: true });
        }
    }

    function saveSettings() {
        const categories = { necessary: true };
        document.querySelectorAll('[data-cookie-toggle]').forEach(function(input) {
            categories[input.dataset.cookieToggle] = input.checked;
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
            window.setTimeout(function() {
                if (!readConsent()) showBanner();
            }, prefersReducedMotion() ? 0 : BANNER_DELAY_MS);
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
