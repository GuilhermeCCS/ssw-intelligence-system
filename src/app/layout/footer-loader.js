// Carrega o footer dinamicamente
            async function loadFooterSection() {
                try {
                    const response = await fetch('src/components/footer/footer-component.html');
                    const html = await response.text();
                    document.getElementById('footer-container').innerHTML = html;
                    // Recria ícones Lucide após carregar
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                    // Dispara evento para inicialização específica do footer
                    window.dispatchEvent(new Event('loadFooterSection'));
                    if (typeof checkForAuditResults === 'function') {
                        setTimeout(checkForAuditResults, 0);
                    }
                } catch (error) {
                    console.error('Erro ao carregar footer:', error);
                }
            }

            // Carrega o footer quando a página estiver pronta
            document.addEventListener('DOMContentLoaded', loadFooterSection);
