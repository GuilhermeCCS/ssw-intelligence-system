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
            observeGroup('.lp-hero-label, #landing-title, .lp-hero-intro > p, .lp-hero-actions', 65);
            observeGroup('.lp-tour-intro, .lp-tour', 100);
            observeGroup('.lp-resource-heading, .lp-resource-list > article');
            observeGroup('.lp-personas-grid > .lp-section-copy, .lp-orbit-core, .lp-persona-avatar', 95);
            observeGroup('.lp-centered-heading, .lp-steps > li');
            observeGroup('.lp-report-grid > .lp-section-copy, .lp-report-figure', 110);
            observeGroup('.lp-section-heading, .lp-audiences > article');
            observeGroup('.lp-faq-section > .lp-section-copy, .lp-faq-list');
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
        return { enter, cancelWithin };
    };

    const setup = () => {
        const root = document.querySelector('#view-home.ssw-landing-v2');
        const header = document.querySelector('.lp-header');
        const menu = document.getElementById('landingMenu');
        const toggle = document.getElementById('landingMenuToggle');
        if (!root || !header || !menu || !toggle) return;
        const motion = setupMotion(root);

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

        const tour = document.querySelector('[data-product-tour]');
        if (!tour) return;
        const tabs = Array.from(tour.querySelectorAll('[role="tab"]'));
        const tabList = tour.querySelector('[role="tablist"]');
        const updateIndicator = () => {
            const selected = tabs.find(tab => tab.getAttribute('aria-selected') === 'true');
            if (!selected || !selected.offsetWidth) return;
            tabList.style.setProperty('--lp-tab-left', `${selected.offsetLeft}px`);
            tabList.style.setProperty('--lp-tab-width', selected.offsetWidth);
            tabList.classList.add('has-tab-indicator');
        };
        updateIndicator();
        if ('ResizeObserver' in window) {
            const resizeObserver = new ResizeObserver(updateIndicator);
            tabs.forEach(tab => resizeObserver.observe(tab));
        } else {
            window.addEventListener('resize', updateIndicator, { passive: true });
        }
        const selectTab = (selectedTab) => {
            if (selectedTab.getAttribute('aria-selected') === 'true') return;
            motion.cancelWithin(tour);
            tabs.forEach((tab) => {
                const selected = tab === selectedTab;
                tab.setAttribute('aria-selected', String(selected));
                tab.tabIndex = selected ? 0 : -1;
                const panel = document.getElementById(tab.getAttribute('aria-controls'));
                if (panel) panel.hidden = !selected;
            });
            updateIndicator();
            const selectedPanel = document.getElementById(selectedTab.getAttribute('aria-controls'));
            Array.from(selectedPanel?.children || []).forEach((element, index) => {
                motion.enter(element, { delay: index * 55, distance: 10, duration: 420 });
            });
        };

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
