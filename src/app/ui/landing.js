/* Public presentation controls. Authentication and audits remain in the app shell. */
(() => {
    // Everything stays readable without animation support or JavaScript.
    const setupMotion = (root) => {
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        const running = new Map();
        const cancelWithin = (container) => {
            running.forEach((animation, element) => {
                if (container.contains(element)) {
                    animation.cancel();
                    running.delete(element);
                }
            });
        };
        const enter = (element, { delay = 0, distance = 20, duration = 680 } = {}) => {
            if (!element || !element.animate || reducedMotion.matches || document.hidden || element.contains(document.activeElement)) return;
            running.get(element)?.cancel();
            const animation = element.animate([
                { opacity: 0, translate: `0 ${distance}px` },
                { opacity: 1, translate: '0 0' }
            ], { duration, delay, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'backwards' });
            running.set(element, animation);
            const release = () => {
                if (running.get(element) === animation) running.delete(element);
            };
            animation.addEventListener('finish', release, { once: true });
            animation.addEventListener('cancel', release, { once: true });
        };

        reducedMotion.addEventListener('change', () => {
            if (reducedMotion.matches) cancelWithin(root);
        });
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) cancelWithin(root);
        });
        root.addEventListener('focusin', (event) => {
            running.forEach((animation, element) => {
                if (element.contains(event.target)) {
                    animation.cancel();
                    running.delete(element);
                }
            });
        });

        if ('IntersectionObserver' in window) {
            const targets = new Map();
            const observeGroup = (selector, stagger = 75) => {
                root.querySelectorAll(selector).forEach((element, index) => {
                    targets.set(element, Math.min(index, 3) * stagger);
                });
            };
            observeGroup('#landing-title, .lp-hero-lede, .lp-hero-actions, .lp-hero-result', 70);
            observeGroup('#produto .lp-heading, .lp-tour', 100);
            observeGroup('#recursos .lp-heading, .lp-areas > li');
            observeGroup('.lp-personas-section .lp-copy, .lp-persona-card', 95);
            observeGroup('#como-funciona .lp-heading');
            observeGroup('.lp-report-section .lp-copy, .lp-doc', 110);
            observeGroup('#para-quem .lp-heading, .lp-audiences > li');
            observeGroup('.lp-faq-grid > .lp-copy, .lp-faq-list');
            observeGroup('.lp-final-cta .lp-container > *', 65);

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    enter(entry.target, { delay: targets.get(entry.target) });
                    observer.unobserve(entry.target);
                    targets.delete(entry.target);
                });
                if (!targets.size) observer.disconnect();
            }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
            targets.forEach((_, element) => observer.observe(element));
        }
        // Stages: sequences that explain the product (result arriving, journey, steps), driven by CSS.
        const countUp = (element) => {
            const target = Number(element.dataset.countTo);
            if (!Number.isFinite(target)) return;
            if (reducedMotion.matches) { element.textContent = String(target); return; }
            const duration = 900;
            let start;
            const tick = (now) => {
                start ??= now;
                const progress = Math.min(1, (now - start) / duration);
                element.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
                if (progress < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };
        const stages = root.querySelectorAll('[data-stage]');
        if (stages.length && 'IntersectionObserver' in window && !reducedMotion.matches) {
            root.classList.add('lp-motion');
            root.querySelectorAll('[data-stage] [data-count-to]').forEach((counter) => { counter.textContent = '0'; });
            const stageObserver = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;
                    const stage = entry.target;
                    stage.classList.add('is-in');
                    stage.querySelectorAll('[data-count-to]').forEach((counter) => {
                        window.setTimeout(() => countUp(counter), Number(counter.dataset.countDelay) || 0);
                    });
                    stageObserver.unobserve(stage);
                });
            }, { threshold: 0.3, rootMargin: '0px 0px -40px 0px' });
            stages.forEach((stage) => stageObserver.observe(stage));
            // Switching to reduced motion mid-visit shows every stage in its final state.
            reducedMotion.addEventListener('change', () => {
                if (!reducedMotion.matches) return;
                stageObserver.disconnect();
                root.classList.remove('lp-motion');
                root.querySelectorAll('[data-stage] [data-count-to]').forEach((counter) => { counter.textContent = counter.dataset.countTo; });
            });
        }
        return { enter, cancelWithin };
    };

    const setup = () => {
        const root = document.querySelector('#view-home.ssw-landing-v2');
        const header = document.querySelector('.lp-header');
        const menu = document.getElementById('landingMenu');
        const toggle = document.getElementById('landingMenuToggle');
        if (!root || !header || !menu || !toggle) return;
        setupMotion(root);

        // Header gains a soft shadow once the page scrolls under it.
        const topSentinel = document.getElementById('inicio');
        if (topSentinel && 'IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                header.classList.toggle('is-scrolled', !entry.isIntersecting && entry.boundingClientRect.top < 0);
            }).observe(topSentinel);
        }

        const closeMenu = (restoreFocus = false) => {
            header.classList.remove('is-menu-open');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', 'Abrir menu');
            if (restoreFocus) toggle.focus();
        };
        toggle.addEventListener('click', () => {
            const open = toggle.getAttribute('aria-expanded') !== 'true';
            header.classList.toggle('is-menu-open', open);
            toggle.setAttribute('aria-expanded', String(open));
            toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
            if (open) menu.querySelector('a')?.focus();
        });
        menu.addEventListener('click', (event) => {
            if (event.target.closest('a')) closeMenu();
        });
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
        });
        document.addEventListener('click', (event) => {
            if (!header.contains(event.target)) closeMenu();
        });
        header.addEventListener('focusout', () => {
            requestAnimationFrame(() => {
                if (!header.contains(document.activeElement)) closeMenu();
            });
        });
        window.matchMedia('(min-width: 901px)').addEventListener('change', () => closeMenu());

        // Use explicit behavior: the public page can scroll outside #mainContent.
        root.addEventListener('click', (event) => {
            const link = event.target.closest('a[href^="#"]');
            if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            if (link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
            const hash = link.getAttribute('href');
            const target = document.getElementById(hash.slice(1));
            if (!target || !root.contains(target)) return;
            event.preventDefault();
            closeMenu();
            if (window.location.hash !== hash) window.history.pushState(null, '', hash);
            // Preserve keyboard navigation after replacing native anchor navigation.
            const focusTarget = target.id === 'inicio' ? header.querySelector('.lp-brand') : target;
            if (!focusTarget.hasAttribute('tabindex') && focusTarget.tabIndex < 0) {
                focusTarget.setAttribute('tabindex', '-1');
                focusTarget.addEventListener('blur', () => focusTarget.removeAttribute('tabindex'), { once: true });
            }
            focusTarget.focus({ preventScroll: true });
            target.scrollIntoView({
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                block: 'start'
            });
        });

        // Hero form: guests need an account first, so the URL survives sign-up and pre-fills the audit input.
        const PENDING_URL_KEY = 'ssw:pendingAuditUrl';
        const storage = (() => { try { return window.sessionStorage; } catch { return null; } })();
        const normalizeUrl = (value) => {
            const raw = value.trim();
            if (!raw) return null;
            const withScheme = /^[a-z][a-z\d+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`;
            try {
                const url = new URL(withScheme);
                if (!/^https?:$/.test(url.protocol) || !url.hostname.includes('.')) return null;
                return url.href;
            } catch {
                return null;
            }
        };
        root.querySelectorAll('[data-hero-url-form]').forEach((form) => {
            const input = form.querySelector('input[name="url"]');
            const field = form.querySelector('.lp-hero-field');
            const error = form.querySelector('[data-hero-url-error]');
            const showError = (message) => {
                field?.classList.toggle('is-invalid', Boolean(message));
                if (message && field) {
                    field.classList.remove('is-shaking');
                    void field.offsetWidth;
                    field.classList.add('is-shaking');
                }
                input?.setAttribute('aria-invalid', message ? 'true' : 'false');
                if (!error) return;
                error.textContent = message || '';
                error.hidden = !message;
            };
            input?.addEventListener('input', () => showError(''));
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const typed = input?.value || '';
                const url = normalizeUrl(typed);
                if (!url) {
                    showError(typed.trim() ? 'Confira o endereço. Exemplo: seusite.com.br' : 'Digite o endereço do site que você quer analisar.');
                    input?.focus();
                    return;
                }
                showError('');
                try { storage?.setItem(PENDING_URL_KEY, url); } catch { /* private mode: sign-up still works */ }
                if (typeof window.showAuthScreen === 'function') window.showAuthScreen('register');
            });
        });
        const applyPendingUrl = () => {
            if (!document.body.classList.contains('user-authenticated')) return;
            const auditInput = document.getElementById('auditUrl');
            let pending = null;
            try { pending = storage?.getItem(PENDING_URL_KEY); } catch { pending = null; }
            if (!pending || !auditInput) return;
            if (!auditInput.value) auditInput.value = pending;
            try { storage?.removeItem(PENDING_URL_KEY); } catch { /* ignore */ }
        };
        applyPendingUrl();
        new MutationObserver(applyPendingUrl).observe(document.body, { attributes: true, attributeFilter: ['class'] });

        const tour = document.querySelector('[data-product-tour]');
        if (!tour) return;
        const tabs = Array.from(tour.querySelectorAll('[role="tab"]'));
        const tabList = tour.querySelector('[role="tablist"]');
        const viewport = tour.querySelector('.lp-tour-viewport');
        const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
        const playback = tour.querySelector('[data-tour-playback]');
        const counter = tour.querySelector('[data-tour-counter]');
        if (!tabs.length || !viewport || panels.some(panel => !panel) || !playback || !counter) return;
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        let activeIndex = 0;
        let autoplay = !reducedMotion.matches;
        let inView = !('IntersectionObserver' in window);
        let hovered = false;
        let timer;
        let scrollTimer;
        let playbackBeforePointer;

        const updateIndicator = () => {
            const selected = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
            if (!selected || !selected.offsetWidth) return;
            tabList.style.setProperty('--lp-tab-left', `${selected.offsetLeft}px`);
            tabList.style.setProperty('--lp-tab-width', selected.offsetWidth);
            tabList.classList.add('has-tab-indicator');
        };
        const renderSelection = (index) => {
            const movePanelFocus = panels.some((panel, panelIndex) => panelIndex !== index && panel.contains(document.activeElement));
            activeIndex = index;
            tabs.forEach((tab, panelIndex) => {
                const selected = panelIndex === index;
                tab.setAttribute('aria-selected', String(selected));
                tab.tabIndex = selected ? 0 : -1;
                panels[panelIndex].inert = !selected;
                panels[panelIndex].setAttribute('aria-hidden', String(!selected));
                panels[panelIndex].tabIndex = selected ? 0 : -1;
            });
            counter.firstChild.textContent = `${String(index + 1).padStart(2, '0')} `;
            counter.setAttribute('aria-label', `Captura ${index + 1} de ${tabs.length}`);
            updateIndicator();
            if (movePanelFocus) panels[index].focus({ preventScroll: true });
        };
        const TOUR_DELAY = 6500;
        tour.style.setProperty('--lp-tour-ms', `${TOUR_DELAY}ms`);
        const scheduleAdvance = () => {
            window.clearTimeout(timer);
            tabs.forEach(tab => tab.classList.remove('is-timing'));
            if (!autoplay || reducedMotion.matches || !inView || hovered || document.hidden || !tour.getClientRects().length) return;
            timer = window.setTimeout(() => selectTab(tabs[(activeIndex + 1) % tabs.length], false), TOUR_DELAY);
            const activeTab = tabs[activeIndex];
            void activeTab.offsetWidth;
            activeTab.classList.add('is-timing');
        };
        const setAutoplay = (enabled) => {
            autoplay = enabled && !reducedMotion.matches;
            playback.disabled = reducedMotion.matches;
            playback.setAttribute('aria-label', reducedMotion.matches
                ? 'Rotação automática desativada pela preferência de movimento reduzido'
                : autoplay ? 'Pausar carrossel' : 'Reproduzir carrossel');
            playback.querySelector('[data-tour-pause]').hidden = !autoplay;
            playback.querySelector('[data-tour-play]').hidden = autoplay;
            playback.querySelector('[data-tour-playback-label]').textContent = autoplay ? 'Pausar' : 'Reproduzir';
            viewport.setAttribute('aria-live', autoplay ? 'off' : 'polite');
            scheduleAdvance();
        };
        const selectTab = (selectedTab, manual = true) => {
            const index = tabs.indexOf(selectedTab);
            if (index < 0) return;
            if (manual) setAutoplay(false);
            renderSelection(index);
            viewport.scrollTo({ left: index * viewport.clientWidth, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
            scheduleAdvance();
        };
        const settleScroll = () => {
            if (!viewport.clientWidth) return;
            const index = Math.max(0, Math.min(tabs.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
            if (index !== activeIndex) renderSelection(index);
        };
        viewport.addEventListener('scroll', () => {
            window.clearTimeout(scrollTimer);
            scrollTimer = window.setTimeout(settleScroll, 120);
        }, { passive: true });
        // Native scroll snap keeps touch swipes, vertical scrolling and pinch zoom available.
        viewport.addEventListener('pointerdown', () => setAutoplay(false), { passive: true });
        viewport.addEventListener('wheel', () => setAutoplay(false), { passive: true });
        tour.addEventListener('pointerenter', (event) => {
            if (event.pointerType === 'mouse') { hovered = true; scheduleAdvance(); }
        });
        tour.addEventListener('pointerleave', (event) => {
            if (event.pointerType === 'mouse') { hovered = false; scheduleAdvance(); }
        });
        tour.addEventListener('focusin', () => setAutoplay(false));
        document.addEventListener('visibilitychange', scheduleAdvance);
        reducedMotion.addEventListener('change', () => {
            setAutoplay(false);
            viewport.scrollTo({ left: activeIndex * viewport.clientWidth, behavior: 'instant' });
        });
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                inView = entry.isIntersecting;
                scheduleAdvance();
            }, { threshold: 0.25 }).observe(tour);
        }
        const resize = () => {
            viewport.scrollTo({ left: activeIndex * viewport.clientWidth, behavior: 'instant' });
            updateIndicator();
        };
        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(resize);
            resizeObserver.observe(viewport);
            tabs.forEach(tab => resizeObserver.observe(tab));
        } else {
            window.addEventListener('resize', resize, { passive: true });
        }
        // Pointer focus pauses rotation before click; retain the action the user chose.
        playback.addEventListener('pointerdown', () => { playbackBeforePointer = autoplay; });
        playback.addEventListener('pointercancel', () => { playbackBeforePointer = undefined; });
        playback.addEventListener('blur', () => { playbackBeforePointer = undefined; });
        playback.addEventListener('click', () => {
            const wasPlaying = playbackBeforePointer ?? autoplay;
            playbackBeforePointer = undefined;
            setAutoplay(!wasPlaying);
        });
        tour.querySelector('[data-tour-prev]')?.addEventListener('click', () => selectTab(tabs[(activeIndex - 1 + tabs.length) % tabs.length]));
        tour.querySelector('[data-tour-next]')?.addEventListener('click', () => selectTab(tabs[(activeIndex + 1) % tabs.length]));
        tour.querySelectorAll('[data-tour-controls], [data-tour-playback]').forEach(control => { control.hidden = false; });
        renderSelection(0);
        setAutoplay(autoplay);

        tabs.forEach((tab, index) => {
            tab.addEventListener('click', () => selectTab(tab));
            tab.addEventListener('keydown', (event) => {
                let nextIndex;
                if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
                if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
                if (event.key === 'Home') nextIndex = 0;
                if (event.key === 'End') nextIndex = tabs.length - 1;
                if (nextIndex === undefined) return;
                event.preventDefault();
                selectTab(tabs[nextIndex]);
                tabs[nextIndex].focus();
            });
        });

        document.querySelectorAll('#view-home [data-tour-target]').forEach((control) => {
            control.addEventListener('click', () => {
                const selectedTab = tabs.find(tab => tab.id === `tour-tab-${control.dataset.tourTarget}`);
                if (!selectedTab) return;
                selectTab(selectedTab);
                selectedTab.focus({ preventScroll: true });
                if (control.tagName === 'BUTTON') {
                    document.getElementById('produto')?.scrollIntoView({
                        block: 'start',
                        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
                    });
                }
            });
        });
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
    else setup();
})();
