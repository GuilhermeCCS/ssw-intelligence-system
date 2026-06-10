// Variável global de usuário
        let USER = null;
        let isFloatingButtonVisible = true;
        let hasUnsavedAuditSession = false;
        let auditSnapshotTabOpened = false;
        const AUDIT_LEAVE_MESSAGE = 'Você está saindo da auditoria atual. Se sair agora, pode perder o relatório e o chat com as personas. O ideal é salvar o PDF ou fazer suas perguntas à persona antes de sair.';
        const FRONTEND_PLAN_LIMITS = {
            starter: { chatInputTokens: 3000, chatOutputTokens: 280, historyLimit: 10, historyRetentionDays: 30, personaLimit: 3 },
            pro: { chatInputTokens: 6000, chatOutputTokens: 450, historyLimit: 20, historyRetentionDays: 90, personaLimit: 8 }
        };
        function normalizeUserPlan(plan) {
            const value = String(plan || 'starter').trim().toLowerCase();
            return value === 'pro' ? 'pro' : 'starter';
        }
        function getUserPlan() {
            return normalizeUserPlan(USER?.plan);
        }
        function getUserPlanLabel(plan) {
            return normalizeUserPlan(plan) === 'pro' ? 'Pro' : 'Starter';
        }
        function getFrontendPlanLimits(plan) {
            return FRONTEND_PLAN_LIMITS[normalizeUserPlan(plan || getUserPlan())] || FRONTEND_PLAN_LIMITS.starter;
        }
        function applyUserPlanState(plan, limits) {
            if (!plan || !USER) return;
            USER.plan = normalizeUserPlan(plan);
            if (limits) USER.plan_limits = limits;
            currentChatTokenLimit = getFrontendPlanLimits(USER.plan).chatInputTokens;
            updateUserMenuCircle();
        }
        window.addEventListener('ssw:plan-updated', function(event) {
            applyUserPlanState(event.detail?.plan, event.detail?.limits);
        });
        // Variável temporária para senha no fluxo de cadastro
        let senhaTemporaria = null;
        // === 1. INICIALIZAÇÃO ===
            window.onload = async () => {
            lucide.createIcons();

            // Navegação baseada em pathname (History API)
            function handlePopState() {
                const pathname = window.location.pathname.replace('/', '');
                if (pathname === 'login') {
                    showAuthScreen('login', false);
                } else if (pathname === 'cadastro') {
                    showAuthScreen('register', false);
                } else if (pathname && ['home', 'agents', 'domains', 'history', 'ranking', 'precos', 'about', 'terms', 'tutorial'].includes(pathname)) {
                    hideAuthScreen();
                    nav(pathname);
                } else if (!pathname || pathname === '') {
                    hideAuthScreen();
                    nav('home');
                }
            }

            // Listener para mudanças de histórico (botões voltar/avançar)
            window.addEventListener('popstate', handlePopState);

            // Verifica pathname inicial ao carregar a página
            handlePopState();
            initHeroTypewriter();

            // Função para navegação entre seções do tutorial
            window.showTutorialSection = function(sectionId) {
                // Esconder todas as seções
                const sections = ['auditoria-simples', 'ngrok-localhost', 'dominios-autorizados', 'batalha-comparativa', 'gestao-agents', 'relatorios-insights'];
                sections.forEach(id => {
                    const section = document.getElementById(id);
                    if (section) {
                        section.classList.add('hidden');
                    }
                });
                // Mostrar a seção selecionada
                const targetSection = document.getElementById(sectionId);
                if (targetSection) {
                    targetSection.classList.remove('hidden');
                }
                // Atualizar navegação de tópicos
                const navButtons = document.querySelectorAll('#tutorialNavPanel .tutorial-nav-btn');
                navButtons.forEach(button => {
                    button.classList.remove('border-blue-500', 'text-white', 'bg-cyan-400/10');
                    button.classList.add('border-transparent', 'text-slate-400');
                });
                // Destacar botão ativo
                const activeButton = document.querySelector(`#tutorialNavPanel .tutorial-nav-btn[onclick*="${sectionId}"]`);
                if (activeButton) {
                    activeButton.classList.remove('border-transparent', 'text-slate-400');
                    activeButton.classList.add('border-blue-500', 'text-white', 'bg-cyan-400/10');
                }
                // Scroll suave para o topo
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };

            // Função para baixar PDF de uma seção específica do tutorial
            window.printTutorialSection = function(sectionId) {
                // Mapeamento de seções para arquivos PDF
                const pdfFiles = {
                    'auditoria-simples': 'src/assets/PDF/audit01.pdf',
                    'batalha-comparativa': 'src/assets/PDF/audit02.pdf',
                    'gestao-agents': 'src/assets/PDF/audit03.pdf',
                    'relatorios-insights': 'src/assets/PDF/audit04.pdf'
                };

                const pdfFile = pdfFiles[sectionId];
                if (pdfFile) {
                    // Criar link temporário para download
                    const link = document.createElement('a');
                    link.href = pdfFile;
                    link.download = pdfFile.split('/').pop();
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    Toast.success('PDF baixado com sucesso!');
                } else {
                    Toast.error('Arquivo PDF não encontrado para esta seção.');
                }
            };
            // Carrega usuário do storage (criptografado ou não)
            const loadUserFromStorage = async () => {
                if (typeof secureStorage !== 'undefined') {
                    return await secureStorage.getItem('USER');
                }
                const saved = localStorage.getItem('USER');
                return saved ? JSON.parse(saved) : null;
            };

            const saved = await loadUserFromStorage();
            if(saved && saved.token) {
                USER = saved;
                window.fromLoginFlow = true;
                    loginSuccess();
            } else if (saved) {
                if (typeof secureStorage !== 'undefined') {
                    secureStorage.removeItem('USER');
                } else {
                    localStorage.removeItem('USER');
                }
            }
            // Atualiza os botões
            updateUserMenuCircle();
            updateAuthButton();
            // Mostrar a primeira seção do tutorial por padrão
            showTutorialSection('auditoria-simples');
            initUrlInputSanitizers();
            }; // Fecha window.onload (async)
        // === 2. UI HELPERS ===
        function toggleSidebar(forceOpen) {
            const mobileMenu = document.getElementById('mobileMenuDropdown');
            const overlay = document.getElementById('sidebarOverlay');
            const button = document.getElementById('mobileMenuButton');
            const userDropdown = document.getElementById('userMenuCircleDropdown');
            const avatarBtn = document.getElementById('avatarCircleBtn');
            if(!mobileMenu) return;

            const isOpen = !mobileMenu.classList.contains('hidden');
            const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !isOpen;

            mobileMenu.classList.toggle('hidden', !shouldOpen);
            if(overlay) overlay.classList.toggle('hidden', !shouldOpen);
            if(button) {
                button.setAttribute('aria-expanded', String(shouldOpen));
                button.classList.toggle('is-active', shouldOpen);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
            if (shouldOpen && userDropdown) {
                userDropdown.classList.add('hidden');
                if (avatarBtn) avatarBtn.setAttribute('aria-expanded', 'false');
                document.removeEventListener('click', closeUserMenuCircleOnClickOutside);
            }
            document.body.classList.toggle('mobile-menu-open', shouldOpen);
        }
        // Scroll suave para um elemento
        function smoothScrollTo(elementId) {
            const element = document.getElementById(elementId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        function setActiveNavButton(view) {
            const buttons = document.querySelectorAll('#primarySidebarNav button');
            buttons.forEach(btn => {
                btn.classList.remove('active', 'bg-primary/10', 'border-primary/30');
                btn.classList.add('border-transparent');
                btn.removeAttribute('aria-current');
                const indicator = btn.querySelector('.nav-indicator');
                if (indicator) indicator.remove();
            });

            const activeButtons = document.querySelectorAll(`#primarySidebarNav button[data-nav-target="${view}"]`);
            activeButtons.forEach(btn => {
                btn.classList.add('active', 'bg-primary/10', 'border-primary/30');
                btn.classList.remove('border-transparent');
                btn.setAttribute('aria-current', 'page');
                if (!btn.querySelector('.nav-indicator')) {
                    btn.insertAdjacentHTML('afterbegin', '<div class="nav-indicator"></div>');
                }
            });
        }
        function initHeroTypewriter() {
            const title = document.querySelector('.hero-title-premium[data-typewriter="true"]');
            if (!title || title.dataset.typewriterReady === 'true') return;

            const lines = Array.from(title.querySelectorAll('[data-typewriter-text]'));
            if (!lines.length) return;

            const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (reducedMotion) {
                title.classList.add('typing-complete');
                return;
            }

            title.dataset.typewriterReady = 'true';
            title.classList.remove('typing-complete');
            const texts = lines.map(line => line.dataset.typewriterText || line.textContent || '');
            lines.forEach(line => {
                line.textContent = '';
                line.classList.remove('is-typing', 'is-typed');
            });

            let lineIndex = 0;
            let charIndex = 0;
            const typeNext = () => {
                const line = lines[lineIndex];
                const text = texts[lineIndex] || '';
                if (!line) {
                    title.classList.add('typing-complete');
                    return;
                }

                line.classList.add('is-typing');
                if (charIndex < text.length) {
                    line.textContent += text.charAt(charIndex);
                    charIndex += 1;
                    const pause = /[ ,]/.test(text.charAt(charIndex - 1)) ? 98 : 62;
                    window.setTimeout(typeNext, pause);
                    return;
                }

                line.classList.remove('is-typing');
                line.classList.add('is-typed');
                lineIndex += 1;
                charIndex = 0;
                if (lineIndex < lines.length) {
                    window.setTimeout(typeNext, 380);
                } else {
                    title.classList.add('typing-complete');
                }
            };

            window.setTimeout(typeNext, 260);
        }
        // Função auxiliar para gerenciar UI de comparação
        function updateCompareUI(showResults = false) {
            const emptyState = document.getElementById('emptyStateCards');
            const compareArea = document.getElementById('compareArea');
            const auditResults = document.getElementById('auditResults');
            const auditLoading = document.getElementById('auditLoading');
            if (showResults) {
                // Mostra resultados
                if (auditResults) auditResults.classList.remove('hidden');
                if (auditLoading) auditLoading.classList.add('hidden');
                if (emptyState) emptyState.classList.add('hidden');
                if (compareArea) compareArea.classList.add('hidden');
                adjustFooterPosition(true);
            } else {
                // Mostra inputs
                if (auditResults) auditResults.classList.add('hidden');
                if (auditLoading) auditLoading.classList.add('hidden');
                if (emptyState) emptyState.classList.remove('hidden');
                if (compareArea) compareArea.classList.remove('hidden');
                adjustFooterPosition(false);
            }
        }
        // Suporte global a teclado - atalhos e navegação
        document.addEventListener('keydown', (e) => {
            // ESC fecha modais abertos
            if(e.key === 'Escape') {
                const mobileMenu = document.getElementById('mobileMenuDropdown');
                if(window.innerWidth < 768 && mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    toggleSidebar(false);
                }
            }
            // Alt + N vai para Nova Análise
            if(e.altKey && e.key.toLowerCase() === 'n') {
                e.preventDefault();
                nav('home');
                document.getElementById('auditUrl')?.focus();
            }
            // Alt + P vai para Agents
            if(e.altKey && e.key.toLowerCase() === 'p') {
                e.preventDefault();
                nav('agents');
            }
            // Alt + R vai para Ranking
            if(e.altKey && e.key.toLowerCase() === 'r') {
                e.preventDefault();
                nav('ranking');
            }
            // Alt + M mostra/esconde menu
            if(e.altKey && e.key.toLowerCase() === 'm') {
                e.preventDefault();
                toggleSidebar();
            }
        });
        window.addEventListener('resize', () => {
    const sb = document.getElementById('appSidebar');
    const btn = document.getElementById('floatingChatBtn');
    const isDesktop = window.innerWidth >= 768;

    if(sb) {
        sb.classList.remove('-translate-x-full');
        sb.classList.remove('sidebar-closed');
    }

    if(isDesktop) {
        toggleSidebar(false);
    }

    // --- NOVA LÓGICA DE CONTROLE DO BOTÃO DO CHAT ---
    if (btn) {
        if (isFloatingButtonVisible) {
            btn.style.display = 'inline-flex';
        } else {
            btn.style.display = 'none';
        }
    }
});
        function toggleRegister() {
            const registerForm = document.getElementById('registerForm');
            const nextType = registerForm && registerForm.classList.contains('hidden') ? 'register' : 'login';
            showAuthScreen(nextType);

            // Inicializa Turnstile quando o formulário de registro for exibido
            if (nextType === 'register') {
                updateRegisterPasswordStrength();
                setTimeout(() => initTurnstileRegister(), 500);
            }
        }

        function hasVisibleAuditResults() {
            const auditResults = document.getElementById('auditResults');
            return !!(auditResults && !auditResults.classList.contains('hidden'));
        }

        function hideAuditChatSurfaces() {
            const floatingButton = document.getElementById('floatingChatBtn');
            const selectorModal = document.getElementById('agentSelectorModal');
            const chatModal = document.getElementById('chatModal');
            if (floatingButton) floatingButton.remove();
            if (selectorModal) selectorModal.remove();
            if (chatModal) chatModal.classList.add('hidden');
            isFloatingButtonVisible = false;
            if (typeof agentChatActive !== 'undefined') agentChatActive = false;
        }

        function hideHistorySurfaces() {
            const historyView = document.getElementById('view-history');
            const historyDetail = document.getElementById('auditHistoryDetail');
            if (historyView) historyView.classList.add('hidden');
            if (historyDetail) historyDetail.classList.add('hidden');
        }

        function clearActiveAuditSession() {
            hasUnsavedAuditSession = false;
            hideAuditChatSurfaces();
        }

        function showOnlyAuditHomeView() {
            const views = ['agents', 'domains', 'history', 'ranking', 'precos', 'about', 'terms', 'tutorial'];
            views.forEach(v => {
                const el = document.getElementById(`view-${v}`);
                if (el) el.classList.add('hidden');
            });
            const home = document.getElementById('view-home');
            if (home) home.classList.remove('hidden');
            window.currentView = 'home';
        }

        function warnBeforeLeavingAudit() {
            return hasUnsavedAuditSession && hasVisibleAuditResults();
        }

        function confirmLeavingAudit() {
            return window.confirm(AUDIT_LEAVE_MESSAGE);
        }

        window.addEventListener('beforeunload', function(event) {
            if (!warnBeforeLeavingAudit()) return;
            event.preventDefault();
            event.returnValue = AUDIT_LEAVE_MESSAGE;
            return AUDIT_LEAVE_MESSAGE;
        });

        function openAuditSnapshotTab() {
            const auditResults = document.getElementById('auditResults');
            if (!auditResults || auditResults.classList.contains('hidden') || auditSnapshotTabOpened) return;
            auditSnapshotTabOpened = true;

            const snapshot = window.open('', '_blank');
            if (!snapshot) {
                Toast.info('Seu navegador bloqueou a aba de backup. Salve o PDF ou converse com a persona antes de sair desta tela.');
                return;
            }

            const reportTitle = currentAuditUrl || 'Auditoria SSW Intelligence';
            snapshot.document.open();
            snapshot.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeAuditText(reportTitle)} - SSW Intelligence</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link rel="stylesheet" href="/src/styles/cyber-theme.css">
  <link rel="stylesheet" href="/src/styles/app.css">
  <style>body{margin:0;background:#020408;color:#f8fafc;font-family:Inter,Arial,sans-serif;padding:32px;} .no-print,button{display:none!important;} #auditResults{display:block!important;max-width:1200px;margin:0 auto;} .audit-progress-nav{display:none!important;} .audit-reveal{opacity:1!important;transform:none!important;}</style>
</head>
<body>
  <main>${auditResults.outerHTML}</main>
</body>
</html>`);
            snapshot.document.close();
        }

        function nav(view) {
            if (warnBeforeLeavingAudit()) {
                if (!confirmLeavingAudit()) return;
                clearActiveAuditSession();
            } else if (view !== 'home') {
                hideAuditChatSurfaces();
            }
            if (view !== 'history') hideHistorySurfaces();
            window.currentView = view;

            // Atualiza a URL com caminho limpo (sem hash)
            if (window.location.pathname !== `/${view}`) {
                window.history.pushState({}, '', `/${view}`);
            }

            setActiveNavButton(view);
            // Esconde todas as views
            const views = ['home', 'agents', 'domains', 'history', 'ranking', 'precos', 'about', 'terms', 'tutorial'];
            views.forEach(v => {
                const el = document.getElementById(`view-${v}`);
                if (el) {
                    el.classList.add('hidden');
                    el.style.opacity = '';
                    el.style.transform = '';
                    el.style.transition = '';
                }
            });
            // Mostra a view selecionada
            const targetEl = document.getElementById(`view-${view}`);
            if (targetEl) {
                targetEl.classList.remove('hidden');
                targetEl.style.opacity = '';
                targetEl.style.transform = '';
                targetEl.style.transition = '';
                // Mostra banner promocional apenas na seção de preços
                if (view === 'precos' && USER && USER.email) {
                    const promoBanner = document.getElementById('promo-banner');
                    if (promoBanner) {
                        promoBanner.style.display = 'block';
                        // Inicia contadores se ainda não foram iniciados
                        if (!countdownInterval) {
                            startCountdown();
                            setInterval(updateContadorPessoas, 120000); // Atualiza a cada 2 minutos
                        }
                    }
                }
            }

            // Controle de background para view de preços
            if (view === 'precos') {
                document.body.classList.add('pricing-view-active');
            } else {
                document.body.classList.remove('pricing-view-active');
            }
            // Header Dinâmico
            const titles = {
                'agents': 'Gestão de Perfis',
                'domains': 'Domínios Autorizados',
                'history': 'Histórico de Análises',
                'ranking': 'Ranking Global',
                'precos': 'Planos e Preços',
                'about': 'Sobre Nós',
                'terms': 'Termos de Uso',
                'tutorial': 'Como Usar o Sistema',
                'home': 'Painel Principal'
            };
            if(view === 'agents') loadManageAgents();
            if(view === 'domains') loadAuthorizedDomains();
            if(view === 'history') loadAuditHistory();
            if(view === 'ranking') {
                console.log('🎯 Navegando para ranking');
                console.log('🔍 loadRanking existe?', typeof loadRanking);
                if (typeof loadRanking === 'function') {
                    console.log('📊 Chamando loadRanking() da nav()');
                    loadRanking();
                } else {
                    console.error('❌ loadRanking não está disponível');
                }
            }
            if(view === 'about') initAboutAnimations();
            // Restaura cards e esconde resultados ao voltar para home
            if(view === 'home') {
                const emptyStateCards = document.getElementById('emptyStateCards');
                const auditResults = document.getElementById('auditResults');
                const auditLoading = document.getElementById('auditLoading');
                if(emptyStateCards) emptyStateCards.classList.remove('hidden');
                if(auditResults) auditResults.classList.add('hidden');
                if(auditLoading) auditLoading.classList.add('hidden');
                // Inicializa apenas o captcha visivel. O comparativo carrega sob demanda.
                setTimeout(() => initTurnstileAudit(), 500);
            }
            adjustFooterPosition(false);
            // Scroll para o topo da página
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // === 2.5. ABOUT ANIMATIONS ===
        function initAboutAnimations() {
            // Reseta todas as animações removendo a classe visible
            const allRevealElements = document.querySelectorAll('#view-about .text-reveal');
            allRevealElements.forEach(el => {
                el.classList.remove('visible');
            });

            // Cria IntersectionObserver para detectar quando elementos entram na viewport
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, {
                threshold: 0.1, // Aciona quando 10% do elemento está visível
                rootMargin: '0px 0px -50px 0px' // Aciona um pouco antes do elemento estar totalmente visível
            });

            // Observa todos os elementos com classe text-reveal na seção about
            setTimeout(() => {
                const revealElements = document.querySelectorAll('#view-about .text-reveal');
                revealElements.forEach(el => {
                    observer.observe(el);
                });
            }, 100); // Pequeno delay para garantir que o DOM está pronto
        }

        // === 3. AUTH LOGIC ===
        // States para recuperação de senha
        let authView = 'login'; // 'login', 'email', 'codigo'
        let emailTemporario = '';
        let loadingRecuperacao = false;
        let erroRecuperacao = '';
        let sucessoRecuperacao = '';

        // Turnstile Configuration
        const TURNSTILE_SITE_KEY = '0x4AAAAAADU_DaUQEsTW3GMs';
        let turnstileLoginToken = null;
        let turnstileRegisterToken = null;
        let turnstileAuditToken = null;
        let turnstileLoginWidget = null;
        let turnstileRegisterWidget = null;
        let turnstileAuditWidget = null;
        let turnstileCompareToken = null;
        let turnstileCompareWidget = null;
        const TURNSTILE_RETRY_MS = 350;
        const TURNSTILE_MAX_WAIT_MS = 15000;
        let googleAuthInitializedClientId = '';

        function renderTurnstileWidget({ containerId, getWidget, setWidget, setToken, theme = 'dark' }) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const retryButton = `
                <button type="button" onclick="${containerId === 'turnstile-login' ? 'initTurnstileLogin()' : containerId === 'turnstile-register' ? 'initTurnstileRegister()' : containerId === 'turnstile-compare' ? 'initTurnstileCompare()' : 'initTurnstileAudit()'}" class="px-4 py-2 rounded-lg border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 text-sm font-semibold hover:bg-cyan-400/20 transition">
                    Recarregar captcha
                </button>
            `;

            const resetExistingWidget = () => {
                if (typeof window.turnstile === 'undefined' || getWidget() === null) return false;
                if (!container.querySelector('iframe') && !container.querySelector('[name="cf-turnstile-response"]')) {
                    setWidget(null);
                    setToken(null);
                    container.innerHTML = '';
                    return false;
                }
                try {
                    setToken(null);
                    window.turnstile.reset(getWidget());
                    return true;
                } catch (error) {
                    console.warn('Falha ao resetar Turnstile, renderizando novamente:', error);
                    setWidget(null);
                    setToken(null);
                    container.innerHTML = '';
                    return false;
                }
            };

            if (resetExistingWidget()) return;
            if (container.dataset.turnstileRendering === '1') return;

            container.dataset.turnstileRendering = '1';
            container.innerHTML = '<div class="text-xs text-slate-500 animate-pulse">Carregando verificação de segurança...</div>';
            const startedAt = Date.now();

            const tryRender = () => {
                if (typeof window.turnstile === 'undefined') {
                    if (Date.now() - startedAt >= TURNSTILE_MAX_WAIT_MS) {
                        delete container.dataset.turnstileRendering;
                        container.innerHTML = retryButton;
                        Toast.error('Não foi possível carregar o captcha. Verifique sua conexão e tente novamente.');
                        return;
                    }
                    setTimeout(tryRender, TURNSTILE_RETRY_MS);
                    return;
                }

                try {
                    container.innerHTML = '';
                    const widgetId = window.turnstile.render(`#${containerId}`, {
                        sitekey: TURNSTILE_SITE_KEY,
                        theme,
                        callback: function(token) {
                            setToken(token);
                        },
                        'error-callback': function() {
                            setToken(null);
                            Toast.error('Erro na verificação do captcha. Tente novamente.');
                        },
                        'expired-callback': function() {
                            setToken(null);
                        }
                    });
                    setWidget(widgetId);
                } catch (error) {
                    console.error('Erro ao carregar Turnstile:', error);
                    setWidget(null);
                    setToken(null);
                    container.innerHTML = retryButton;
                    Toast.error('Erro ao carregar captcha. Clique em recarregar e tente novamente.');
                } finally {
                    delete container.dataset.turnstileRendering;
                }
            };

            tryRender();
        }

        // Inicializa o widget do Turnstile para login
        function initTurnstileLogin() {
            renderTurnstileWidget({
                containerId: 'turnstile-login',
                getWidget: () => turnstileLoginWidget,
                setWidget: widget => { turnstileLoginWidget = widget; },
                setToken: token => { turnstileLoginToken = token; }
            });
            return;
            if (turnstileLoginWidget !== null) {
                turnstileLoginToken = null;
                turnstile.reset(turnstileLoginWidget);
                return;
            }

            const container = document.getElementById('turnstile-login');
            if (!container) {
                return;
            }

            // Função para tentar renderizar o widget
            const tryRender = () => {
                if (typeof turnstile !== 'undefined') {
                    // Limpa o texto de carregamento
                    container.innerHTML = '';

                    try {
                        turnstileLoginWidget = turnstile.render('#turnstile-login', {
                            sitekey: TURNSTILE_SITE_KEY,
                            callback: function(token) {
                                turnstileLoginToken = token;
                            },
                            'error-callback': function(error) {
                                turnstileLoginToken = null;
                                Toast.error('Erro na verificação do captcha. Tente novamente.');
                            },
                            'expired-callback': function() {
                                turnstileLoginToken = null;
                            }
                        });
                    } catch (error) {
                        Toast.error('Erro ao carregar captcha: ' + error.message);
                    }
                }
            };

            // Tenta renderizar imediatamente
            tryRender();

            // Se não funcionou, tenta novamente a cada 500ms por até 10 segundos
            let attempts = 0;
            const maxAttempts = 20;
            const interval = setInterval(() => {
                attempts++;
                if (typeof turnstile !== 'undefined') {
                    clearInterval(interval);
                    tryRender();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    Toast.error('Erro ao carregar captcha. Recarregue a página.');
                }
            }, 500);
        }

        // Inicializa o widget do Turnstile para registro
        function initTurnstileRegister() {
            renderTurnstileWidget({
                containerId: 'turnstile-register',
                getWidget: () => turnstileRegisterWidget,
                setWidget: widget => { turnstileRegisterWidget = widget; },
                setToken: token => { turnstileRegisterToken = token; }
            });
            return;
            if (turnstileRegisterWidget !== null) {
                turnstileRegisterToken = null;
                turnstile.reset(turnstileRegisterWidget);
                return;
            }

            const container = document.getElementById('turnstile-register');
            if (!container) {
                return;
            }

            // Função para tentar renderizar o widget
            const tryRender = () => {
                if (typeof turnstile !== 'undefined') {
                    // Limpa o texto de carregamento
                    container.innerHTML = '';
                    try {
                        turnstileRegisterWidget = turnstile.render('#turnstile-register', {
                            sitekey: TURNSTILE_SITE_KEY,
                            callback: function(token) {
                                turnstileRegisterToken = token;
                            },
                            'error-callback': function() {
                                turnstileRegisterToken = null;
                                Toast.error('Erro na verificação do captcha. Tente novamente.');
                            },
                            'expired-callback': function() {
                                turnstileRegisterToken = null;
                            }
                        });
                    } catch (error) {
                        Toast.error('Erro ao carregar captcha: ' + error.message);
                    }
                }
            };

            // Tenta renderizar imediatamente
            tryRender();

            // Se não funcionou, tenta novamente a cada 500ms por até 10 segundos
            let attempts = 0;
            const maxAttempts = 20;
            const interval = setInterval(() => {
                attempts++;
                if (typeof turnstile !== 'undefined') {
                    clearInterval(interval);
                    tryRender();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    Toast.error('Erro ao carregar captcha. Recarregue a página.');
                }
            }, 500);
        }

        function getRegisterCaptchaToken() {
            return turnstileRegisterToken || document.querySelector('#turnstile-register [name="cf-turnstile-response"]')?.value || '';
        }

        function getLoginCaptchaToken() {
            return turnstileLoginToken || document.querySelector('#turnstile-login [name="cf-turnstile-response"]')?.value || '';
        }

        function resetLoginCaptcha() {
            turnstileLoginToken = null;
            if (typeof window.turnstile !== 'undefined' && turnstileLoginWidget !== null) {
                try {
                    window.turnstile.reset(turnstileLoginWidget);
                } catch (error) {
                    turnstileLoginWidget = null;
                    initTurnstileLogin();
                }
            }
        }

        function setLoginSubmitLoading(isLoading) {
            const btn = document.getElementById('loginSubmitBtn');
            if (!btn) return;
            btn.disabled = isLoading;
            btn.textContent = isLoading ? 'ACESSANDO...' : 'ACESSAR SISTEMA';
            btn.classList.toggle('opacity-70', isLoading);
            btn.classList.toggle('cursor-not-allowed', isLoading);
        }

        function togglePasswordVisibility(inputId, button) {
            const input = document.getElementById(inputId);
            if (!input) return;
            const shouldShow = input.type === 'password';
            input.type = shouldShow ? 'text' : 'password';
            button.setAttribute('aria-label', shouldShow ? 'Ocultar senha' : 'Mostrar senha');
            button.innerHTML = `<i data-lucide="${shouldShow ? 'eye-off' : 'eye'}" class="w-4 h-4 pointer-events-none"></i>`;
            lucide.createIcons();
            input.focus();
        }

        function getGoogleClientId() {
            const env = window.ENV || {};
            return env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || '';
        }

        function decodeGoogleCredentialPayload(token) {
            try {
                const payload = String(token || '').split('.')[1];
                if (!payload) return {};

                const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
                const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
                const binary = atob(padded);
                const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
                return JSON.parse(new TextDecoder().decode(bytes));
            } catch (error) {
                console.warn('Nao foi possivel ler os dados do perfil Google:', error);
                return {};
            }
        }

        function setGoogleAuthBusy(isBusy) {
            document.querySelectorAll('.google-auth-slot').forEach(slot => {
                slot.style.pointerEvents = isBusy ? 'none' : '';
                slot.classList.toggle('opacity-60', isBusy);
            });
        }

        function renderGoogleSignInButton(containerId = 'googleSignInLogin', attempt = 0) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const hint = document.getElementById(`${containerId}Hint`);
            const clientId = getGoogleClientId();
            if (!clientId) {
                container.innerHTML = '';
                if (hint) {
                    hint.textContent = '';
                    hint.classList.add('hidden');
                }
                return;
            }

            if (!window.google?.accounts?.id) {
                if (attempt < 40) {
                    setTimeout(() => renderGoogleSignInButton(containerId, attempt + 1), 250);
                    return;
                }
                container.innerHTML = '<div class="google-auth-disabled">Google indisponível no momento.</div>';
                if (hint) {
                    hint.textContent = 'Use e-mail e senha enquanto o provedor carrega.';
                    hint.classList.remove('hidden');
                }
                return;
            }

            try {
                if (googleAuthInitializedClientId !== clientId) {
                    window.google.accounts.id.initialize({
                        client_id: clientId,
                        callback: handleGoogleCredentialResponse,
                        cancel_on_tap_outside: true
                    });
                    googleAuthInitializedClientId = clientId;
                }

                const width = Math.min(360, Math.max(280, container.clientWidth || 320));
                container.innerHTML = '';
                window.google.accounts.id.renderButton(container, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    shape: 'rectangular',
                    text: containerId.toLowerCase().includes('register') ? 'signup_with' : 'signin_with',
                    logo_alignment: 'left',
                    width
                });
                if (hint) {
                    hint.textContent = '';
                    hint.classList.add('hidden');
                }
            } catch (error) {
                console.error('Erro ao renderizar Google Sign-In:', error);
                container.innerHTML = '<div class="google-auth-disabled">Não foi possível carregar o Google.</div>';
                if (hint) {
                    hint.textContent = 'Continue com e-mail e senha.';
                    hint.classList.remove('hidden');
                }
            }
        }

        async function handleGoogleCredentialResponse(response) {
            const token = response?.credential;
            if (!token) {
                Toast.error('O Google não retornou uma credencial válida.');
                return;
            }

            try {
                setGoogleAuthBusy(true);
                const res = await fetch(`${API_URL}/api/login/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok || !data.token) {
                    throw new Error(data.detail || 'Não foi possível entrar com Google.');
                }

                const googleProfile = decodeGoogleCredentialPayload(token);
                const googlePicture = data.picture || data.avatar_url || data.avatarUrl || data.photo_url || data.photoURL || googleProfile.picture || '';
                const googleEmail = data.email || googleProfile.email || '';
                const googleName = data.name || data.nome || googleProfile.name || googleProfile.given_name || '';

                USER = {
                    ...data,
                    provider: data.provider || data.auth_provider || 'google',
                    auth_provider: data.auth_provider || data.provider || 'google',
                    google_id: data.google_id || data.googleId || data.sub || googleProfile.sub || '',
                    name: googleName || data.name || data.nome || googleEmail.split('@')[0] || '',
                    email: googleEmail || data.email,
                    picture: googlePicture,
                    avatar_url: data.avatar_url || data.avatarUrl || data.photo_url || data.photoURL || googlePicture,
                    verificado: data.verificado ?? data.verified ?? true,
                    verified: data.verified ?? data.verificado ?? true
                };

                if (typeof secureStorage !== 'undefined') {
                    await secureStorage.setItem('USER', USER);
                } else {
                    localStorage.setItem('USER', JSON.stringify(USER));
                }

                window.fromLoginFlow = true;
                Toast.success('Login com Google realizado com sucesso.');
                loginSuccess();
            } catch (error) {
                console.error('Erro no login com Google:', error);
                Toast.error(error.message || 'Não foi possível entrar com Google.');
            } finally {
                setGoogleAuthBusy(false);
            }
        }

        window.renderGoogleSignInButton = renderGoogleSignInButton;
        window.handleGoogleCredentialResponse = handleGoogleCredentialResponse;

        function resetRegisterCaptcha() {
            turnstileRegisterToken = null;
            if (typeof window.turnstile !== 'undefined' && turnstileRegisterWidget !== null) {
                try {
                    window.turnstile.reset(turnstileRegisterWidget);
                } catch (error) {
                    turnstileRegisterWidget = null;
                    initTurnstileRegister();
                }
            }
        }

        function resetAuditCaptcha() {
            turnstileAuditToken = null;
            if (typeof window.turnstile !== 'undefined' && turnstileAuditWidget !== null) {
                try {
                    window.turnstile.reset(turnstileAuditWidget);
                } catch (error) {
                    turnstileAuditWidget = null;
                    initTurnstileAudit();
                }
            } else {
                initTurnstileAudit();
            }
        }

        function resetCompareCaptcha() {
            turnstileCompareToken = null;
            if (typeof window.turnstile !== 'undefined' && turnstileCompareWidget !== null) {
                try {
                    window.turnstile.reset(turnstileCompareWidget);
                } catch (error) {
                    turnstileCompareWidget = null;
                    initTurnstileCompare();
                }
            } else {
                initTurnstileCompare();
            }
        }

        function setRegisterSubmitLoading(isLoading) {
            const btn = document.getElementById('registerSubmitBtn');
            if (!btn) return;
            btn.disabled = isLoading;
            btn.textContent = isLoading ? 'CRIANDO CONTA...' : 'CONFIRMAR CADASTRO';
            btn.classList.toggle('opacity-70', isLoading);
            btn.classList.toggle('cursor-not-allowed', isLoading);
        }

        function getPasswordStrength(pass) {
            const password = pass || '';
            let score = 0;
            if (password.length >= 8) score += 25;
            if (password.length >= 12) score += 10;
            if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 20;
            if (/\d/.test(password)) score += 20;
            if (/[^A-Za-z0-9]/.test(password)) score += 20;
            if (!/(.)\1{2,}/.test(password) && password.length >= 8) score += 5;
            score = Math.min(score, 100);

            if (!password) {
                return { score: 0, label: 'Força da senha', color: '#ef4444', hint: 'Use 8+ caracteres, número e símbolo', strong: false };
            }
            if (score < 45) {
                return { score, label: 'Senha fraca', color: '#ef4444', hint: 'Adicione mais caracteres e variedade', strong: false };
            }
            if (score < 75) {
                return { score, label: 'Senha média', color: '#f59e0b', hint: 'Inclua maiúscula, número e símbolo', strong: false };
            }
            return { score, label: 'Senha forte', color: '#22c55e', hint: 'Boa senha para criar a conta', strong: true };
        }

        function updateRegisterPasswordStrength() {
            const input = document.getElementById('regPass');
            const bar = document.getElementById('regPasswordStrengthBar');
            const label = document.getElementById('regPasswordStrengthLabel');
            const hint = document.getElementById('regPasswordStrengthHint');
            if (!input || !bar || !label || !hint) return;

            const strength = getPasswordStrength(input.value);
            bar.style.width = `${strength.score}%`;
            bar.style.background = strength.color;
            label.textContent = strength.label;
            label.style.color = strength.color;
            hint.textContent = strength.hint;
        }

        function resetRegisterPasswordStrength() {
            const input = document.getElementById('regPass');
            if (input) input.value = '';
            updateRegisterPasswordStrength();
        }

        // Inicializa o widget do Turnstile para auditoria
        function initTurnstileAudit() {
            renderTurnstileWidget({
                containerId: 'turnstile-audit',
                getWidget: () => turnstileAuditWidget,
                setWidget: widget => { turnstileAuditWidget = widget; },
                setToken: token => { turnstileAuditToken = token; }
            });
            return;
            if (turnstileAuditWidget !== null) {
    turnstile.reset(turnstileAuditWidget);
    return;
}

            const container = document.getElementById('turnstile-audit');
            if (!container) {
                return;
            }

            // Função para tentar renderizar o widget
            const tryRender = () => {
                if (typeof turnstile !== 'undefined') {
                    // Limpa o texto de carregamento
                    container.innerHTML = '';

                    try {
                        turnstileAuditWidget = turnstile.render('#turnstile-audit', {
                            sitekey: TURNSTILE_SITE_KEY,
                            callback: function(token) {
                                turnstileAuditToken = token;
                            },
                            'error-callback': function(error) {
                                turnstileAuditToken = null;
                                Toast.error('Erro na verificação do captcha. Tente novamente.');
                            },
                            'expired-callback': function() {
                                turnstileAuditToken = null;
                            }
                        });
                    } catch (error) {
                        Toast.error('Erro ao carregar captcha: ' + error.message);
                    }
                }
            };

            // Tenta renderizar imediatamente
            tryRender();

            // Se não funcionou, tenta novamente a cada 500ms por até 10 segundos
            let attempts = 0;
            const maxAttempts = 20;
            const interval = setInterval(() => {
                attempts++;
                if (typeof turnstile !== 'undefined') {
                    clearInterval(interval);
                    tryRender();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    Toast.error('Erro ao carregar captcha. Recarregue a página.');
                }
            }, 500);
        }

        // Inicializa o widget do Turnstile para modo comparativo
        function initTurnstileCompare() {
            renderTurnstileWidget({
                containerId: 'turnstile-compare',
                getWidget: () => turnstileCompareWidget,
                setWidget: widget => { turnstileCompareWidget = widget; },
                setToken: token => { turnstileCompareToken = token; }
            });
            return;
            if (turnstileCompareWidget !== null) {
    turnstile.reset(turnstileCompareWidget);
    return;
}

            const container = document.getElementById('turnstile-compare');
            if (!container) {
                return;
            }

            // Função para tentar renderizar o widget
            const tryRender = () => {
                if (typeof turnstile !== 'undefined') {
                    // Limpa o texto de carregamento
                    container.innerHTML = '';

                    try {
                        turnstileCompareWidget = turnstile.render('#turnstile-compare', {
                            sitekey: TURNSTILE_SITE_KEY,
                            callback: function(token) {
                                turnstileCompareToken = token;
                            },
                            'error-callback': function(error) {
                                turnstileCompareToken = null;
                                Toast.error('Erro na verificação do captcha. Tente novamente.');
                            },
                            'expired-callback': function() {
                                turnstileCompareToken = null;
                            }
                        });
                    } catch (error) {
                        Toast.error('Erro ao carregar captcha: ' + error.message);
                    }
                }
            };

            // Tenta renderizar imediatamente
            tryRender();

            // Se não funcionou, tenta novamente a cada 500ms por até 10 segundos
            let attempts = 0;
            const maxAttempts = 20;
            const interval = setInterval(() => {
                attempts++;
                if (typeof turnstile !== 'undefined') {
                    clearInterval(interval);
                    tryRender();
                } else if (attempts >= maxAttempts) {
                    clearInterval(interval);
                    Toast.error('Erro ao carregar captcha. Recarregue a página.');
                }
            }, 500);
        }

        async function fazerLogin() {
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPass').value;
            if(!email || !pass) return Toast.warning("Preencha todos os campos");

            const cfToken = getLoginCaptchaToken();
            if (!cfToken) {
                initTurnstileLogin();
                Toast.warning("Resolva o captcha primeiro");
                return;
            }

            try {
                setLoginSubmitLoading(true);
                const res = await fetch(`${API_URL}/api/login`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, senha: pass, cf_token: cfToken })
                });
                const data = await res.json();
                if(res.ok) {
                    USER = data;
                    // Salva dados criptografados se secureStorage disponível
                    if (typeof secureStorage !== 'undefined') {
                        await secureStorage.setItem('USER', data);
                    } else {
                        localStorage.setItem('USER', JSON.stringify(data));
                    }
                    window.fromLoginFlow = true;
                    loginSuccess();
                } else {
                    Toast.error(data.detail || "Erro no login");
                    resetLoginCaptcha();
                }
            } catch(e) {
                console.error('Erro de login (index.html):', e);
                resetLoginCaptcha();
                // Verifica se é erro de rede/conexão
                if (e.name === 'TypeError' && e.message.includes('fetch')) {
                    Toast.error("Sem conexão com o servidor.");
                } else if (e.name === 'SyntaxError') {
                    Toast.error("Erro na resposta do servidor.");
                } else {
                    Toast.error("Ocorreu um erro inesperado.");
                }
            } finally {
                setLoginSubmitLoading(false);
            }
        }
        async function fazerCadastro() {
            const nome = document.getElementById('regNome').value;
            const email = document.getElementById('regEmail').value;
            const pass = document.getElementById('regPass').value;

            if(!nome || !email || !pass) return Toast.warning("Preencha todos os campos");

            updateRegisterPasswordStrength();
            const passwordStrength = getPasswordStrength(pass);
            if (!passwordStrength.strong) {
                Toast.warning("Crie uma senha mais forte antes de continuar.");
                return;
            }

            const cfToken = getRegisterCaptchaToken();
            if (!cfToken) {
                initTurnstileRegister();
                Toast.warning("Resolva o captcha primeiro");
                return;
            }

            try {
                setRegisterSubmitLoading(true);
                const res = await fetch(`${API_URL}/api/register`, {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ nome, email, senha: pass, cf_token: cfToken })
                });
                const data = await res.json().catch(() => ({}));

                if(res.ok) {
                    Toast.success("Conta criada! Um código de verificação foi enviado para seu e-mail.");
                    // Limpa formulário
                    document.getElementById('regNome').value = "";
                    document.getElementById('regEmail').value = "";
                    resetRegisterPasswordStrength();
                    resetRegisterCaptcha();
                    // Esconde formulário de cadastro
                    document.getElementById('registerForm').classList.add('hidden');
                    // Mostra tela de verificação diretamente
                    document.getElementById('verifyModal').classList.remove('hidden');
                    lucide.createIcons();
                    // Inicia a contagem de reenvio
                    iniciarContagemReenvio();
                    // Salva email e senha temporários para verificação e login automático
                    emailTemporario = email;
                    senhaTemporaria = pass;
                    // O reload só acontecerá após confirmar o código em confirmarCodigoAPI()
                } else {
                    console.error('Erro no cadastro:', data);
                    Toast.error(data.detail || "Erro ao criar conta. Verifique os dados e tente novamente.");
                    resetRegisterCaptcha();
                }
            } catch(e) {
                console.error('Erro de cadastro (index.html):', e);
                resetRegisterCaptcha();
                // Verifica se é erro de rede/conexão
                if (e.name === 'TypeError' && e.message.includes('fetch')) {
                    Toast.error("Sem conexão com o servidor.");
                } else if (e.name === 'SyntaxError') {
                    Toast.error("Erro na resposta do servidor.");
                } else {
                    Toast.error("Ocorreu um erro inesperado.");
                }
            } finally {
                setRegisterSubmitLoading(false);
            }
        }
        // 2. VERIFICAÇÃO DE SEGURANÇA (NOVO)
        // Se o usuário não tiver a flag 'verificado' ou ela for falsa/0
// Funções de controle de visualização
function setAuthView(view) {
    authView = view;
    erroRecuperacao = '';
    sucessoRecuperacao = '';
    renderAuthView();
}
// Função para enviar código de recuperação
async function enviarCodigoRecuperacao() {
    const email = document.getElementById('recuperarEmail').value;
    if(!email) {
        Toast.warning("Preencha o campo de e-mail");
        return;
    }
    loadingRecuperacao = true;
    erroRecuperacao = '';
    renderAuthView();
    try {
        const res = await fetch(`${API_URL}/api/recuperar-senha`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email})
        });
        // Salva e-mail temporário independentemente do resultado (segurança)
        emailTemporario = email;
        loadingRecuperacao = false;
        // Sempre muda para a tela de código (mesmo com erro, por segurança)
        setAuthView('codigo');
        if(res.ok) {
            Toast.success("código enviado para seu e-mail!");
        } else {
            // Não mostra erro específico por segurança anti-enumeração
            Toast.info("Se o e-mail existir, você receberá um código.");
        }
    } catch(e) {
        console.error('Erro ao enviar código:', e);
        loadingRecuperacao = false;
        emailTemporario = email;
        setAuthView('codigo');
        Toast.info("Se o e-mail existir, você receberá um código.");
    }
}
// Função para atualizar senha
async function atualizarSenha() {
    const codigo = document.getElementById('codigoRecuperacao').value;
    const novaSenha = document.getElementById('novaSenha').value;
    const confirmarSenha = document.getElementById('confirmarNovaSenha').value;
    if(!codigo || !novaSenha || !confirmarSenha) {
        Toast.warning("Preencha todos os campos");
        return;
    }
    if(codigo.length !== 4) {
        Toast.warning("O código deve ter 4 dígitos");
        return;
    }
    if(novaSenha !== confirmarSenha) {
        Toast.warning("As senhas não coincidem");
        return;
    }
    if(novaSenha.length < 6) {
        Toast.warning("A senha deve ter pelo menos 6 caracteres");
        return;
    }
    loadingRecuperacao = true;
    erroRecuperacao = '';
    renderAuthView();
    try {
        const res = await fetch(`${API_URL}/api/nova-senha`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                email: emailTemporario,
                codigo: codigo,
                nova_senha: novaSenha
            })
        });
        const data = await res.json();
        loadingRecuperacao = false;
        if(res.ok) {
            sucessoRecuperacao = "Senha atualizada com sucesso!";
            Toast.success("Senha atualizada com sucesso!");
            setTimeout(() => {
                setAuthView('login');
                // Limpa campos
                document.getElementById('loginEmail').value = emailTemporario;
                document.getElementById('loginPass').value = '';
                emailTemporario = '';
            }, 2000);
        } else {
            erroRecuperacao = data.detail || "código inválido ou expirado";
            Toast.error(erroRecuperacao);
            renderAuthView();
        }
    } catch(e) {
        console.error('Erro ao atualizar senha:', e);
        loadingRecuperacao = false;
        erroRecuperacao = "Erro de conexão com o servidor";
        Toast.error(erroRecuperacao);
        renderAuthView();
    }
}
// Função para renderizar a visualização atual
function renderAuthView() {
    const loginContent = document.getElementById('loginContent');
    if(authView === 'login') {
        loginContent.innerHTML = getLoginHTML();
        // Inicializa Turnstile após renderizar o HTML
        setTimeout(() => initTurnstileLogin(), 500);
        setTimeout(() => renderGoogleSignInButton('googleSignInLogin'), 250);
    } else if(authView === 'email') {
        loginContent.innerHTML = getEmailHTML();
    } else if(authView === 'codigo') {
        loginContent.innerHTML = getCodigoHTML();
    }
    // Re-renderiza ícones Lucide
    setTimeout(() => lucide.createIcons(), 100);
}
// Templates HTML para cada visualização
function getLoginHTML() {
    return `
        <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-white mb-2">Acessar Sistema</h2>
            <p class="text-slate-400 text-sm">Entre com suas credenciais para continuar</p>
        </div>
        <div class="space-y-4">
            <div id="googleSignInLogin" class="google-auth-slot"></div>
            <p id="googleSignInLoginHint" class="google-auth-hint hidden"></p>
            <div class="google-auth-divider" aria-hidden="true">
                <span></span>
                <small>ou entre com e-mail</small>
                <span></span>
            </div>
            <div class="group">
                <label class="text-[10px] font-bold text-slate-500 ml-1 mb-1 block uppercase tracking-wider group-focus-within:text-primary transition-colors">E-mail Corporativo</label>
                <div class="relative">
                    <i data-lucide="mail" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors"></i>
                    <input type="email" id="loginEmail" class="input-pro w-full rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-600" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('loginPass').focus();}">
                </div>
            </div>
            <div class="group">
                <label class="text-[10px] font-bold text-slate-500 ml-1 mb-1 block uppercase tracking-wider group-focus-within:text-primary transition-colors">Senha de Acesso</label>
                <div class="relative">
                    <i data-lucide="lock" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors"></i>
                    <input type="password" id="loginPass" class="input-pro w-full rounded-xl py-3 pl-10 pr-11 text-white text-sm placeholder-slate-600" onkeydown="if(event.key==='Enter'){event.preventDefault();fazerLogin();}">
                    <button type="button" onclick="togglePasswordVisibility('loginPass', this)" aria-label="Mostrar senha" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors">
                        <i data-lucide="eye" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </div>
            <div class="mt-4">
                <div id="turnstile-login" class="flex justify-center min-h-[65px] items-center">
                    <div class="text-xs text-slate-500 animate-pulse">Carregando verificação de segurança...</div>
                </div>
            </div>
            <button id="loginSubmitBtn" onclick="fazerLogin()" class="btn-primary w-full text-white font-bold py-4 rounded-xl shadow-lg mt-4 tracking-wide text-sm uppercase">
                Acessar Sistema
            </button>
            <div class="flex justify-between items-center mt-8 pt-6 border-t border-slate-800/50">
                <button onclick="showAuthScreen('register')" class="text-xs text-slate-400 hover:text-white transition-colors font-medium flex items-center gap-1">
                    <i data-lucide="user-plus" class="w-3 h-3"></i> Criar Conta
                </button>
                <button onclick="setAuthView('email')" class="text-xs text-slate-400 hover:text-[#00D4FF] transition-colors font-medium">
                    Esqueci minha senha
                </button>
            </div>
        </div>
    `;
}
function getEmailHTML() {
    return `
        <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-white mb-2">Recuperar Acesso</h2>
            <p class="text-slate-400 text-sm">Enviaremos um código de 4 dígitos para seu e-mail</p>
        </div>
        <div class="space-y-4">
            <div class="group">
                <label class="text-[10px] font-bold text-slate-500 ml-1 mb-1 block uppercase tracking-wider group-focus-within:text-primary transition-colors">E-mail Corporativo</label>
                <div class="relative">
                    <i data-lucide="mail" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors"></i>
                    <input type="email" id="recuperarEmail" class="input-pro w-full rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-600" onkeydown="if(event.key==='Enter'){event.preventDefault();enviarCodigoRecuperacao();}">
                </div>
            </div>
            <button onclick="enviarCodigoRecuperacao()" class="btn-primary w-full text-white font-bold py-4 rounded-xl shadow-lg mt-4 tracking-wide text-sm uppercase" ${loadingRecuperacao ? 'disabled' : ''}>
                ${loadingRecuperacao ? `
                    <div class="flex items-center justify-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                    </div>
                ` : 'Enviar código'}
            </button>
            <button onclick="setAuthView('login')" class="w-full text-slate-400 hover:text-white transition-colors font-medium text-sm py-2">
                Voltar para o Login
            </button>
        </div>
    `;
}
function getCodigoHTML() {
    return `
        <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-white mb-2">Criar Nova Senha</h2>
            <p class="text-slate-400 text-sm">Insira o código de 4 dígitos enviado ao seu e-mail</p>
        </div>
        ${erroRecuperacao ? `
            <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
                <p class="text-red-400 text-sm">${erroRecuperacao}</p>
            </div>
        ` : ''}
        ${sucessoRecuperacao ? `
            <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
                <p class="text-emerald-400 text-sm">${sucessoRecuperacao}</p>
            </div>
        ` : ''}
        <div class="space-y-4">
            <div class="group">
                <label class="text-[10px] font-bold text-slate-500 ml-1 mb-1 block uppercase tracking-wider group-focus-within:text-primary transition-colors">código de 4 dígitos</label>
                <div class="relative">
                    <i data-lucide="key" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors"></i>
                    <input type="text" id="codigoRecuperacao" maxlength="4" class="input-pro w-full rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-600 text-center tracking-widest text-xl" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('novaSenha').focus();}">
                </div>
            </div>
            <div class="group">
                <label class="text-[10px] font-bold text-slate-500 ml-1 mb-1 block uppercase tracking-wider group-focus-within:text-primary transition-colors">Nova Senha</label>
                <div class="relative">
                    <i data-lucide="lock" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors"></i>
                    <input type="password" id="novaSenha" class="input-pro w-full rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-600" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('confirmarNovaSenha').focus();}">
                </div>
            </div>
            <div class="group">
                <label class="text-[10px] font-bold text-slate-500 ml-1 mb-1 block uppercase tracking-wider group-focus-within:text-primary transition-colors">Confirmar Nova Senha</label>
                <div class="relative">
                    <i data-lucide="lock" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-white transition-colors"></i>
                    <input type="password" id="confirmarNovaSenha" class="input-pro w-full rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder-slate-600" onkeydown="if(event.key==='Enter'){event.preventDefault();atualizarSenha();}">
                </div>
            </div>
            <button onclick="atualizarSenha()" class="btn-primary w-full text-white font-bold py-4 rounded-xl shadow-lg mt-4 tracking-wide text-sm uppercase" ${loadingRecuperacao ? 'disabled' : ''}>
                ${loadingRecuperacao ? `
                    <div class="flex items-center justify-center">
                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Atualizando...
                    </div>
                ` : 'Atualizar Senha'}
            </button>
            <button onclick="setAuthView('login')" class="w-full text-slate-400 hover:text-white transition-colors font-medium text-sm py-2">
                Voltar para o Login
            </button>
        </div>
    `;
}
        function loginSuccess() {
            // 1. Esconde tela de login
            document.getElementById('authScreen').classList.add('hidden');
            // 2. VERIFICAÇÃO DE SEGURANÇA (NOVO)
            // Se o usuário não tiver a flag 'verificado' ou ela for falsa/0
            if (!USER.verificado || USER.verificado === 0 || USER.verificado === 'false') {
                setAuthPageState(true);
                // Mostra o Modal de Bloqueio
                document.getElementById('verifyModal').classList.remove('hidden');
                lucide.createIcons(); // Garante que os ícones do modal apareçam
                iniciarContagemReenvio(); // <--- ADICIONE ESTA LINHA
                return; // PARA AQUI. Não carrega o resto do site.
            }
            // 3. Se estiver verificado, segue o fluxo normal
            setAuthPageState(false);
            document.getElementById('verifyModal').classList.add('hidden'); // Garante que sumiu
            document.getElementById('appSidebar').classList.remove('hidden');
            document.getElementById('appSidebar').classList.add('flex');
            document.getElementById('userAvatarCircle').innerText = getUserInitial();
            loadManageAgents();
            // Atualiza os botões
            updateUserMenuCircle();
            updateAuthButton();
            // Reload automático da página após login bem-sucedido
            // EVITA RELOAD INFINITO: Apenas recarrega se vier do fluxo de login explícito
            if (!window.fromLoginFlow) {
                setTimeout(() => {
                    console.log(' Recarregando página após login...');
                    window.location.reload();
                }, 1000);
            } else {
                console.log(' Usuário já carregado do storage - sem reload necessário');
                window.fromLoginFlow = false; // Reseta a flag
            }
            if (window.location.pathname === '/login' || window.location.pathname === '/cadastro') {
                nav('home');
            }
        }
        function toggleUserMenuCircle() {
            const dropdown = document.getElementById('userMenuCircleDropdown');
            const btn = document.getElementById('avatarCircleBtn');
            if (!dropdown) return;
            const shouldOpen = dropdown.classList.contains('hidden');
            if (shouldOpen) toggleSidebar(false);
            dropdown.classList.toggle('hidden', !shouldOpen);
            if (btn) btn.setAttribute('aria-expanded', String(shouldOpen));
            // Fechar ao clicar fora
            if (shouldOpen) {
                document.addEventListener('click', closeUserMenuCircleOnClickOutside);
            } else {
                document.removeEventListener('click', closeUserMenuCircleOnClickOutside);
            }
        }
        // Função para fechar o menu ao clicar fora
        function closeUserMenuCircleOnClickOutside(e) {
            const dropdown = document.getElementById('userMenuCircleDropdown');
            const btn = document.getElementById('avatarCircleBtn');
            if (!dropdown || !btn) return;
            if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
                dropdown.classList.add('hidden');
                btn.setAttribute('aria-expanded', 'false');
                document.removeEventListener('click', closeUserMenuCircleOnClickOutside);
            }
        }
        function getUserInitial() {
            const source = USER?.name || USER?.nome || USER?.email || 'U';
            return String(source).trim().charAt(0).toUpperCase() || 'U';
        }

        // Avatar helpers
        function getUserDisplayName() {
            return USER?.name || USER?.nome || USER?.email?.split('@')[0] || 'Meu perfil';
        }

        function isGoogleUserProfile() {
            const provider = String(USER?.provider || USER?.auth_provider || USER?.login_provider || '').toLowerCase();
            return provider.includes('google') || provider.includes('gmail') || Boolean(USER?.google_id || USER?.googleId);
        }

        function getUserAvatarUrl() {
            const avatarUrl = USER?.picture || USER?.avatar_url || USER?.avatarUrl || USER?.photo_url || USER?.photoURL || USER?.profile_picture || '';
            if (!avatarUrl) return '';

            try {
                const url = new URL(String(avatarUrl), window.location.origin);
                const isGoogleImage = /(^|\.)googleusercontent\.com$/i.test(url.hostname);
                if (url.protocol !== 'https:' || (!isGoogleUserProfile() && !isGoogleImage)) return '';
                return url.href;
            } catch (error) {
                return '';
            }
        }

        function renderUserAvatar(avatarElement, initial, avatarUrl) {
            if (!avatarElement) return;

            avatarElement.textContent = '';
            avatarElement.classList.toggle('has-photo', Boolean(avatarUrl));

            if (!avatarUrl) {
                avatarElement.textContent = initial;
                return;
            }

            const image = document.createElement('img');
            image.src = avatarUrl;
            image.alt = getUserDisplayName();
            image.className = 'user-avatar-photo';
            image.referrerPolicy = 'no-referrer';
            image.loading = 'lazy';
            image.decoding = 'async';
            avatarElement.appendChild(image);
        }

        // Função para atualizar a barra superior e o menu circular
    function updateUserMenuCircle() {
    const userInfoSection = document.getElementById('userInfoCircleSection');
    const userNameCircle = document.getElementById('userNameCircle');
    const userEmailCircle = document.getElementById('userEmailCircle');
    const userCreditsCircle = document.getElementById('userCreditsCircle');
    const userPlanCircle = document.getElementById('userPlanCircle');
    const userAvatarLarge = document.getElementById('userAvatarLarge');
    const userAvatarCircle = document.getElementById('userAvatarCircle');
    const sidebarProfileName = document.getElementById('sidebarProfileName');
    const sidebarProfilePlan = document.getElementById('sidebarProfilePlan');

    // Nossos novos containers
    const authButtonsContainer = document.getElementById('authButtonsContainer');
    const userAvatarContainer = document.getElementById('userAvatarContainer');

    if (!USER || !USER.email) {
        // --- ESTADO: NÃO LOGADO ---
        if (authButtonsContainer) authButtonsContainer.classList.remove('hidden'); // Mostra botões Login/Cadastro
        if (userAvatarContainer) userAvatarContainer.classList.add('hidden');      // Esconde Avatar
        renderUserAvatar(userAvatarCircle, 'U', '');
        renderUserAvatar(userAvatarLarge, 'U', '');
        if (sidebarProfileName) sidebarProfileName.textContent = 'Meu perfil';
        if (sidebarProfilePlan) sidebarProfilePlan.textContent = 'Starter';
    } else {
        // --- ESTADO: LOGADO ---
        if (authButtonsContainer) authButtonsContainer.classList.add('hidden');    // Esconde botões Login/Cadastro
        if (userAvatarContainer) userAvatarContainer.classList.remove('hidden');   // Mostra Avatar

        // Preenche dados do avatar
        if (userInfoSection) userInfoSection.classList.remove('hidden');
        const initial = getUserInitial();
        const avatarUrl = getUserAvatarUrl();
        const displayName = getUserDisplayName();
        renderUserAvatar(userAvatarCircle, initial, avatarUrl);
        renderUserAvatar(userAvatarLarge, initial, avatarUrl);
        if (userNameCircle) userNameCircle.textContent = displayName;
        if (userEmailCircle) userEmailCircle.textContent = USER.email;
        if (userCreditsCircle) userCreditsCircle.textContent = USER.credits || 0;
        if (userPlanCircle) userPlanCircle.textContent = getUserPlanLabel(USER.plan);
        if (sidebarProfileName) sidebarProfileName.textContent = displayName;
        if (sidebarProfilePlan) sidebarProfilePlan.textContent = getUserPlanLabel(USER.plan);
    }

    // Recriar ícones Lucide
    lucide.createIcons();
}
        // Função para alternar Login/Sair
        function handleLoginLogout() {
            if (!USER || !USER.email) {
                // Mostra tela de login
                showAuthScreen('login');
            } else {
                // Faz logout
                logout();
            }
        }
        // Função para atualizar o estado do botão Login/Sair
        function logout() {
            clearActiveAuditSession();
            auditSnapshotTabOpened = false;
            if (typeof secureStorage !== 'undefined') {
                secureStorage.removeItem('USER');
            }
            localStorage.removeItem('USER');
            USER = null;
            updateUserMenuCircle();
            updateAuthButton();
            Toast.success('Logout realizado com sucesso!');
            setTimeout(() => location.reload(), 1000);
        }
        function comprarCreditos() { nav('precos'); }
        // Função falarComVendas movida para pricing-section.js
        function mudarSenha() {
            // Fecha o menu do usuário
            toggleUserMenuCircle();
            // Se não estiver logado, redireciona para login
            if (!USER || !USER.email) {
                showAuthScreen('login');
                return;
            }
            // Inicia o fluxo de recuperação de senha com o email do usuário logado
            emailTemporario = USER.email;
            setAuthView('email');
            window.history.pushState({}, '', '/login');
            setAuthPageState(true);
            document.getElementById('authScreen').classList.remove('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
            document.getElementById('registerForm').classList.add('hidden');
            document.getElementById('recuperarEmail').value = USER.email;
            Toast.info('Enviaremos um código para seu email para redefinir sua senha');
        }
        // Função para controlar o botão de auth (cadastro/login vs settings)
        function handleAuthButton() {
            if (!USER || !USER.email) {
                // Mostra tela de cadastro/login
                showAuthScreen();
            } else {
                // Abrir menu de configurações do usuário
                showUserSettings();
            }
        }
        // Função para atualizar o estado do botão de auth
        function updateAuthButton() {
            const btn = document.getElementById('userMenuCircleLogoutBtn');
            const text = document.getElementById('userMenuCircleText');
            // Verifica se os elementos existem antes de manipulá-los
            if (!btn || !text) {
                console.warn('Elementos do botão de auth não encontrados');
                return;
            }
            if (!USER || !USER.email) {
                // Usuário não logado - mostrar Login
                btn.className = 'user-menu-action user-menu-action-primary';
                btn.onclick = () => {
                    showAuthScreen('login');
                    toggleUserMenuCircle();
                };
                text.textContent = 'Login';
            } else {
                // Usuário logado - mostrar Logout
                btn.className = 'user-menu-action user-menu-action-danger';
                btn.onclick = () => {
                    logout();
                };
                text.textContent = 'Sair';
            }
        }
        // Função para mostrar configurações do usuário
        function showUserSettings() {
            // Criar menu de configurações flutuante
            const settingsMenu = document.createElement('div');
            settingsMenu.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
            settingsMenu.innerHTML = `
                <div class="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-bold text-white">Configurações</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-slate-400 hover:text-white">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <div class="space-y-3">
                        <button onclick="logout(); this.closest('.fixed').remove();" class="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-3">
                            <i data-lucide="log-out" class="w-4 h-4 text-red-400"></i>
                            <span>Sair do Sistema</span>
                        </button>
                        <button onclick="this.closest('.fixed').remove();" class="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-3">
                            <i data-lucide="user" class="w-4 h-4 text-blue-400"></i>
                            <span>Meu Perfil</span>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(settingsMenu);
            // Recriar ícones Lucide
            lucide.createIcons();
        }
        async function confirmarCodigoAPI() {
            const codigoInput = document.getElementById('inputVerifyCode');
            const codigo = codigoInput.value.trim();
            const btn = event.target; // O botão clicado
            if (codigo.length < 4) return Toast.warning("Digite o código de 4 números.");

            // Determina qual email usar (fluxo de login ou cadastro)
            let emailParaVerificar;
            let isCadastroFlow = false;

            if (USER && USER.email) {
                // Fluxo normal de login (usuário já logado)
                emailParaVerificar = USER.email;
            } else if (emailTemporario) {
                // Fluxo de cadastro (usuário acabou de se cadastrar)
                emailParaVerificar = emailTemporario;
                isCadastroFlow = true;
            } else {
                Toast.error("Usuário não encontrado. Faça login novamente.");
                logout();
                return;
            }

            // Efeito visual de carregando
            const textoOriginal = btn.innerHTML;
            btn.innerHTML = "Verificando...";
            btn.disabled = true;
            try {
                // Chama sua API no Replit
                const res = await fetch(`${API_URL}/api/verificar`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                        email: emailParaVerificar,
                        codigo: codigo
                    })
                });
                const data = await res.json();
                if (res.ok) {
                    // SUCESSO!
                    Toast.success(isCadastroFlow ? "Conta verificada. Faça login para continuar." : "Conta verificada com sucesso! Bem-vindo.");

                    if (isCadastroFlow) {
                        const emailVerificado = emailTemporario || emailParaVerificar;
                        emailTemporario = null;
                        senhaTemporaria = null;
                        document.getElementById('verifyModal').classList.add('hidden');
                        showAuthScreen('login');
                        const loginEmailInput = document.getElementById('loginEmail');
                        if (loginEmailInput && emailVerificado) loginEmailInput.value = emailVerificado;
                        setTimeout(() => {
                            if (typeof initTurnstileLogin === 'function') initTurnstileLogin();
                        }, 300);
                    } else {
                        // Fluxo normal de login (usuário já logado)
                        USER.verificado = true;
                        // Salva dados criptografados se secureStorage disponível
                        if (typeof secureStorage !== 'undefined') {
                            await secureStorage.setItem('USER', USER);
                        } else {
                            localStorage.setItem('USER', JSON.stringify(USER));
                        }
                        window.fromLoginFlow = true;
                        loginSuccess();
                    }
                } else {
                    // ERRO (Código errado)
                    Toast.error(data.detail || "Código incorreto. Tente novamente.");
                    codigoInput.value = ""; // Limpa campo
                    codigoInput.focus();
                }
            } catch (e) {
                console.error(e);
                Toast.error("Erro de conexão com o servidor.");
            }
            // Restaura o botão
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
        function getPersonaUsage(fallbackCount = 0) {
            const usage = window.SSW_PERSONA_USAGE || {};
            const plan = normalizeUserPlan(usage.plan || getUserPlan());
            const limits = getFrontendPlanLimits(plan);
            const count = Number.isFinite(Number(usage.count)) ? Number(usage.count) : fallbackCount;
            const limit = Number.isFinite(Number(usage.limit)) && Number(usage.limit) > 0 ? Number(usage.limit) : limits.personaLimit;
            return { count, limit, plan };
        }

        function renderPersonaLimitStatus(fallbackCount = 0) {
            const usage = getPersonaUsage(fallbackCount);
            const percent = Math.min(100, Math.round((usage.count / Math.max(usage.limit, 1)) * 100));
            const reached = usage.count >= usage.limit;
            return `
                <div class="md:col-span-2 lg:col-span-3 rounded-2xl border ${reached ? 'border-amber-400/30 bg-amber-400/10' : 'border-cyan-400/20 bg-cyan-400/5'} p-4">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <p class="text-xs uppercase tracking-[0.18em] ${reached ? 'text-amber-200' : 'text-cyan-200'} font-bold">Limite do plano ${getUserPlanLabel(usage.plan)}</p>
                            <p class="text-sm text-slate-300 mt-1">${usage.count}/${usage.limit} personas criadas ${reached ? '- limite atingido' : '- disponível para uso'}</p>
                        </div>
                        <div class="w-full sm:w-48 h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden">
                            <div class="h-full ${reached ? 'bg-amber-300' : 'bg-cyan-300'}" style="width:${percent}%"></div>
                        </div>
                    </div>
                </div>`;
        }

        function updateCreateAgentButtonByLimit(fallbackCount = 0) {
            const btn = document.getElementById('createAgentBtn');
            if (!btn) return;
            const usage = getPersonaUsage(fallbackCount);
            const reached = usage.count >= usage.limit;
            btn.disabled = reached;
            btn.innerText = reached ? 'LIMITE ATINGIDO' : 'SALVAR';
            btn.classList.toggle('opacity-60', reached);
            btn.classList.toggle('cursor-not-allowed', reached);
        }

        async function loadManageAgents() {
            const div = document.getElementById('manageAgentsList');
            div.innerHTML = "<p class='text-slate-500 animate-pulse'>Sincronizando...</p>";
            try {
                const lista = await fetchBackendPersonas({ includeSystem: false, requireAuth: true });
                div.innerHTML = renderPersonaLimitStatus(lista.length);
                updateCreateAgentButtonByLimit(lista.length);
                if(lista.length === 0) div.innerHTML += "<div class='text-slate-500 col-span-3 text-center border border-dashed border-slate-700 p-8 rounded-xl'>Nenhum perfil criado.</div>";
                lista.forEach(p => {
                    const safeName = safeAuditText(p.name);
                    const safeDescription = safeAuditText(p.description);
                    const safeNiche = safeAuditText(getPersonaNiche(p));
                    const safeType = safeAuditText(getPersonaType(p));
                    div.innerHTML += `
                        <div class="glass-panel p-5 rounded-2xl border border-slate-800 relative group">
                            <div class="flex justify-between items-start mb-2">
                                <div class="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-accent"><i data-lucide="user" class="w-4 h-4"></i></div>
                                <button onclick="deleteAgent('${p.id}')" class="text-slate-600 hover:text-red-500 transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                            </div>
                            <div class="flex flex-wrap gap-2 mb-3">
                                <span class="text-[10px] font-bold uppercase tracking-wide rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 text-cyan-200">${safeNiche}</span>
                                <span class="text-[10px] font-bold uppercase tracking-wide rounded-full border border-white/10 bg-white/5 px-2 py-1 text-slate-300">${safeType}</span>
                            </div>
                            <h4 class="font-bold text-white">${safeName}</h4>
                            <p class="text-xs text-slate-400 mt-2 line-clamp-3">${safeDescription}</p>
                        </div>`;
                });
                lucide.createIcons();
            } catch(e) {
                console.error(e);
                div.innerHTML = `<div class='text-red-300 col-span-3 text-center border border-red-500/20 bg-red-500/10 p-8 rounded-xl'>${safeAuditText(e.message || 'Erro ao carregar personas.')}</div>`;
            }
        }
        async function createAgent() {
            const nome = document.getElementById('newAgentName').value;
            const desc = document.getElementById('newAgentDesc').value;
            const niche = document.getElementById('newAgentNiche')?.value || 'geral';
            const type = document.getElementById('newAgentType')?.value || 'perfil';
            if(!nome || !desc) return Toast.warning("Preencha todos os campos");
            const usage = getPersonaUsage();
            if (usage.count >= usage.limit) {
                return Toast.warning(`Limite de personas do plano ${getUserPlanLabel(usage.plan)} atingido (${usage.count}/${usage.limit}). Exclua uma persona ou faça upgrade.`);
            }
            const btn = document.getElementById('createAgentBtn');
            if (btn) { btn.innerText = "..."; btn.disabled = true; }
            try {
                const res = await fetch(`${API_URL}/api/personas`, {
                    method: 'POST', headers: authHeaders({'Content-Type': 'application/json'}),
                    body: JSON.stringify({ nome, descricao: desc, niche, type })
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.detail || "Erro ao criar perfil");
                }
                const data = await res.json().catch(() => ({}));
                if (data.plan || data.custom_limit) {
                    window.SSW_PERSONA_USAGE = {
                        count: Number(data.custom_count ?? (usage.count + 1)),
                        limit: Number(data.custom_limit ?? usage.limit),
                        plan: data.plan || usage.plan,
                        limits: data.limits || null
                    };
                }
                document.getElementById('newAgentName').value = "";
                document.getElementById('newAgentDesc').value = "";
                if (document.getElementById('newAgentNiche')) document.getElementById('newAgentNiche').value = "";
                if (document.getElementById('newAgentType')) document.getElementById('newAgentType').value = "";
                await loadManageAgents();
                if(document.getElementById('auditMode').value === 'manual') toggleManualSelect();
                Toast.success("Perfil salvo com sucesso!");
            } catch(e) { Toast.error(e.message || "Erro ao criar perfil"); }
            updateCreateAgentButtonByLimit();
        }
        // Função de confirmação personalizada
        function showConfirmDialog(message, onConfirm, onCancel) {
            // Remove modal anterior se existir
            const existingModal = document.getElementById('confirmModal');
            if (existingModal) {
                existingModal.remove();
            }
            // Cria o modal de confirmação
            const modal = document.createElement('div');
            modal.id = 'confirmModal';
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up';
            modal.innerHTML = `
                <div class="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full mx-auto p-6 transform transition-all">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-semibold text-white">Confirmar Ação</h3>
                        <button onclick="closeConfirmModal()" class="text-slate-400 hover:text-white transition-colors">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <p class="text-slate-300 mb-6">${message}</p>
                    <div class="flex gap-3 justify-end">
                        <button onclick="closeConfirmModal()" class="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                            Cancelar
                        </button>
                        <button onclick="confirmAction()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                            Confirmar
                        </button>
                    </div>
                </div>
            `;
            // Adiciona ao body
            document.body.appendChild(modal);
            // Inicializa ícones Lucide
            lucide.createIcons();

            // Funções globais para os botões
            window.closeConfirmModal = function() {
                const modal = document.getElementById('confirmModal');
                if (modal) {
                    modal.remove();
                }
                if (onCancel) onCancel();
            };
            window.confirmAction = function() {
                const modal = document.getElementById('confirmModal');
                if (modal) {
                    modal.remove();
                }
                if (onConfirm) onConfirm();
            };

            // Fecha ao clicar fora
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeConfirmModal();
                }
            });
        }
        async function deleteAgent(id) {
            showConfirmDialog("Deseja realmente excluir essa agent?", async () => {
                await fetch(`${API_URL}/api/personas/${id}`, { method: 'DELETE', headers: authHeaders() });
                loadManageAgents();
                if(!document.getElementById('manualSelectArea').classList.contains('hidden')) toggleManualSelect();
            }); // Fecha o callback do showConfirmDialog
        }
        // === 5. AUDIT LOGIC (CORE) ===
        // Função para criar estrutura HTML inicial dos resultados da auditoria (Relatório Técnico Corporativo)
        function createAuditResultsStructure() {
            const resultsContainer = document.getElementById('auditResults');
            if (!resultsContainer) return;
            resultsContainer.innerHTML = `
                <!-- PÁGINA 1: Capa e Veredito Técnico -->
                <div class="print:break-after-page bg-[#0F1117] text-white p-8 print:p-12 print:min-h-0 print:h-auto print:block print:overflow-visible" style="-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                    <!-- Cabeçalho Profissional -->
                    <header class="mb-8 pb-6 border-b border-slate-800">
                        <div class="flex justify-between items-start">
                            <div>
                                <h1 class="text-2xl font-bold text-white mb-2">SSW INTELLIGENCE</h1>
                                <p class="text-lg text-slate-300 font-semibold">Relatório de Auditoria Técnica</p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-slate-400" id="reportDate">${new Date().toLocaleDateString('pt-BR')}</p>
                                <p class="text-sm text-slate-300 font-medium mt-1" id="reportUrl">-</p>
                            </div>
                        </div>
                    </header>
                    <!-- Score Principal -->
                    <section class="mb-12 text-center print:break-inside-avoid">
                        <h2 class="text-xl font-bold text-slate-300 mb-4">Veredito Técnico Geral</h2>
                        <div class="inline-block bg-slate-800 border-2 border-slate-700 rounded-xl p-8 print:break-inside-avoid">
                            <div class="text-6xl font-black text-white mb-2" id="resScore">-</div>
                            <p class="text-slate-400 text-sm uppercase tracking-wider">Score Técnica</p>
                        </div>
                    </section>
                    <!-- Dashboard Técnico - Cockpit de Performance -->
                    <section class="grid grid-cols-1 print:grid-cols-2 gap-6 print:break-inside-avoid">
                        <h3 class="text-lg font-bold text-slate-300 mb-6 print:break-inside-avoid">Dashboard Técnico - Google PageSpeed Insights</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-6 mb-8 print:break-inside-avoid">
                            <!-- Performance Score -->
                            <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center print:break-inside-avoid print:block">
                                <div class="flex items-center justify-center mb-2">
                                    <i data-lucide="zap" class="w-5 h-5 text-blue-400 mr-2"></i>
                                    <span class="text-xs text-slate-500 font-bold uppercase">Performance</span>
                                </div>
                                <div id="realPerformanceScore" class="text-3xl font-black text-white mb-1">--</div>
                                <div class="text-xs text-slate-400">Score</div>
                            </div>
                            <!-- SEO Score -->
                            <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center print:break-inside-avoid print:block">
                                <div class="flex items-center justify-center mb-2">
                                    <i data-lucide="search" class="w-5 h-5 text-green-400 mr-2"></i>
                                    <span class="text-xs text-slate-500 font-bold uppercase">SEO</span>
                                </div>
                                <div id="realSeoScore" class="text-3xl font-black text-white mb-1">--</div>
                                <div class="text-xs text-slate-400">Score</div>
                            </div>
                            <!-- Accessibility Score -->
                            <div class="bg-slate-800 border border-slate-700 rounded-lg p-4 text-center print:break-inside-avoid print:block">
                                <div class="flex items-center justify-center mb-2">
                                    <i data-lucide="users" class="w-5 h-5 text-purple-400 mr-2"></i>
                                    <span class="text-xs text-slate-500 font-bold uppercase">Acessibilidade</span>
                                </div>
                                <div id="realA11yScore" class="text-3xl font-black text-white mb-1">--</div>
                                <div class="text-xs text-slate-400">Score</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-6 mb-8 print:break-inside-avoid">
                            <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center print:break-inside-avoid print:block">
                                <div class="flex items-center justify-center mb-2">
                                    <i data-lucide="timer" class="w-5 h-5 text-cyan-400 mr-2"></i>
                                    <span class="text-xs text-slate-500 font-bold uppercase">Primeiro item a aparecer</span>
                                </div>
                                <div id="realLcp" class="text-2xl font-bold text-white mb-1">--</div>
                                <div class="text-xs text-slate-400">Tempo de Renderização</div>
                            </div>
                            <div class="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center print:break-inside-avoid print:block">
                                <div class="flex items-center justify-center mb-2">
                                    <i data-lucide="clock" class="w-5 h-5 text-orange-400 mr-2"></i>
                                    <span class="text-xs text-slate-500 font-bold uppercase">Tempo de Carregamento</span>
                                </div>
                                <div id="realLoadTime" class="text-2xl font-bold text-white mb-1">--</div>
                                <div class="text-xs text-slate-400">Total de tempo de carregamento</div>
                            </div>
                        </div>
                    </section>
                    <!-- Resumo Executivo -->
                    <section class="mt-12 print:break-inside-avoid">
                        <h3 class="text-lg font-bold text-slate-300 mb-4 print:break-inside-avoid">Resumo Executivo</h3>
                        <div class="bg-slate-800 border border-slate-700 rounded-lg p-6 print:break-inside-avoid">
                            <p class="text-slate-300 leading-relaxed" id="resSummary">Carregando resumo...</p>
                        </div>
                    </section>
                    <!-- Análise estratégica dos 4 Pilares -->
                    <section class="mt-8 print:break-inside-avoid">
                        <div class="flex items-center justify-between gap-4 mb-4">
                            <div>
                                <h3 class="text-lg font-bold text-slate-300 print:break-inside-avoid">Análise estratégica dos 4 Pilares</h3>
                                <p class="text-xs text-slate-500 mt-1">Leitura executiva das áreas que sustentam a qualidade do site.</p>
                            </div>
                        </div>
                        <div id="pillarsDashboard" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <!-- Pilares serão inseridos aqui -->
                        </div>
                    </section>
                </div>
                <!-- PÁGINA 2: Detalhamento de Vulnerabilidades -->
                <div class="print:break-before-page print:break-after-page bg-[#0F1117] text-white p-8 print:p-12 print:min-h-0 print:h-auto print:block print:overflow-visible" style="-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                    <header class="mb-8 print:break-inside-avoid">
                        <h2 class="text-2xl font-bold text-white print:break-inside-avoid">Vulnerabilidades e Riscos Encontrados</h2>
                        <p class="text-slate-400 mt-2 print:break-inside-avoid">Análise detalhada dos pontos críticos de segurança e performance</p>
                    </header>
                    <section class="vulnerabilities-table print:break-inside-avoid">
                        <table class="w-full text-left border-collapse border border-slate-700 print:table print:w-full print:border-collapse print:table-fixed print:break-inside-avoid">
                            <thead class="print:table-header-group">
                                <tr class="bg-slate-800 border-b border-slate-700 print:table-row print:break-inside-avoid">
                                    <th class="p-4 font-semibold text-white border-r border-slate-700 print:table-cell print:border print:border-slate-300 print:p-3 print:text-black print:break-inside-avoid">Nível de Risco</th>
                                    <th class="p-4 font-semibold text-white border-r border-slate-700 print:table-cell print:border print:border-slate-300 print:p-3 print:text-black print:break-inside-avoid">Problema</th>
                                    <th class="p-4 font-semibold text-white print:table-cell print:border print:border-slate-300 print:p-3 print:text-black print:break-inside-avoid">Descrição Técnica</th>
                                </tr>
                            </thead>
                            <tbody id="vulnerabilitiesTableBody" class="print:table-row-group">
                                <!-- Vulnerabilidades serão inseridas aqui -->
                            </tbody>
                        </table>
                    </section>
                </div>
                <!-- PÁGINA 3: Simulação Comportamental -->
                <div class="print:break-before-page print:break-after-page bg-[#0F1117] text-white p-8 print:p-12 print:min-h-0 print:h-auto print:block print:overflow-visible" style="-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                    <header class="mb-8 print:break-inside-avoid">
                        <h2 class="text-2xl font-bold text-white print:break-inside-avoid">Análise de Experiência do Usuário (Simulação por IA)</h2>
                        <p class="text-slate-400 mt-2 print:break-inside-avoid">Comportamento simulado baseado em diferentes agents de usuários</p>
                    </header>
                    <section class="agents-table print:break-inside-avoid">
                        <table class="w-full text-left border-collapse border border-slate-700 print:table print:w-full print:border-collapse print:table-fixed print:break-inside-avoid">
                            <thead class="print:table-header-group">
                                <tr class="bg-slate-800 border-b border-slate-700 print:table-row print:break-inside-avoid">
                                    <th class="p-4 font-semibold text-white border-r border-slate-700 w-1/4 print:table-cell print:border print:border-slate-300 print:p-3 print:text-black print:break-inside-avoid">Perfil Simulado (Agent)</th>
                                    <th class="p-4 font-semibold text-white border-r border-slate-700 w-1/6 print:table-cell print:border print:border-slate-300 print:p-3 print:text-black print:break-inside-avoid">Veredito/Sentimento</th>
                                    <th class="p-4 font-semibold text-white w-1/2 print:table-cell print:border print:border-slate-300 print:p-3 print:text-black print:break-inside-avoid">Feedback Detalhado</th>
                                </tr>
                            </thead>
                            <tbody id="agentsTableBody" class="print:table-row-group">
                                <!-- Agents serão inseridas aqui -->
                            </tbody>
                        </table>
                    </section>
                </div>
                <!-- PÁGINA 4: Plano de Ação -->
                <div class="print:break-before-page bg-[#0F1117] text-white p-8 print:p-12 print:min-h-0 print:h-auto print:block print:overflow-visible print:pb-0" style="-webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;">
                    <header class="mb-8 print:break-inside-avoid">
                        <h2 class="text-2xl font-bold text-white print:break-inside-avoid">Plano de Ação Recomendado</h2>
                        <p class="text-slate-400 mt-2 print:break-inside-avoid">Estratégias priorizadas para melhoria contínua</p>
                    </header>
                    <section class="action-plan print:break-inside-avoid">
                        <ol class="space-y-4 print:break-inside-avoid" id="actionPlanList">
                            <!-- Itens do plano de ação serão inseridos aqui -->
                        </ol>
                    </section>
                    <!-- Botões de Exportação (escondidos na impressão) -->
                    <div class="mt-12 flex gap-4 print:hidden">
                        <button onclick="gerarPDFOficial()" class="bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 print:hidden">
                            <i data-lucide="file-down" class="w-4 h-4"></i>
                            Exportar PDF
                        </button>
                        <button onclick="showSimplifiedSearch()" class="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 print:hidden">
                            <i data-lucide="repeat" class="w-4 h-4"></i>
                            Nova Análise
                        </button>
                    </div>
                </div>
            `;
        }

        function createAuditResultsStructureModern() {
            const resultsContainer = document.getElementById('auditResults');
            if (!resultsContainer) return;
            const displayDate = new Date().toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            });
            const blankPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

            resultsContainer.innerHTML = `
                <article class="audit-experience-shell">
                    <section class="audit-hero-panel audit-reveal is-visible">
                        <div class="audit-hero-copy">
                            <p class="audit-kicker">Análise estratégica concluída</p>
                            <h1>O que a captura revelou sobre este site.</h1>
                            <p id="resSummary" class="audit-hero-summary">Carregando resumo executivo...</p>
                            <div class="audit-hero-actions">
                                <button onclick="gerarPDFOficial()" class="audit-primary-action">
                                    <i data-lucide="file-down" class="w-4 h-4"></i>
                                    Baixar PDF
                                </button>
                                <button onclick="showSimplifiedSearch()" class="audit-secondary-action">
                                    Nova análise
                                </button>
                            </div>
                        </div>
                        <aside class="audit-score-board">
                            <span class="audit-score-label">Score geral</span>
                            <strong id="resScore">--</strong>
                            <span id="reportUrl" class="audit-score-url">URL analisada</span>
                            <span id="reportDate" class="audit-score-date">${displayDate}</span>
                        </aside>
                    </section>

                    <nav class="audit-progress-nav audit-reveal" aria-label="Mapa da auditoria">
                        <a href="#audit-capturas">Capturas</a>
                        <a href="#audit-metricas">Diagnóstico</a>
                        <a href="#audit-pilares">Pilares</a>
                        <a href="#audit-riscos">Riscos</a>
                        <a href="#audit-agents">Agents</a>
                        <a href="#audit-plano">Plano</a>
                    </nav>

                    <section id="audit-capturas" class="audit-story-section audit-reveal">
                        <div class="audit-section-heading">
                            <span>01</span>
                            <div>
                                <h2>A evidência visual da auditoria</h2>
                                <p>As imagens abaixo são a leitura real feita pelo Playwright. Elas ajudam a conectar a nota técnica com o que o usuário realmente encontra na tela.</p>
                            </div>
                        </div>
                        <div class="audit-screens-grid">
                            <figure class="audit-shot-frame audit-shot-desktop">
                                <div class="audit-shot-topbar">
                                    <span></span><span></span><span></span>
                                    <em>Desktop</em>
                                </div>
                                <div class="audit-shot-placeholder">A captura desktop aparece aqui quando a auditoria termina.</div>
                                <img id="printDesktop" class="audit-shot-img" src="${blankPixel}" alt="Captura desktop do site auditado">
                            </figure>
                            <figure class="audit-shot-frame audit-shot-mobile">
                                <div class="audit-phone-shell">
                                    <div class="audit-phone-notch"></div>
                                    <div class="audit-shot-placeholder">Mobile</div>
                                    <img id="printMobile" class="audit-shot-img" src="${blankPixel}" alt="Captura mobile do site auditado">
                                </div>
                            </figure>
                        </div>
                    </section>

                    <section id="audit-metricas" class="audit-story-section audit-reveal">
                        <div class="audit-section-heading">
                            <span>02</span>
                            <div>
                                <h2>Diagnóstico técnico, sem ruído</h2>
                                <p>Esta camada mostra se a experiência tem base técnica para carregar rápido, ser encontrada e funcionar bem em dispositivos reais.</p>
                            </div>
                        </div>
                        <div class="audit-metrics-grid">
                            <div class="audit-metric-card">
                                <span>Performance</span>
                                <strong id="realPerformanceScore">--</strong>
                                <p>Velocidade percebida e estabilidade durante o carregamento.</p>
                            </div>
                            <div class="audit-metric-card">
                                <span>SEO</span>
                                <strong id="realSeoScore">--</strong>
                                <p>Estrutura de descoberta, semântica e leitura por buscadores.</p>
                            </div>
                            <div class="audit-metric-card">
                                <span>Acessibilidade</span>
                                <strong id="realA11yScore">--</strong>
                                <p>Base para uso claro, legível e inclusivo.</p>
                            </div>
                            <div class="audit-metric-card audit-metric-wide">
                                <span>Primeira impressão visual</span>
                                <strong id="realLcp">--</strong>
                                <p>Tempo até o principal conteúdo aparecer para o usuário.</p>
                            </div>
                            <div class="audit-metric-card audit-metric-wide">
                                <span>Carregamento total</span>
                                <strong id="realLoadTime">--</strong>
                                <p>Quanto tempo a página leva para entregar uma experiência utilizável.</p>
                            </div>
                        </div>
                    </section>

                    <section id="audit-pilares" class="audit-story-section audit-reveal">
                        <div class="audit-section-heading">
                            <span>03</span>
                            <div>
                                <h2>Os 4 pilares do laudo</h2>
                                <p>Cada pilar traduz a auditoria em uma dimensão de decisão: onde há confiança, onde há fricção e onde há perda de conversão.</p>
                            </div>
                        </div>
                        <div id="pillarsDashboard" class="audit-pillars-grid"></div>
                    </section>

                    <section id="audit-riscos" class="audit-story-section audit-reveal">
                        <div class="audit-section-heading">
                            <span>04</span>
                            <div>
                                <h2>Riscos que merecem ação</h2>
                                <p>Em vez de uma tabela fria, cada item abaixo explica qual problema foi encontrado, qual pilar ele afeta e por que ele reduz a qualidade da experiência.</p>
                            </div>
                        </div>
                        <div id="vulnerabilitiesTableBody" class="audit-risk-list"></div>
                    </section>

                    <section id="audit-agents" class="audit-story-section audit-reveal">
                        <div class="audit-section-heading">
                            <span>05</span>
                            <div>
                                <h2>Como as agents interpretaram a jornada</h2>
                                <p>As personas não avaliam só a tela: elas ajudam a entender intenção, confiança, fricção e probabilidade de avanço no funil.</p>
                            </div>
                        </div>
                        <div id="agentsTableBody" class="audit-agent-grid"></div>
                    </section>

                    <section id="audit-plano" class="audit-story-section audit-reveal">
                        <div class="audit-section-heading">
                            <span>06</span>
                            <div>
                                <h2>Plano de ação recomendado</h2>
                                <p>Uma sequência prática para transformar o diagnóstico em melhoria real, começando pelo que tende a gerar mais impacto.</p>
                            </div>
                        </div>
                        <div id="actionPlanList" class="audit-action-timeline"></div>
                        <div class="audit-final-actions">
                            <button onclick="gerarPDFOficial()" class="audit-primary-action">
                                <i data-lucide="file-down" class="w-4 h-4"></i>
                                Baixar análise estratégica
                            </button>
                            <button onclick="showSimplifiedSearch()" class="audit-secondary-action">
                                Analisar outra URL
                            </button>
                        </div>
                    </section>
                </article>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            initAuditResultReveal();
        }

        function initAuditResultReveal() {
            const elements = document.querySelectorAll('#auditResults .audit-reveal');
            if (!elements.length) return;
            if (!('IntersectionObserver' in window)) {
                elements.forEach(el => el.classList.add('is-visible'));
                return;
            }
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.16, rootMargin: '0px 0px -80px 0px' });
            elements.forEach(el => observer.observe(el));
        }

        function getAuditScoreTone(score) {
            const value = Number(score);
            if (!Number.isFinite(value)) return 'neutral';
            if (value >= 80) return 'strong';
            if (value >= 50) return 'attention';
            return 'critical';
        }

        function getSeverityMeta(severity) {
            const raw = String(severity || '').toUpperCase();
            if (raw.includes('CRÍTICO') || raw.includes('CRITICO') || raw.includes('CRITICAL')) {
                return { label: severity || 'Crítico', tone: 'critical' };
            }
            if (raw.includes('ALTO') || raw.includes('HIGH')) {
                return { label: severity || 'Alto', tone: 'high' };
            }
            if (raw.includes('MÉDIO') || raw.includes('MEDIO') || raw.includes('MEDIUM')) {
                return { label: severity || 'Médio', tone: 'attention' };
            }
            if (raw.includes('SUCESSO') || raw.includes('OK')) {
                return { label: severity || 'Sucesso', tone: 'strong' };
            }
            return { label: severity || 'Atenção', tone: 'neutral' };
        }

        function humanizeActionPeriod(period) {
            const key = String(period || '').toLowerCase();
            if (key.includes('week')) return 'Primeira semana';
            if (key.includes('month')) return 'Primeiro mês';
            if (key.includes('day')) return 'Hoje';
            return key.replace(/_/g, ' ') || 'Próxima ação';
        }
        function showSimplifiedSearch() {
            // Primeiro, navega para home se não estiver lá
            if (!USER || !USER.email) {
                showAuthScreen();
                return;
            }
            // Atualiza a URL para /home
            if (window.location.pathname !== '/home') {
                window.history.pushState({}, '', '/home');
            }
            // Esconde TODAS as views primeiro
            const views = ['home', 'agents', 'domains', 'history', 'ranking', 'precos', 'about', 'terms', 'tutorial'];
            views.forEach(v => {
                const el = document.getElementById(`view-${v}`);
                if (el) {
                    el.classList.add('hidden');
                    el.style.opacity = '';
                    el.style.transform = '';
                    el.style.transition = '';
                }
            });
            // Mostra a view home
            const viewHome = document.getElementById('view-home');
            if (viewHome) {
                viewHome.classList.remove('hidden');
            }
            // Mostra o hero section (que contém a search bar)
            const heroSection = document.getElementById('heroSection');
            if (heroSection) heroSection.classList.remove('hidden');
            // Esconde elementos do hero section
            const titleContainer = document.querySelector('.hero-title-container');
            if (titleContainer) titleContainer.classList.add('hidden');
            const subtitleContainer = document.querySelector('.hero-subtitle-container');
            if (subtitleContainer) subtitleContainer.classList.add('hidden');
            const statsContainer = document.querySelector('.stats-container-premium');
            if (statsContainer) statsContainer.classList.add('hidden');
            const emptyStateCards = document.getElementById('emptyStateCards');
            if (emptyStateCards) emptyStateCards.classList.add('hidden');
            const manualSelectArea = document.getElementById('manualSelectArea');
            if (manualSelectArea) manualSelectArea.classList.add('hidden');
            const compareArea = document.getElementById('compareArea');
            if (compareArea) compareArea.classList.add('hidden');
            const auditResults = document.getElementById('auditResults');
            if (auditResults) auditResults.classList.add('hidden');
            adjustFooterPosition(false);
            const auditLoading = document.getElementById('auditLoading');
            if (auditLoading) auditLoading.classList.add('hidden');
            // Mostra o search container
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) searchContainer.classList.remove('hidden');
            // Reseta os campos
            const auditUrl = document.getElementById('auditUrl');
            if (auditUrl) auditUrl.value = '';
            const normalSearchBar = document.getElementById('normalSearchBar');
            const compareSearchBar = document.getElementById('compareSearchBar');
            if (normalSearchBar) normalSearchBar.classList.remove('hidden');
            if (compareSearchBar) compareSearchBar.classList.add('hidden');
            // Reseta para modo automático
            document.getElementById('auditMode').value = 'auto';
            document.querySelector('input[name="auditMode"][value="auto"]').checked = true;
            positionLocalAuditHelp('auto');
            setActiveNavButton('home');
            // Foca no input de URL
            if (auditUrl) {
                setTimeout(() => {
                    auditUrl.focus();
                }, 100);
            }
            // Scroll para o topo
            const mainContent = document.getElementById('mainContent');
            if (mainContent) {
                mainContent.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
        async function toggleManualSelect() {
            console.log("toggleManualSelect chamada");
            const mode = document.getElementById('auditMode').value;
            console.log("Modo selecionado:", mode);
            const manualArea = document.getElementById('manualSelectArea');
            const compareArea = document.getElementById('compareArea');
            const normalSearchBar = document.getElementById('normalSearchBar');
            const compareSearchBar = document.getElementById('compareSearchBar');
            const turnstileAudit = document.getElementById('turnstile-audit');
            const turnstileCompare = document.getElementById('turnstile-compare');
            const localAuditHelp = document.getElementById('localAuditHelp');
            // Elementos do hero que devem ser controlados
            const titleContainer = document.querySelector('.hero-title-container');
            const subtitleContainer = document.querySelector('.hero-subtitle-container');
            const statsContainer = document.querySelector('.stats-container-premium');
            const emptyStateCards = document.getElementById('emptyStateCards');
            console.log("Elementos encontrados:", { manualArea, compareArea, normalSearchBar, compareSearchBar });
            // Reset all areas
            if (manualArea) manualArea.classList.add('hidden');
            if (compareArea) compareArea.classList.add('hidden');
            if (normalSearchBar) normalSearchBar.classList.remove('hidden');
            if (compareSearchBar) compareSearchBar.classList.add('hidden');
            if (localAuditHelp) localAuditHelp.classList.remove('hidden');
            // Reset CAPTCHAs - mostra o do modo normal, esconde o do compare
            if (turnstileAudit) turnstileAudit.classList.remove('hidden');
            if (turnstileCompare) turnstileCompare.classList.add('hidden');
            positionLocalAuditHelp(mode);
            setModeOnlyCardsVisibility(mode);
            // Controle dos elementos do hero baseado no modo
            if (mode === 'auto') {
                // Mostra elementos no modo automático
                if (titleContainer) titleContainer.classList.remove('hidden');
                if (subtitleContainer) subtitleContainer.classList.remove('hidden');
                if (statsContainer) statsContainer.classList.remove('hidden');
                if (emptyStateCards) emptyStateCards.classList.remove('hidden');
            } else {
                // Esconde elementos nos modos manual e compare
                if (titleContainer) titleContainer.classList.add('hidden');
                if (subtitleContainer) subtitleContainer.classList.add('hidden');
                if (statsContainer) statsContainer.classList.add('hidden');
                if (emptyStateCards) emptyStateCards.classList.add('hidden');
            }
            if(mode === 'manual') {
                console.log("Entrando no modo manual");
                if (manualArea) manualArea.classList.remove('hidden');
                const cont = document.getElementById('checklistContainer');
                console.log("Container encontrado:", cont);
                if (cont) {
                    cont.innerHTML = "<span class='text-xs text-slate-500'>Carregando perfis...</span>";
                    try {
                        let custom = [];
                        custom = await fetchBackendPersonas();
                        manualPersonaCache = custom.map(normalizeManualPersona);
                        populateManualPersonaFilters(manualPersonaCache);
                        cont.innerHTML = "";
                        if (manualPersonaCache.length === 0) {
                            cont.innerHTML = '<div class="md:col-span-2 lg:col-span-3 text-center border border-dashed border-slate-700 rounded-xl p-7">'
                                + '<p class="text-sm font-semibold text-white">Nenhuma persona retornada pela API.</p>'
                                + '<p class="text-xs text-slate-500 mt-2">Verifique se o backend está expondo o catálogo oficial de personas.</p>'
                                + '<button onclick="toggleManualSelect()" class="mt-4 px-4 py-2 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-xs font-bold hover:bg-cyan-500/25 transition">Tentar novamente</button>'
                                + '</div>';
                            updateManualPersonaCount();
                            return;
                        }
                        renderManualPersonaList();
                    } catch (e) {
                        console.error(e);
                        cont.innerHTML = '<div class="text-center border border-red-500/20 bg-red-500/10 rounded-xl p-7">'
                            + '<p class="text-sm font-semibold text-red-200">Não consegui carregar suas personas.</p>'
                            + '<p class="text-xs text-red-100/80 mt-2">' + safeAuditText(e.message || 'Verifique seu login e a API.') + '</p>'
                            + '<button onclick="toggleManualSelect()" class="mt-4 px-4 py-2 rounded-lg bg-red-500/15 border border-red-400/30 text-red-100 text-xs font-bold hover:bg-red-500/25 transition">Tentar novamente</button>'
                            + '</div>';
                    }
                }
            } else if(mode === 'compare') {
                console.log("Entrando no modo comparativo");
                // Esconde a barra normal e mostra a barra comparativa
                if (normalSearchBar) normalSearchBar.classList.add('hidden');
                if (compareSearchBar) compareSearchBar.classList.remove('hidden');
                // Esconde CAPTCHA do modo normal e mostra o do modo compare
                if (turnstileAudit) turnstileAudit.classList.add('hidden');
                if (turnstileCompare) turnstileCompare.classList.remove('hidden');
                setTimeout(() => initTurnstileCompare(), 100);
                // Mantém a área de comparação escondida pois agora está integrada na barra
                if (compareArea) compareArea.classList.add('hidden');
            }
        }
        // === LOADING ANIMATION DINÂMICO ===
        var _auditLoadingInterval = null;
        var _auditProgressInterval = null;
        var _auditTipsInterval = null;

        function startAuditLoadingAnimation(url, mode) {
            var container = document.getElementById('auditLoading');
            if (!container) return;
            stopAuditLoadingAnimation();

            var isCompare = mode === 'compare' || mode === 'comparativo';
            var modeColor = isCompare ? '#818cf8' : mode === 'manual' ? '#67e8f9' : '#22d3ee';

            var steps = isCompare ? [
                'Acessando e verificando Site A...',
                'Acessando e verificando Site B...',
                'Comparando performance e velocidade...',
                'Auditando SEO dos dois sites...',
                'Analisando experiência do usuário...',
                'Gerando análise comparativa com IA...',
                'Calculando pontuações e vencedor...',
                'Compilando relatório de batalha...'
            ] : [
                'Acessando estrutura da página...',
                'Analisando performance e Core Web Vitals...',
                'Auditando SEO e metadados...',
                'Verificando acessibilidade (WCAG)...',
                'Analisando segurança e certificados...',
                'Construindo perfis de agents com IA...',
                'Gerando recomendações estratégicas...',
                'Compilando relatório final...'
            ];

            var tips = [
                'Sites com carregamento rápido convertem até 3× mais',
                '68% das buscas globais são feitas em dispositivos móveis',
                'Sites com HTTPS têm melhor posicionamento no Google',
                '1 segundo de atraso reduz conversões em até 7%',
                '53% dos usuários abandonam páginas que demoram mais de 3s',
                'Análise de agents aumenta eficácia de marketing em 73%',
                'Acessibilidade pode ampliar seu público em até 15%',
                'Páginas com Schema Markup têm 20% mais cliques nos resultados'
            ];

            var displayUrl = url.length > 45 ? url.substring(0, 42) + '...' : url;

            container.innerHTML = [
                '<div style="width:100%;max-width:480px;margin:0 auto;text-align:center;">',
                  '<h2 style="color:white;font-size:20px;font-weight:700;margin:0 0 6px;">Processando Auditoria</h2>',
                  '<div style="display:inline-flex;align-items:center;gap:7px;margin-bottom:28px;">',
                    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8292a8" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
                    '<span id="loadingUrlDisplay" style="color:#3d4f63;font-size:12px;font-family:monospace;">' + displayUrl + '</span>',
                  '</div>',
                  '<div style="margin-bottom:32px;">',
                    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">',
                      '<span style="color:#8292a8;font-size:11px;letter-spacing:0.05em;">PROGRESSO</span>',
                      '<span id="loadingPercent" style="color:' + modeColor + ';font-size:12px;font-weight:700;">0%</span>',
                    '</div>',
                    '<div style="height:4px;background:rgba(12,18,32,0.8);border-radius:4px;overflow:hidden;">',
                      '<div id="loadingProgressBar" style="height:100%;width:0%;background:linear-gradient(90deg,' + modeColor + ',' + modeColor + '80);border-radius:4px;transition:width 0.7s ease;box-shadow:0 0 10px ' + modeColor + '50;"></div>',
                    '</div>',
                  '</div>',
                  '<div style="min-height:56px;display:flex;align-items:center;justify-content:center;margin-bottom:32px;">',
                    '<div id="auditCurrentStep" style="display:flex;align-items:center;gap:12px;opacity:1;transition:opacity 0.3s ease;">',
                      '<div style="width:18px;height:18px;flex-shrink:0;border:2px solid rgba(71,85,105,0.25);border-top-color:' + modeColor + ';border-radius:50%;animation:auditSpin 0.8s linear infinite;"></div>',
                      '<span id="auditCurrentStepText" style="color:#e2e8f0;font-size:15px;font-weight:500;">' + steps[0] + '</span>',
                    '</div>',
                  '</div>',
                  '<div style="border-top:1px solid rgba(12,18,32,0.8);padding-top:16px;min-height:32px;">',
                    '<p id="loadingTip" style="color:#3d4f63;font-size:11px;line-height:1.6;transition:opacity 0.4s ease;">' + tips[0] + '</p>',
                  '</div>',
                '</div>'
            ].join('');

            var currentStep = 0;
            var progress = 2;
            var tipIdx = 0;
            var totalSteps = steps.length;
            var stepDuration = 2200;

            function showStep(idx) {
                var wrapper = document.getElementById('auditCurrentStep');
                var txt = document.getElementById('auditCurrentStepText');
                if (!wrapper || !txt) return;
                wrapper.style.opacity = '0';
                setTimeout(function() {
                    if (txt) txt.textContent = steps[idx] || steps[totalSteps - 1];
                    if (wrapper) wrapper.style.opacity = '1';
                }, 300);
            }

            _auditLoadingInterval = setInterval(function() {
                currentStep++;
                if (currentStep < totalSteps) {
                    showStep(currentStep);
                } else {
                    clearInterval(_auditLoadingInterval);
                }
            }, stepDuration);

            _auditProgressInterval = setInterval(function() {
                var target = Math.min(93, ((currentStep + 1) / totalSteps) * 95);
                if (progress < target) {
                    progress = Math.min(target, progress + 0.6);
                    var bar = document.getElementById('loadingProgressBar');
                    var pct = document.getElementById('loadingPercent');
                    if (bar) bar.style.width = progress + '%';
                    if (pct) pct.textContent = Math.floor(progress) + '%';
                }
            }, 180);

            _auditTipsInterval = setInterval(function() {
                tipIdx = (tipIdx + 1) % tips.length;
                var tipEl = document.getElementById('loadingTip');
                if (tipEl) {
                    tipEl.style.opacity = '0';
                    setTimeout(function() {
                        if (tipEl) { tipEl.textContent = tips[tipIdx]; tipEl.style.opacity = '1'; }
                    }, 400);
                }
            }, 4500);
        }

        function stopAuditLoadingAnimation() {
            if (_auditLoadingInterval) { clearInterval(_auditLoadingInterval); _auditLoadingInterval = null; }
            if (_auditProgressInterval) { clearInterval(_auditProgressInterval); _auditProgressInterval = null; }
            if (_auditTipsInterval) { clearInterval(_auditTipsInterval); _auditTipsInterval = null; }
        }
        // === FIM LOADING ANIMATION ===

        function safeAuditText(value) {
            const text = String(value ?? '');
            if (window.Sanitizer && typeof window.Sanitizer.sanitizeText === 'function') {
                return window.Sanitizer.sanitizeText(text);
            }
            return text.replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char]));
        }

        var manualPersonaCache = [];
        var manualNicheCache = {};

        function normalizeTaxonomyValue(value, fallback) {
            return String(value || fallback || '').trim().toLowerCase().replace(/\s+/g, '_');
        }

        function getPersonaNiche(persona) {
            return normalizeTaxonomyValue(persona?.niche || persona?.nicho || persona?.segment || persona?.segmento, 'geral');
        }

        function getPersonaType(persona) {
            return normalizeTaxonomyValue(persona?.type || persona?.tipo || persona?.category || persona?.categoria, 'perfil');
        }

        function normalizeManualPersona(persona) {
            const name = persona?.name || persona?.profile_name || persona?.agent || 'Persona';
            return {
                ...persona,
                id: String(persona?.id || name),
                name,
                description: persona?.description || persona?.profile_description || '',
                niche: getPersonaNiche(persona),
                type: getPersonaType(persona)
            };
        }

        function humanizeTaxonomy(value) {
            return String(value || 'geral').replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }

        function populateManualPersonaFilters(personas) {
            const nicheSelect = document.getElementById('manualPersonaNiche');
            const typeSelect = document.getElementById('manualPersonaType');
            if (!nicheSelect || !typeSelect) return;

            const currentNiche = nicheSelect.value || 'all';
            const currentType = typeSelect.value || 'all';
            const niches = [...new Set(personas.map(getPersonaNiche))].sort();
            const types = [...new Set(personas.map(getPersonaType))].sort();

            nicheSelect.innerHTML = '<option value="all">Todos os nichos</option>' + niches.map(n => `<option value="${safeAuditText(n)}">${safeAuditText(humanizeTaxonomy(n))}</option>`).join('');
            typeSelect.innerHTML = '<option value="all">Todos os tipos</option>' + types.map(t => `<option value="${safeAuditText(t)}">${safeAuditText(humanizeTaxonomy(t))}</option>`).join('');
            nicheSelect.value = niches.includes(currentNiche) ? currentNiche : 'all';
            typeSelect.value = types.includes(currentType) ? currentType : 'all';
        }

        function updateManualPersonaCount() {
            const selected = document.querySelector('.agent-radio:checked');
            const badge = document.getElementById('agentSelCount');
            if (!badge) return;
            badge.textContent = selected ? '1 / 1' : '0 / 1';
            badge.style.color = selected ? '#e2e8f0' : '';
            badge.style.borderColor = selected ? 'rgba(6,182,212,0.4)' : '';
        }

        function setManualPersonaSelected(input) {
            document.querySelectorAll('.manual-persona-row').forEach(row => {
                row.style.borderColor = 'rgba(255,255,255,0.1)';
                row.style.background = 'rgba(8,13,22,0.72)';
                row.style.boxShadow = 'none';
            });
            const row = input?.closest('.manual-persona-row');
            if (row) {
                row.style.borderColor = 'rgba(34,211,238,0.55)';
                row.style.background = 'rgba(34,211,238,0.08)';
                row.style.boxShadow = '0 0 0 1px rgba(34,211,238,0.18), 0 18px 50px rgba(0,0,0,0.22)';
            }
            updateManualPersonaCount();
            validateManualPersonaNiche(input?.value);
        }

        function renderManualPersonaList() {
            const cont = document.getElementById('checklistContainer');
            if (!cont) return;
            const search = (document.getElementById('manualPersonaSearch')?.value || '').toLowerCase().trim();
            const niche = document.getElementById('manualPersonaNiche')?.value || 'all';
            const type = document.getElementById('manualPersonaType')?.value || 'all';
            const selectedValue = document.querySelector('.agent-radio:checked')?.value || '';

            const filtered = manualPersonaCache.filter(p => {
                const haystack = `${p.name} ${p.description} ${p.niche} ${p.type}`.toLowerCase();
                return (!search || haystack.includes(search)) &&
                    (niche === 'all' || p.niche === niche) &&
                    (type === 'all' || p.type === type);
            });

            if (filtered.length === 0) {
                cont.innerHTML = '<div class="text-center border border-dashed border-slate-700 rounded-xl p-7">'
                    + '<p class="text-sm font-semibold text-white">Nenhuma persona encontrada.</p>'
                    + '<p class="text-xs text-slate-500 mt-2">Ajuste a busca ou os filtros para encontrar uma persona do backend.</p>'
                    + '</div>';
                updateManualPersonaCount();
                return;
            }

            cont.innerHTML = filtered.map(p => {
                const checked = selectedValue === p.id ? 'checked' : '';
                return `
                    <label class="manual-persona-row block rounded-xl border border-white/10 bg-slate-950/70 p-4 cursor-pointer transition-all hover:border-cyan-400/35 hover:bg-cyan-400/[0.06]">
                        <div class="flex items-start gap-4">
                            <input type="radio" name="manualPersona" class="agent-radio mt-1 accent-cyan-400" value="${safeAuditText(p.id)}" ${checked} onchange="setManualPersonaSelected(this)">
                            <div class="min-w-0 flex-1">
                                <div class="flex flex-wrap items-center gap-2">
                                    <h4 class="text-sm font-bold text-white">${safeAuditText(p.name)}</h4>
                                    <span class="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-cyan-200">${safeAuditText(humanizeTaxonomy(p.niche))}</span>
                                    <span class="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-300">${safeAuditText(humanizeTaxonomy(p.type))}</span>
                                </div>
                                <p class="mt-2 text-xs leading-relaxed text-slate-400">${safeAuditText(p.description || 'Sem descrição comportamental.')}</p>
                            </div>
                        </div>
                    </label>
                `;
            }).join('');
            const selected = Array.from(document.querySelectorAll('.agent-radio')).find(el => el.value === selectedValue);
            if (selected) setManualPersonaSelected(selected);
            updateManualPersonaCount();
        }

        async function validateManualPersonaNiche(personaId) {
            const warning = document.getElementById('manualPersonaWarning');
            if (!warning) return;
            warning.classList.add('hidden');
            warning.textContent = '';

            const persona = manualPersonaCache.find(p => p.id === personaId);
            const url = sanitizeUrlInputValue(document.getElementById('auditUrl'));
            if (!persona || !url || persona.niche === 'geral') return;

            try {
                const cacheKey = url.toLowerCase();
                let detected = manualNicheCache[cacheKey];
                if (!detected) {
                    const res = await fetch(`${API_URL}/api/detectar-nicho`, {
                        method: 'POST',
                        headers: authHeaders({ 'Content-Type': 'application/json' }),
                        body: JSON.stringify({ url })
                    });
                    if (!res.ok) return;
                    const data = await res.json();
                    detected = data.niche || 'geral';
                    manualNicheCache[cacheKey] = detected;
                }

                const personaNiche = persona.niche;
                const compatible = detected === 'geral' || personaNiche === detected || personaNiche.includes(detected) || detected.includes(personaNiche);
                if (!compatible) {
                    warning.textContent = `Atenção: esta URL parece ser do nicho "${humanizeTaxonomy(detected)}", mas a persona selecionada é do nicho "${humanizeTaxonomy(personaNiche)}". Ela pode gerar uma análise menos precisa.`;
                    warning.classList.remove('hidden');
                    Toast.warning("A persona selecionada pode não ser adequada para o nicho da URL.");
                }
            } catch (e) {
                console.warn('Não foi possível validar nicho da persona:', e);
            }
        }

        function getPillarScoreColor(score) {
            const value = Number(score);
            if (!Number.isFinite(value)) return 'text-slate-300';
            if (value > 80) return 'text-green-400';
            if (value >= 50) return 'text-yellow-400';
            return 'text-red-400';
        }

        function getPillarMeta(key) {
            const map = {
                accessibility_performance: { title: 'Performance', icon: 'zap' },
                security: { title: 'Segurança', icon: 'shield' },
                functional_integrity: { title: 'Funcionalidade', icon: 'link' },
                conversion_ux: { title: 'Conversão', icon: 'trending-up' }
            };
            return map[key] || { title: key, icon: 'activity' };
        }

        function normalizePillarsEvaluation(technicalAudit = {}) {
            const pillars = technicalAudit.pillars_evaluation || {};
            const metrics = technicalAudit.real_metrics || {};
            const generalScore = Number(technicalAudit.score) || 0;
            const perfFallback = Math.round(((Number(metrics.performance_score) || generalScore || 70) + (Number(metrics.accessibility_score) || generalScore || 70)) / 2);
            const defaults = {
                accessibility_performance: {
                    score: perfFallback,
                    brief: 'Leitura combinada de velocidade, estabilidade visual e acessibilidade.'
                },
                security: {
                    score: generalScore || 70,
                    brief: 'Avalia sinais de confiança, proteção e redução de risco percebido.'
                },
                functional_integrity: {
                    score: generalScore || 70,
                    brief: 'Verifica integridade de links, botões e fluxos críticos de navegação.'
                },
                conversion_ux: {
                    score: generalScore || 70,
                    brief: 'Mede clareza, persuasão visual e facilidade para avançar no funil.'
                }
            };
            return Object.keys(defaults).reduce((acc, key) => {
                acc[key] = {
                    score: pillars[key]?.score ?? defaults[key].score,
                    brief: pillars[key]?.brief || defaults[key].brief
                };
                return acc;
            }, {});
        }

        function renderPillarsDashboard(technicalAudit = {}) {
            const container = document.getElementById('pillarsDashboard');
            if (!container) return;
            const pillars = normalizePillarsEvaluation(technicalAudit);
            container.innerHTML = Object.entries(pillars).map(([key, value], index) => {
                const meta = getPillarMeta(key);
                const score = Number(value.score);
                const scoreLabel = Number.isFinite(score) ? Math.round(score) : '--';
                const tone = getAuditScoreTone(score);
                return `
                    <article class="audit-pillar-card audit-pillar-${tone}">
                        <div class="audit-pillar-index">${String(index + 1).padStart(2, '0')}</div>
                        <div class="audit-pillar-body">
                            <div class="audit-pillar-top">
                                <h3>${safeAuditText(meta.title)}</h3>
                                <strong class="${getPillarScoreColor(score)}">${scoreLabel}</strong>
                            </div>
                            <p>${safeAuditText(value.brief)}</p>
                        </div>
                    </article>
                `;
            }).join('');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        function getVulnerabilityPillarLabel(pillar) {
            if (!pillar) return '';
            const raw = String(pillar).toLowerCase();
            if (raw.includes('performance') || raw.includes('acess')) return 'Performance';
            if (raw.includes('segur') || raw.includes('security')) return 'Segurança';
            if (raw.includes('func') || raw.includes('link') || raw.includes('bot')) return 'Funcional';
            if (raw.includes('convers') || raw.includes('ux')) return 'Conversão';
            return String(pillar);
        }

        function abrirTutorialNgrok() {
            nav('tutorial');
            setTimeout(() => {
                if (typeof showTutorialSection === 'function') {
                    showTutorialSection('ngrok-localhost');
                }
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 60);
        }

        function abrirTutorialDominioAutorizado() {
            nav('tutorial');
            setTimeout(() => {
                if (typeof showTutorialSection === 'function') {
                    showTutorialSection('dominios-autorizados');
                }
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }, 60);
        }

        window.abrirTutorialDominioAutorizado = abrirTutorialDominioAutorizado;

        function positionLocalAuditHelp(mode = 'auto') {
            const help = document.getElementById('localAuditHelp');
            const normalSearchBar = document.getElementById('normalSearchBar');
            const compareSearchBar = document.getElementById('compareSearchBar');
            if (!help) return;

            const anchor = mode === 'compare' ? compareSearchBar : normalSearchBar;
            if (anchor && anchor.parentNode) {
                anchor.insertAdjacentElement('afterend', help);
            }
            help.classList.remove('hidden');
        }

        function setModeOnlyCardsVisibility(mode = 'auto') {
            const showCards = mode === 'auto';
            const statsContainer = document.querySelector('.stats-container-premium');
            const emptyStateCards = document.getElementById('emptyStateCards');
            if (statsContainer) statsContainer.classList.toggle('hidden', !showCards);
            if (emptyStateCards) emptyStateCards.classList.toggle('hidden', !showCards);
        }

        function setAuditPillarsVisibility(show) {
            const section = document.getElementById('audit-pilares');
            const navLink = document.querySelector('.audit-progress-nav a[href="#audit-pilares"]');
            if (section) section.classList.toggle('hidden', !show);
            if (navLink) navLink.classList.toggle('hidden', !show);
        }

        function openSupportForm() {
            const modal = document.getElementById('supportFormModal');
            if (!modal) return;
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('support-modal-open');

            const nameInput = document.getElementById('supportName');
            const emailInput = document.getElementById('supportEmail');
            if (nameInput && USER?.name && !nameInput.value) nameInput.value = USER.name;
            if (emailInput && USER?.email && !emailInput.value) emailInput.value = USER.email;
            setTimeout(() => document.getElementById('supportSubject')?.focus(), 80);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        function closeSupportForm() {
            const modal = document.getElementById('supportFormModal');
            if (!modal) return;
            modal.classList.add('hidden');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('support-modal-open');
        }

        function setSupportSubmitLoading(isLoading) {
            const button = document.getElementById('supportSubmitBtn');
            if (!button) return;
            button.disabled = isLoading;
            button.textContent = isLoading ? 'Enviando...' : 'Enviar para suporte';
            button.classList.toggle('opacity-70', isLoading);
            button.classList.toggle('cursor-not-allowed', isLoading);
        }

        async function submitSupportQuestion(event) {
            event.preventDefault();
            const nome = document.getElementById('supportName')?.value.trim() || '';
            const email = document.getElementById('supportEmail')?.value.trim() || '';
            const assunto = document.getElementById('supportSubject')?.value.trim() || '';
            const mensagem = document.getElementById('supportMessage')?.value.trim() || '';

            if (!email || !assunto || !mensagem) {
                Toast.warning('Preencha e-mail, assunto e mensagem.');
                return;
            }
            if (mensagem.length < 10) {
                Toast.warning('Descreva sua dúvida com pelo menos 10 caracteres.');
                return;
            }

            try {
                setSupportSubmitLoading(true);
                const res = await fetch(`${API_URL}/api/suporte/duvida`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nome,
                        email,
                        assunto,
                        mensagem,
                        pagina: window.location.href
                    })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.detail || 'Não foi possível enviar sua dúvida agora.');

                Toast.success('Dúvida enviada para o suporte.');
                document.getElementById('supportSubject').value = '';
                document.getElementById('supportMessage').value = '';
                closeSupportForm();
            } catch (error) {
                console.error('Erro ao enviar dúvida ao suporte:', error);
                Toast.error(error.message || 'Não foi possível enviar sua dúvida agora.');
            } finally {
                setSupportSubmitLoading(false);
            }
        }

        window.openSupportForm = openSupportForm;
        window.closeSupportForm = closeSupportForm;
        window.submitSupportQuestion = submitSupportQuestion;

        let authorizedDomainsCache = [];

        function getAuthorizedDomainApiError(data, fallback) {
            const detail = data?.detail;
            if (typeof detail === 'string') return detail;
            if (detail && typeof detail === 'object') return detail.message || fallback;
            return fallback;
        }

        async function copyAuthorizedDomainValue(value) {
            const text = decodeURIComponent(String(value || ''));
            try {
                await navigator.clipboard.writeText(text);
                Toast.success('Copiado para a área de transferência.');
            } catch (_) {
                Toast.info(text, 10000);
            }
        }

        function renderAuthorizedDomainSetup(item) {
            const token = item.verification_token || '';
            const auditToken = item.audit_token || '';
            const domain = item.domain || '';
            const dnsName = item.dns_record_name || `_ssw-verify.${domain}`;
            const fileUrl = `https://${domain}/.well-known/ssw-verification.txt`;
            const metaTag = `<meta name="ssw-verification" content="${token}">`;
            const wafRule = `${item.header_name || 'X-SSW-Audit-Token'} = ${auditToken}`;
            const inline = value => encodeURIComponent(String(value || ''));

            return [
                '<div class="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-5">',
                    '<div class="rounded-xl border border-white/10 bg-black/20 p-4">',
                        '<p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Verificação por DNS TXT</p>',
                        `<p class="mt-2 text-xs text-slate-400">Nome: <code class="text-cyan-200">${safeAuditText(dnsName)}</code></p>`,
                        `<p class="mt-1 text-xs text-slate-400">Valor: <code class="break-all text-cyan-200">${safeAuditText(token)}</code></p>`,
                        `<button class="mt-3 text-xs font-bold text-cyan-200 hover:text-white" onclick="copyAuthorizedDomainValue('${inline(`Nome: ${dnsName}\nValor: ${token}`)}')">Copiar DNS</button>`,
                    '</div>',
                    '<div class="rounded-xl border border-white/10 bg-black/20 p-4">',
                        '<p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Verificação por arquivo</p>',
                        `<p class="mt-2 text-xs text-slate-400">URL: <code class="break-all text-cyan-200">${safeAuditText(fileUrl)}</code></p>`,
                        `<p class="mt-1 text-xs text-slate-400">Conteúdo: <code class="break-all text-cyan-200">${safeAuditText(token)}</code></p>`,
                        `<button class="mt-3 text-xs font-bold text-cyan-200 hover:text-white" onclick="copyAuthorizedDomainValue('${inline(token)}')">Copiar token</button>`,
                    '</div>',
                    '<div class="rounded-xl border border-white/10 bg-black/20 p-4">',
                        '<p class="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Verificação por meta tag</p>',
                        `<code class="mt-2 block break-all text-xs text-cyan-200">${safeAuditText(metaTag)}</code>`,
                        `<button class="mt-3 text-xs font-bold text-cyan-200 hover:text-white" onclick="copyAuthorizedDomainValue('${inline(metaTag)}')">Copiar meta tag</button>`,
                    '</div>',
                    '<div class="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">',
                        '<p class="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">Regra no firewall/WAF</p>',
                        `<p class="mt-2 text-xs text-slate-300">Permitir quando o header secreto for:</p>`,
                        `<code class="mt-2 block break-all text-xs text-emerald-100">${safeAuditText(wafRule)}</code>`,
                        `<p class="mt-2 text-xs text-slate-400">E quando o User-Agent contiver <code>${safeAuditText(item.user_agent || 'SSW-Intelligence-Auditor/1.0')}</code>.</p>`,
                        `<button class="mt-3 text-xs font-bold text-emerald-200 hover:text-white" onclick="copyAuthorizedDomainValue('${inline(`${wafRule}\nUser-Agent contém: ${item.user_agent || 'SSW-Intelligence-Auditor/1.0'}`)}')">Copiar regra</button>`,
                    '</div>',
                '</div>'
            ].join('');
        }

        function renderAuthorizedDomains(items = []) {
            const list = document.getElementById('authorizedDomainsList');
            if (!list) return;

            if (!items.length) {
                list.innerHTML = [
                    '<div class="history-empty-state">',
                        '<i data-lucide="shield-check" class="w-6 h-6"></i>',
                        '<strong>Nenhum domínio autorizado ainda</strong>',
                        '<p>Adicione um domínio somente quando a auditoria normal for bloqueada por anti-bot, WAF ou Cloudflare. A plataforma vai gerar o token de verificação e o header secreto para a liberação técnica.</p>',
                    '</div>'
                ].join('');
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }

            list.innerHTML = items.map(item => {
                const statusClass = item.verified ? 'border-emerald-400/25 bg-emerald-400/[0.04]' : 'border-amber-400/25 bg-amber-400/[0.04]';
                const statusLabel = item.verified ? 'Verificado' : 'Pendente';
                const statusText = item.verified
                    ? `Validado por ${safeAuditText(item.verification_method || 'token')}. O header autorizado será usado apenas se a auditoria normal for bloqueada.`
                    : 'Publique o token por DNS, arquivo ou meta tag e clique em verificar.';
                const idArg = encodeURIComponent(String(item.id || ''));

                return [
                    `<article class="rounded-2xl border ${statusClass} p-5 md:p-6">`,
                        '<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">',
                            '<div>',
                                `<span class="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${item.verified ? 'text-emerald-200' : 'text-amber-200'}"><i data-lucide="${item.verified ? 'badge-check' : 'clock'}" class="w-3.5 h-3.5"></i>${statusLabel}</span>`,
                                `<h3 class="mt-3 text-2xl font-black text-white">${safeAuditText(item.domain)}</h3>`,
                                `<p class="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">${statusText}</p>`,
                            '</div>',
                            '<div class="flex flex-wrap gap-2">',
                                `<button class="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-400/20" onclick="verifyAuthorizedDomain(decodeURIComponent('${idArg}'))">Verificar</button>`,
                                `<button class="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/[0.08]" onclick="rotateAuthorizedDomainToken(decodeURIComponent('${idArg}'))">Rotacionar token</button>`,
                                `<button class="rounded-lg border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-bold text-red-100 hover:bg-red-400/20" onclick="deleteAuthorizedDomain(decodeURIComponent('${idArg}'))">Excluir</button>`,
                            '</div>',
                        '</div>',
                        renderAuthorizedDomainSetup(item),
                    '</article>'
                ].join('');
            }).join('');

            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        async function loadAuthorizedDomains(showToast = false) {
            const list = document.getElementById('authorizedDomainsList');
            if (!list) return;

            if (!USER || !USER.token) {
                list.innerHTML = `<div class="history-empty-state"><strong>Login necessário</strong><p>Entre na sua conta para gerenciar domínios autorizados.</p><button onclick="showAuthScreen('login')">Fazer login</button></div>`;
                return;
            }

            list.innerHTML = '<div class="history-empty-state"><span class="history-loading-dot"></span>Carregando domínios...</div>';
            try {
                const res = await fetch(`${API_URL}/api/authorized-domains`, { headers: authHeaders() });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(getAuthorizedDomainApiError(data, 'Não foi possível carregar os domínios.'));
                authorizedDomainsCache = data.items || [];
                renderAuthorizedDomains(authorizedDomainsCache);
                if (showToast) Toast.success('Domínios atualizados.');
            } catch (error) {
                console.error('Erro ao carregar domínios autorizados:', error);
                list.innerHTML = `<div class="history-empty-state history-empty-error"><strong>Domínios indisponíveis</strong><p>${safeAuditText(error.message || 'Tente novamente em instantes.')}</p><button onclick="loadAuthorizedDomains(true)">Tentar novamente</button></div>`;
            }
        }

        async function createAuthorizedDomain() {
            if (!USER || !USER.token) {
                showAuthScreen('login');
                return;
            }
            const input = document.getElementById('authorizedDomainInput');
            const domain = String(input?.value || '').trim();
            if (!domain) {
                Toast.warning('Informe um domínio para autorizar.');
                return;
            }

            try {
                const res = await fetch(`${API_URL}/api/authorized-domains`, {
                    method: 'POST',
                    headers: authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ domain })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(getAuthorizedDomainApiError(data, 'Não foi possível adicionar este domínio.'));
                if (input) input.value = '';
                Toast.success('Domínio adicionado. Publique o token e clique em verificar.');
                await loadAuthorizedDomains(false);
            } catch (error) {
                Toast.error(error.message || 'Erro ao adicionar domínio.');
            }
        }

        async function verifyAuthorizedDomain(domainId) {
            try {
                Toast.info('Verificando DNS, arquivo e meta tag...', 10000);
                const res = await fetch(`${API_URL}/api/authorized-domains/${encodeURIComponent(domainId)}/verify`, {
                    method: 'POST',
                    headers: authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ method: 'all' })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(getAuthorizedDomainApiError(data, 'Token ainda não encontrado no domínio.'));
                Toast.success('Domínio verificado. O fallback autorizado está ativo para bloqueios anti-bot.');
                await loadAuthorizedDomains(false);
            } catch (error) {
                Toast.warning(error.message || 'Não encontramos o token neste domínio.', 10000);
            }
        }

        async function rotateAuthorizedDomainToken(domainId) {
            if (!confirm('Rotacionar o token de auditoria? Você precisará atualizar a regra no firewall/WAF.')) return;
            try {
                const res = await fetch(`${API_URL}/api/authorized-domains/${encodeURIComponent(domainId)}/rotate-token`, {
                    method: 'POST',
                    headers: authHeaders()
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(getAuthorizedDomainApiError(data, 'Não foi possível rotacionar o token.'));
                Toast.success('Token rotacionado. Atualize a regra no firewall.');
                await loadAuthorizedDomains(false);
            } catch (error) {
                Toast.error(error.message || 'Erro ao rotacionar token.');
            }
        }

        async function deleteAuthorizedDomain(domainId) {
            if (!confirm('Excluir este domínio autorizado? A SSW deixará de usar o header secreto como fallback para ele.')) return;
            try {
                const res = await fetch(`${API_URL}/api/authorized-domains/${encodeURIComponent(domainId)}`, {
                    method: 'DELETE',
                    headers: authHeaders()
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(getAuthorizedDomainApiError(data, 'Não foi possível excluir este domínio.'));
                Toast.success(data.msg || 'Domínio autorizado removido.');
                await loadAuthorizedDomains(false);
            } catch (error) {
                Toast.error(error.message || 'Erro ao excluir domínio.');
            }
        }

        window.loadAuthorizedDomains = loadAuthorizedDomains;
        window.createAuthorizedDomain = createAuthorizedDomain;
        window.verifyAuthorizedDomain = verifyAuthorizedDomain;
        window.rotateAuthorizedDomainToken = rotateAuthorizedDomainToken;
        window.deleteAuthorizedDomain = deleteAuthorizedDomain;
        window.copyAuthorizedDomainValue = copyAuthorizedDomainValue;

        let auditHistoryFilter = 'all';

        function getAuditHistoryTypeMeta(type) {
            const normalized = String(type || 'auto').toLowerCase();
            const map = {
                auto: { label: 'Automatica', icon: 'sparkles', tone: 'auto' },
                manual: { label: 'Manual', icon: 'user-check', tone: 'manual' },
                compare: { label: 'Comparativa', icon: 'git-compare', tone: 'compare' }
            };
            return map[normalized] || { label: 'Análise', icon: 'file-search', tone: 'auto' };
        }

        function formatHistoryDate(value) {
            if (!value) return 'Data indisponível';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return 'Data indisponível';
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function getHistoryScoreTone(score) {
            const value = Number(score);
            if (!Number.isFinite(value)) return 'muted';
            if (value >= 80) return 'strong';
            if (value >= 50) return 'attention';
            return 'critical';
        }

        function toHistoryInlineArg(value) {
            return encodeURIComponent(String(value ?? ''));
        }

        function setAuditHistoryFilter(type = 'all') {
            auditHistoryFilter = type;
            document.querySelectorAll('[data-history-filter]').forEach(button => {
                button.classList.toggle('active', button.dataset.historyFilter === type);
            });
            loadAuditHistory(true);
        }

        async function loadAuditHistory(showToast = false) {
            const list = document.getElementById('auditHistoryList');
            const detail = document.getElementById('auditHistoryDetail');
            if (!list) return;

            if (!USER || !USER.token) {
                list.innerHTML = '<div class="history-empty-state"><strong>Login necessário</strong><p>Entre na sua conta para visualizar o histórico privado das suas análises.</p><button onclick="showAuthScreen(\'login\')">Fazer login</button></div>';
                if (detail) detail.classList.add('hidden');
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }

            list.innerHTML = '<div class="history-empty-state"><span class="history-loading-dot"></span>Carregando histórico...</div>';
            if (detail) detail.classList.add('hidden');

            try {
                const params = new URLSearchParams({ tipo: auditHistoryFilter, limit: '60' });
                const res = await fetch(`${API_URL}/api/audits/history?${params.toString()}`, {
                    headers: authHeaders()
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.detail || 'Não foi possível carregar o histórico.');
                renderAuditHistoryList(data.items || [], data);
                if (showToast) Toast.success('Histórico atualizado.');
            } catch (error) {
                console.error('Erro ao carregar historico:', error);
                list.innerHTML = `<div class="history-empty-state history-empty-error"><strong>Histórico indisponível</strong><p>${safeAuditText(error.message || 'Tente novamente em instantes.')}</p><button onclick="loadAuditHistory(true)">Tentar novamente</button></div>`;
            } finally {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }

        function renderAuditHistoryList(items, meta = {}) {
            const list = document.getElementById('auditHistoryList');
            if (!list) return;
            const note = document.querySelector('.history-toolbar-note span');
            if (note) {
                const plan = getUserPlanLabel(meta.plan || getUserPlan());
                const limit = meta.limit || getFrontendPlanLimits(meta.plan).historyLimit;
                const retention = meta.retention_days || getFrontendPlanLimits(meta.plan).historyRetentionDays;
                note.textContent = `${plan}: até ${limit} análises salvas por ${retention} dias.`;
            }

            if (!items.length) {
                list.innerHTML = [
                    '<div class="history-empty-state">',
                        '<i data-lucide="archive" class="w-6 h-6"></i>',
                        '<strong>Nenhuma análise salva ainda</strong>',
                        '<p>Assim que uma auditoria for concluída com sucesso, ela aparecerá aqui automaticamente.</p>',
                        '<button onclick="nav(\'home\')">Iniciar uma análise</button>',
                    '</div>'
                ].join('');
                return;
            }

            list.innerHTML = items.map(item => {
                const meta = getAuditHistoryTypeMeta(item.audit_type);
                const score = Number(item.score);
                const scoreLabel = Number.isFinite(score) ? Math.round(score) : '--';
                const scoreTone = getHistoryScoreTone(score);
                const urlLine = item.audit_type === 'compare'
                    ? `${item.url_a || 'Site A'} vs ${item.url_b || 'Site B'}`
                    : (item.url || 'URL não informada');

                return [
                    `<article class="history-card history-card-${meta.tone}">`,
                        '<div class="history-card-top">',
                            `<span class="history-type-badge"><i data-lucide="${meta.icon}" class="w-4 h-4"></i>${safeAuditText(meta.label)}</span>`,
                            `<time>${safeAuditText(formatHistoryDate(item.created_at))}</time>`,
                        '</div>',
                        '<div class="history-card-body">',
                            '<div class="history-card-main">',
                                `<h3>${safeAuditText(item.title || 'Análise SSW')}</h3>`,
                                `<p class="history-card-url">${safeAuditText(urlLine)}</p>`,
                                `<p class="history-card-summary">${safeAuditText(item.summary || 'Resumo executivo não informado.')}</p>`,
                            '</div>',
                            `<div class="history-score history-score-${scoreTone}"><strong>${scoreLabel}</strong><span>score</span></div>`,
                        '</div>',
                        '<div class="history-card-actions">',
                            `<button onclick="openAuditHistoryItem(decodeURIComponent('${toHistoryInlineArg(item.id)}'))">Ver detalhes</button>`,
                            item.url && item.audit_type !== 'compare' ? `<button onclick="rerunAuditFromHistory(decodeURIComponent('${toHistoryInlineArg(item.url)}'), decodeURIComponent('${toHistoryInlineArg(item.audit_type || 'auto')}'))">Analisar novamente</button>` : '',
                            `<button class="history-delete-btn" onclick="deleteAuditHistoryItem(decodeURIComponent('${toHistoryInlineArg(item.id)}'))">Excluir</button>`,
                        '</div>',
                    '</article>'
                ].join('');
            }).join('');
        }

        async function deleteAuditHistoryItem(historyId) {
            const runDelete = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/audits/history/${encodeURIComponent(historyId)}`, {
                        method: 'DELETE',
                        headers: authHeaders()
                    });
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(data.detail || 'Não foi possível excluir esta análise.');
                    const detail = document.getElementById('auditHistoryDetail');
                    if (detail) detail.classList.add('hidden');
                    await loadAuditHistory(false);
                    Toast.success(data.msg || 'Análise removida do histórico.');
                } catch (error) {
                    console.error('Erro ao excluir historico:', error);
                    Toast.error(error.message || 'Erro ao excluir análise.');
                }
            };

            if (typeof showConfirmDialog === 'function') {
                showConfirmDialog('Deseja excluir esta análise do histórico? Esta ação não pode ser desfeita.', runDelete);
            } else if (confirm('Deseja excluir esta análise do histórico?')) {
                await runDelete();
            }
        }

        function normalizeHistoryArray(value) {
            if (!value) return [];
            if (Array.isArray(value)) return value;
            if (typeof value === 'object') {
                return Object.keys(value).flatMap(key => Array.isArray(value[key]) ? value[key].map((item, index) => ({ period: key, index, step: item })) : []);
            }
            return [];
        }

        function getHistoryActionText(action) {
            if (typeof action === 'string') return action;
            if (!action || typeof action !== 'object') return String(action || '');
            return action.step || action.action || action.title || action.description || action.text || '';
        }

        function getHistoryActionKey(action, index) {
            const period = action?.period || 'item';
            const actionIndex = Number.isFinite(Number(action?.index)) ? Number(action.index) : index;
            return `${period}:${actionIndex}`;
        }

        function getHistoryVerificationMap(verification) {
            const map = new Map();
            (verification?.items || []).forEach(item => {
                if (item?.key) map.set(String(item.key), item);
            });
            return map;
        }

        function renderHistoryVulnerabilitiesDetailed(vulnerabilities) {
            const items = normalizeHistoryArray(vulnerabilities);
            if (!items.length) {
                return '<section class="history-detail-block history-vulnerability-detail"><h4>Vulnerabilidades identificadas</h4><ul><li class="history-detail-muted"><p>Nenhuma vulnerabilidade foi retornada para esta análise.</p></li></ul></section>';
            }

            const content = items.map((value, index) => {
                const vuln = (value && typeof value === 'object') ? value : { description: value };
                const title = vuln.title || vuln.name || `Vulnerabilidade ${index + 1}`;
                const severity = vuln.severity || vuln.risk || vuln.level || 'NÃO INFORMADO';
                const pillar = vuln.pillar || vuln.category || vuln.period || 'Pilar não informado';
                const description = vuln.description || vuln.detail || vuln.explanation || vuln.step || '';
                const extraRows = Object.entries(vuln)
                    .filter(([key, val]) => val !== null && val !== undefined && !['id', 'title', 'name', 'severity', 'risk', 'level', 'pillar', 'category', 'period', 'description', 'detail', 'explanation', 'step'].includes(key))
                    .slice(0, 6)
                    .map(([key, val]) => `<span><strong>${safeAuditText(humanizeTaxonomy(key))}:</strong> ${safeAuditText(typeof val === 'object' ? JSON.stringify(val) : val)}</span>`)
                    .join('');

                return [
                    '<li class="history-vulnerability-item">',
                        '<div class="history-vulnerability-top">',
                            `<strong>${safeAuditText(title)}</strong>`,
                            `<span>${safeAuditText(severity)}</span>`,
                        '</div>',
                        `<p>${safeAuditText(description || 'Descrição não informada pelo backend.')}</p>`,
                        `<div class="history-vulnerability-meta"><span><strong>Pilar:</strong> ${safeAuditText(pillar)}</span>${vuln.id ? `<span><strong>ID:</strong> ${safeAuditText(vuln.id)}</span>` : ''}${extraRows}</div>`,
                    '</li>'
                ].join('');
            }).join('');

            return `<section class="history-detail-block history-vulnerability-detail"><h4>Vulnerabilidades identificadas</h4><ul>${content}</ul></section>`;
        }

        function renderHistoryActionVerification(verification) {
            if (!verification || !Array.isArray(verification.items) || !verification.items.length) {
                return '';
            }
            const scoreLine = `${verification.score_before ?? '--'} -> ${verification.score_effective ?? verification.score_after_detected ?? '--'}`;
            const rows = verification.items.map(item => {
                const status = String(item.status || 'nao_corrigida');
                const label = status === 'corrigida' ? 'Corrigida' : status === 'parcial' ? 'Parcial' : status === 'inconclusiva' ? 'Inconclusiva' : 'Não corrigida';
                return [
                    `<div class="history-verification-row history-verification-${safeAuditText(status)}">`,
                        `<div><strong>${safeAuditText(item.action || 'Ação marcada')}</strong><p>${safeAuditText(item.evidence || '')}</p>${item.recommendation ? `<small>${safeAuditText(item.recommendation)}</small>` : ''}</div>`,
                        `<span>${safeAuditText(label)}</span>`,
                    '</div>'
                ].join('');
            }).join('');

            return [
                '<section class="history-verification-result">',
                    '<div class="history-verification-head">',
                        '<div>',
                            '<h4>Validação de correções</h4>',
                            `<p>${safeAuditText(verification.message || verification.summary || 'Resultado da última rechecagem.')}</p>`,
                        '</div>',
                        `<strong>${safeAuditText(scoreLine)}</strong>`,
                    '</div>',
                    rows,
                '</section>'
            ].join('');
        }

        function renderHistoryActionChecklist(item, actions, verification) {
            const historyId = item.id || '';
            const verificationMap = getHistoryVerificationMap(verification);
            const actionItems = normalizeHistoryArray(actions);
            if (!actionItems.length) {
                return '<section class="history-detail-block history-action-checklist"><h4>Plano recomendado</h4><p class="history-detail-muted">Nenhuma ação foi retornada pelo backend.</p></section>';
            }

            const rows = actionItems.map((action, index) => {
                const key = getHistoryActionKey(action, index);
                const text = getHistoryActionText(action);
                const verified = verificationMap.get(key);
                const isChecked = Boolean(verified);
                const checked = isChecked ? 'checked' : '';
                const checkedClass = isChecked ? ' is-checked' : '';
                const status = verified?.status || '';
                const payload = safeAuditText(JSON.stringify({
                    key,
                    period: action?.period || 'item',
                    index: Number.isFinite(Number(action?.index)) ? Number(action.index) : index,
                    text
                }));
                return [
                    `<label class="history-action-check${checkedClass}" aria-checked="${isChecked ? 'true' : 'false'}" onclick="toggleHistoryActionCheck(event, this)">`,
                        `<input type="checkbox" data-history-action-checkbox data-action="${payload}" ${checked} onchange="syncHistoryActionCheckVisual(this)">`,
                        '<span>',
                            `<strong>${safeAuditText(text)}</strong>`,
                            status ? `<small class="history-action-status history-action-status-${safeAuditText(status)}">${safeAuditText(status === 'corrigida' ? 'corrigida' : status === 'parcial' ? 'parcial' : status === 'inconclusiva' ? 'inconclusiva' : 'não corrigida')}</small>` : '',
                        '</span>',
                    '</label>'
                ].join('');
            }).join('');

            return [
                '<section class="history-detail-block history-action-checklist">',
                    '<div class="history-action-head">',
                        '<div>',
                            '<h4>Plano recomendado</h4>',
                            '<p>Marque as ações que você já corrigiu para a IA validar novamente a URL.</p>',
                        '</div>',
                        '<div class="history-action-tools">',
                            '<button type="button" onclick="setHistoryActionChecks(true)">Marcar todas</button>',
                            '<button type="button" onclick="setHistoryActionChecks(false)">Limpar</button>',
                        '</div>',
                    '</div>',
                    `<div class="history-action-list">${rows}</div>`,
                    '<div class="history-action-footer">',
                        '<span>Esta rechecagem consome 1 crédito e reembolsa em caso de erro externo.</span>',
                        `<button type="button" id="historyVerifyActionsBtn" onclick="verifyHistoryActions(decodeURIComponent('${toHistoryInlineArg(historyId)}'))">Validar correções com IA</button>`,
                    '</div>',
                    renderHistoryActionVerification(verification),
                '</section>'
            ].join('');
        }

        function syncHistoryActionCheckVisual(input) {
            if (!input) return;
            const row = input.closest('.history-action-check');
            if (!row) return;
            const checked = Boolean(input.checked);
            row.classList.toggle('is-checked', checked);
            row.setAttribute('aria-checked', checked ? 'true' : 'false');
        }

        function toggleHistoryActionCheck(event, row) {
            const input = row?.querySelector?.('[data-history-action-checkbox]');
            if (!input) return;
            if (event?.target === input) {
                setTimeout(() => syncHistoryActionCheckVisual(input), 0);
                return;
            }
            if (event) event.preventDefault();
            input.checked = !input.checked;
            syncHistoryActionCheckVisual(input);
        }

        function setHistoryActionChecks(checked) {
            document.querySelectorAll('[data-history-action-checkbox]').forEach(input => {
                input.checked = Boolean(checked);
                syncHistoryActionCheckVisual(input);
            });
        }

        function parseSelectedHistoryAction(input) {
            if (!input) return null;
            try {
                const action = JSON.parse(input.dataset.action || '{}');
                return action && (action.text || action.key) ? action : null;
            } catch {
                return null;
            }
        }

        async function verifyHistoryActions(historyId) {
            const btn = document.getElementById('historyVerifyActionsBtn');
            const selected = Array.from(document.querySelectorAll('[data-history-action-checkbox]'))
                .filter(input => input.checked || input.closest('.history-action-check')?.classList.contains('is-checked'))
                .map(input => {
                    input.checked = true;
                    syncHistoryActionCheckVisual(input);
                    return parseSelectedHistoryAction(input);
                })
                .filter(Boolean);

            if (!selected.length) {
                Toast.warning('Marque pelo menos uma ação do plano recomendado.');
                return;
            }

            try {
                if (btn) { btn.disabled = true; btn.innerText = 'Validando...'; }
                Toast.info ? Toast.info('A IA está reanalisando a URL e comparando as correções marcadas.', 10000) : Toast.warning('A IA está reanalisando a URL.', 10000);
                const res = await fetch(`${API_URL}/api/audits/history/${encodeURIComponent(historyId)}/verify-actions`, {
                    method: 'POST',
                    headers: authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({ actions: selected })
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.detail || 'Não foi possível validar as correções.');
                if (USER && typeof data.novo_saldo !== 'undefined') {
                    USER.credits = data.novo_saldo;
                    if (typeof secureStorage !== 'undefined') await secureStorage.setItem('USER', USER);
                    else localStorage.setItem('USER', JSON.stringify(USER));
                    updateUserMenuCircle();
                }
                renderAuditHistoryDetail(data.history || window.currentHistoryChatItem);
                const confirmed = Number(data.verification?.confirmed_count || 0);
                if (confirmed > 0) Toast.success(data.verification?.message || 'Correções confirmadas pela IA.', 10000);
                else Toast.warning(data.verification?.message || 'A IA não confirmou mudanças suficientes na URL.', 10000);
            } catch (error) {
                console.error('Erro ao validar correcoes:', error);
                Toast.error(error.message || 'Erro ao validar correções.');
            } finally {
                if (btn) { btn.disabled = false; btn.innerText = 'Validar correções com IA'; }
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }

        async function openAuditHistoryItem(historyId) {
            const detail = document.getElementById('auditHistoryDetail');
            if (!detail) return;
            detail.classList.remove('hidden');
            detail.innerHTML = '<div class="history-detail-loading"><span class="history-loading-dot"></span>Carregando detalhes...</div>';
            detail.scrollIntoView({ behavior: 'smooth', block: 'start' });

            try {
                const res = await fetch(`${API_URL}/api/audits/history/${encodeURIComponent(historyId)}`, {
                    headers: authHeaders()
                });
                const item = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(item.detail || 'Não foi possível abrir esta análise.');
                renderAuditHistoryDetail(item);
            } catch (error) {
                console.error('Erro ao abrir item do historico:', error);
                detail.innerHTML = `<div class="history-empty-state history-empty-error"><strong>Detalhe indisponível</strong><p>${safeAuditText(error.message || 'Tente novamente em instantes.')}</p></div>`;
            } finally {
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }

        function renderAuditHistoryDetail(item) {
            const detail = document.getElementById('auditHistoryDetail');
            if (!detail) return;
            const meta = getAuditHistoryTypeMeta(item.audit_type);
            const payload = item.payload || {};

            if (String(item.audit_type).toLowerCase() === 'compare') {
                renderCompareHistoryDetail(item, payload, meta);
                return;
            }

            const result = payload.resultado || payload.result || payload.audit || payload;
            const technical = result.technical_audit || {};
            const vulnerabilities = normalizeHistoryArray(technical.vulnerabilities);
            const chatAgents = normalizeHistoryArray(result.agents_results || result.personas_results).map(normalizeChatPersona).filter(agent => agent.profile_name);
            const agents = chatAgents.slice(0, 4);
            const actions = normalizeHistoryArray(technical.action_plan);
            const verification = payload.action_verification || null;
            const score = Number(item.score ?? technical.score);
            const scoreLabel = Number.isFinite(score) ? Math.round(score) : '--';
            window.currentHistoryChatItem = item;
            window.currentHistoryChatAgents = chatAgents;

            detail.innerHTML = [
                '<article class="history-detail-panel">',
                    '<div class="history-detail-head">',
                        '<div>',
                            `<span class="history-type-badge"><i data-lucide="${meta.icon}" class="w-4 h-4"></i>${safeAuditText(meta.label)}</span>`,
                            `<h3>${safeAuditText(item.title || 'Análise SSW')}</h3>`,
                            `<p>${safeAuditText(item.url || 'URL não informada')}</p>`,
                        '</div>',
                        `<div class="history-score history-score-${getHistoryScoreTone(score)}"><strong>${scoreLabel}</strong><span>score</span></div>`,
                    '</div>',
                    `<div class="history-detail-summary">${safeAuditText(item.summary || technical.executive_summary || 'Resumo executivo não informado.')}</div>`,
                    '<div class="history-detail-grid">',
                        renderHistoryVulnerabilitiesDetailed(vulnerabilities),
                        renderHistoryDetailBlock('Análise de agents', agents, value => value.profile_name || value.direct_quote || value.agent || value.name),
                        renderHistoryActionChecklist(item, actions, verification),
                    '</div>',
                    renderHistoryChatAgents(chatAgents),
                    '<div class="history-detail-actions">',
                        item.url ? `<button onclick="rerunAuditFromHistory(decodeURIComponent('${toHistoryInlineArg(item.url)}'), decodeURIComponent('${toHistoryInlineArg(item.audit_type || 'auto')}'))">Rodar novamente</button>` : '',
                        `<button class="history-delete-btn" onclick="deleteAuditHistoryItem(decodeURIComponent('${toHistoryInlineArg(item.id)}'))">Excluir análise</button>`,
                        '<button onclick="document.getElementById(\'auditHistoryDetail\').classList.add(\'hidden\')">Fechar detalhes</button>',
                    '</div>',
                '</article>'
            ].join('');
        }

        function renderCompareHistoryDetail(item, payload, meta) {
            const detail = document.getElementById('auditHistoryDetail');
            const battle = payload.battle_data || payload.comparativo || payload;
            const verdict = battle.executive_verdict || {};
            const agents = normalizeHistoryArray(battle.agent_battleground).slice(0, 5);
            const chatAgents = agents.map(agent => normalizeChatPersona({
                id: agent.agent || agent.preference || 'comparativo',
                profile_name: agent.agent || 'Persona comparativa',
                score: null,
                direct_quote: agent.reason || '',
                description: agent.reason || agent.preference || ''
            }));
            const technical = normalizeHistoryArray(battle.technical_faceoff).slice(0, 5);
            const actions = normalizeHistoryArray(battle.action_plan_for_a || battle.action_plan).slice(0, 6);
            const score = Number(item.score);
            const scoreLabel = Number.isFinite(score) ? Math.round(score) : '--';
            window.currentHistoryChatItem = item;
            window.currentHistoryChatAgents = chatAgents;

            detail.innerHTML = [
                '<article class="history-detail-panel">',
                    '<div class="history-detail-head">',
                        '<div>',
                            `<span class="history-type-badge"><i data-lucide="${meta.icon}" class="w-4 h-4"></i>${safeAuditText(meta.label)}</span>`,
                            `<h3>${safeAuditText(item.title || 'Comparativo SSW')}</h3>`,
                            `<p>${safeAuditText((item.url_a || 'Site A') + ' vs ' + (item.url_b || 'Site B'))}</p>`,
                        '</div>',
                        `<div class="history-score history-score-${getHistoryScoreTone(score)}"><strong>${scoreLabel}</strong><span>média</span></div>`,
                    '</div>',
                    `<div class="history-detail-summary"><strong>${safeAuditText(verdict.winner_site || 'Resultado comparativo')}</strong><p>${safeAuditText(verdict.summary || item.summary || 'Resumo comparativo não informado.')}</p></div>`,
                    '<div class="history-detail-grid">',
                        renderHistoryDetailBlock('Preferência dos agents', agents, value => `${value.agent || 'Agent'}: ${value.preference || value.reason || ''}`),
                        renderHistoryDetailBlock('Confronto técnico', technical, value => `${value.criteria || 'Critério'}: ${value.analysis || value.winner || ''}`),
                        renderHistoryDetailBlock('Plano para superar', actions, value => value.step || value),
                    '</div>',
                    renderHistoryChatAgents(chatAgents),
                    '<div class="history-detail-actions">',
                        `<button class="history-delete-btn" onclick="deleteAuditHistoryItem(decodeURIComponent('${toHistoryInlineArg(item.id)}'))">Excluir análise</button>`,
                        '<button onclick="document.getElementById(\'auditHistoryDetail\').classList.add(\'hidden\')">Fechar detalhes</button>',
                    '</div>',
                '</article>'
            ].join('');
        }

        function renderHistoryDetailBlock(title, items, getText) {
            const content = items.length
                ? items.map((item, index) => `<li><span>${String(index + 1).padStart(2, '0')}</span><p>${safeAuditText(getText(item) || 'Item sem descricao.')}</p></li>`).join('')
                : '<li class="history-detail-muted"><p>Nenhum item retornado para esta secao.</p></li>';
            return `<section class="history-detail-block"><h4>${safeAuditText(title)}</h4><ul>${content}</ul></section>`;
        }

        function renderHistoryChatAgents(agents) {
            if (!agents || !agents.length) {
                return '<section class="history-chat-agents history-chat-agents-empty"><h4>Conversar com personas</h4><p>Esta análise não retornou personas disponíveis para chat.</p></section>';
            }
            return [
                '<section class="history-chat-agents">',
                    '<div>',
                        '<h4>Conversar com personas desta análise</h4>',
                        '<p>O chat abre com o contexto salvo deste histórico, sem consumir uma nova auditoria.</p>',
                    '</div>',
                    '<div class="history-chat-agent-list">',
                        agents.slice(0, 8).map((agent, index) => [
                            `<button type="button" onclick="openHistoryPersonaChat(${index})">`,
                                `<strong>${safeAuditText(agent.profile_name || agent.name || 'Persona')}</strong>`,
                                `<span>${safeAuditText(agent.direct_quote || agent.description || 'Abrir conversa contextual')}</span>`,
                            '</button>'
                        ].join('')).join(''),
                    '</div>',
                '</section>'
            ].join('');
        }

        function getHistoryChatPayload(item) {
            const payload = item?.payload || {};
            if (String(item?.audit_type).toLowerCase() === 'compare') {
                return {
                    audit_data: payload.site_a || {},
                    compare_data: payload.battle_data || payload.comparativo || payload
                };
            }
            return {
                audit_data: payload.resultado || payload.result || payload.audit || payload,
                compare_data: null
            };
        }

        function openHistoryPersonaChat(index) {
            const item = window.currentHistoryChatItem;
            const agents = window.currentHistoryChatAgents || [];
            const rawAgent = agents[index];
            if (!item || !rawAgent) {
                Toast.warning('Não foi possível abrir esta persona do histórico.');
                return;
            }
            const agent = normalizeChatPersona(rawAgent);
            const payload = getHistoryChatPayload(item);
            currentChatMetaOverride = {
                title: item.title || 'Histórico SSW',
                url: item.url || item.url_a || '',
                history_id: item.id,
                audit_type: item.audit_type,
                audit_data: payload.audit_data,
                compare_data: payload.compare_data
            };
            currentChatConversationId = `history:${item.id}:${agent.id || agent.profile_name || index}`;
            openChat(agent);
        }

        window.openHistoryPersonaChat = openHistoryPersonaChat;

        function rerunAuditFromHistory(url, type = 'auto') {
            nav('home');
            setTimeout(() => {
                const input = document.getElementById('auditUrl');
                if (input) input.value = sanitizeMarketingUrl(url);
                const mode = type === 'manual' ? 'manual' : 'auto';
                const modeInput = document.getElementById('auditMode');
                if (modeInput) modeInput.value = mode;
                document.querySelectorAll('input[name="auditMode"]').forEach(radio => {
                    radio.checked = radio.value === mode;
                });
                if (typeof toggleManualSelect === 'function') toggleManualSelect();
                Toast.info('URL carregada para uma nova análise.');
            }, 80);
        }

        window.setAuditHistoryFilter = setAuditHistoryFilter;
        window.loadAuditHistory = loadAuditHistory;
        window.openAuditHistoryItem = openAuditHistoryItem;
        window.deleteAuditHistoryItem = deleteAuditHistoryItem;
        window.rerunAuditFromHistory = rerunAuditFromHistory;
        window.setHistoryActionChecks = setHistoryActionChecks;
        window.syncHistoryActionCheckVisual = syncHistoryActionCheckVisual;
        window.toggleHistoryActionCheck = toggleHistoryActionCheck;
        window.verifyHistoryActions = verifyHistoryActions;

        const MARKETING_QUERY_PARAM_EXACT = new Set([
            'ppc',
            'gclid',
            'gclsrc',
            'gbraid',
            'wbraid',
            'dclid',
            'fbclid',
            'msclkid',
            'ttclid',
            'twclid',
            'li_fat_id',
            'igshid',
            'mc_cid',
            'mc_eid',
            'srsltid',
            '_gl',
            '_hsenc',
            '_hsmi',
            'cjevent',
            'irclickid',
            'clickid',
            'click_id',
            'rb_clickid'
        ]);
        const MARKETING_QUERY_PARAM_PREFIXES = [
            'utm_',
            'gad_',
            'hsa_',
            'fb_action_'
        ];

        function isMarketingQueryParam(name) {
            const key = String(name || '').trim().toLowerCase();
            return MARKETING_QUERY_PARAM_EXACT.has(key) ||
                MARKETING_QUERY_PARAM_PREFIXES.some(prefix => key.startsWith(prefix));
        }

        function getUrlParseCandidate(value) {
            const trimmed = String(value || '').trim().replace(/^<(.+)>$/, '$1').replace(/^['"]|['"]$/g, '');
            if (!trimmed || /\s/.test(trimmed)) return null;

            const hasProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed);
            const protocolRelative = /^\/\//.test(trimmed);
            const looksLikeDomain = /^[^\s/?#]+\.[^\s]+/.test(trimmed);
            if (!hasProtocol && !protocolRelative && !looksLikeDomain) return null;

            return {
                original: trimmed,
                candidate: hasProtocol ? trimmed : protocolRelative ? `https:${trimmed}` : `https://${trimmed}`,
                removeProtocol: !hasProtocol && !protocolRelative,
                protocolRelative
            };
        }

        function sanitizeMarketingUrl(value) {
            const parsed = getUrlParseCandidate(value);
            if (!parsed) return String(value || '').trim();

            try {
                const url = new URL(parsed.candidate);
                const removableKeys = Array.from(new Set(Array.from(url.searchParams.keys()).filter(isMarketingQueryParam)));
                if (!removableKeys.length) return parsed.original;

                removableKeys.forEach(key => url.searchParams.delete(key));
                let cleaned = url.toString();

                if (parsed.removeProtocol) cleaned = cleaned.replace(/^https:\/\//i, '');
                if (parsed.protocolRelative) cleaned = cleaned.replace(/^https:/i, '');

                return cleaned;
            } catch (_) {
                return String(value || '').trim();
            }
        }

        function sanitizeUrlInputValue(input) {
            if (!input) return '';
            const before = input.value;
            const cleaned = sanitizeMarketingUrl(before);
            if (cleaned && cleaned !== before.trim()) {
                input.value = cleaned;
            }
            return input.value.trim();
        }

        function bindUrlSanitizer(input) {
            if (!input || input.dataset.urlSanitizerBound === '1') return;
            input.dataset.urlSanitizerBound = '1';
            let sanitizeTimer = null;
            const scheduleSanitize = () => {
                clearTimeout(sanitizeTimer);
                sanitizeTimer = setTimeout(() => sanitizeUrlInputValue(input), 160);
            };
            input.addEventListener('input', scheduleSanitize);
            input.addEventListener('paste', () => setTimeout(() => sanitizeUrlInputValue(input), 0));
            input.addEventListener('change', () => sanitizeUrlInputValue(input));
            input.addEventListener('blur', () => sanitizeUrlInputValue(input));
        }

        function initUrlInputSanitizers() {
            document.querySelectorAll('#auditUrl, [id="compareUrlA"], [id="compareUrlB"], #compareUrlA_main, #compareUrlB_main')
                .forEach(bindUrlSanitizer);
        }

        function abrirModalNgrok() {
            abrirTutorialNgrok();
        }

        function isLocalAuditUrl(url) {
            const value = String(url || '').trim().toLowerCase();
            if (!value) return false;
            return value.includes('localhost') ||
                value.includes('127.0.0.1') ||
                value.includes('0.0.0.0') ||
                value.includes('[::1]') ||
                value.includes('://::1') ||
                /^https?:\/\/10\./.test(value) ||
                /^https?:\/\/192\.168\./.test(value) ||
                /^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\./.test(value);
        }

        function bloquearUrlLocalSeNecessario(url) {
            if (!isLocalAuditUrl(url)) return false;
            alert("Ambiente Local Detectado!\n\nA nossa IA precisa de uma URL pública.\n\nVamos abrir o Tutorial Ngrok completo para você gerar um link temporário.");
            abrirTutorialNgrok();
            return true;
        }

        const AUDIT_CANCEL_MESSAGE = 'A análise foi finalizada por um erro externo. Isso pode acontecer por bloqueio de bots, instabilidade temporária, timeout ou indisponibilidade do site. Fique tranquilo: seu saldo foi mantido. Tente novamente daqui a 5 minutos e, se o erro persistir, fale conosco pelo contato, pelo formulário de dúvidas ou pelo WhatsApp.';

        function getAuditErrorPayload(detail) {
            if (!detail) return {};
            if (typeof detail === 'object') return detail;
            return { message: String(detail) };
        }

        function getAuditErrorDetailText(detail) {
            if (!detail) return '';
            if (typeof detail === 'string') return detail;
            if (typeof detail === 'object') {
                if (typeof detail.detail === 'object') return getAuditErrorDetailText(detail.detail);
                return detail.message || detail.raw_message || detail.error || detail.detail || detail.erro || JSON.stringify(detail);
            }
            return String(detail);
        }

        function getAuditErrorStage(detail) {
            const payload = getAuditErrorPayload(detail);
            if (payload.stage) return String(payload.stage).toLowerCase();
            if (payload.detail && typeof payload.detail === 'object' && payload.detail.stage) {
                return String(payload.detail.stage).toLowerCase();
            }
            return '';
        }

        function isAntiBotAuditError(value) {
            const lower = getAuditErrorDetailText(value).toLowerCase();
            return [
                'anti-bot',
                'antibot',
                'bot protection',
                'bot detected',
                'bot blocked',
                'bloqueio',
                'bloqueado',
                'cloudflare',
                'challenge',
                'waf',
                'firewall',
                'checking your browser',
                'private access token',
                'ddos protection',
                'access denied'
            ].some(term => lower.includes(term));
        }

        function formatAuditApiError(detail, status) {
            const raw = getAuditErrorDetailText(detail).trim();
            const stage = getAuditErrorStage(detail);
            const clean = raw.replace(/^(Erro IA|Erro de captura|Erro de metricas oficiais|Erro de métricas oficiais|Erro de historico|Erro interno):\s*/i, '').trim();
            const lower = clean.toLowerCase();

            const platformCaptchaError = status === 403 ||
                lower.includes('turnstile') ||
                lower.includes('captcha inválido') ||
                lower.includes('captcha invalido') ||
                lower.includes('verificação de segurança') ||
                lower.includes('verificacao de seguranca');

            if (platformCaptchaError) {
                return 'A verificação de segurança expirou ou ficou inválida. Recarregue o captcha e tente novamente.';
            }

            if (lower.includes('captcha') || isAntiBotAuditError(clean)) {
                return 'O site parece estar bloqueando automações legítimas por anti-bot, WAF ou Cloudflare. A análise foi cancelada e seu saldo foi mantido. Para auditar esse domínio, valide a propriedade e libere o header secreto da SSW no firewall do site.';
            }

            if (stage === 'pagespeed' || lower.includes('pagespeed') || lower.includes('metricas oficiais') || lower.includes('métricas oficiais')) {
                return 'A etapa de métricas oficiais do Google falhou e a análise foi cancelada automaticamente para não entregar um relatório incompleto. Seu saldo foi mantido. Tente novamente em alguns minutos.';
            }

            if (stage === 'ia' || lower.includes('gemini') || lower.includes('ia indispon') || lower.includes('etapa de ia')) {
                return 'A etapa de IA não conseguiu concluir a leitura do site e a análise foi cancelada automaticamente. Seu saldo foi mantido. Tente novamente em alguns minutos.';
            }

            if (stage === 'historico') {
                return 'Não foi possível consultar o histórico necessário para a auditoria, então a análise foi cancelada automaticamente. Seu saldo foi mantido.';
            }

            if (stage === 'servidor' || status >= 500) {
                return 'O backend interrompeu a análise por um erro interno antes de gerar o relatório. Seu saldo foi mantido. Tente novamente em alguns minutos.';
            }

            if (
                lower.includes('site inacess') ||
                lower.includes('bloqueio') ||
                lower.includes('offline') ||
                lower.includes('timeout') ||
                lower.includes('playwright') ||
                lower.includes('captura')
            ) {
                return 'Não conseguimos abrir esse site para a auditoria. Ele pode estar offline, lento ou bloqueando acessos automatizados. Teste outra URL pública, tente novamente em alguns minutos ou use o Ngrok se for um projeto local.';
            }

            return clean || 'Erro ao iniciar auditoria.';
        }

        function restoreAuditInputState(mode = 'auto') {
            stopAuditLoadingAnimation();
            document.getElementById('auditLoading')?.classList.add('hidden');
            document.getElementById('auditResults')?.classList.add('hidden');
            document.getElementById('heroSection')?.classList.remove('hidden');
            document.getElementById('manualSelectArea')?.classList.toggle('hidden', mode !== 'manual');
            document.getElementById('compareArea')?.classList.add('hidden');

            const normalSearchBar = document.getElementById('normalSearchBar');
            const compareSearchBar = document.getElementById('compareSearchBar');
            const turnstileAudit = document.getElementById('turnstile-audit');
            const turnstileCompare = document.getElementById('turnstile-compare');

            if (normalSearchBar) normalSearchBar.classList.toggle('hidden', mode === 'compare');
            if (compareSearchBar) compareSearchBar.classList.toggle('hidden', mode !== 'compare');
            if (turnstileAudit) turnstileAudit.classList.toggle('hidden', mode === 'compare');
            if (turnstileCompare) turnstileCompare.classList.toggle('hidden', mode !== 'compare');

            positionLocalAuditHelp(mode);
            setModeOnlyCardsVisibility(mode);
            adjustFooterPosition(false);
            updateUserMenuCircle();
        }

        function showAuditCancelledNotice(reason = '', mode = 'auto', displayMessage = '') {
            const searchContainer = document.querySelector('.search-container');
            const reasonText = String(reason || '').trim();
            const antiBotDetected = isAntiBotAuditError(reasonText);
            const message = antiBotDetected
                ? 'O site bloqueou a auditoria por uma proteção anti-bot, WAF ou Cloudflare. A análise foi cancelada e seu saldo foi mantido. Para liberar esse domínio, valide a propriedade e configure o header secreto da SSW no firewall do site.'
                : (String(displayMessage || '').trim() || AUDIT_CANCEL_MESSAGE);

            if (!searchContainer) {
                Toast.warning(message, 10000);
                return;
            }

            const oldNotice = document.getElementById('auditCancelNotice');
            if (oldNotice) oldNotice.remove();

            const technicalReason = reasonText && !reasonText.toLowerCase().includes('captcha')
                ? `<p class="audit-cancel-reason">Motivo técnico informado: ${safeAuditText(reasonText)}</p>`
                : '';
            const antiBotGuidance = antiBotDetected
                ? `
                    <div class="audit-cancel-guidance">
                        <strong>Como resolver</strong>
                        <p>Peça ao dono do site para validar o domínio na SSW e permitir requisições com o header <code>X-SSW-Audit-Token</code> e User-Agent contendo <code>SSW-Intelligence-Auditor/1.0</code>.</p>
                    </div>
                `
                : '';

            const notice = document.createElement('div');
            notice.id = 'auditCancelNotice';
            notice.className = 'audit-cancel-notice';
            notice.innerHTML = `
                <div class="audit-cancel-icon"><i data-lucide="${antiBotDetected ? 'shield-alert' : 'alert-triangle'}" class="w-5 h-5"></i></div>
                <div class="audit-cancel-copy">
                    <strong>${antiBotDetected ? 'Bloqueio anti-bot detectado' : 'Análise cancelada com saldo preservado'}</strong>
                    <p>${message}</p>
                    ${antiBotGuidance}
                    ${technicalReason}
                    <div class="audit-cancel-actions">
                        <button type="button" onclick="document.getElementById('auditCancelNotice')?.remove();">Entendi</button>
                        ${antiBotDetected ? '<button type="button" onclick="abrirTutorialDominioAutorizado()">Ver tutorial</button><button type="button" onclick="nav(\'domains\')">Configurar domínio</button>' : ''}
                        <button type="button" onclick="openSupportForm()">Abrir formulário</button>
                        <a href="https://wa.me/5582991301991" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    </div>
                </div>
            `;
            searchContainer.appendChild(notice);
            if (typeof lucide !== 'undefined') lucide.createIcons();
            Toast.warning(antiBotDetected ? 'Bloqueio anti-bot detectado. Seu saldo foi mantido.' : message, 10000);
        }

        function cancelAuditDueToApiError({ mode = 'auto', reason = '', displayMessage = '', resetCaptcha = true } = {}) {
            if (resetCaptcha) {
                if (mode === 'compare') resetCompareCaptcha();
                else resetAuditCaptcha();
            }
            restoreAuditInputState(mode);
            showAuditCancelledNotice(reason, mode, displayMessage);
        }

        function renderHighScorePraise(data, url) {
            const results = document.getElementById('auditResults');
            if (!results) return;
            const technical = data?.resultado?.technical_audit || {};
            const praise = data?.praise || {};
            const score = Number(technical.score);
            const scoreLabel = Number.isFinite(score) ? Math.round(score) : '90+';
            const points = Array.isArray(praise.positive_points) && praise.positive_points.length
                ? praise.positive_points.slice(0, 5)
                : [
                    'Experiência consistente e acima da média.',
                    'Estrutura técnica madura para navegação e confiança.',
                    'Base visual e funcional preparada para sustentar conversão.'
                ];
            const host = String(url || '').replace(/^https?:\/\//, '').split('/')[0];

            clearActiveAuditSession();
            auditData = null;
            currentAuditUrl = '';
            auditSnapshotTabOpened = false;
            hasUnsavedAuditSession = false;

            results.innerHTML = [
                '<section class="audit-excellence-result">',
                    '<div class="audit-excellence-score">',
                        `<strong>${safeAuditText(scoreLabel)}</strong>`,
                        '<span>score de excelência</span>',
                    '</div>',
                    '<div class="audit-excellence-copy">',
                        '<span class="audit-excellence-kicker">Análise concluída sem relatório técnico</span>',
                        `<h2>${safeAuditText(praise.headline || 'Site em nível de excelência')}</h2>`,
                        `<p>${safeAuditText(praise.message || technical.executive_summary || 'A S.S.W Intelligence identificou uma experiência madura, consistente e acima do padrão esperado para a URL analisada.')}</p>`,
                        `<small>${safeAuditText(praise.score_comment || `A URL ${host} está na faixa premium da auditoria.`)}</small>`,
                    '</div>',
                    '<div class="audit-excellence-points">',
                        points.map(point => [
                            '<article>',
                                '<i data-lucide="check-circle-2" class="w-4 h-4"></i>',
                                `<span>${safeAuditText(point)}</span>`,
                            '</article>'
                        ].join('')).join(''),
                    '</div>',
                    '<div class="audit-excellence-note">',
                        '<strong>Nenhum relatório foi gerado.</strong>',
                        '<p>Como o score ficou em 90 ou mais, a plataforma não salvou esta análise no histórico e não liberou PDF. O resultado aqui é apenas o reconhecimento positivo da IA.</p>',
                    '</div>',
                    '<div class="audit-excellence-actions">',
                        '<button type="button" onclick="showSimplifiedSearch()">Analisar outro site</button>',
                        '<button type="button" onclick="nav(\'ranking\')">Ver ranking</button>',
                    '</div>',
                '</section>'
            ].join('');
            results.classList.remove('hidden');
            document.getElementById('heroSection')?.classList.add('hidden');
            document.getElementById('emptyStateCards')?.classList.add('hidden');
            adjustFooterPosition(true);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        async function runAudit() {
            showOnlyAuditHomeView();
            const urlInput = document.getElementById('auditUrl');
            const url = sanitizeUrlInputValue(urlInput);
            if (bloquearUrlLocalSeNecessario(url)) return;
            if(USER.credits <= 0) return comprarCreditos();
            const mode = document.getElementById('auditMode')?.value || 'auto';
            const selected = mode === 'manual'
                ? Array.from(document.querySelectorAll('.agent-radio:checked')).map(el => el.value).filter(Boolean)
                : [];
            if(!url) return Toast.warning("Digite uma URL para analisar");
            if(mode === 'compare') return runCompare();
            if(mode === 'manual' && selected.length === 0) {
                return Toast.warning("Selecione 1 persona do backend para a análise manual.");
            }
            if (mode === 'manual' && selected[0]) {
                validateManualPersonaNiche(selected[0]);
            }
            // Esconde toda a interface anterior e mostra apenas o loading centralizado
            document.getElementById('heroSection').classList.add('hidden');
            document.getElementById('emptyStateCards').classList.add('hidden');
            document.getElementById('manualSelectArea').classList.add('hidden');
            document.getElementById('compareArea').classList.add('hidden');
            document.getElementById('auditLoading').classList.remove('hidden');
            startAuditLoadingAnimation(url, mode);
            document.getElementById('auditResults').classList.add('hidden');
            adjustFooterPosition(false);
            try {
                let data;
                try {
                    // Capturar token do Turnstile do DOM
                    const cfToken = turnstileAuditToken || document.querySelector('#turnstile-audit [name="cf-turnstile-response"]')?.value || '';
                    if (!cfToken) {
                        initTurnstileAudit();
                        Toast.warning("Resolva o captcha primeiro");
                        document.getElementById('heroSection').classList.remove('hidden');
                        document.getElementById('emptyStateCards').classList.remove('hidden');
                        document.getElementById('manualSelectArea').classList.toggle('hidden', mode !== 'manual');
                        document.getElementById('compareArea').classList.toggle('hidden', mode !== 'compare');
                        stopAuditLoadingAnimation();
                        document.getElementById('auditLoading').classList.add('hidden');
                        return;
                    }

                    const res = await fetch(`${API_URL}/api/auditar`, {
                        method: 'POST', headers: authHeaders({'Content-Type': 'application/json'}),
                        body: JSON.stringify({ url, modo: mode, personas: selected, cf_token: cfToken })
                    });
                    if(res.ok) {
                        data = await res.json();
                    } else if(res.status === 402) {
                        resetAuditCaptcha();
                        document.getElementById('heroSection').classList.remove('hidden');
                        document.getElementById('emptyStateCards').classList.remove('hidden');
                        document.getElementById('manualSelectArea').classList.toggle('hidden', mode !== 'manual');
                        document.getElementById('compareArea').classList.toggle('hidden', mode !== 'compare');
                        stopAuditLoadingAnimation();
                        document.getElementById('auditLoading').classList.add('hidden');
                        comprarCreditos();
                        return;
                    } else {
                        resetAuditCaptcha();
                        const errorData = await res.json().catch(() => ({}));
                        const errorDetail = errorData.detail || errorData.error || errorData;
                        const apiError = new Error(formatAuditApiError(errorDetail, res.status));
                        apiError.isHttpError = true;
                        apiError.status = res.status;
                        apiError.rawDetail = getAuditErrorDetailText(errorDetail);
                        apiError.userMessage = apiError.message;
                        throw apiError;
                    }
                } catch (apiError) {
                    if (apiError.isHttpError) {
                        cancelAuditDueToApiError({
                            mode,
                            reason: apiError.rawDetail || apiError.message || 'Erro ao iniciar auditoria.',
                            displayMessage: apiError.userMessage || apiError.message,
                            resetCaptcha: true
                        });
                        return;
                    }
                    cancelAuditDueToApiError({
                        mode,
                        reason: apiError.message || 'Falha de conexão com a API.',
                        displayMessage: 'Não foi possível conectar com a API da SSW agora. A análise foi cancelada antes de gerar o relatório.',
                        resetCaptcha: true
                    });
                    return;
                }
                stopAuditLoadingAnimation();
                document.getElementById('auditLoading').classList.add('hidden');
                if (data.success_only || data.high_score) {
                    USER.credits = data.novo_saldo;
                    if (typeof secureStorage !== 'undefined') {
                        await secureStorage.setItem('USER', USER);
                    } else {
                        localStorage.setItem('USER', JSON.stringify(USER));
                    }
                    updateUserMenuCircle();
                    showOnlyAuditHomeView();
                    renderHighScorePraise(data, url);
                    resetAuditCaptcha();
                    return;
                }
                // Criar estrutura HTML inicial para todas as seções
                showOnlyAuditHomeView();
                createAuditResultsStructureModern();
                setAuditPillarsVisibility(mode === 'auto');
                // Armazenar dados globalmente para exportação PDF
                auditData = data.resultado;
                currentAuditUrl = url;
                USER.credits = data.novo_saldo;
                // Salva dados criptografados se secureStorage disponível
                if (typeof secureStorage !== 'undefined') {
                    await secureStorage.setItem('USER', USER);
                } else {
                    localStorage.setItem('USER', JSON.stringify(USER));
                }
                updateUserMenuCircle();
                document.getElementById('auditResults').classList.remove('hidden');
                // Popula Dados com verificações de segurança
                const technicalAudit = data.resultado.technical_audit || {};
                const resScoreEl = document.getElementById('resScore');
                if (resScoreEl) resScoreEl.innerText = technicalAudit.score;
                document.querySelector('.audit-score-board')?.setAttribute('data-score-tone', getAuditScoreTone(technicalAudit.score));
                const reportUrlEl = document.getElementById('reportUrl');
                if (reportUrlEl) reportUrlEl.innerText = url.replace(/https?:\/\//, '').split('/')[0];
                const resSummaryEl = document.getElementById('resSummary');
                if (resSummaryEl) resSummaryEl.innerText = technicalAudit.executive_summary;
                // Função para determinar cor baseada no score
                function getScoreColor(score) {
                    if (score >= 90) return "text-green-400";
                    if (score >= 50) return "text-yellow-500";
                    return "text-red-500";
                }
                // Função para determinar cor de tempo (em segundos)
                function getTimeColor(timeStr) {
                    const time = parseFloat(timeStr);
                    if (time <= 2.5) return "text-green-400";
                    if (time <= 4.0) return "text-yellow-500";
                    return "text-red-500";
                }
                // Popula métricas reais do Google PageSpeed
                const realMetrics = technicalAudit.real_metrics || {};
                // Performance Score
                const perfScoreEl = document.getElementById('realPerformanceScore');
                if (perfScoreEl) {
                    const score = realMetrics.performance_score || '--';
                    perfScoreEl.innerText = score;
                    perfScoreEl.className = `text-4xl font-black ${typeof score === 'number' ? getScoreColor(score) : 'text-white'}`;
                }
                // SEO Score
                const seoScoreEl = document.getElementById('realSeoScore');
                if (seoScoreEl) {
                    const score = realMetrics.seo_score || '--';
                    seoScoreEl.innerText = score;
                    seoScoreEl.className = `text-4xl font-black ${typeof score === 'number' ? getScoreColor(score) : 'text-white'}`;
                }
                // Accessibility Score
                const a11yScoreEl = document.getElementById('realA11yScore');
                if (a11yScoreEl) {
                    const score = realMetrics.accessibility_score || '--';
                    a11yScoreEl.innerText = score;
                    a11yScoreEl.className = `text-4xl font-black ${typeof score === 'number' ? getScoreColor(score) : 'text-white'}`;
                }
                // LCP (Largest Contentful Paint)
                const lcpEl = document.getElementById('realLcp');
                if (lcpEl) {
                    const lcp = realMetrics.lcp || '--';
                    lcpEl.innerText = lcp;
                    lcpEl.className = `text-2xl font-bold ${typeof lcp === 'string' ? getTimeColor(lcp) : 'text-white'}`;
                }
                // Load Time
                const loadTimeEl = document.getElementById('realLoadTime');
                if (loadTimeEl) {
                    const loadTime = realMetrics.load_time || '--';
                    loadTimeEl.innerText = loadTime;
                    loadTimeEl.className = `text-2xl font-bold ${typeof loadTime === 'string' ? getTimeColor(loadTime) : 'text-white'}`;
                }
                if (mode === 'auto') {
                    renderPillarsDashboard(technicalAudit);
                }
                if(data.images) {
                    const printMobileEl = document.getElementById('printMobile');
                    if (printMobileEl && data.images.mobile) {
                        printMobileEl.src = "data:image/jpeg;base64," + data.images.mobile;
                        printMobileEl.closest('.audit-shot-frame')?.classList.add('has-capture');
                    }
                    const printDesktopEl = document.getElementById('printDesktop');
                    if (printDesktopEl && data.images.desktop) {
                        printDesktopEl.src = "data:image/jpeg;base64," + data.images.desktop;
                        printDesktopEl.closest('.audit-shot-frame')?.classList.add('has-capture');
                    }
                }
                // ===============================================
                // BLOCO 1: MATRIZ DE VULNERABILIDADES (EXPANDIDA)
                // ===============================================
    // ===============================================
    // Vulnerabilidades
    const vDiv = document.getElementById('vulnerabilitiesTableBody');
    if (vDiv) {
        const vulnerabilities = technicalAudit.vulnerabilities || [];
        console.log("Vulnerabilidades da API:", vulnerabilities);
        if (!vulnerabilities.length) {
            vDiv.innerHTML = '<div class="audit-empty-block"><strong>Nenhum risco cr?tico foi retornado.</strong><p>A auditoria n?o encontrou problemas relevantes o suficiente para compor uma matriz de vulnerabilidades.</p></div>';
        } else {
            vDiv.innerHTML = vulnerabilities.map((v, index) => {
                const severity = getSeverityMeta(v.severity);
                const pillarLabel = getVulnerabilityPillarLabel(v.pillar) || 'Pilar n?o informado';
                return [
                    '<article class="audit-risk-card audit-risk-' + severity.tone + '">',
                        '<div class="audit-risk-number">' + String(index + 1).padStart(2, '0') + '</div>',
                        '<div class="audit-risk-content">',
                            '<div class="audit-risk-meta">',
                                '<span class="audit-severity audit-severity-' + severity.tone + '">' + safeAuditText(severity.label) + '</span>',
                                '<span>' + safeAuditText(pillarLabel) + '</span>',
                            '</div>',
                            '<h3>' + safeAuditText(v.title || 'Problema sem t?tulo') + '</h3>',
                            '<p>' + safeAuditText(v.description || 'A API n?o retornou uma descri??o t?cnica para este item.') + '</p>',
                        '</div>',
                    '</article>'
                ].join('');
            }).join('');
        }
    }
                // Renderiza Plano de A??o
                const actionPlanList = document.getElementById('actionPlanList');
                if (actionPlanList) {
                    const actionPlan = data.resultado.technical_audit.action_plan || {};
                    console.log("Action Plan da API:", actionPlan);
                    const realSteps = [];
                    Object.keys(actionPlan).forEach(period => {
                        if (Array.isArray(actionPlan[period])) {
                            actionPlan[period].forEach(step => realSteps.push({ period, step }));
                        }
                    });
                    console.log("Steps combinados:", realSteps);
                    if (!realSteps.length) {
                        actionPlanList.innerHTML = '<div class="audit-empty-block"><strong>Plano n?o retornado.</strong><p>A auditoria n?o trouxe a??es espec?ficas, mas voc? ainda pode baixar o PDF e revisar os pilares do diagn?stico.</p></div>';
                    } else {
                        actionPlanList.innerHTML = realSteps.map((item, i) => [
                            '<article class="audit-action-card">',
                                '<div class="audit-action-index">' + String(i + 1).padStart(2, '0') + '</div>',
                                '<div>',
                                    '<span>' + safeAuditText(humanizeActionPeriod(item.period)) + '</span>',
                                    '<p>' + safeAuditText(item.step) + '</p>',
                                '</div>',
                            '</article>'
                        ].join('')).join('');
                    }
                }
                const pGrid = document.getElementById('agentsTableBody');
                const agentsResults = data.resultado.agents_results || data.resultado.personas_results || [];
                if (pGrid) {
                    if (!agentsResults.length) {
                        pGrid.innerHTML = '<div class="audit-empty-block"><strong>Nenhuma agent foi aplicada.</strong><p>A auditoria seguiu somente pela an?lise t?cnica. Para uma leitura comportamental, selecione uma persona compat?vel no modo manual.</p></div>';
                    } else {
                        pGrid.innerHTML = agentsResults.map(p => {
                            const score = Number(p.score);
                            const tone = score >= 8 ? 'strong' : score <= 4 ? 'critical' : 'attention';
                            const logs = Array.isArray(p.journey_log) ? p.journey_log.slice(0, 3) : [];
                            const journeyHtml = logs.length ?
                                '<div class="audit-agent-journey">' + logs.map(log => [
                                    '<div>',
                                        '<span>' + safeAuditText(log.action || 'A??o observada') + '</span>',
                                        '<p>' + safeAuditText(log.status || 'Sem status detalhado.') + '</p>',
                                    '</div>'
                                ].join('')).join('') + '</div>' : '';
                            return [
                                '<article class="audit-agent-card audit-agent-' + tone + '">',
                                    '<div class="audit-agent-header">',
                                        '<div>',
                                            '<h3>' + safeAuditText(p.profile_name || 'Persona SSW') + '</h3>',
                                            '<span>Score ' + (Number.isFinite(score) ? score : '--') + '/10</span>',
                                        '</div>',
                                        '<strong>' + (Number.isFinite(score) ? score : '--') + '</strong>',
                                    '</div>',
                                    '<blockquote>"' + safeAuditText(p.direct_quote || 'A persona n?o retornou uma cita??o direta.') + '"</blockquote>',
                                    journeyHtml,
                                '</article>'
                            ].join('');
                        }).join('');
                    }
                }
                initAuditResultReveal();

                // Recria ícones Lucide para os novos botões de chat
                lucide.createIcons();
                // Adiciona botão flutuante de chat
                addFloatingChatButton(agentsResults);
                hasUnsavedAuditSession = true;
                auditSnapshotTabOpened = false;
                openAuditSnapshotTab();
                // Ajusta posição do footer para não sobrepor resultados
                adjustFooterPosition(true);
                // Verificação adicional para garantir o posicionamento
                setTimeout(() => {
                    console.log('Verificação adicional do footer após auditoria');
                    checkForAuditResults();
                }, 500);
            } catch(e) {
                window.SSWConsole?.capture?.('error', ['Erro na auditoria', e]);
                cancelAuditDueToApiError({
                    mode,
                    reason: e.message || 'Erro inesperado durante a auditoria.',
                    displayMessage: 'A interface interrompeu a renderização do relatório por um erro inesperado. A análise foi cancelada antes de mostrar dados incompletos.',
                    resetCaptcha: true
                });
                return;
            }
        }
        // === FUNÇÃO DE COMPARAÇÃO ===
        async function runCompare() {
            showOnlyAuditHomeView();
            console.log("Iniciando processo de comparação...");
            // Oculta os cards IMEDIATAMENTE ao iniciar comparação
            const emptyStateCards = document.getElementById('emptyStateCards');
            const compareArea = document.getElementById('compareArea');
            const heroSection = document.getElementById('heroSection');
            const manualSelectArea = document.getElementById('manualSelectArea');
            if(emptyStateCards) emptyStateCards.classList.add('hidden');
            if(compareArea) compareArea.classList.add('hidden');
            if(heroSection) heroSection.classList.add('hidden');
            if(manualSelectArea) manualSelectArea.classList.add('hidden');
            // 1. Verificações de Segurança
            if (!USER || !USER.id) {
                alert("Sessão inválida. Faça login novamente.");
                document.getElementById('emptyStateCards').classList.remove('hidden');
                document.getElementById('heroSection').classList.remove('hidden');
                document.getElementById('manualSelectArea').classList.add('hidden');
                return;
            }
            if (USER.credits <= 0) {
                document.getElementById('emptyStateCards').classList.remove('hidden');
                document.getElementById('heroSection').classList.remove('hidden');
                document.getElementById('manualSelectArea').classList.add('hidden');
                return comprarCreditos();
            }
            // 2. Coleta de Inputs
            const elA = document.getElementById('compareUrlA_main') || document.getElementById('compareUrlA');
            const elB = document.getElementById('compareUrlB_main') || document.getElementById('compareUrlB');
            if (!elA || !elB) {
                document.getElementById('emptyStateCards').classList.remove('hidden');
                document.getElementById('heroSection').classList.remove('hidden');
                document.getElementById('manualSelectArea').classList.add('hidden');
                return alert("Erro interno: Inputs não encontrados.");
            }
            const urlA = sanitizeUrlInputValue(elA);
            const urlB = sanitizeUrlInputValue(elB);
            if (!urlA || !urlB) {
                document.getElementById('emptyStateCards').classList.remove('hidden');
                document.getElementById('heroSection').classList.remove('hidden');
                document.getElementById('manualSelectArea').classList.add('hidden');
                return alert("Preencha ambas as URLs.");
            }
            if (urlA === urlB) {
                document.getElementById('emptyStateCards').classList.remove('hidden');
                document.getElementById('heroSection').classList.remove('hidden');
                document.getElementById('manualSelectArea').classList.add('hidden');
                return alert("As URLs devem ser diferentes.");
            }
            if (bloquearUrlLocalSeNecessario(urlA) || bloquearUrlLocalSeNecessario(urlB)) {
                document.getElementById('emptyStateCards').classList.remove('hidden');
                document.getElementById('heroSection').classList.remove('hidden');
                document.getElementById('manualSelectArea').classList.add('hidden');
                if(compareArea) compareArea.classList.remove('hidden');
                return;
            }
            // 3. UI Loading
            const loading = document.getElementById('auditLoading');
            const results = document.getElementById('auditResults');
            if(loading) {
                loading.classList.remove('hidden');
                startAuditLoadingAnimation(urlA + ' × ' + urlB, 'compare');
            }
            if(results) results.classList.add('hidden');
            try {
                // 4. Tenta API Real
                const cfToken = turnstileCompareToken || document.querySelector('#turnstile-compare [name="cf-turnstile-response"]')?.value || '';
                if (!cfToken) {
                    initTurnstileCompare();
                    throw new Error("Resolva o captcha primeiro");
                }
                const res = await fetch(`${API_URL}/api/comparar`, {
                    method: 'POST',
                    headers: authHeaders({'Content-Type': 'application/json'}),
                    body: JSON.stringify({
                        url_a: urlA,
                        url_b: urlB,
                        cf_token: cfToken,
                        agents: []
                    })
                });
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    const errorDetail = errorData.detail || errorData.error || errorData;
                    const compareError = new Error(formatAuditApiError(errorDetail, res.status));
                    compareError.rawDetail = getAuditErrorDetailText(errorDetail);
                    throw compareError;
                }
                const response = await res.json();
                console.log("📡 Resposta da API:", response);
                // Extrai battle_data se existir (novo formato), ou usa response diretamente
                const data = response.battle_data || response;
                console.log("📦 Dados para renderizar:", data);
                // Validação: aceita novo formato (executive_verdict) ou antigo (site_a/site_b)
                if(!data || (!data.executive_verdict && (!data.site_a || !data.site_b))) {
                    throw new Error("Dados da API incompletos ou formato inválido");
                }
                stopAuditLoadingAnimation();
                displayCompareResults(data);
            } catch (e) {
                if (String(e.message || '').toLowerCase().includes('captcha')) {
                    restoreAuditInputState('compare');
                    initTurnstileCompare();
                    Toast.warning('Resolva o captcha primeiro');
                    return;
                }
                cancelAuditDueToApiError({
                    mode: 'compare',
                    reason: e.rawDetail || e.message || 'Falha de conexão com a API comparativa.',
                    displayMessage: e.message || 'Não foi possível conectar com a API comparativa. A análise foi cancelada.',
                    resetCaptcha: true
                });
                return;
                resetCompareCaptcha();
                console.warn("⚠️ Ativando MODO SIMULAÇÃO (Fallback). Motivo:", e.message);
                stopAuditLoadingAnimation();
                // 5. MODO SIMULAÇÃO - Novo Formato Enriquecido
                setTimeout(() => {
                    const scoreA = Math.floor(Math.random() * 20) + 70;
                    const scoreB = Math.floor(Math.random() * 20) + 60;
                    const isSiteABetter = scoreA > scoreB;
                    const mockData = {
                        executive_verdict: {
                            winner_site: isSiteABetter ? "Site A" : "Site B",
                            score_diff: isSiteABetter ? `+${scoreA - scoreB} pontos` : `+${scoreB - scoreA} pontos`,
                            summary: isSiteABetter
                                ? "Site A demonstra desempenho superior em velocidade, acessibilidade e experiência do usuário."
                                : "Site B supera na estrutura visual e otimização, mas deixa espaço para melhorias em performance."
                        },
                        agent_battleground: [
                            {
                                agent: "Executivo/CEO",
                                preference: isSiteABetter ? "Site A" : "Site B",
                                reason: "Apresentação clara com dados acionáveis"
                            },
                            {
                                agent: "Design Enthusiast",
                                preference: !isSiteABetter ? "Site A" : "Site B",
                                reason: "Estética moderna com excelente tipografia"
                            },
                            {
                                agent: "Usuário Mobile",
                                preference: isSiteABetter ? "Site A" : "Site B",
                                reason: "Navegação fluida e responsiva"
                            },
                            {
                                agent: "Idoso/Iniciante",
                                preference: isSiteABetter ? "Site A" : "Site B",
                                reason: "Interface intuitiva com contraste adequado"
                            }
                        ],
                        technical_faceoff: [
                            {
                                criteria: "Velocidade (LCP)",
                                winner: isSiteABetter ? "Site A" : "Site B",
                                analysis: isSiteABetter
                                    ? "Site A carrega em ~1.8s, Site B em ~2.5s"
                                    : "Site B otimizado com lazy loading eficiente"
                            },
                            {
                                criteria: "Acessibilidade (WCAG)",
                                winner: isSiteABetter ? "Site A" : "Site B",
                                analysis: "Contraste e navegação teclado implementados"
                            },
                            {
                                criteria: "SEO Score",
                                winner: isSiteABetter ? "Site A" : "Site B",
                                analysis: "Meta tags e structured data bem configurados"
                            },
                            {
                                criteria: "Performance (Lighthouse)",
                                winner: isSiteABetter ? "Site A" : "Site B",
                                analysis: "Score acima de 85 em desktop"
                            }
                        ],
                        gap_analysis: {
                            site_a_missing: [
                                "Otimização de imagens em formatos modernos",
                                "Implementação de Progressive Web App",
                                "Análise A/B integrada"
                            ],
                            site_b_missing: [
                                "Melhor compressão de assets",
                                "Cache headers configurados",
                                "Minificação de CSS/JS"
                            ]
                        },
                        action_plan_for_a: [
                            "Converter todas as imagens para WebP com fallback PNG",
                            "Implementar Service Worker para offline capability",
                            "Adicionar lazy loading em imagens acima da dobra",
                            "Otimizar CLS (Cumulative Layout Shift) removendo fontes não-críticas",
                            "Implementar CDN para servir assets estáticos",
                            "Configurar cache headers com max-age apropriado"
                        ],
                        novo_saldo: Math.max(0, USER.credits - 1)
                    };
                    displayCompareResults(mockData);
                }, 2500);
            }
        }
        function displayCompareResults(data) {
            console.log("🎯 Exibindo resultados:", data);
            // Armazenar dados globalmente para exportação PDF (comparação)
            auditData = data;
            currentAuditUrl = (data.site_a?.url || "Site A") + " vs " + (data.site_b?.url || "Site B");
            console.log("📊 Detectando formato...", {
                hasExecutiveVerdict: !!data.executive_verdict,
                hasSiteData: !!(data.site_a && data.site_b),
                executive_verdict: data.executive_verdict ? '✓ Presente' : '✗ Ausente',
                agent_battleground: data.agent_battleground ? `✓ ${data.agent_battleground.length} itens` : '✗ Ausente',
                technical_faceoff: data.technical_faceoff ? `✓ ${data.technical_faceoff.length} itens` : '✗ Ausente',
                gap_analysis: data.gap_analysis ? '✓ Presente' : '✗ Ausente',
                action_plan_for_a: data.action_plan_for_a ? `✓ ${data.action_plan_for_a.length} itens` : '✗ Ausente'
            });
            // 1. Proteção contra dados vazios
            if (!data) {
                console.error("❌ Dados inválidos recebidos:", data);
                alert("Erro ao renderizar resultados. Tente novamente.");
                updateCompareUI(false); // Volta para mostrar inputs
                return;
            }
            // 3. Atualiza UI
            const resDiv = document.getElementById('auditResults');
            if (!resDiv) {
                console.error("❌ Container auditResults não encontrado");
                updateCompareUI(false);
                return;
            }
            // Atualiza Menu Circular
            updateUserMenuCircle();
            // 2. Detecta Novo Formato (Análise Comparativa Rica)
            if (data.executive_verdict && data.agent_battleground) {
                console.log("✨ Usando renderizador RELATÓRIO EXECUTIVO (novo formato enriquecido)");
                renderComparisonReportV2(data, resDiv);
                updateCompareUI(true);
            }
            // Fallback para Formato Antigo
            else if (data.site_a && data.site_b) {
                console.log("🔄 Usando renderizador V1 (formato antigo compatível)");
                renderComparisonResultsV1(data, resDiv);
                updateCompareUI(true);
            } else {
                console.error("❌ Formato de dados não reconhecido");
                alert("Formato de resposta inesperado. Contacte o suporte.");
                updateCompareUI(false);  // Volta para mostrar inputs
            }
            if (!resDiv.classList.contains('hidden')) {
                hasUnsavedAuditSession = true;
                auditSnapshotTabOpened = false;
                openAuditSnapshotTab();
            }
        }
        // ===== RENDERIZADOR RELATÓRIO EXECUTIVO =====
        function renderComparisonReportV2(data, container) {
            const verdict = data.executive_verdict || {};
            const agents = data.agent_battleground || [];
            const technical = data.technical_faceoff || [];
            const gaps = data.gap_analysis || {};
            const actionPlan = data.action_plan_for_a || [];
            console.log("📄 Renderizando relatório executivo...");
            const isSiteAWinner = verdict.winner_site && verdict.winner_site.toLowerCase().includes('a');
            container.innerHTML = `
                <div class="report-container">
                    <!-- ===== PÁGINA 1: CAPA E RESUMO EXECUTIVO ===== -->
                    <div class="report-page">
                        <div style="text-align: center; padding: 60px 0; border-bottom: 2px solid #333; margin-bottom: 40px;">
                            <h1 style="font-size: 32px; font-weight: 900; color: black; margin: 0 0 10px 0;">AUDITORIA COMPARATIVA</h1>
                            <h2 style="font-size: 24px; color: #666; margin: 0 0 30px 0;">Análise de Inteligência Competitiva</h2>
                            <p style="font-size: 14px; color: #999; margin: 0;">Relatório Profissional | ${new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                        <div class="report-section">
                            <h3 style="font-size: 18px; font-weight: bold; color: black; margin-top: 0;">VENCEDOR DA ANÁLISE</h3>
                            <p style="font-size: 36px; font-weight: 900; color: ${isSiteAWinner ? '#0066cc' : '#cc3300'}; margin: 20px 0;">
                                ${verdict.winner_site || 'Indeterminado'}
                            </p>
                            <p style="font-size: 16px; color: #666; margin-bottom: 20px;">
                                <strong>Diferença de Desempenho:</strong> ${verdict.score_diff || 'N/A'}
                            </p>
                        </div>
                        <div class="report-section">
                            <h3 style="font-size: 16px; font-weight: bold; color: black; margin-top: 0;">RESUMO EXECUTIVO</h3>
                            <p style="font-size: 14px; line-height: 1.8; color: #333; margin: 0;">
                                ${verdict.summary || 'Análise não disponível'}
                            </p>
                        </div>
                        <div style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #ddd; font-size: 11px; color: #999;">
                            <p>SSW INTELLIGENCE | Análise Profissional de Benchmarking</p>
                        </div>
                    </div>
                    <!-- ===== PÁGINA 2: ANÁLISE COMPORTAMENTAL (AGENTS) ===== -->
                    <div class="report-page">
                        <h2 style="font-size: 24px; font-weight: bold; color: black; border-bottom: 2px solid #333; padding-bottom: 15px; margin-top: 0;">VISÃO DO USUÁRIO (AGENTS)</h2>
                        <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Análise de como diferentes perfis de usuários percebem cada site</p>
                        ${agents.length > 0 ? `
                            <table class="report-table">
                                <thead>
                                    <tr style="background: #f5f5f5;">
                                        <th style="width: 25%;">Agent</th>
                                        <th style="width: 25%;">Preferência</th>
                                        <th style="width: 50%;">Motivo</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${agents.map(p => `
                                        <tr>
                                            <td style="font-weight: bold;">${p.agent || 'N/A'}</td>
                                            <td>${p.preference || 'N/A'}</td>
                                            <td>${p.reason || 'Sem dados'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="color: #999;">Nenhuma análise de agents disponível</p>'}
                    </div>
                    <!-- ===== PÁGINA 3: CONFRONTO TÉCNICO ===== -->
                    <div class="report-page">
                        <h2 style="font-size: 24px; font-weight: bold; color: black; border-bottom: 2px solid #333; padding-bottom: 15px; margin-top: 0;">RAIO-X TÉCNICO</h2>
                        <p style="font-size: 12px; color: #666; margin-bottom: 20px;">Avaliação detalhada dos critérios técnicos e de performance</p>
                        ${technical.length > 0 ? `
                            <table class="report-table">
                                <thead>
                                    <tr style="background: #f5f5f5;">
                                        <th style="width: 25%;">Critério</th>
                                        <th style="width: 20%;">Vencedor</th>
                                        <th style="width: 55%;">Análise</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${technical.map(t => `
                                        <tr>
                                            <td style="font-weight: bold;">${t.criteria || 'N/A'}</td>
                                            <td style="color: ${t.winner && t.winner.toLowerCase().includes('a') ? '#0066cc' : '#cc3300'}; font-weight: bold;">
                                                ${t.winner || 'N/A'}
                                            </td>
                                            <td>${t.analysis || 'Sem dados'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        ` : '<p style="color: #999;">Nenhuma análise técnica disponível</p>'}
                    </div>
                    <!-- ===== PÁGINA 4: GAPS E PLANO DE AÇÃO ===== -->
                    <div class="report-page">
                        <h2 style="font-size: 24px; font-weight: bold; color: black; border-bottom: 2px solid #333; padding-bottom: 15px; margin-top: 0;">PLANO DE ATAQUE E OPORTUNIDADES</h2>
                        <!-- GAPS ANALYSIS -->
                        <h3 style="font-size: 16px; font-weight: bold; color: black; margin-top: 30px; margin-bottom: 15px;">Análise de Lacunas (Gaps)</h3>
                        <div class="report-gap-grid" style="page-break-inside: avoid;">
                            <div class="report-gap-column" style="page-break-inside: avoid; margin-bottom: 15px;">
                                <h4 style="font-size: 13px; font-weight: bold; color: #0066cc; margin-top: 0;">O QUE FALTA NO SITE A</h4>
                                <ul style="list-style: disc; margin-left: 20px; padding: 0; color: #333; page-break-inside: avoid;">
                                    ${(gaps.site_a_missing || []).map(gap => `<li style="margin: 8px 0; font-size: 12px; page-break-inside: avoid;">${gap}</li>`).join('') || '<li style="color: #999;">Nenhuma lacuna identificada</li>'}
                                </ul>
                            </div>
                            <div class="report-gap-column" style="page-break-inside: avoid;">
                                <h4 style="font-size: 13px; font-weight: bold; color: #cc3300; margin-top: 0;">O QUE FALTA NO SITE B</h4>
                                <ul style="list-style: disc; margin-left: 20px; padding: 0; color: #333; page-break-inside: avoid;">
                                    ${(gaps.site_b_missing || []).map(gap => `<li style="margin: 8px 0; font-size: 12px; page-break-inside: avoid;">${gap}</li>`).join('') || '<li style="color: #999;">Nenhuma lacuna identificada</li>'}
                                </ul>
                            </div>
                        </div>
                        <!-- ACTION PLAN -->
                        <h3 style="font-size: 16px; font-weight: bold; color: black; margin-top: 40px; margin-bottom: 15px; padding: 15px; background: #f0f4ff; border-left: 4px solid #0066cc;">
                            ⚡ PLANO DE AÇÃO RECOMENDADO PARA SITE A
                        </h3>
                        ${actionPlan.length > 0 ? `
                            <ol class="report-checklist" style="color: #333; page-break-inside: avoid;">
                                ${actionPlan.slice(0, 4).map(action => `
                                    <li style="margin: 12px 0; font-size: 13px; line-height: 1.6; padding: 8px; background: #fafafa; page-break-inside: avoid;">
                                        ${action}
                                    </li>
                                `).join('')}
                            </ol>
                        ` : '<p style="color: #999;">Nenhuma ação recomendada disponível</p>'}
                        <div style="margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #999; text-align: right;">
                            <p>Fim do Relatório | SSW INTELLIGENCE | ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
                        </div>
                    </div>
                </div>
                <!-- BOTÃO EXPORTAR PDF (Não aparece no print) -->
                <div style="margin-top: 30px; padding: 20px; text-align: center; background: #f5f5f5; border-radius: 8px;" class="no-print">
                    <button onclick="gerarPDFOficial()" style="padding: 12px 30px; font-size: 14px; font-weight: bold; background: #0066cc; color: white; border: none; border-radius: 6px; cursor: pointer; margin-right: 10px;">
                        📥 EXPORTAR COMO PDF
                    </button>
                    <button onclick="smoothScrollTo('compareArea')" style="padding: 12px 30px; font-size: 14px; font-weight: bold; background: #666; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        ↻ NOVA COMPARAÇÃO
                    </button>
                </div>
            `;
            lucide.createIcons();
        }
        // ===== RENDERIZADOR V2 - NOVO FORMATO ENRIQUECIDO =====
        function renderComparisonResultsV2(data, container) {
            const verdict = data.executive_verdict || {};
            const agents = data.agent_battleground || [];
            const technical = data.technical_faceoff || [];
            const gaps = data.gap_analysis || {};
            const actionPlan = data.action_plan_for_a || [];
            console.log("🎯 V2 - Renderizando com dados:", {
                verdict: verdict.winner_site,
                agents: agents.length,
                technical: technical.length,
                gaps: { a: gaps.site_a_missing?.length || 0, b: gaps.site_b_missing?.length || 0 },
                actionPlan: actionPlan.length
            });
            const isSiteAWinner = verdict.winner_site && verdict.winner_site.toLowerCase().includes('a');
            const winnerColor = isSiteAWinner ? 'from-cyan-500 to-blue-600' : 'from-orange-500 to-red-600';
            const badgeColor = isSiteAWinner ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-red-500/20 border-red-500/50 text-red-300';
            const accentColor = isSiteAWinner ? 'text-cyan-400' : 'text-orange-400';
            const accentBg = isSiteAWinner ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-orange-500/10 border-orange-500/30';
            container.innerHTML = `
                <!-- ===== SECTION 1: VEREDITO EXECUTIVO ===== -->
                <div class="mb-12 animate-fade-in-up">
                    <div class="relative overflow-hidden rounded-3xl border border-slate-700/50 bg-gradient-to-br ${winnerColor} p-0.5">
                        <div class="bg-slate-900/95 backdrop-blur rounded-3xl p-10 relative z-10">
                            <div class="relative z-20 text-center">
                                <div class="inline-block mb-6">
                                    <i data-lucide="crown" class="w-10 h-10 ${accentColor}"></i>
                                </div>
                                <h2 class="text-5xl md:text-6xl font-black text-white mb-4">${verdict.winner_site || 'Indeterminado'}</h2>
                                <p class="text-slate-300 text-lg mb-6 max-w-2xl mx-auto">${verdict.summary || 'Análise em progresso...'}</p>
                                <div class="flex flex-col md:flex-row items-center justify-center gap-4">
                                    <div class="px-6 py-3 rounded-full border ${badgeColor} font-bold text-lg">
                                        ${verdict.score_diff || '+0 pontos'}
                                    </div>
                                    <div class="text-slate-400 text-sm">Diferença de Desempenho</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!-- ===== SECTION 2: BATALHA DAS AGENTS ===== -->
                ${agents.length > 0 ? `
                <div class="mb-12">
                    <div class="mb-6">
                        <h3 class="text-2xl font-bold text-white flex items-center gap-3">
                            <i data-lucide="users" class="w-6 h-6 ${accentColor}"></i>
                            Batalha das Agents
                        </h3>
                        <p class="text-slate-400 text-sm mt-2">Como diferentes tipos de usuários percebem cada site</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${agents.map((p, idx) => {
                            const agentWinsA = p.preference && p.preference.toLowerCase().includes('a');
                            const agentBg = agentWinsA ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-orange-500/30 bg-orange-500/5';
                            const agentBadgeColor = agentWinsA ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' : 'bg-orange-500/20 text-orange-300 border-orange-500/30';
                            return `
                            <div class="group p-6 rounded-2xl border ${agentBg} backdrop-blur-xl hover:border-slate-500/50 transition-all hover:translate-y-[-4px]">
                                <div class="flex items-start justify-between mb-4">
                                    <div>
                                        <h4 class="text-lg font-bold text-white">${p.agent || 'Agent ' + (idx + 1)}</h4>
                                        <div class="inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold border ${agentBadgeColor}">
                                            Prefere: ${p.preference || 'N/A'}
                                        </div>
                                    </div>
                                    <i data-lucide="heart" class="w-5 h-5 ${agentWinsA ? 'text-cyan-400' : 'text-orange-400'}"></i>
                                </div>
                                <p class="text-slate-300 text-sm mt-4">${p.reason || 'Sem dados disponíveis'}</p>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
                <!-- ===== SECTION 3: CONFRONTO TÉCNICO ===== -->
                ${technical.length > 0 ? `
                <div class="mb-12">
                    <div class="mb-6">
                        <h3 class="text-2xl font-bold text-white flex items-center gap-3">
                            <i data-lucide="zap" class="w-6 h-6 ${accentColor}"></i>
                            Confronto Técnico
                        </h3>
                        <p class="text-slate-400 text-sm mt-2">Comparação de métricas e comportamentos técnicos</p>
                    </div>
                    <div class="space-y-3">
                        ${technical.map((t, idx) => {
                            const techWinnerA = t.winner && t.winner.toLowerCase().includes('a');
                            const techSignal = techWinnerA ? '→' : '←';
                            const techColor = techWinnerA ? 'from-cyan-600/20 to-cyan-600/5 border-cyan-600/30' : 'from-orange-600/20 to-orange-600/5 border-orange-600/30';
                            return `
                            <div class="p-5 rounded-xl border bg-gradient-to-r ${techColor} backdrop-blur-sm hover:border-slate-500/50 transition-all">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="flex-1">
                                        <h5 class="font-bold text-white text-sm mb-2 flex items-center gap-2">
                                            <span class="w-2 h-2 rounded-full ${techWinnerA ? 'bg-cyan-400' : 'bg-orange-400'}"></span>
                                            ${t.criteria || 'Critério ' + (idx + 1)}
                                        </h5>
                                        <p class="text-slate-300 text-sm">${t.analysis || 'Análise indisponível'}</p>
                                    </div>
                                    <div class="flex-shrink-0 text-right">
                                        <div class="text-2xl font-black ${techWinnerA ? 'text-cyan-400' : 'text-orange-400'}">${techSignal}</div>
                                        <p class="text-xs text-slate-400 mt-1">${t.winner || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>
                ` : ''}
                <!-- ===== SECTION 4: ANÁLISE DE GAPS ===== -->
                ${(gaps.site_a_missing && gaps.site_a_missing.length > 0) || (gaps.site_b_missing && gaps.site_b_missing.length > 0) ? `
                <div class="mb-12">
                    <div class="mb-6">
                        <h3 class="text-2xl font-bold text-white flex items-center gap-3">
                            <i data-lucide="target" class="w-6 h-6 ${accentColor}"></i>
                            Análise de Gaps - Oportunidades
                        </h3>
                        <p class="text-slate-400 text-sm mt-2">O que falta para vencer</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Site A Gaps -->
                        <div class="p-6 rounded-2xl border border-cyan-600/30 bg-cyan-600/5 backdrop-blur-xl">
                            <div class="flex items-center gap-3 mb-4">
                                <i data-lucide="alert-triangle" class="w-5 h-5 text-cyan-400"></i>
                                <h4 class="font-bold text-white text-lg">Site A</h4>
                            </div>
                            <p class="text-slate-400 text-xs mb-4">O que deixou na mesa:</p>
                            <ul class="space-y-2">
                                ${(gaps.site_a_missing || []).map(gap => `
                                <li class="flex items-start gap-3 text-slate-300 text-sm">
                                    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                                    <span>${gap}</span>
                                </li>
                                `).join('')}
                            </ul>
                        </div>
                        <!-- Site B Gaps -->
                        <div class="p-6 rounded-2xl border border-orange-600/30 bg-orange-600/5 backdrop-blur-xl">
                            <div class="flex items-center gap-3 mb-4">
                                <i data-lucide="target" class="w-5 h-5 text-orange-400"></i>
                                <h4 class="font-bold text-white text-lg">Site B</h4>
                            </div>
                            <p class="text-slate-400 text-xs mb-4">Oportunidade para Site A atacar:</p>
                            <ul class="space-y-2">
                                ${(gaps.site_b_missing || []).map(gap => `
                                <li class="flex items-start gap-3 text-slate-300 text-sm">
                                    <span class="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1.5 flex-shrink-0"></span>
                                    <span>${gap}</span>
                                </li>
                                `).join('')}
                            </ul>
                        </div>
                    </div>
                </div>
                ` : ''}
                <!-- ===== SECTION 5: PLANO DE AÇÃO TÁTICO ===== -->
                ${actionPlan.length > 0 ? `
                <div class="mb-12">
                    <div class="mb-6">
                        <h3 class="text-2xl font-bold text-white flex items-center gap-3">
                            <i data-lucide="rocket" class="w-6 h-6 ${accentColor}"></i>
                            Plano de Ação Tático para Site A
                        </h3>
                        <p class="text-slate-400 text-sm mt-2">Próximas ações para ultrapassar o concorrente</p>
                    </div>
                    <div class="space-y-3">
                        ${actionPlan.map((action, idx) => `
                        <div class="group p-5 rounded-xl border border-blue-600/30 bg-gradient-to-r from-blue-600/10 to-blue-600/5 backdrop-blur-xl hover:border-blue-400/50 transition-all hover:translate-x-2">
                            <div class="flex items-start gap-4">
                                <div class="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/50 flex items-center justify-center mt-0.5">
                                    <span class="text-sm font-bold text-blue-300">${idx + 1}</span>
                                </div>
                                <div class="flex-1">
                                    <p class="text-white font-medium">${action}</p>
                                </div>
                                <i data-lucide="arrow-right" class="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"></i>
                            </div>
                        </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                <!-- CTA e PDF -->
                <div class="mt-12 flex flex-col md:flex-row gap-4 items-center justify-center">
                    <button onclick="gerarPDFOficial()" class="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105">
                        <i data-lucide="file-down" class="w-5 h-5"></i>
                        BAIXAR RELATÓRIO PDF
                    </button>
                    <button onclick="smoothScrollTo('compareArea')" class="flex items-center gap-2 px-8 py-4 rounded-xl font-bold border border-slate-600 text-slate-300 hover:border-slate-400 hover:text-white transition-all">
                        <i data-lucide="repeat" class="w-5 h-5"></i>
                        NOVA COMPARAÇÃO
                    </button>
                </div>
            `;
            console.log("✅ V2 Renderizado com sucesso - Novo formato");
            lucide.createIcons();
        }
        // ===== RENDERIZADOR V1 - FORMATO COMPATÍVEL (ANTIGO) =====
        function renderComparisonResultsV1(data, container) {
            // 2. Extração Segura de Dados
            const scoreA = data.site_a.score || 0;
            const scoreB = data.site_b.score || 0;
            const vulnsA = data.site_a.vulnerabilities || ["Sem dados"];
            const vulnsB = data.site_b.vulnerabilities || ["Sem dados"];
            // Define Vencedor
            const winner = scoreA > scoreB ? "SEU SITE" : "CONCORRENTE";
            const winnerClass = scoreA > scoreB ? "text-cyan-400" : "text-orange-400";
            // 4. Renderiza HTML
            container.innerHTML = `
                <div class="text-center mb-10 animate-fade-in-up">
                    <div class="inline-block p-4 rounded-2xl bg-slate-900/50 border border-slate-700 mb-4">
                        <i data-lucide="trophy" class="w-8 h-8 text-yellow-500 mx-auto mb-2"></i>
                        <h3 class="text-xl font-bold text-white">Vencedor do Duelo</h3>
                        <p class="text-2xl font-black ${winnerClass} mt-1">${winner}</p>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div class="glass-panel p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden group">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h4 class="text-cyan-400 font-bold text-lg">Seu Site</h4>
                                <p class="text-xs text-slate-500 font-mono truncate max-w-[200px]">${data.site_a.url}</p>
                            </div>
                            <div class="text-5xl font-black text-white">${scoreA}</div>
                        </div>
                        <p class="text-sm text-slate-300 mb-6 min-h-[50px]">${data.site_a.summary}</p>
                        <div class="space-y-2">
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pontos de Atenção</p>
                            ${vulnsA.map(v => `<div class="flex items-center gap-2 text-xs text-red-300 bg-red-900/10 p-2 rounded border border-red-900/20"><i data-lucide="alert-circle" class="w-3 h-3"></i> ${v}</div>`).join('')}
                        </div>
                    </div>
                    <div class="glass-panel p-6 rounded-2xl border border-slate-700/50 relative overflow-hidden group">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h4 class="text-orange-400 font-bold text-lg">Concorrente</h4>
                                <p class="text-xs text-slate-500 font-mono truncate max-w-[200px]">${data.site_b.url}</p>
                            </div>
                            <div class="text-5xl font-black text-white">${scoreB}</div>
                        </div>
                        <p class="text-sm text-slate-300 mb-6 min-h-[50px]">${data.site_b.summary}</p>
                        <div class="space-y-2">
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pontos de Atenção</p>
                            ${vulnsB.map(v => `<div class="flex items-center gap-2 text-xs text-red-300 bg-red-900/10 p-2 rounded border border-red-900/20"><i data-lucide="alert-circle" class="w-3 h-3"></i> ${v}</div>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="mt-10 text-center">
                    <button onclick="gerarPDFOficial()" class="bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg inline-flex items-center gap-2 transition-all hover:scale-105">
                        <i data-lucide="file-down" class="w-5 h-5"></i> BAIXAR RELATÓRIO PDF
                    </button>
                </div>
            `;
            console.log("✅ V1 Renderizado com sucesso - Formato antigo");
            lucide.createIcons();
        }
        // === 6. FALLBACK AUDIT (QUANDO IA ESTIVER INDISPONÍVEL) ===
        async function generateFallbackAudit(url, mode, selected) {
            stopAuditLoadingAnimation();
            document.getElementById('auditLoading').classList.add('hidden');
            // Criar estrutura HTML inicial para todas as seções
            createAuditResultsStructureModern();
            setAuditPillarsVisibility(mode === 'auto');
            // Armazenar dados globalmente para exportação PDF (fallback)
            auditData = {
                url: url,
                technical_audit: {
                    score: Math.floor(Math.random() * 30) + 60,
                    performance_score: Math.floor(Math.random() * 30) + 60,
                    seo_score: Math.floor(Math.random() * 30) + 60,
                    accessibility_score: Math.floor(Math.random() * 30) + 60,
                    lcp: (Math.random() * 3 + 1).toFixed(1),
                    load_time: (Math.random() * 4 + 1).toFixed(1),
                    executive_summary: "Análise realizada com modo de avaliação básica. Sistema de IA temporariamente indisponível. Esta análise contém informações gerais baseadas em heurísticas web comuns.",
                    vulnerabilities: [],
                    action_plan: []
                },
                agents_results: [],
                behavioral_analysis: []
            };
            currentAuditUrl = url;
            document.getElementById('auditResults').classList.remove('hidden');
            // Gera score aleatório entre 60-89
            const score = Math.floor(Math.random() * 30) + 60;
            // Atualiza créditos (simula consumo)
            USER.credits = Math.max(0, USER.credits - 1);
            // Salva dados criptografados se secureStorage disponível
            if (typeof secureStorage !== 'undefined') {
                await secureStorage.setItem('USER', USER);
            } else {
                localStorage.setItem('USER', JSON.stringify(USER));
            }
            updateUserMenuCircle();
            // Popula Dados Fallback com verificações de segurança
            const resScoreEl = document.getElementById('resScore');
            if (resScoreEl) resScoreEl.innerText = score;
            document.querySelector('.audit-score-board')?.setAttribute('data-score-tone', getAuditScoreTone(score));
            const resUrlEl = document.getElementById('reportUrl');
            if (resUrlEl) resUrlEl.innerText = url.replace(/https?:\/\//, '').split('/')[0];
            const resSummaryEl = document.getElementById('resSummary');
            if (resSummaryEl) resSummaryEl.innerText = "Análise realizada com modo de avaliação básica. Sistema de IA temporariamente indisponível. Esta análise contém informações gerais baseadas em heurísticas web comuns.";
            // Função para determinar cor baseada no score
            function getScoreColor(score) {
                if (score >= 90) return "text-green-400";
                if (score >= 50) return "text-yellow-500";
                return "text-red-500";
            }
            // Função para determinar cor de tempo (em segundos)
            function getTimeColor(timeStr) {
                const time = parseFloat(timeStr);
                if (time <= 2.5) return "text-green-400";
                if (time <= 4.0) return "text-yellow-500";
                return "text-red-500";
            }
            // Gera métricas reais simuladas para fallback
            const fallbackMetrics = {
                performance_score: Math.floor(Math.random() * 30) + 60, // 60-89
                seo_score: Math.floor(Math.random() * 20) + 80, // 80-99
                accessibility_score: Math.floor(Math.random() * 25) + 70, // 70-94
                lcp: `${(Math.random() * 3 + 1.5).toFixed(1)} s`, // 1.5-4.5s
                load_time: `${(Math.random() * 2 + 1).toFixed(1)} s` // 1.0-3.0s
            };
            // Popula métricas reais do Google PageSpeed (Fallback)
            const perfScoreEl = document.getElementById('realPerformanceScore');
            if (perfScoreEl) {
                perfScoreEl.innerText = fallbackMetrics.performance_score;
                perfScoreEl.className = `text-4xl font-black ${getScoreColor(fallbackMetrics.performance_score)}`;
            }
            const seoScoreEl = document.getElementById('realSeoScore');
            if (seoScoreEl) {
                seoScoreEl.innerText = fallbackMetrics.seo_score;
                seoScoreEl.className = `text-4xl font-black ${getScoreColor(fallbackMetrics.seo_score)}`;
            }
            const a11yScoreEl = document.getElementById('realA11yScore');
            if (a11yScoreEl) {
                a11yScoreEl.innerText = fallbackMetrics.accessibility_score;
                a11yScoreEl.className = `text-4xl font-black ${getScoreColor(fallbackMetrics.accessibility_score)}`;
            }
            const lcpEl = document.getElementById('realLcp');
            if (lcpEl) {
                lcpEl.innerText = fallbackMetrics.lcp;
                lcpEl.className = `text-2xl font-bold ${getTimeColor(fallbackMetrics.lcp)}`;
            }
            const loadTimeEl = document.getElementById('realLoadTime');
            if (loadTimeEl) {
                loadTimeEl.innerText = fallbackMetrics.load_time;
                loadTimeEl.className = `text-2xl font-bold ${getTimeColor(fallbackMetrics.load_time)}`;
            }
            // Imagens placeholder com verificações
            const printMobileEl = document.getElementById('printMobile');
            if (printMobileEl) {
                printMobileEl.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDMwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMUYyOTM3Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMzAwIiBmaWxsPSIjNjY3MDgxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPk1vYmlsZSBWaWV3PC90ZXh0Pgo8L3N2Zz4=";
                printMobileEl.closest('.audit-shot-frame')?.classList.add('has-capture');
            }
            const printDesktopEl = document.getElementById('printDesktop');
            if (printDesktopEl) {
                printDesktopEl.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMUYyOTM3Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiBmaWxsPSIjNjY3MDgxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkRlc2t0b3AgVmlldzwvdGV4dD4KPC9zdmc+";
                printDesktopEl.closest('.audit-shot-frame')?.classList.add('has-capture');
            }
            if (mode === 'auto') {
                renderPillarsDashboard({
                    score,
                    real_metrics: fallbackMetrics,
                    pillars_evaluation: {
                        accessibility_performance: { score: fallbackMetrics.accessibility_score, brief: 'Performance e acessibilidade estimadas em modo de contingencia.' },
                        security: { score: Math.max(55, score - 8), brief: 'Sinais de confiança avaliados por heurísticas básicas.' },
                        functional_integrity: { score: Math.max(50, score - 5), brief: 'Fluxos e links exigem validação detalhada na próxima auditoria completa.' },
                        conversion_ux: { score, brief: 'Clareza da oferta e chamadas de ação avaliadas por regras gerais.' }
                    }
                });
            }
            // Vulnerabilidades baseadas no score
            const vDiv = document.getElementById('vulnerabilitiesTableBody');
            if (vDiv) {
                const listaVulnerabilidades = [
                    {
                        severity: score < 70 ? 'CR?TICO' : score < 80 ? 'ALTO' : 'M?DIO',
                        pillar: 'Performance',
                        title: score < 70 ? 'Performance geral baixa' : score < 80 ? 'Otimiza??es de performance necess?rias' : 'Pequenas otimiza??es sugeridas',
                        description: 'A an?lise em modo de conting?ncia detectou oportunidades de melhoria na performance geral do site.'
                    },
                    { severity: 'M?DIO', pillar: 'SEO', title: 'SEO t?cnico', description: 'Existem melhorias a serem implementadas nos aspectos t?cnicos de descoberta e estrutura da p?gina.' },
                    { severity: 'BAIXO', pillar: 'Acessibilidade', title: 'Acessibilidade e clareza', description: 'Algumas pr?ticas de acessibilidade poderiam ser revisadas para tornar a experi?ncia mais previs?vel.' }
                ];
                vDiv.innerHTML = listaVulnerabilidades.map((v, index) => {
                    const severity = getSeverityMeta(v.severity);
                    return [
                        '<article class="audit-risk-card audit-risk-' + severity.tone + '">',
                            '<div class="audit-risk-number">' + String(index + 1).padStart(2, '0') + '</div>',
                            '<div class="audit-risk-content">',
                                '<div class="audit-risk-meta">',
                                    '<span class="audit-severity audit-severity-' + severity.tone + '">' + safeAuditText(severity.label) + '</span>',
                                    '<span>' + safeAuditText(v.pillar) + '</span>',
                                '</div>',
                                '<h3>' + safeAuditText(v.title) + '</h3>',
                                '<p>' + safeAuditText(v.description) + '</p>',
                            '</div>',
                        '</article>'
                    ].join('');
                }).join('');
            }
            // Agents simuladas
            const pDiv = document.getElementById('agentsTableBody');
            if (pDiv) {
                const agentsToUse = selected.length > 0 ? selected : [];
                if (!agentsToUse.length) {
                    pDiv.innerHTML = '<div class="audit-empty-block"><strong>Nenhuma agent foi aplicada.</strong><p>O modo de conting?ncia entregou apenas uma leitura t?cnica b?sica.</p></div>';
                } else {
                    const quotes = [
                        'Site funcional, mas poderia ser mais intuitivo.',
                        'Navega??o aceit?vel, mas alguns elementos poderiam ser mais claros.',
                        'Consigo usar sem grandes dificuldades, embora existam pontos de fric??o.'
                    ];
                    pDiv.innerHTML = agentsToUse.map((agent, index) => {
                        const fallbackPersona = typeof agent === 'string' ? manualPersonaCache.find(p => p.id === agent) : null;
                        const agentName = fallbackPersona?.name || (typeof agent === 'string' ? agent.split(':')[0] : agent.name) || 'Persona SSW';
                        const agentScore = Math.floor(Math.random() * 4) + 6;
                        const tone = agentScore >= 8 ? 'strong' : agentScore <= 6 ? 'critical' : 'attention';
                        return [
                            '<article class="audit-agent-card audit-agent-' + tone + '">',
                                '<div class="audit-agent-header">',
                                    '<div><h3>' + safeAuditText(agentName) + '</h3><span>Score ' + agentScore + '/10</span></div>',
                                    '<strong>' + agentScore + '</strong>',
                                '</div>',
                                '<blockquote>"' + safeAuditText(quotes[index % quotes.length]) + '"</blockquote>',
                            '</article>'
                        ].join('');
                    }).join('');
                }
            }
            // Plano de A??o Fallback
            const actionPlanList = document.getElementById('actionPlanList');
            if (actionPlanList) {
                const fallbackSteps = [
                    'Otimizar imagens e implementar lazy loading para melhorar performance.',
                    'Revisar meta tags e estrutura SEO para melhorar leitura por buscadores.',
                    'Melhorar contraste, foco e navega??o por teclado para acessibilidade.',
                    'Implementar cache de navegador para reduzir tempo de carregamento.'
                ];
                actionPlanList.innerHTML = fallbackSteps.map((stepText, i) => [
                    '<article class="audit-action-card">',
                        '<div class="audit-action-index">' + String(i + 1).padStart(2, '0') + '</div>',
                        '<div><span>Conting?ncia</span><p>' + safeAuditText(stepText) + '</p></div>',
                    '</article>'
                ].join('')).join('');
            }
            initAuditResultReveal();
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            hasUnsavedAuditSession = true;
            auditSnapshotTabOpened = false;
            openAuditSnapshotTab();
            adjustFooterPosition(true);
        }
        // === FUNÇÕES DE CONTROLE DO FOOTER ===
        function adjustFooterPosition(hasAuditResults = false) {
            const footerHost = document.getElementById('footer-container');
            const footerAnchor = document.getElementById('footer-anchor');
            const footer = document.getElementById('mainFooter');
            const main = document.getElementById('mainContent');
            const homeFooterSpacer = document.getElementById('homeFooterSpacer');
            if (!footerHost || !footerAnchor) return;

            if (footer && footer.parentElement !== footerHost) {
                footerHost.appendChild(footer);
            }

            if (footer) {
                footer.classList.remove('audit-footer-position');
                footer.style.position = '';
                footer.style.width = '';
                footer.style.margin = '';
                footer.style.padding = '';
                footer.style.zIndex = '';
                footer.style.clear = '';
                footer.style.background = '#000000';
                footer.style.borderTop = '1px solid rgba(255,255,255,0.08)';
            }

            if (footerHost.previousElementSibling !== footerAnchor) {
                footerAnchor.insertAdjacentElement('afterend', footerHost);
            }

            if (homeFooterSpacer) {
                homeFooterSpacer.classList.toggle('hidden', hasAuditResults);
            }

            if (hasAuditResults) {
                document.body.classList.add('audit-active');
                if (main) main.style.paddingBottom = '0';
            } else {
                // Remove classe do body
                document.body.classList.remove('audit-active');
                // Restaura overflow do body
                document.body.style.overflow = '';
                document.body.style.height = '';
                // Remove padding do main
                if (main) main.style.paddingBottom = '';
            }
        }
        function checkForAuditResults() {
            // Verifica se há resultados de auditoria na tela
            const auditResults = document.getElementById('auditResults');
            const hasResults = !!(auditResults && !auditResults.classList.contains('hidden'));
            console.log('=== DEBUG FOOTER ===');
            console.log('auditResults hidden:', auditResults ? auditResults.classList.contains('hidden') : 'elemento não encontrado');
            console.log('hasResults:', hasResults);
            console.log('Footer parent:', document.getElementById('mainFooter')?.parentNode?.tagName || 'não encontrado');
            adjustFooterPosition(hasResults);
        }
        // === FUNÇÃO PARA BOTÃO FLUTUANTE DE CHAT ===
        function addFloatingChatButton(agents) {
            // Verifica se está na página principal (home) e há resultados de auditoria
            const currentView = window.currentView || 'home';
            const auditResults = document.getElementById('auditResults');
            const agentsGrid = document.getElementById('agentsGrid');
            const actionPlanSection = document.getElementById('actionPlanSection');
            const hasAuditResults = !!(auditResults && !auditResults.classList.contains('hidden')) ||
                                 !!(agentsGrid && agentsGrid.children.length > 0) ||
                                 !!(actionPlanSection && !actionPlanSection.classList.contains('hidden'));
            // Se o chat de agents estiver ativo, não reexibe o botão
            if (agentChatActive) {
                const existingBtn = document.getElementById('floatingChatBtn');
                if (existingBtn) existingBtn.style.display = 'none';
                return;
            }
            // Só adiciona botão se estiver na home e houver resultados de auditoria
            if (currentView !== 'home' || !hasAuditResults || !agents || agents.length === 0) {
                // Remove botão anterior se existir
                const existingBtn = document.getElementById('floatingChatBtn');
                if (existingBtn) existingBtn.remove();
                return; // Não adiciona o botão
            }
            // Remove botão anterior se existir
            const existingBtn = document.getElementById('floatingChatBtn');
            if (existingBtn) existingBtn.remove();
            // Cria botão flutuante
            const chatBtn = document.createElement('div');
            chatBtn.id = 'floatingChatBtn';
            chatBtn.className = 'no-print';
            chatBtn.style.cssText = `
                position: fixed;
                bottom: 28px;
                right: 24px;
                z-index: 9999;
                background: linear-gradient(135deg, #2563eb, #7c3aed);
                color: white;
                padding: 14px 24px;
                border-radius: 999px;
                cursor: pointer;
                box-shadow: 0 22px 60px rgba(37, 99, 235, 0.18);
                transition: transform 0.25s ease, box-shadow 0.25s ease;
                font-weight: 700;
                font-size: 14px;
                display: inline-flex;
                align-items: center;
                gap: 10px;
                min-width: 230px;
                max-width: calc(100% - 48px);
            `;
            chatBtn.innerHTML = `
                <div style="display:flex;align-items:center;gap:14px;">
                    <div style="width:42px;height:42px;border-radius:14px;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                    </div>
                    <div style="display:flex;flex-direction:column;align-items:flex-start;line-height:1.1;">
                        <span style="font-size:14px;font-weight:700;">Falar com agents</span>
                        <span style="font-size:11px;color:rgba(255,255,255,0.88);">Escolha um perfil e converse</span>
                    </div>
                </div>
            `;
            // Adiciona hover effect
            chatBtn.onmouseover = () => {
                chatBtn.style.transform = 'translateY(-2px)';
                chatBtn.style.boxShadow = '0 24px 70px rgba(37, 99, 235, 0.25)';
            };
            chatBtn.onmouseout = () => {
                chatBtn.style.transform = 'translateY(0)';
                chatBtn.style.boxShadow = '0 22px 60px rgba(37, 99, 235, 0.18)';
            };
            // Cria menu de seleção de agents (esconde o botão quando aberto)
            window._lastAgentsList = agents;
            chatBtn.onclick = () => {
                showAgentSelector(agents);
            };

            document.body.appendChild(chatBtn);
            // Adiciona CSS da animação e estilo do chat
            if (!document.getElementById('chatBtnStyles')) {
                const style = document.createElement('style');
                style.id = 'chatBtnStyles';
                style.textContent = `
                    @keyframes pulse {
                        0% { transform: scale(1); }
                        50% { transform: scale(1.05); }
                        100% { transform: scale(1); }
                    }
                    @keyframes typingBounce {
                        0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
                        30% { transform: translateY(-7px); opacity: 1; }
                    }
                    @keyframes msgSlideIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .chat-msg-enter {
                        animation: msgSlideIn 0.22s ease forwards;
                    }
                    .agent-select-card {
                        display: block;
                        width: 100%;
                        border-radius: 18px;
                        background: #080d16;
                        border: 1px solid rgba(255, 255, 255, 0.55);
                        padding: 18px 20px;
                        text-align: left;
                        color: #f8fafc;
                        cursor: pointer;
                        transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
                    }
                    .agent-select-card:hover {
                        transform: translateY(-2px);
                        border-color: #67e8f9;
                        background: #1e293b;
                    }
                    .agent-select-card-title {
                        font-size: 15px;
                        font-weight: 700;
                        letter-spacing: 0.01em;
                        margin-bottom: 6px;
                    }
                    .agent-select-card-meta {
                        font-size: 12px;
                        color: #8292a8;
                    }
                    .chat-avatar-ai {
                        width: 30px; height: 30px; min-width: 30px;
                        border-radius: 10px;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 11px; font-weight: 700;
                        margin-bottom: 2px;
                        flex-shrink: 0;
                    }
                    .chat-avatar-user {
                        width: 30px; height: 30px; min-width: 30px;
                        border-radius: 10px;
                        background: linear-gradient(135deg, #14b8a6, #0f766e);
                        display: flex; align-items: center; justify-content: center;
                        font-size: 10px; font-weight: 700; color: white;
                        margin-bottom: 2px;
                        flex-shrink: 0;
                    }
                    .chat-bubble-user {
                        background: linear-gradient(135deg, #22d3ee, #0ea5e9);
                        color: #020408;
                        border-radius: 16px 16px 4px 16px;
                        padding: 10px 14px;
                        font-size: 14px;
                        line-height: 1.6;
                        box-shadow: 0 4px 14px rgba(8, 145, 178, 0.25);
                        word-break: break-word;
                    }
                    .chat-bubble-assistant {
                        background: #1e293b;
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        color: #e2e8f0;
                        border-radius: 16px 16px 16px 4px;
                        padding: 10px 14px;
                        font-size: 14px;
                        line-height: 1.6;
                        box-shadow: 0 4px 14px rgba(8, 13, 22, 0.25);
                        word-break: break-word;
                    }
                    .chat-bubble-assistant strong { color: #e2e8f0; }
                    .chat-bubble-assistant em { color: #cbd5e1; font-style: italic; }
                    .chat-timestamp {
                        font-size: 10px;
                        color: #8292a8;
                        margin-top: 4px;
                        display: block;
                    }
                    .chat-typing-indicator {
                        display: flex;
                        align-items: center;
                        gap: 5px;
                        padding: 12px 16px;
                        background: #1e293b;
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        border-radius: 16px 16px 16px 4px;
                        width: fit-content;
                    }
                    .chat-typing-dot {
                        width: 6px; height: 6px;
                        border-radius: 50%;
                        background: #3d4f63;
                        animation: typingBounce 1.3s ease-in-out infinite;
                    }
                    .chat-typing-dot:nth-child(2) { animation-delay: 0.18s; }
                    .chat-typing-dot:nth-child(3) { animation-delay: 0.36s; }
                    .chat-quick-reply {
                        padding: 6px 13px;
                        border-radius: 20px;
                        border: 1px solid rgba(34, 211, 238, 0.3);
                        background: rgba(34, 211, 238, 0.06);
                        color: #22d3ee;
                        font-size: 12px;
                        cursor: pointer;
                        transition: background 0.2s, border-color 0.2s, transform 0.15s;
                        white-space: nowrap;
                    }
                    .chat-quick-reply:hover {
                        background: rgba(34, 211, 238, 0.14);
                        border-color: rgba(34, 211, 238, 0.55);
                        transform: translateY(-1px);
                    }
                    .chat-scrollbar::-webkit-scrollbar { width: 3px; }
                    .chat-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .chat-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.18); border-radius: 2px; }
                    .chat-message-label {
                        font-size: 11px;
                        color: #8292a8;
                        margin-bottom: 6px;
                    }
                `;
                document.head.appendChild(style);
            }
        }
        function showAgentSelector(agents) {
            // Remove modal anterior se existir
            const existingModal = document.getElementById('agentSelectorModal');
            if (existingModal) existingModal.remove();
            // Cria modal de seleção (container)
            const modal = document.createElement('div');
            modal.id = 'agentSelectorModal';
            modal.style.cssText = `
                position: fixed;
                bottom: 4px;
                right: 4px;
                z-index: 10000;
                display: block;
                width: 100%;
                max-width: 380px;
                height: min(88vh, 580px);
                max-height: 88vh;
                animation: slideUp 0.22s ease;
            `;
            const panel = document.createElement('div');
            panel.style.cssText = `
                width: 100%;
                height: 100%;
                background: linear-gradient(180deg, #080d16 0%, #111827 100%);
                border-radius: 32px;
                border: 1px solid rgba(255, 255, 255, 0.16);
                box-shadow: 0 30px 90px rgba(8, 13, 22, 0.65);
                overflow: hidden;
                display: flex;
                flex-direction: column;
            `;
            panel.innerHTML = `
                <div style="padding: 24px 24px 18px; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
                    <div style="flex:1; min-width:0;">
                        <p style="color: #22d3ee; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 8px;">Fale com agents</p>
                        <h3 style="color: white; font-size: 20px; font-weight: 700; margin: 0;">Escolha o perfil para conversar</h3>
                        <p style="margin: 10px 0 0; font-size: 13px; color: #8292a8; line-height: 1.7;">Selecione a agent que orientará recomendações diretas de UX, performance e conversão.</p>
                    </div>
                    <button id="agentSelectorCloseBtn" style="background: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.16); color: #cbd5e1; cursor: pointer; padding: 10px; border-radius: 14px; display: flex; align-items: center; justify-content: center;">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
                <div id="agentsList" style="flex: 1; min-height: 0; overflow-y: auto; display: grid; gap: 14px; padding: 20px 24px 24px;"></div>
            `;
            panel.querySelector('#agentSelectorCloseBtn').onclick = function() {
    const modal = document.getElementById('agentSelectorModal');
    if (modal) {
        modal.remove();
    }
};
            modal.appendChild(panel);
            // Adiciona CSS da animação fadeIn se necessário
            if (!document.getElementById('modalStyles')) {
                const style = document.createElement('style');
                style.id = 'modalStyles';
                style.textContent = `
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `;
                document.head.appendChild(style);
            }
            document.body.appendChild(modal);
            // Preenche a lista de agents com botões criados dinamicamente para evitar problemas com JSON inline
            const list = document.getElementById('agentsList');
            agents.forEach(function(agent) {
                const normalizedAgent = normalizeChatPersona(agent);
                const btn = document.createElement('button');
                btn.className = 'agent-select-card';
                btn.style.cssText = 'width:100%; background: rgba(8, 13, 22, 0.95); border: 1px solid rgba(255, 255, 255, 0.65); color: white; padding: 18px; border-radius: 20px; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease; text-align: left; display: grid; gap: 8px;';
                const title = document.createElement('div');
                title.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:12px;';
                title.innerHTML = `<span class="agent-select-card-title">${safeAuditText(normalizedAgent.profile_name)}</span><span class="agent-select-card-meta">Score ${normalizedAgent.score || '--'}/10</span>`;
                const desc = document.createElement('div');
                desc.style.cssText = 'font-size:13px; color: #cbd5e1; line-height:1.6;';
                desc.innerText = normalizedAgent.description || 'Perspectiva projetada para análise estratégica e recomendações rápidas.';
                btn.appendChild(title);
                btn.appendChild(desc);
                btn.addEventListener('click', function() {
                    selectAgentForChat(normalizedAgent);
                    const m = document.getElementById('agentSelectorModal');
                    if (m) m.remove();
                });
                list.appendChild(btn);
            });
        }
        function selectAgentForChat(agent) {
            const normalized = normalizeChatPersona(agent);
            setLiveChatContext(normalized);
            openChat(normalized);
        }
        // === FUNÇÕES DE CHAT COM AGENTS ===
        // Armazena históricos por agent (id ou nome)
        var agentChats = {};
        var currentChatHistory = [];
        var currentAgent = null;
        var agentChatActive = false;
        var currentChatMetaOverride = null;
        var currentChatConversationId = null;
        var currentChatTokenLimit = getFrontendPlanLimits().chatInputTokens;
        function getAgentColor(agent) {
            const colors = ['#22d3ee','#818cf8','#67e8f9','#0ea5e9','#bae6fd','#c8d3e2','#8292a8','#3d4f63'];
            if (!agent || !agent.profile_name) return colors[0];
            let hash = 0;
            for (let i = 0; i < agent.profile_name.length; i++) {
                hash = agent.profile_name.charCodeAt(i) + ((hash << 5) - hash);
            }
            return colors[Math.abs(hash) % colors.length];
        }
        function getAgentInitials(agent) {
            if (!agent || !agent.profile_name) return 'AI';
            const parts = agent.profile_name.trim().split(/\s+/);
            if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
            return agent.profile_name.substring(0, 2).toUpperCase();
        }
        function getCurrentChatMeta() {
            if (currentChatMetaOverride) {
                return currentChatMetaOverride;
            }
            return {
                title: currentAuditUrl || document.getElementById('reportUrl')?.innerText || 'Site Auditado',
                url: currentAuditUrl || '',
                audit_data: auditData || {}
            };
        }
        function getChatSessionKey(agent) {
            const agentKey = agent?.id || agent?.profile_name || agent?.name || 'persona';
            const base = currentChatConversationId || currentAuditUrl || 'live-audit';
            return `${base}::${agentKey}`;
        }
        function estimateChatTokensFromHistory(history) {
            const text = JSON.stringify({
                meta: getCurrentChatMeta(),
                persona: currentAgent || {},
                historico: history || []
            });
            return Math.ceil(text.length / 4);
        }
        function updateChatTokenStatus(usage) {
            const label = document.getElementById('chatAgentScore');
            if (!label) return;
            const base = label.dataset.baseLabel || label.innerText || 'Perfil analitico';
            const estimated = usage?.estimated_input_tokens ?? estimateChatTokensFromHistory(currentChatHistory);
            const limit = usage?.input_token_limit || currentChatTokenLimit;
            const plan = normalizeUserPlan(usage?.plan || usage?.plan_limits?.plan || getUserPlan());
            const planLabel = getUserPlanLabel(plan);
            currentChatTokenLimit = limit;
            label.dataset.baseLabel = base;
            label.innerText = `${base} | ${planLabel} | ${estimated}/${limit} tokens`;
            if (estimated >= limit * 0.85) {
                label.style.color = '#fbbf24';
            } else {
                label.style.color = '#3d4f63';
            }
        }
        function setLiveChatContext(agent) {
            currentChatMetaOverride = null;
            const agentKey = agent?.id || agent?.profile_name || agent?.name || 'persona';
            currentChatConversationId = `audit:${currentAuditUrl || 'current'}:${agentKey}`;
        }
        function normalizeChatPersona(agent) {
            const profileName = agent?.profile_name || agent?.name || agent?.agent || 'Persona SSW';
            return {
                ...agent,
                profile_name: profileName,
                name: agent?.name || profileName,
                score: agent?.score ?? null,
                direct_quote: agent?.direct_quote || agent?.feedback || '',
                description: agent?.description || agent?.profile_description || ''
            };
        }
        function formatChatText(text) {
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/\n/g, '<br>');
        }
        function openChat(agent) {
            isFloatingButtonVisible = false;
            const btn = document.getElementById('floatingChatBtn');
            if (btn) btn.style.display = 'none';
            agentChats = agentChats || {};
            currentAgent = agent;
            currentChatTokenLimit = getFrontendPlanLimits().chatInputTokens;
            window.currentAgentColor = getAgentColor(agent);
            const agentColor = window.currentAgentColor;
            const agentInitials = getAgentInitials(agent);
            const sessionKey = getChatSessionKey(agent);
            currentChatHistory = agentChats[sessionKey] ? [...agentChats[sessionKey]] : [];
            document.getElementById('chatModal').classList.remove('hidden');
            document.getElementById('chatAgentName').innerText = agent.profile_name;
            document.getElementById('chatAgentScore').innerText = agent.score ? `Score ${agent.score}/10` : 'Perfil analítico';
            // Atualiza avatar no header
            const scoreEl = document.getElementById('chatAgentScore');
            if (scoreEl) {
                const scoreLabel = agent.score ? `Score ${agent.score}/10` : 'Perfil analitico';
                scoreEl.dataset.baseLabel = scoreLabel;
                scoreEl.innerText = scoreLabel;
            }
            const headerAvatar = document.getElementById('chatHeaderAvatar');
            if (headerAvatar) {
                headerAvatar.style.background = agentColor + '20';
                headerAvatar.style.color = agentColor;
                headerAvatar.style.border = '2px solid ' + agentColor + '40';
                headerAvatar.innerText = agentInitials;
            }
            const container = document.getElementById('chatHistory');
            container.innerHTML = '';
            if (currentChatHistory.length) {
                currentChatHistory.forEach(message => {
                    appendMsg(message.role === 'assistant' ? 'ai' : 'user', message.content || '');
                });
                const backBtn = document.getElementById('chatBackBtn');
                if (backBtn) backBtn.style.display = 'none';
                updateChatTokenStatus();
                setTimeout(function() {
                    const inp = document.getElementById('chatInput');
                    if (inp) inp.focus();
                }, 150);
                return;
            }
            // Mensagem de boas-vindas
            const welcomeDiv = document.createElement('div');
            welcomeDiv.style.cssText = 'display:flex; justify-content:flex-start; margin-bottom:12px; align-items:flex-end; gap:8px;';
            welcomeDiv.className = 'chat-msg-enter';
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
            const shortName = agent.profile_name.split(' ')[0];
            welcomeDiv.innerHTML = `
                <div class="chat-avatar-ai" style="background:${agentColor}20;color:${agentColor};border:1px solid ${agentColor}40;">${agentInitials}</div>
                <div style="display:flex;flex-direction:column;max-width:75%;">
                    <div class="chat-bubble-assistant">Olá! Sou <strong>${shortName}</strong> e analisei seu site com foco no meu perfil. O que gostaria de saber? 👋</div>
                    <span class="chat-timestamp">${timeStr}</span>
                </div>
            `;
            container.appendChild(welcomeDiv);
            // Quick replies sugeridos
            const suggestions = [
                'Quais os maiores problemas de UX?',
                'Como melhorar a conversão?',
                'Principais pontos de SEO?',
                'O que melhorar primeiro?'
            ];
            const qrDiv = document.createElement('div');
            qrDiv.id = 'chatQuickReplies';
            qrDiv.style.cssText = 'display:flex; flex-wrap:wrap; gap:8px; padding:0 0 12px 38px; animation: msgSlideIn 0.3s ease forwards;';
            suggestions.forEach(function(s) {
                const qrBtn = document.createElement('button');
                qrBtn.className = 'chat-quick-reply';
                qrBtn.textContent = s;
                qrBtn.onclick = function() {
                    const inp = document.getElementById('chatInput');
                    if (inp) { inp.value = s; sendChat(); }
                };
                qrDiv.appendChild(qrBtn);
            });
            container.appendChild(qrDiv);
            const backBtn = document.getElementById('chatBackBtn');
            if (backBtn) backBtn.style.display = 'none';
            container.scrollTop = container.scrollHeight;
            updateChatTokenStatus();
            setTimeout(function() {
                const inp = document.getElementById('chatInput');
                if (inp) inp.focus();
            }, 150);
        }
        function closeChat() {
            document.getElementById('chatModal').classList.add('hidden');
            isFloatingButtonVisible = true;
            const btn = document.getElementById('floatingChatBtn');
            if (btn) btn.style.display = 'inline-flex';
}

        async function sendChat() {
            const input = document.getElementById('chatInput');
            const sendBtn = document.getElementById('chatSendBtn');
            const msg = input.value.trim();
            if (!msg) return;
            // Oculta quick replies após primeira mensagem
            const qr = document.getElementById('chatQuickReplies');
            if (qr) { qr.style.transition = 'opacity 0.2s'; qr.style.opacity = '0'; setTimeout(function(){if(qr)qr.remove();}, 200); }
            // 1. Adiciona msg do usuário na tela
            appendMsg('user', msg);
            input.value = '';
            input.style.height = 'auto';
            // 2. Desabilita input durante loading
            input.disabled = true;
            if (sendBtn) { sendBtn.disabled = true; sendBtn.style.opacity = '0.45'; }
            // 3. Prepara histórico para API
            currentChatHistory.push({ role: "user", content: msg });
            const estimatedBeforeSend = estimateChatTokensFromHistory(currentChatHistory);
            if (estimatedBeforeSend > currentChatTokenLimit) {
                appendMsg('ai', `Esta conversa chegou ao limite de ${currentChatTokenLimit} tokens. Limpe a conversa para continuar com esta persona.`);
                currentChatHistory.pop();
                input.disabled = false;
                if (sendBtn) { sendBtn.disabled = false; sendBtn.style.opacity = '1'; }
                updateChatTokenStatus();
                return;
            }
            // 4. Typing indicator animado
            const loadingId = appendMsg('ai', '', true);
            try {
                const res = await fetch(`${API_URL}/api/chat`, {
                    method: 'POST', headers: authHeaders({ 'Content-Type': 'application/json' }),
                    body: JSON.stringify({
                        historico: currentChatHistory,
                        persona: normalizeChatPersona(currentAgent),
                        meta: getCurrentChatMeta(),
                        conversation_id: currentChatConversationId
                    })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Falha no chat');
                // Remove typing indicator e põe resposta
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();
                const resposta = data.resposta || 'Desculpe, não consegui processar sua mensagem.';
                appendMsg('ai', resposta);
                currentChatHistory.push({ role: "assistant", content: resposta });
                updateChatTokenStatus(data.usage);
                // Persiste histórico por agent
                const key = getChatSessionKey(currentAgent);
                if (key) agentChats[key] = [...currentChatHistory];
            } catch (e) {
                const loadingEl = document.getElementById(loadingId);
                if (loadingEl) loadingEl.remove();
                appendMsg('ai', e.message || 'Erro de conexao. Tente novamente.');
            } finally {
                input.disabled = false;
                if (sendBtn) { sendBtn.disabled = false; sendBtn.style.opacity = '1'; }
                input.focus();
            }
        }
        function appendMsg(role, text, isTyping) {
            const container = document.getElementById('chatHistory');
            const div = document.createElement('div');
            const id = 'msg-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
            div.id = id;
            div.className = 'chat-msg-enter';
            const now = new Date();
            const timeStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');
            if (role === 'user') {
                div.style.cssText = 'display:flex; justify-content:flex-end; margin-bottom:12px; align-items:flex-end; gap:8px;';
                div.innerHTML = `
                    <div style="display:flex;flex-direction:column;align-items:flex-end;max-width:75%;">
                        <div class="chat-bubble-user">${formatChatText(text)}</div>
                        <span class="chat-timestamp" style="text-align:right;">${timeStr}</span>
                    </div>
                    <div class="chat-avatar-user">Eu</div>
                `;
            } else if (isTyping) {
                const agentColor = window.currentAgentColor || '#22d3ee';
                const agentInitials = getAgentInitials(currentAgent);
                div.style.cssText = 'display:flex; justify-content:flex-start; margin-bottom:12px; align-items:flex-end; gap:8px;';
                div.innerHTML = `
                    <div class="chat-avatar-ai" style="background:${agentColor}20;color:${agentColor};border:1px solid ${agentColor}40;">${agentInitials}</div>
                    <div class="chat-typing-indicator">
                        <div class="chat-typing-dot"></div>
                        <div class="chat-typing-dot"></div>
                        <div class="chat-typing-dot"></div>
                    </div>
                `;
            } else {
                const agentColor = window.currentAgentColor || '#22d3ee';
                const agentInitials = getAgentInitials(currentAgent);
                div.style.cssText = 'display:flex; justify-content:flex-start; margin-bottom:12px; align-items:flex-end; gap:8px;';
                div.innerHTML = `
                    <div class="chat-avatar-ai" style="background:${agentColor}20;color:${agentColor};border:1px solid ${agentColor}40;">${agentInitials}</div>
                    <div style="display:flex;flex-direction:column;max-width:75%;">
                        <div class="chat-bubble-assistant">${formatChatText(text)}</div>
                        <span class="chat-timestamp">${timeStr}</span>
                    </div>
                `;
            }
            container.appendChild(div);
            container.scrollTop = container.scrollHeight;
            return id;
        }
        function clearChatHistory() {
            if (!currentAgent) return;
            currentChatHistory = [];
            const key = getChatSessionKey(currentAgent);
            if (key) delete agentChats[key];
            openChat(currentAgent);
        }
        // Event listener global para botões de chat
        document.addEventListener('click', function(e) {
            if (e.target.closest('.chat-button')) {
                console.log('Botão de chat clicado!');
                const button = e.target.closest('.chat-button');
                const agentData = JSON.parse(button.getAttribute('data-agent'));
                console.log('Dados da agent:', agentData);
                openChat(agentData);
            }
        });
        // === FUNÇÃO DE TUTORIAL CARDS ===
        function showTutorialCard(type) {
            const tutorials = {
                'primeira': {
                    title: 'Primeira Análise',
                    icon: 'play-circle',
                    content: `
                        <div class="space-y-4">
                            <p class="text-slate-300">Siga estes passos para fazer sua primeira auditoria completa:</p>
                            <ol class="space-y-3 text-slate-300">
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">1.</span>
                                    <div>
                                        <strong class="text-white">Faça login ou cadastro</strong> no sistema (clique no botão de menu lateral)
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">2.</span>
                                    <div>
                                        <strong class="text-white">Digite a URL do site</strong> que deseja analisar no campo de busca
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">3.</span>
                                    <div>
                                        <strong class="text-white">Escolha o modo de análise:</strong> Automático (recomendado), Manual ou Comparativo
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">4.</span>
                                    <div>
                                        <strong class="text-white">Selecione sua persona (no modo manual)</strong> - escolha 1 perfil criado na sua conta
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">5.</span>
                                    <div>
                                        <strong class="text-white">Clique em "ANALISAR"</strong> e aguarde 30 segundos
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">6.</span>
                                    <div>
                                        <strong class="text-white">Veja o relatório completo</strong> com scores de UX, performance e segurança
                                    </div>
                                </li>
                            </ol>
                            <div class="bg-primary/10 p-3 rounded-lg border border-primary/20">
                                <p class="text-primary text-sm font-medium"> Dica: Comece com o modo Automático para obter uma visão geral completa do seu site!</p>
                            </div>
                        </div>
                    `
                },
                'auditar': {
                    title: '1: Como Auditar um Site',
                    icon: 'file-search',
                    content: `
                        <div class="space-y-4">
                            <p class="text-slate-300">Para auditar um site, siga estes passos simples:</p>
                            <ol class="space-y-3 text-slate-300">
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">1.</span>
                                    <div>
                                        <strong class="text-white">Acesse a página inicial</strong> e clique em "Nova Análise"
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">2.</span>
                                    <div>
                                        <strong class="text-white">Digite a URL completa</strong> do site que deseja analisar
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">3.</span>
                                    <div>
                                        <strong class="text-white">Selecione 1 persona criada</strong> que representa o público-alvo da análise
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">4.</span>
                                    <div>
                                        <strong class="text-white">Clique em "Iniciar Auditoria"</strong> e aguarde a análise completa
                                    </div>
                                </li>
                            </ol>
                            <div class="bg-primary/10 p-3 rounded-lg border border-primary/20">
                                <p class="text-primary text-sm font-medium"> Dica: crie personas diferentes para obter visões variadas do seu site!</p>
                            </div>
                        </div>
                    `
                },
                'agents': {
                    title: '2: Como Gerenciar Agents',
                    icon: 'users',
                    content: `
                        <div class="space-y-4">
                            <p class="text-slate-300">Gerencie agents para personalizar suas análises:</p>
                            <ol class="space-y-3 text-slate-300">
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">1.</span>
                                    <div>
                                        <strong class="text-white">Vá para "Gerenciar Agents"</strong> no menu lateral
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">2.</span>
                                    <div>
                                        <strong class="text-white">Visualize suas personas salvas</strong> e mantenha o painel organizado
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">3.</span>
                                    <div>
                                        <strong class="text-white">Leia as descrições</strong> para entender cada perfil
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">4.</span>
                                    <div>
                                        <strong class="text-white">Selecione as mais adequadas</strong> para seu tipo de análise
                                    </div>
                                </li>
                            </ol>
                            <div class="bg-accent/10 p-3 rounded-lg border border-accent/20">
                                <p class="text-accent text-sm font-medium"> Dica: Combine agents complementares para análises mais completas!</p>
                            </div>
                        </div>
                    `
                },
                'ranking': {
                    title: '3: Como Ver o Ranking',
                    icon: 'trophy',
                    content: `
                        <div class="space-y-4">
                            <p class="text-slate-300">Acompanhe o ranking global de desempenho:</p>
                            <ol class="space-y-3 text-slate-300">
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">1.</span>
                                    <div>
                                        <strong class="text-white">Clique em "Ranking Global"</strong> no menu lateral
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">2.</span>
                                    <div>
                                        <strong class="text-white">Veja os melhores sites</strong> avaliados pela plataforma
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">3.</span>
                                    <div>
                                        <strong class="text-white">Analise os scores</strong> de performance de cada site
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">4.</span>
                                    <div>
                                        <strong class="text-white">Compare com concorrentes</strong> do mesmo nicho
                                    </div>
                                </li>
                            </ol>
                            <div class="bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
                                <p class="text-yellow-500 text-sm font-medium"> Dica: Use o ranking para benchmarking e identificar oportunidades!</p>
                            </div>
                        </div>
                    `
                },
                'relatorios': {
                    title: '4: Como Gerar Relatórios',
                    icon: 'file-text',
                    content: `
                        <div class="space-y-4">
                            <p class="text-slate-300">Exporte suas análises em relatórios profissionais:</p>
                            <ol class="space-y-3 text-slate-300">
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">1.</span>
                                    <div>
                                        <strong class="text-white">Após concluir uma auditoria</strong>, vá até os resultados
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">2.</span>
                                    <div>
                                        <strong class="text-white">Clique em "Gerar Relatório PDF"</strong> no final da página
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">3.</span>
                                    <div>
                                        <strong class="text-white">Aguarde a geração</strong> do documento automática
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">4.</span>
                                    <div>
                                        <strong class="text-white">Faça o download</strong> do PDF completo
                                    </div>
                                </li>
                            </ol>
                            <div class="bg-cyber/10 p-3 rounded-lg border border-cyber/20">
                                <p class="text-cyber text-sm font-medium"> Dica: Os relatórios incluem gráficos, análises detalhadas e recomendações!</p>
                            </div>
                        </div>
                    `
                },
                'creditos': {
                    title: '5: Como Comprar Créditos',
                    icon: 'credit-card',
                    content: `
                        <div class="space-y-4">
                            <p class="text-slate-300">Adquira mais créditos para continuar analisando:</p>
                            <ol class="space-y-3 text-slate-300">
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">1.</span>
                                    <div>
                                        <strong class="text-white">Veja seus créditos disponíveis</strong> no menu lateral
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">2.</span>
                                    <div>
                                        <strong class="text-white">Clique em "COMPRAR"</strong> ao lado do saldo
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">3.</span>
                                    <div>
                                        <strong class="text-white">Escolha o plano desejado</strong> conforme sua necessidade
                                    </div>
                                </li>
                                <li class="flex items-start gap-3">
                                    <span class="text-primary font-bold">4.</span>
                                    <div>
                                        <strong class="text-white">Finalize o pagamento</strong> e os créditos são adicionados automaticamente
                                    </div>
                                </li>
                            </ol>
                            <div class="bg-emerald-500/10 p-3 rounded-lg border border-emerald-500/20">
                                <p class="text-emerald-500 text-sm font-medium"> Dica: Planos maiores oferecem melhor custo-benefício por auditoria!</p>
                            </div>
                        </div>
                    `
                }
            };
            const tutorial = tutorials[type];
            if (!tutorial) return;
            // Remove modal anterior se existir
            const existingModal = document.getElementById('tutorialModal');
            if (existingModal) {
                existingModal.remove();
            }
            // Cria o modal
            const modal = document.createElement('div');
            modal.id = 'tutorialModal';
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up';
            modal.innerHTML = `
                <div class="glass-panel p-8 rounded-2xl border border-slate-800 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
                    <button onclick="closeTutorialModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <i data-lucide="${tutorial.icon}" class="w-6 h-6 text-primary"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white">${tutorial.title}</h3>
                    </div>
                    <div class="text-slate-300 leading-relaxed">
                        ${tutorial.content}
                    </div>
                    <div class="mt-6 pt-6 border-t border-slate-700">
                        <p class="text-center text-slate-500 text-sm">
                            2026 SSW INTELLIGENCE. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            // Inicializa os ícones do Lucide
            lucide.createIcons();
            // Fecha o modal ao clicar fora
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeTutorialModal();
                }
            });
        }
        function closeTutorialModal() {
            const modal = document.getElementById('tutorialModal');
            if (modal) {
                modal.remove();
            }
        }
        // === FUNÇÕES DE CARDS ADICIONAIS ===
        function closeAboutModal() {
            const modal = document.getElementById('aboutModal');
            if (modal) {
                modal.remove();
            }
        }
        function closeTermsModal() {
            const modal = document.getElementById('termsModal');
            if (modal) {
                modal.remove();
            }
        }
        function closeFAQModal() {
            const modal = document.getElementById('faqModal');
            if (modal) {
                modal.remove();
            }
        }
        // Função para controlar o accordion do FAQ
        function toggleFAQ(id) {
            const content = document.getElementById(`faq-content-${id}`);
            const icon = document.getElementById(`faq-icon-${id}`);
            if (content.classList.contains('hidden')) {
                // Abrir com animação suave
                content.classList.remove('hidden');
                content.style.maxHeight = '0px';
                content.style.opacity = '0';
                content.style.overflow = 'hidden';
                content.style.transition = 'max-height 0.4s ease-out, opacity 0.3s ease-out';
                // Força reflow para garantir que a transição funcione
                content.offsetHeight;
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.opacity = '1';
                icon.style.transform = 'rotate(180deg)';
                // Remove max-height após a animação para permitir conteúdo responsivo
                setTimeout(() => {
                    content.style.maxHeight = 'none';
                    content.style.overflow = 'visible';
                }, 400);
            } else {
                // Fechar com animação suave
                content.style.maxHeight = content.scrollHeight + 'px';
                content.style.overflow = 'hidden';
                content.offsetHeight;
                content.style.maxHeight = '0px';
                content.style.opacity = '0';
                icon.style.transform = 'rotate(0deg)';
                setTimeout(() => {
                    content.classList.add('hidden');
                    content.style.maxHeight = '';
                    content.style.opacity = '';
                    content.style.overflow = '';
                }, 400);
            }
        }
        // Funções do carrossel (moveCarousel, initCarousel, etc.) movidas para pricing-section.js
        function showFAQ() {
            // Remove modal anterior se existir
            const existingModal = document.getElementById('faqModal');
            if (existingModal) {
                existingModal.remove();
            }
            // Cria o modal FAQ
            const modal = document.createElement('div');
            modal.id = 'faqModal';
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up';
            modal.innerHTML = `
                <div class="glass-panel p-8 rounded-2xl border border-slate-800 max-w-4xl w-full max-h-[80vh] overflow-y-auto relative">
                    <button onclick="closeFAQModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                            <i data-lucide="help-circle" class="w-6 h-6 text-accent"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white">Perguntas Frequentes - FAQ</h3>
                    </div>
                    <div class="space-y-4">
                        <!-- FAQ Item 1 -->
                        <div class="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                            <button onclick="this.parentElement.classList.toggle('expanded')" class="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                <span class="text-white font-medium">O que é o SSW INTELLIGENCE?</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform"></i>
                            </button>
                            <div class="hidden px-4 pb-4 text-slate-300 text-sm leading-relaxed">
                                A SSW INTELLIGENCE é uma plataforma avançada de análise inteligente de sites que identifica erros visuais e técnicos, gerando relatórios profissionais sobre velocidade de carregamento, SEO, performance e experiência do usuário. Nosso diferencial exclusivo são as agents - personalidades baseadas em pessoas reais que interagem e fornecem feedback personalizado ao final de cada análise.
                            </div>
                        </div>
                        <!-- FAQ Item 2 -->
                        <div class="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                            <button onclick="this.parentElement.classList.toggle('expanded')" class="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                <span class="text-white font-medium">Como funciona a análise de sites?</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform"></i>
                            </button>
                            <div class="hidden px-4 pb-4 text-slate-300 text-sm leading-relaxed">
                                Nosso sistema analisa sites completos, identificando erros visuais e técnicos, problemas de performance, SEO, velocidade de carregamento e experiência do usuário. Ao final, nossas agents exclusivas interagem com você, fornecendo feedback personalizado baseado em suas características reais. Basta informar a URL do site para obter uma análise completa.
                            </div>
                        </div>
                        <!-- FAQ Item 3 -->
                        <div class="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                            <button onclick="this.parentElement.classList.toggle('expanded')" class="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                <span class="text-white font-medium">Quais tipos de análise são oferecidos?</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform"></i>
                            </button>
                            <div class="hidden px-4 pb-4 text-slate-300 text-sm leading-relaxed">
                                Oferecemos análise individual completa e análise comparativa entre sites. Nossas análises cobrem performance técnica, SEO, velocidade de carregamento, erros visuais, acessibilidade, experiência do usuário e muito mais. Todas incluem o feedback exclusivo das nossas agents ao final.
                            </div>
                        </div>
                        <!-- FAQ Item 4 -->
                        <div class="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                            <button onclick="this.parentElement.classList.toggle('expanded')" class="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                <span class="text-white font-medium">A análise é segura e confidencial?</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform"></i>
                            </button>
                            <div class="hidden px-4 pb-4 text-slate-300 text-sm leading-relaxed">
                                Sim! Todas as análises são realizadas utilizando apenas informações publicamente disponíveis dos sites. Não armazenamos dados sensíveis dos sites analisados e utilizamos criptografia para proteger suas informações. Consulte nossos Termos de Uso para mais detalhes.
                            </div>
                        </div>
                        <!-- FAQ Item 5 -->
                        <div class="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                            <button onclick="this.parentElement.classList.toggle('expanded')" class="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                <span class="text-white font-medium">O que são as Agents?</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform"></i>
                            </button>
                            <div class="hidden px-4 pb-4 text-slate-300 text-sm leading-relaxed">
                                Nossas Agents são o diferencial exclusivo da SSW! São personalidades baseadas em pessoas reais que interagem com você ao final de cada análise, fornecendo feedback personalizado e insights únicos. Cada Agent tem características diferentes, oferecendo perspectivas variadas sobre os resultados da análise do seu site.
                            </div>
                        </div>
                        <!-- FAQ Item 6 -->
                        <div class="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                            <button onclick="this.parentElement.classList.toggle('expanded')" class="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                <span class="text-white font-medium">Como funciona a análise comparativa?</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform"></i>
                            </button>
                            <div class="hidden px-4 pb-4 text-slate-300 text-sm leading-relaxed">
                                A análise comparativa permite analisar dois ou mais sites simultaneamente, destacando semelhanças, diferenças e padrões de performance entre eles. Ideal para benchmarking competitivo, análise de concorrência ou compreensão de posicionamento no mercado. Inclui feedback das agents para cada site analisado.
                            </div>
                        </div>
                        <!-- FAQ Item 7 -->
                        <div class="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                            <button onclick="this.parentElement.classList.toggle('expanded')" class="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                <span class="text-white font-medium">Como são calculados os créditos?</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform"></i>
                            </button>
                            <div class="hidden px-4 pb-4 text-slate-300 text-sm leading-relaxed">
                                Cada análise consome uma quantidade específica de créditos dependendo da complexidade e do tipo de análise. Análises individuais consomem menos créditos que análises comparativas. Você pode adquirir pacotes de créditos na seção Gestão de Créditos.
                            </div>
                        </div>
                        <!-- FAQ Item 8 -->
                        <div class="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                            <button onclick="this.parentElement.classList.toggle('expanded')" class="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                <span class="text-white font-medium">Posso exportar os resultados das análises?</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform"></i>
                            </button>
                            <div class="hidden px-4 pb-4 text-slate-300 text-sm leading-relaxed">
                                Sim! Todos os relatórios de análise podem ser exportados em formato PDF, incluindo métricas detalhadas, gráficos de performance, insights técnicos e o feedback das agents. A função de exportação está disponível na seção Relatórios e Insights após cada análise concluída.
                            </div>
                        </div>
                        <!-- FAQ Item 9 -->
                        <div class="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                            <button onclick="this.parentElement.classList.toggle('expanded')" class="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                <span class="text-white font-medium">Como obtenho suporte técnico?</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform"></i>
                            </button>
                            <div class="hidden px-4 pb-4 text-slate-300 text-sm leading-relaxed">
                                Você pode entrar em contato conosco através do WhatsApp (82 99130-1991), email (contato@sswintelligence.com.br) ou consultar nosso Tutorial completo disponível no sistema. Também oferecemos suporte prioritário para usuários premium.
                            </div>
                        </div>
                        <!-- FAQ Item 10 -->
                        <div class="bg-slate-900/20 rounded-xl border border-slate-800/50 overflow-hidden">
                            <button onclick="this.parentElement.classList.toggle('expanded')" class="w-full p-4 text-left flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                                <span class="text-white font-medium">Qual a precisão das análises?</span>
                                <i data-lucide="chevron-down" class="w-4 h-4 text-slate-400 transition-transform"></i>
                            </button>
                            <div class="hidden px-4 pb-4 text-slate-300 text-sm leading-relaxed">
                                Nossos algoritmos são constantemente aprimorados e oferecem alta precisão na identificação de problemas técnicos e de performance. No entanto, as análises devem ser usadas como ferramenta de apoio para otimização. A precisão pode variar conforme a complexidade e estrutura do site analisado.
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <p class="text-slate-300 text-sm text-center">
                            <i data-lucide="info" class="w-4 h-4 inline mr-2"></i>
                            Não encontrou sua dúvida? Entre em contato conosco pelo WhatsApp ou email para suporte personalizado.
                        </p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            // Inicializa ícones Lucide no modal
            lucide.createIcons();
            // Adiciona evento de clique para expandir/colapsar
            modal.querySelectorAll('button[onclick*="expanded"]').forEach(button => {
                button.addEventListener('click', function() {
                    const content = this.nextElementSibling;
                    const icon = this.querySelector('[data-lucide="chevron-down"]');
                    if (content.classList.contains('hidden')) {
                        content.classList.remove('hidden');
                        icon.style.transform = 'rotate(180deg)';
                    } else {
                        content.classList.add('hidden');
                        icon.style.transform = 'rotate(0deg)';
                    }
                });
            });
        }
        function showAboutCard() {
            nav('about');
        }
        function _showAboutCard_legacy() {
            const existingModal = document.getElementById('aboutModal');
            if (existingModal) existingModal.remove();
            const modal = document.createElement('div');
            modal.id = 'aboutModal';
            modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);';
            modal.innerHTML = `
                <div style="background:#09101f;border:1px solid rgba(255,255,255,0.08);border-radius:20px;max-width:780px;width:100%;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 32px 80px rgba(0,0,0,0.6);">
                    <!-- Close -->
                    <button onclick="closeAboutModal()" style="position:absolute;top:18px;right:18px;z-index:10;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:#8292a8;cursor:pointer;width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                        <i data-lucide="x" style="width:16px;height:16px;"></i>
                    </button>

                    <!-- Hero Section -->
                    <div style="padding:48px 48px 36px;border-bottom:1px solid rgba(255,255,255,0.06);position:relative;overflow:hidden;">
                        <div style="display:inline-flex;align-items:center;gap:8px;background:rgba(6,182,212,0.08);border:1px solid rgba(6,182,212,0.2);border-radius:999px;padding:4px 14px;margin-bottom:20px;">
                            <span style="width:6px;height:6px;border-radius:50%;background:#22d3ee;display:inline-block;"></span>
                            <span style="color:#67e8f9;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;">Plataforma de Inteligência Web</span>
                        </div>
                        <h2 style="color:#ffffff;font-size:30px;font-weight:800;line-height:1.2;margin:0 0 14px;">Transformando dados em<br><span style="background:linear-gradient(90deg,#22d3ee,#6366f1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">vantagem competitiva</span></h2>
                        <p style="color:#8292a8;font-size:15px;line-height:1.75;max-width:520px;margin:0;">A SSW INTELLIGENCE é uma plataforma enterprise de auditoria web orientada por IA, projetada para agências, desenvolvedores e times de marketing que buscam decisões fundamentadas em dados reais.</p>
                    </div>

                    <!-- Stats Bar -->
                    <div style="display:grid;grid-template-columns:repeat(3,1fr);border-bottom:1px solid rgba(255,255,255,0.06);">
                        <div style="padding:24px 28px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
                            <p style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 4px;">+50</p>
                            <p style="color:#3d4f63;font-size:12px;margin:0;">Métricas por auditoria</p>
                        </div>
                        <div style="padding:24px 28px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);">
                            <p style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 4px;">15+</p>
                            <p style="color:#3d4f63;font-size:12px;margin:0;">Agents especializadas</p>
                        </div>
                        <div style="padding:24px 28px;text-align:center;">
                            <p style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 4px;">&lt;30s</p>
                            <p style="color:#3d4f63;font-size:12px;margin:0;">Tempo de análise completa</p>
                        </div>
                    </div>

                    <!-- Body -->
                    <div style="padding:36px 48px;">

                        <!-- Pillars -->
                        <p style="color:#8292a8;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 16px;">O que entregamos</p>
                        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:36px;">
                            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;">
                                <div style="width:36px;height:36px;border-radius:8px;background:rgba(6,182,212,0.1);border:1px solid rgba(6,182,212,0.2);display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
                                    <i data-lucide="gauge" style="width:16px;height:16px;color:#22d3ee;"></i>
                                </div>
                                <p style="color:#ffffff;font-size:13px;font-weight:700;margin:0 0 6px;">Auditoria Técnica</p>
                                <p style="color:#3d4f63;font-size:12px;line-height:1.6;margin:0;">Performance, Core Web Vitals, SEO e segurança em um único relatório.</p>
                            </div>
                            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;">
                                <div style="width:36px;height:36px;border-radius:8px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
                                    <i data-lucide="users" style="width:16px;height:16px;color:#818cf8;"></i>
                                </div>
                                <p style="color:#ffffff;font-size:13px;font-weight:700;margin:0 0 6px;">Análise de Agents</p>
                                <p style="color:#3d4f63;font-size:12px;line-height:1.6;margin:0;">Simule o comportamento de diferentes perfis de usuário no seu site.</p>
                            </div>
                            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:20px;">
                                <div style="width:36px;height:36px;border-radius:8px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);display:flex;align-items:center;justify-content:center;margin-bottom:12px;">
                                    <i data-lucide="git-compare" style="width:16px;height:16px;color:#22d3ee;"></i>
                                </div>
                                <p style="color:#ffffff;font-size:13px;font-weight:700;margin:0 0 6px;">Benchmarking</p>
                                <p style="color:#3d4f63;font-size:12px;line-height:1.6;margin:0;">Compare dois sites lado a lado e identifique vantagens competitivas.</p>
                            </div>
                        </div>

                        <!-- Values -->
                        <p style="color:#8292a8;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 16px;">Nossos princípios</p>
                        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:36px;">
                            <div style="display:flex;align-items:flex-start;gap:12px;padding:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;">
                                <div style="width:8px;height:8px;border-radius:50%;background:#22d3ee;flex-shrink:0;margin-top:5px;"></div>
                                <div>
                                    <p style="color:#ffffff;font-size:13px;font-weight:700;margin:0 0 3px;">Dados sobre achismos</p>
                                    <p style="color:#3d4f63;font-size:12px;line-height:1.55;margin:0;">Cada recomendação é fundamentada em métricas objetivas e mensuráveis.</p>
                                </div>
                            </div>
                            <div style="display:flex;align-items:flex-start;gap:12px;padding:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;">
                                <div style="width:8px;height:8px;border-radius:50%;background:#818cf8;flex-shrink:0;margin-top:5px;"></div>
                                <div>
                                    <p style="color:#ffffff;font-size:13px;font-weight:700;margin:0 0 3px;">Acessibilidade democratizada</p>
                                    <p style="color:#3d4f63;font-size:12px;line-height:1.55;margin:0;">Análise de nível enterprise disponível para negócios de qualquer porte.</p>
                                </div>
                            </div>
                            <div style="display:flex;align-items:flex-start;gap:12px;padding:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;">
                                <div style="width:8px;height:8px;border-radius:50%;background:#22d3ee;flex-shrink:0;margin-top:5px;"></div>
                                <div>
                                    <p style="color:#ffffff;font-size:13px;font-weight:700;margin:0 0 3px;">Velocidade com precisão</p>
                                    <p style="color:#3d4f63;font-size:12px;line-height:1.55;margin:0;">Resultados completos em segundos, sem abrir mão da profundidade analítica.</p>
                                </div>
                            </div>
                            <div style="display:flex;align-items:flex-start;gap:12px;padding:16px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05);border-radius:10px;">
                                <div style="width:8px;height:8px;border-radius:50%;background:#67e8f9;flex-shrink:0;margin-top:5px;"></div>
                                <div>
                                    <p style="color:#ffffff;font-size:13px;font-weight:700;margin:0 0 3px;">Melhoria contínua</p>
                                    <p style="color:#3d4f63;font-size:12px;line-height:1.55;margin:0;">A plataforma evolui constantemente com novas métricas, agents e integrações.</p>
                                </div>
                            </div>
                        </div>

                        <!-- Founder -->
                        <div style="background:linear-gradient(135deg,rgba(6,182,212,0.06) 0%,rgba(99,102,241,0.06) 100%);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:24px;display:flex;align-items:center;gap:20px;margin-bottom:28px;">
                            <div style="width:56px;height:56px;border-radius:12px;background:linear-gradient(135deg,#22d3ee,#818cf8);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:#020408;flex-shrink:0;letter-spacing:-1px;">GC</div>
                            <div style="flex:1;min-width:0;">
                                <p style="color:#ffffff;font-size:15px;font-weight:700;margin:0 0 2px;">Guilherme Cruz da Silva</p>
                                <p style="color:#22d3ee;font-size:12px;font-weight:600;margin:0 0 10px;letter-spacing:0.04em;">Fundador & Engenheiro de Produto</p>
                                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                                    <span style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:3px 10px;font-size:11px;color:#8292a8;">Performance & UX</span>
                                    <span style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:3px 10px;font-size:11px;color:#8292a8;">IA Aplicada</span>
                                    <span style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:3px 10px;font-size:11px;color:#8292a8;">Auditoria Web</span>
                                </div>
                            </div>
                        </div>

                        <!-- CTA -->
                        <div style="display:flex;gap:10px;justify-content:flex-end;">
                            <button onclick="closeAboutModal()" style="padding:10px 22px;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);color:#8292a8;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.2s;">Fechar</button>
                            <button onclick="closeAboutModal();nav('home');" style="padding:10px 22px;border-radius:8px;border:none;background:linear-gradient(135deg,#22d3ee,#0ea5e9);color:#020408;font-size:13px;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(34,211,238,0.25);">Iniciar Auditoria</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            // Inicializa os ícones do Lucide
            lucide.createIcons();
            // Fecha o modal ao clicar fora
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeTutorialModal();
                }
            });
        }
        function showTermsCard() {
            // Remove modal anterior se existir
            const existingModal = document.getElementById('termsModal');
            if (existingModal) {
                existingModal.remove();
            }
            // Cria o modal Termos de Uso
            const modal = document.createElement('div');
            modal.id = 'termsModal';
            modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in-up';
            modal.innerHTML = `
                <div class="glass-panel p-8 rounded-2xl border border-slate-800 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative">
                    <button onclick="closeTermsModal()" class="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                            <i data-lucide="file-check" class="w-6 h-6 text-emerald-500"></i>
                        </div>
                        <h3 class="text-2xl font-bold text-white">Termos de Uso</h3>
                    </div>
                    <div class="text-slate-300 leading-relaxed space-y-4">
                        <div>
                            <h4 class="text-white font-bold text-lg mb-3">1. Aceitação dos Termos</h4>
                            <p class="mb-4">Ao acessar e usar a plataforma SSW INTELLIGENCE, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg mb-3">2. Uso da Licença</h4>
                            <p class="mb-4">É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site SSW INTELLIGENCE, apenas para visualização transitória pessoal e não comercial.</p>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg mb-3">3. Sistema de Créditos</h4>
                            <p class="mb-4">Os serviços da plataforma são oferecidos mediante sistema de créditos. Cada auditoria consome 1 crédito por página analisada. Os créditos adquiridos não são reembolsáveis e devem ser utilizados dentro do prazo de validade estipulado. Preços e condições podem ser alterados a qualquer momento.</p>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg mb-3">4. Uso das Agents</h4>
                            <p class="mb-4">O sistema permite criar personas próprias e selecionar 1 por auditoria manual para obter análises focadas. As personas ficam vinculadas à sua conta e simulam diferentes tipos de comportamento e expectativas dos usuários.</p>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg mb-3">5. Resultados e Relatórios</h4>
                            <p class="mb-4">As auditorias geram relatórios detalhados com scores de performance, análise competitiva e recomendações acionáveis. Os resultados ficam disponíveis em seu painel por 30 dias. Recomendamos fazer backup regularmente dos relatórios importantes.</p>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg mb-3">6. Privacidade e Dados</h4>
                            <p class="mb-4">A coleta e uso de informações pessoais estão em conformidade com nossa Política de Privacidade. Ao usar nossos serviços, você consente com a coleta e uso de informações conforme descrito em nossa política.</p>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg mb-3">7. Responsabilidade</h4>
                            <p class="mb-4">Você é responsável por manter a confidencialidade de sua conta e senha, e por restringir o acesso ao seu computador. Você aceita responsabilidade por todas as atividades que ocorrem em sua conta ou senha.</p>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg mb-3">8. Garantias e Representações</h4>
                            <p class="mb-4">A plataforma SSW INTELLIGENCE é fornecida "como está" e "conforme disponível". Não fazemos garantias de qualquer tipo, expressas ou implícitas, sobre a plataforma ou os serviços oferecidos.</p>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg mb-3">9. Limitação de Responsabilidade</h4>
                            <p class="mb-4">Em nenhum caso, a SSW INTELLIGENCE, seus diretores, funcionários, afiliados, agentes, contratados, fornecedores, licenciadores ou concessionários serão responsáveis por qualquer dano direto, indireto, incidental, especial, punitivo ou consequencial.</p>
                        </div>
                        <div>
                            <h4 class="text-white font-bold text-lg mb-3">10. Encerramento de Conta</h4>
                            <p class="mb-4">Você pode solicitar o encerramento de sua conta a qualquer momento. Após o encerramento, seus dados serão mantidos pelo período legalmente exigido, após o qual serão excluídos permanentemente. Créditos não utilizados não são reembolsáveis no encerramento.</p>
                        </div>
                        <div class="p-4 bg-slate-900/50 rounded-xl border border-slate-700 mt-6">
                            <p class="text-xs text-slate-500 text-center">Última atualização: Fevereiro de 2026</p>
                        </div>
                    </div>
                    <div class="mt-6 pt-6 border-t border-slate-700">
                        <p class="text-center text-slate-500 text-sm">
                            2026 SSW INTELLIGENCE. Todos os direitos reservados.
                        </p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            // Inicializa os ícones do Lucide
            lucide.createIcons();
            // Fecha o modal ao clicar fora
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeTermsModal();
                }
            });
        }
        // --- FUNÇÃO DE COMPRA COM CHECKOUT TRANSPARENTE MERCADO PAGO ---
        // Funções comprarPlano, togglePlanType, toggleFAQ e falarComVendas movidas para pricing-section.js
        // Função para gerar PDF oficial a partir dos dados brutos da API
        function gerarPDFOficial(dadosOverride = null) {
            try {
                // Usar dados fornecidos ou dados globais
                const dados = dadosOverride || auditData;
                if (!dados) {
                    Toast.error("Nenhum dado de auditoria disponível para exportar.");
                    return;
                }
                // Adicionar URL se não estiver nos dados
                if (!dados.url && currentAuditUrl) {
                    dados.url = currentAuditUrl;
                }
                // Inicializar jsPDF
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });
                // Configurações de fonte
                doc.setFont('helvetica');
                // Cores corporativas (preto, cinza, branco)
                const colors = {
                    black: [17, 24, 39],         // #111827
                    darkGray: [55, 65, 81],       // #374151
                    lightGray: [249, 250, 251],   // #f9fafb
                    headerBg: [243, 244, 246],    // #f3f4f6
                    border: [229, 231, 235]      // #e5e7eb
                };
                let yPosition = 20;
                // === CABEÇALHO DO DOCUMENTO (Limpo e Elegante) ===
                // Título principal
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...colors.black);
                doc.text('SSW INTELLIGENCE - Análise Estratégica', 105, yPosition, { align: 'center' });
                yPosition += 12;
                // URL analisada
                doc.setFontSize(11);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...colors.darkGray);
                doc.text(`URL Analisada: ${dados.url || 'N/A'}`, 20, yPosition);
                yPosition += 7;
                // Data da análise
                const dataGeracao = new Date().toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                doc.text(`Data da Análise: ${dataGeracao}`, 20, yPosition);
                yPosition += 12;
                // Linha horizontal separadora
                doc.setDrawColor(...colors.border);
                doc.line(20, yPosition, 190, yPosition);
                yPosition += 15;
                // === SCORES COMO TABELA (Painel de Métricas) ===
                // 1. EXTRAÇÃO DOS SCORES com fallbacks seguros
                const metrics = dados?.technical_audit?.real_metrics || {};
                const score_perf = metrics.performance_score ?? "N/A";
                const score_seo = metrics.seo_score ?? "N/A";  // Corrigido de "SEQ" para "SEO"
                const score_acc = metrics.accessibility_score ?? "N/A";
                const load_time = metrics.load_time || "N/A";
                const lcp = metrics.lcp || "N/A";
                // Remover duplicação de "s" nos tempos
                const clean_load_time = String(load_time).replace(/s+$/, '');
                const clean_lcp = String(lcp).replace(/s+$/, '');
                // Criar tabela de scores
                doc.autoTable({
                    head: [['Performance', 'SEO', 'Acessibilidade', 'LCP', 'Load Time']],
                    body: [[score_perf, score_seo, score_acc, clean_lcp, clean_load_time]],
                    startY: yPosition,
                    theme: 'plain',
                    headStyles: {
                        fillColor: colors.headerBg,
                        textColor: colors.black,
                        fontStyle: 'bold',
                        halign: 'center',
                        fontSize: 11
                    },
                    bodyStyles: {
                        halign: 'center',
                        fontSize: 14,
                        textColor: colors.black
                    },
                    margin: { left: 20, right: 20 },
                    didDrawPage: function(data) {
                        yPosition = data.cursor.y;
                    }
                });
                yPosition += 15;
                // === TABELA DE VULNERABILIDADES (Página Separada) ===
                // 2. EXTRAÇÃO DE VULNERABILIDADES com fallbacks
                const limitPdfText = (value, max = 130) => {
                    const text = String(value ?? '').replace(/\s+/g, ' ').trim();
                    return text.length > max ? `${text.substring(0, max - 3)}...` : text;
                };
                const vulns = dados?.technical_audit?.vulnerabilities || [];
                if (vulns.length > 0) {
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.black);
                    doc.text('Vulnerabilidades Identificadas', 20, yPosition);
                    yPosition += 8;
                    // Preparar dados para a tabela
                    const bodyVulns = vulns.slice(0, 4).map(v => [
                        limitPdfText(v.severity || "Atenção", 22),
                        limitPdfText(v.title || "Não especificado", 48),
                        limitPdfText(v.description || "Sem detalhes", 145)
                    ]);
                    // Criar tabela de vulnerabilidades
                    doc.autoTable({
                        head: [['Nível de Risco', 'Problema', 'Descrição Técnica']],
                        body: bodyVulns,
                        startY: yPosition,
                        theme: 'grid',
                        headStyles: {
                            fillColor: [31, 41, 55],
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            fontSize: 10
                        },
                        bodyStyles: {
                            textColor: colors.darkGray,
                            fontSize: 8,
                            cellPadding: 1.5,
                            overflow: 'linebreak'
                        },
                        alternateRowStyles: {
                            fillColor: colors.lightGray
                        },
                        tableLineColor: colors.border,
                        margin: { left: 20, right: 20 },
                        didDrawPage: function(data) {
                            yPosition = data.cursor.y;
                        }
                    });
                }
                // === TABELA DE AGENTS (Página Separada) ===
                // 3. MAPEAMENTO UNIVERSAL DE AGENTS
                const agents = dados?.agents_results || dados?.battle_data?.agent_battleground || dados?.behavioral_analysis || [];
                if (agents.length > 0) {
                    yPosition += 10;
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(...colors.black);
                    doc.text('Análise de Agents', 20, yPosition);
                    yPosition += 8;
                    // Preparar dados para a tabela de agents
                    const bodyAgents = agents.slice(0, 3).map(p => [
                        limitPdfText(p.profile_name || p.agent || "Usuário Geral", 42),
                        limitPdfText((p.score ? `Nota: ${p.score}/10` : null) || p.sentiment || p.preference || "Neutro", 36),
                        limitPdfText(p.direct_quote || p.feedback || p.reason || "Sem análise detalhada.", 145)
                    ]);
                    // Criar tabela de agents
                    doc.autoTable({
                        head: [['Perfil Simulado (Agent)', 'Veredito/Sentimento', 'Feedback Detalhado']],
                        body: bodyAgents,
                        startY: yPosition,
                        theme: 'grid',
                        headStyles: {
                            fillColor: [31, 41, 55],
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            fontSize: 10
                        },
                        bodyStyles: {
                            textColor: colors.darkGray,
                            fontSize: 8,
                            cellPadding: 1.5,
                            overflow: 'linebreak'
                        },
                        alternateRowStyles: {
                            fillColor: colors.lightGray
                        },
                        tableLineColor: colors.border,
                        columnStyles: {
                            0: { cellWidth: 40 }, // Agent
                            1: { cellWidth: 35 }, // Veredito
                            2: { cellWidth: 'auto' } // Feedback Detalhado (largura automática)
                        },
                        margin: { left: 20, right: 20 },
                        didDrawPage: function(data) {
                            yPosition = data.cursor.y;
                        }
                    });
                }
                // === PLANO DE AÇÃO ===
                // 4. O plano começa sempre em uma folha própria.
                const normalizeActions = (plan) => {
                    if (!plan) return [];
                    if (Array.isArray(plan)) return plan.flat().filter(Boolean);
                    if (typeof plan === 'object') {
                        return Object.values(plan).flat().filter(Boolean);
                    }
                    return [plan];
                };
                let actions = [
                    ...normalizeActions(dados?.technical_audit?.action_plan),
                    ...normalizeActions(dados?.action_plan),
                    ...normalizeActions(dados?.battle_data?.action_plan_for_a)
                ];
                actions = [...new Set(actions.map(action => String(action).trim()).filter(Boolean))];

                doc.addPage();
                yPosition = 24;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...colors.black);
                doc.text('Plano de Ação Recomendado', 20, yPosition);
                yPosition += 10;
                const bodyActions = actions.length > 0
                    ? actions.map((act, index) => [`${index + 1}. ${limitPdfText(act, 240)}`])
                    : [["Nenhuma ação recomendada foi retornada pela análise."]];
                doc.autoTable({
                    head: [],
                    body: bodyActions,
                    startY: yPosition,
                    showHead: 'never',
                    theme: 'plain',
                    styles: {
                        textColor: colors.black,
                        fontSize: 10,
                        cellPadding: 2.5,
                        overflow: 'linebreak'
                    },
                    margin: { left: 20, right: 20 },
                    didDrawPage: function(data) {
                        yPosition = data.cursor.y;
                    }
                });
                // === RODAPÉ ===
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(...colors.darkGray);
                    doc.text(`Página ${i} de ${pageCount}`, 105, 287, { align: 'center' });
                    doc.text('Gerado por SSW INTELLIGENCE - Plataforma de Auditoria Web', 105, 290, { align: 'center' });
                }
                // Salvar o PDF
                const fileName = `analise-estrategica-${dados.url ? dados.url.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 30) : 'site'}-${Date.now()}.pdf`;
                doc.save(fileName);
                Toast.success('Análise estratégica gerada com sucesso!');
            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                Toast.error('Erro ao gerar PDF. Tente novamente.');
            }
        }

// ========== RANKING FUNCTIONS MOVED TO src/components/ranking/ranking-component.js ==========
// ========== END RANKING FUNCTIONS ==========
