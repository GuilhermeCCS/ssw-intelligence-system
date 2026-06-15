const API_URL = window.ENV?.API_URL || "https://ssw-intelligence-api.onrender.com";
        // Variável global para armazenar dados da auditoria atual
        let auditData = null;
        let currentAuditUrl = null;

        function authHeaders(extra = {}) {
            const headers = { ...extra };
            const token = (typeof USER !== 'undefined' && USER && USER.token) ? USER.token : null;
            if (token) headers.Authorization = `Bearer ${token}`;
            return headers;
        }

        function uniquePersonas(personas) {
            const seen = new Set();
            return (personas || []).filter(persona => {
                if (!persona) return false;
                const key = String(persona.id || persona.name || persona.profile_name || persona.agent || '').trim();
                if (!key || seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }

        function extractPersonasPayload(data, includeSystem = true) {
            const systemPersonas = includeSystem ? [
                ...(data.system_personas || []),
                ...(data.system_agents || [])
            ] : [];
            const customPersonas = [
                ...(data.custom_personas || []),
                ...(data.custom_agents || [])
            ];
            const mixedPersonas = includeSystem ? (data.personas || data.agents || []) : [];
            return uniquePersonas([...systemPersonas, ...customPersonas, ...mixedPersonas]);
        }

        async function fetchBackendPersonas(options = {}) {
            const { includeSystem = true, requireAuth = false } = options;
            const hasToken = typeof USER !== 'undefined' && USER && USER.token;

            if (hasToken) {
                const res = await fetch(`${API_URL}/api/personas`, { headers: authHeaders() });
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                    window.SSW_PERSONA_USAGE = {
                        count: Number(data.custom_count ?? (data.custom_personas || data.custom_agents || []).length ?? 0),
                        limit: Number(data.custom_limit ?? data.limits?.persona_limit ?? 0),
                        plan: data.plan || data.limits?.plan || 'starter',
                        limits: data.limits || null
                    };
                    return extractPersonasPayload(data, includeSystem);
                }
                if (requireAuth || !includeSystem) {
                    throw new Error(data.detail || `Erro ao carregar personas (${res.status})`);
                }
            } else if (requireAuth || !includeSystem) {
                throw new Error("Faça login para carregar suas personas.");
            }

            const catalogRes = await fetch(`${API_URL}/api/personas/catalog`);
            const catalogData = await catalogRes.json().catch(() => ({}));
            if (!catalogRes.ok) {
                throw new Error(catalogData.detail || `Erro ao carregar catálogo de personas (${catalogRes.status})`);
            }
            return extractPersonasPayload(catalogData, true);
        }

        // Função para mostrar tela de autenticação
    function setAuthBackdropState(isActive) {
        const elements = [
            document.getElementById('mainContent'),
            document.getElementById('mainContentWrapper'),
            document.getElementById('appSidebar'),
            document.getElementById('guestAuthTopbar'),
            document.getElementById('sidebarRevealButton')
        ].filter(Boolean);
        elements.forEach((element) => {
            if (isActive) {
                element.style.setProperty('filter', 'blur(8px) saturate(0.78)', 'important');
                element.style.setProperty('opacity', '0.36', 'important');
                element.style.setProperty('pointer-events', 'none', 'important');
                element.style.setProperty('user-select', 'none', 'important');
            } else {
                element.style.removeProperty('filter');
                element.style.removeProperty('opacity');
                element.style.removeProperty('pointer-events');
                element.style.removeProperty('user-select');
            }
        });
    }

    function setAuthPageState(isActive) {
        document.body.classList.toggle('auth-page-active', isActive);
        const mobileMenu = document.getElementById('mobileMenuDropdown');
        const overlay = document.getElementById('sidebarOverlay');
        if (mobileMenu) mobileMenu.classList.add('hidden');
        if (overlay) overlay.classList.add('hidden');
        document.body.classList.remove('mobile-menu-open');
        setAuthBackdropState(isActive);
    }

    function showAuthScreen(type = 'login', pushRoute = true) {
    const route = type === 'register' ? '/cadastro' : '/login';
    if (pushRoute && window.location.pathname !== route) {
        window.history.pushState({}, '', route);
    }
    setAuthPageState(true);
    document.getElementById('authScreen').classList.remove('hidden');

    // Abre a aba correta (Login ou Cadastro) dependendo de qual botão foi clicado
    if (type === 'register') {
        document.getElementById('loginForm').classList.add('hidden');
        document.getElementById('registerForm').classList.remove('hidden');
        updateRegisterPasswordStrength();
        setTimeout(() => {
            initTurnstileRegister();
            if (typeof renderGoogleSignInButton === 'function') {
                renderGoogleSignInButton('googleSignInRegister');
            }
        }, 500);
    } else {
        document.getElementById('loginForm').classList.remove('hidden');
        document.getElementById('registerForm').classList.add('hidden');
        authView = 'login';
        if (typeof renderAuthView === 'function') renderAuthView();
        setTimeout(() => {
            initTurnstileLogin();
            if (typeof renderGoogleSignInButton === 'function') {
                renderGoogleSignInButton('googleSignInLogin');
            }
        }, 500);
    }
}
        // Função para esconder tela de autenticação
        function hideAuthScreen() {
            document.getElementById('authScreen').classList.add('hidden');
            setAuthPageState(false);
        }
        window.setAuthPageState = setAuthPageState;
        window.showAuthScreen = showAuthScreen;
        window.hideAuthScreen = hideAuthScreen;
        // Verificar se clique foi em botão que não é do footer
        function handleButtonClick(event) {
            const button = event.target.closest('button');
            const link = event.target.closest('a');
            const element = button || link;
            if (!element) return;
            // Verificar se está no footer
            const footer = document.getElementById('mainFooter');
            const isInFooter = footer && footer.contains(element);
            // Se não estiver no footer e não estiver autenticado, mostrar tela de login
            if (!isInFooter && !USER) {
                event.preventDefault();
                event.stopPropagation();
                showAuthScreen();
            }
        }
        function togglePerfilCard(id) {
            var el = document.getElementById(id);
            var btn = document.getElementById(id + '_btn');
            if (!el) return;
            var isHidden = el.style.display === 'none' || !el.style.display;
            el.style.display = isHidden ? 'block' : 'none';
            if (btn) btn.textContent = isHidden ? 'Ocultar \u25b4' : 'Ver perfil \u25be';
        }
