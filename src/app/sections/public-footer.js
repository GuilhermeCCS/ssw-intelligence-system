(function() {
    const footerStyles = `
        .ssw-public-footer {
            position: relative;
            overflow: hidden;
            border-top: 1px solid rgba(103, 232, 249, 0.12);
            background-color: #05070b;
            background-image:
                linear-gradient(90deg, rgba(3, 6, 12, 0.96) 0%, rgba(3, 8, 18, 0.9) 46%, rgba(3, 6, 12, 0.94) 100%),
                url("/src/assets/images/footer/ssw-footer-network-bg.png?v=20260630-1");
            background-repeat: no-repeat;
            background-position: center;
            background-size: cover;
            color: #a3adbd;
        }

        .ssw-public-footer::before {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
                radial-gradient(circle at 10% 72%, rgba(37, 99, 235, 0.16), transparent 27%),
                radial-gradient(circle at 88% 34%, rgba(59, 130, 246, 0.13), transparent 30%),
                linear-gradient(180deg, rgba(255, 255, 255, 0.025), transparent 24%, rgba(0, 0, 0, 0.22));
        }

        .ssw-public-footer::after {
            content: "";
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
                linear-gradient(180deg, rgba(255, 255, 255, 0.035), transparent 18%),
                linear-gradient(90deg, rgba(0, 0, 0, 0.22), transparent 42%, rgba(0, 0, 0, 0.18));
        }

        .ssw-public-footer-inner {
            position: relative;
            z-index: 1;
            width: min(1180px, calc(100% - 40px));
            margin: 0 auto;
            padding: 42px 0 18px;
        }

        .ssw-public-footer-grid {
            display: grid;
            grid-template-columns: minmax(250px, 1.45fr) repeat(4, minmax(120px, 0.66fr));
            gap: clamp(24px, 4vw, 58px);
            align-items: start;
        }

        .ssw-public-footer-brand-mark {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            color: #f8fafc;
            text-decoration: none;
        }

        .ssw-public-footer-logo {
            width: 32px;
            height: 32px;
            border-radius: 999px;
            object-fit: cover;
            box-shadow: 0 0 0 1px rgba(103, 232, 249, 0.24);
        }

        .ssw-public-footer-brand strong {
            display: block;
            color: #f8fafc;
            font-size: 0.86rem;
            font-weight: 900;
            line-height: 1;
            letter-spacing: 0.02em;
        }

        .ssw-public-footer-brand-mark > span > span {
            display: block;
            margin-top: 4px;
            color: #22d3ee;
            font-size: 0.64rem;
            font-weight: 850;
            letter-spacing: 0.16em;
            line-height: 1;
            text-transform: uppercase;
        }

        .ssw-public-footer-brand p {
            max-width: 360px;
            margin: 22px 0 0;
            color: #7f8ca2;
            font-size: 0.9rem;
            line-height: 1.7;
        }

        .ssw-public-footer-social {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-top: 42px;
        }

        .ssw-public-footer-social a {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            color: #f8fafc;
            opacity: 0.78;
            text-decoration: none;
            transition: color 180ms ease, opacity 180ms ease, transform 180ms ease;
        }

        .ssw-public-footer-social a:hover {
            color: #67e8f9;
            opacity: 1;
            transform: translateY(-1px);
        }

        .ssw-public-footer-social svg {
            width: 16px;
            height: 16px;
        }

        .ssw-public-footer-col h2 {
            margin: 0 0 16px;
            color: #f8fafc;
            font-size: 0.76rem;
            font-weight: 800;
            letter-spacing: 0.02em;
        }

        .ssw-public-footer-col a,
        .ssw-public-footer-col button {
            display: flex;
            width: fit-content;
            margin: 0 0 11px;
            padding: 0;
            border: 0;
            background: transparent;
            color: #8d97a8;
            font: inherit;
            font-size: 0.82rem;
            line-height: 1.35;
            text-align: left;
            text-decoration: none;
            cursor: pointer;
            transition: color 180ms ease, transform 180ms ease;
        }

        .ssw-public-footer-col a:hover,
        .ssw-public-footer-col button:hover {
            color: #f8fafc;
            transform: translateX(2px);
        }

        .ssw-public-footer-bottom {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 20px;
            margin-top: 34px;
            padding-top: 18px;
            border-top: 1px solid rgba(148, 163, 184, 0.08);
            color: #687386;
            font-size: 0.76rem;
            line-height: 1.6;
        }

        .ssw-public-footer-bottom p {
            margin: 0;
        }

        .ssw-public-footer-legal {
            display: flex;
            flex-wrap: wrap;
            justify-content: flex-end;
            gap: 9px 14px;
        }

        .ssw-public-footer-legal a,
        .ssw-public-footer-legal span {
            color: #687386;
            text-decoration: none;
        }

        .ssw-public-footer-legal a:hover {
            color: #dbeafe;
        }

        @media (max-width: 980px) {
            .ssw-public-footer-grid {
                grid-template-columns: 1fr 1fr;
            }

            .ssw-public-footer-brand {
                grid-column: 1 / -1;
            }
        }

        @media (max-width: 640px) {
            .ssw-public-footer-inner {
                width: min(100% - 32px, 1180px);
            }

            .ssw-public-footer-grid {
                grid-template-columns: 1fr;
            }

            .ssw-public-footer-social {
                margin-top: 28px;
            }

            .ssw-public-footer-bottom {
                align-items: flex-start;
                flex-direction: column;
            }

            .ssw-public-footer-legal {
                justify-content: flex-start;
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

    function publicFooterData(isSitesFooter) {
        if (isSitesFooter) {
            return {
                title: 'S.S.W Sites',
                subtitle: 'Alta conversão',
                description: 'Landing pages e sites institucionais rápidos, responsivos e pensados para transformar visitas em oportunidades reais de negócio.',
                columns: [
                    {
                        label: 'Navegação',
                        links: [
                            { href: '#problema', text: 'O problema' },
                            { href: '#processo', text: 'Como funciona' },
                            { href: '#comparacao', text: 'Comparação' },
                            { href: '#faq', text: 'Dúvidas' }
                        ]
                    },
                    {
                        label: 'Serviços',
                        links: [
                            { href: 'https://wa.me/5582991301991?text=Ol%C3%A1!%20Quero%20solicitar%20um%20or%C3%A7amento%20para%20a%20cria%C3%A7%C3%A3o%20de%20um%20site.', text: 'Solicitar orçamento', external: true },
                            { href: '/sites/', text: 'Sites e landing pages' },
                            { href: '/home', text: 'Auditoria S.S.W' }
                        ]
                    },
                    {
                        label: 'Contato',
                        links: [
                            { href: 'mailto:contato@sswintelligence.com.br', text: 'E-mail' },
                            { href: 'https://wa.me/5582991301991?text=PRECISO%20DE%20AJUDA', text: 'WhatsApp', external: true },
                            { href: 'https://instagram.com/sswintelligence', text: 'Instagram', external: true }
                        ]
                    },
                    {
                        label: 'Empresa',
                        links: [
                            { href: '/home', text: 'S.S.W Intelligence' },
                            { href: '/precos/', text: 'Planos e créditos' },
                            { href: '/termos/', text: 'Termos de uso' }
                        ]
                    }
                ]
            };
        }

        return {
            title: 'S.S.W Intelligence',
            subtitle: 'Silva Serviços Web',
            description: 'Auditoria web com IA, simulação de personas reais e desenvolvimento de sites e sistemas otimizados para performance, clareza e conversão.',
            columns: [
                {
                    label: 'Plataforma',
                    links: [
                        { href: '/home', text: 'Nova análise' },
                        { href: '/precos/', text: 'Planos e créditos' },
                        { href: '/termos/', text: 'Termos de uso' }
                    ]
                },
                {
                    label: 'Serviços',
                    links: [
                        { href: '/sites/', text: 'Sites e sistemas' },
                        { href: '/home', text: 'Auditoria com IA' },
                        { href: '/agents', text: 'Personas IA' }
                    ]
                },
                {
                    label: 'Recursos',
                    links: [
                        { href: '/ranking', text: 'Ranking público' },
                        { href: '/tutorial', text: 'Documentação' },
                        { href: '/precos/', text: 'Preços' }
                    ]
                },
                {
                    label: 'Empresa',
                    links: [
                        { href: '/about', text: 'Sobre a S.S.W' },
                        { href: 'mailto:contato@sswintelligence.com.br', text: 'Contato' },
                        { href: 'https://instagram.com/sswintelligence', text: 'Instagram', external: true }
                    ]
                }
            ]
        };
    }

    function renderLink(link) {
        const target = link.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${link.href}"${target}>${link.text}</a>`;
    }

    function renderPublicFooter() {
        ensurePublicFooterStyles();
        document.querySelectorAll('[data-public-footer]').forEach(root => {
            const isSitesFooter = root.dataset.publicFooter === 'sites';
            const data = publicFooterData(isSitesFooter);

            root.innerHTML = `
                <footer class="ssw-public-footer${isSitesFooter ? ' ssw-public-footer--sites' : ''}">
                    <div class="ssw-public-footer-inner">
                        <div class="ssw-public-footer-grid">
                            <div class="ssw-public-footer-brand">
                                <a class="ssw-public-footer-brand-mark" href="/home" aria-label="Ir para a S.S.W Intelligence">
                                    <img class="ssw-public-footer-logo" src="/src/assets/images/logo/logo_ofc.png?v=20260627-logo-ofc-v2" alt="">
                                    <span>
                                        <strong>${data.title}</strong>
                                        <span>${data.subtitle}</span>
                                    </span>
                                </a>
                                <p>${data.description}</p>
                                <div class="ssw-public-footer-social" aria-label="Canais oficiais">
                                    <a href="mailto:contato@sswintelligence.com.br" aria-label="E-mail"><i data-lucide="mail"></i></a>
                                    <a href="https://wa.me/5582991301991?text=PRECISO%20DE%20AJUDA" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><i data-lucide="message-circle"></i></a>
                                    <a href="https://instagram.com/sswintelligence" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><i data-lucide="instagram"></i></a>
                                </div>
                            </div>

                            ${data.columns.map(column => `
                                <nav class="ssw-public-footer-col" aria-label="${column.label}">
                                    <h2>${column.label}</h2>
                                    ${column.links.map(renderLink).join('')}
                                </nav>
                            `).join('')}
                        </div>

                        <div class="ssw-public-footer-bottom">
                            <p>Copyright © 2026 S.S.W Intelligence. Todos os direitos reservados.</p>
                            <div class="ssw-public-footer-legal" aria-label="Informações legais">
                                <a href="/termos/">Termos de uso</a>
                                <span>CNPJ 65.283.065/0001-37</span>
                                <span>Desenvolvido por Guilherme Cruz da Silva</span>
                            </div>
                        </div>
                    </div>
                </footer>
            `;
        });

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    document.addEventListener('DOMContentLoaded', renderPublicFooter);
    window.addEventListener('loadPublicFooter', renderPublicFooter);
})();
