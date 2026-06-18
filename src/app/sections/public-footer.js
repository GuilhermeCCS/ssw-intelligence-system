(function() {
    const footerStyles = `
        .ssw-public-footer {
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            background: #020408;
            color: #d1d5db;
        }

        .ssw-public-footer-inner {
            width: min(1180px, calc(100% - 32px));
            margin: 0 auto;
            padding: 54px 0 28px;
        }

        .ssw-public-footer-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.35fr) repeat(3, minmax(150px, 0.7fr));
            gap: 34px;
            align-items: flex-start;
        }

        .ssw-public-footer-brand strong {
            display: block;
            color: #ffffff;
            font-size: 20px;
            font-weight: 900;
            letter-spacing: 0.02em;
        }

        .ssw-public-footer-brand span {
            display: block;
            margin-top: 2px;
            color: #22d3ee;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.14em;
            text-transform: uppercase;
        }

        .ssw-public-footer-brand p {
            max-width: 420px;
            margin: 18px 0 0;
            color: #8292a8;
            font-size: 14px;
            line-height: 1.75;
        }

        .ssw-public-footer-col h2 {
            margin: 0 0 14px;
            color: #ffffff;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
        }

        .ssw-public-footer-col a,
        .ssw-public-footer-col button {
            min-height: 28px;
            display: flex;
            align-items: center;
            gap: 9px;
            width: fit-content;
            margin: 0 0 8px;
            padding: 0;
            border: 0;
            background: transparent;
            color: #aebbd0;
            font: inherit;
            font-size: 14px;
            text-decoration: none;
            cursor: pointer;
            transition: color 0.18s ease;
        }

        .ssw-public-footer-col a:hover,
        .ssw-public-footer-col button:hover {
            color: #ffffff;
        }

        .ssw-public-footer-col svg {
            width: 15px;
            height: 15px;
            color: #22d3ee;
            flex: 0 0 auto;
        }

        .ssw-public-footer--sites .ssw-public-footer-brand span,
        .ssw-public-footer--sites .ssw-public-footer-col svg {
            color: #25d366;
        }

        .ssw-public-footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 16px;
            margin-top: 44px;
            padding-top: 22px;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            color: #64748b;
            font-size: 12px;
            line-height: 1.6;
        }

        .ssw-public-footer-bottom span {
            text-align: right;
        }

        @media (max-width: 820px) {
            .ssw-public-footer-grid {
                grid-template-columns: 1fr 1fr;
            }

            .ssw-public-footer-brand {
                grid-column: 1 / -1;
            }

            .ssw-public-footer-bottom {
                align-items: flex-start;
                flex-direction: column;
            }

            .ssw-public-footer-bottom span {
                text-align: left;
            }
        }

        @media (max-width: 560px) {
            .ssw-public-footer-grid {
                grid-template-columns: 1fr;
            }
        }
    `;

    function ensurePublicFooterStyles() {
        if (document.getElementById('ssw-public-footer-styles')) return;
        const style = document.createElement('style');
        style.id = 'ssw-public-footer-styles';
        style.textContent = footerStyles;
        document.head.appendChild(style);
    }

    function renderPublicFooter() {
        ensurePublicFooterStyles();
        document.querySelectorAll('[data-public-footer]').forEach(root => {
            const isSitesFooter = root.dataset.publicFooter === 'sites';
            root.innerHTML = `
                <footer class="ssw-public-footer">
                    <div class="ssw-public-footer-inner">
                        <div class="ssw-public-footer-grid">
                            <div class="ssw-public-footer-brand">
                                <strong>SSW</strong>
                                <span>Intelligence</span>
                                <p>Auditoria web com IA para identificar riscos técnicos, pontos de fricção e oportunidades de crescimento em experiências digitais.</p>
                            </div>

                            <nav class="ssw-public-footer-col" aria-label="Produto">
                                <h2>Produto</h2>
                                <a href="/home"><i data-lucide="file-search"></i>Nova análise</a>
                                <a href="/precos/"><i data-lucide="credit-card"></i>Preços</a>
                                <a href="/termos/"><i data-lucide="file-check"></i>Termos de uso</a>
                            </nav>

                            <nav class="ssw-public-footer-col" aria-label="Suporte">
                                <h2>Suporte</h2>
                                <a href="mailto:contato@sswintelligence.com.br"><i data-lucide="mail"></i>E-mail</a>
                                <a href="https://wa.me/5582991301991?text=PRECISO%20DE%20AJUDA" target="_blank" rel="noopener noreferrer"><i data-lucide="message-circle"></i>WhatsApp</a>
                                <a href="https://instagram.com/sswintelligence" target="_blank" rel="noopener noreferrer"><i data-lucide="camera"></i>Instagram</a>
                            </nav>

                            <div class="ssw-public-footer-col">
                                <h2>Empresa</h2>
                                <a href="/home"><i data-lucide="building-2"></i>SSW Intelligence</a>
                            </div>
                        </div>

                        <div class="ssw-public-footer-bottom">
                            <p>© 2026 SSW INTELLIGENCE. Todos os direitos reservados.</p>
                            <span>CNPJ: 65.283.065/0001-37<br>Desenvolvido por Guilherme Cruz da Silva</span>
                        </div>
                    </div>
                </footer>
            `;

            if (isSitesFooter) {
                const footer = root.querySelector('.ssw-public-footer');
                const brand = root.querySelector('.ssw-public-footer-brand');
                const columns = root.querySelectorAll('.ssw-public-footer-col');

                footer?.classList.add('ssw-public-footer--sites');
                if (brand) {
                    brand.querySelector('strong').textContent = 'S.S.W';
                    brand.querySelector('span').textContent = 'Sites';
                    brand.querySelector('p').textContent = 'Landing pages e sites institucionais r\u00e1pidos, responsivos e pensados para transformar visitas em oportunidades reais de neg\u00f3cio.';
                }

                if (columns.length === 3) {
                    columns[0].setAttribute('aria-label', 'Servi\u00e7os de cria\u00e7\u00e3o de sites');
                    columns[0].innerHTML = `
                        <h2>Servi\u00e7os</h2>
                        <a href="#diferenciais"><i data-lucide="sparkles"></i>Diferenciais</a>
                        <a href="#processo"><i data-lucide="route"></i>Como trabalhamos</a>
                        <a href="#faq"><i data-lucide="circle-help"></i>D\u00favidas frequentes</a>
                    `;

                    columns[1].setAttribute('aria-label', 'Contato para cria\u00e7\u00e3o de sites');
                    columns[1].innerHTML = `
                        <h2>Contato</h2>
                        <a href="https://wa.me/5582991301991?text=Ol%C3%A1!%20Quero%20saber%20mais%20sobre%20a%20cria%C3%A7%C3%A3o%20de%20sites." target="_blank" rel="noopener noreferrer"><i data-lucide="message-circle"></i>Solicitar or\u00e7amento</a>
                        <a href="mailto:contato@sswintelligence.com.br"><i data-lucide="mail"></i>E-mail</a>
                        <a href="https://instagram.com/sswintelligence" target="_blank" rel="noopener noreferrer"><i data-lucide="camera"></i>Instagram</a>
                    `;

                    columns[2].setAttribute('aria-label', 'SSW Intelligence');
                    columns[2].innerHTML = `
                        <h2>SSW</h2>
                        <a href="/home"><i data-lucide="building-2"></i>Plataforma</a>
                        <a href="/precos/"><i data-lucide="credit-card"></i>Planos e pre\u00e7os</a>
                        <a href="/termos/"><i data-lucide="file-check"></i>Termos de uso</a>
                    `;
                }
            }
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    document.addEventListener('DOMContentLoaded', renderPublicFooter);
    window.addEventListener('loadPublicFooter', renderPublicFooter);
})();
