function closePromoBanner() {
            const banner = document.getElementById('promo-banner');
            if (banner) {
                banner.style.transition = 'all 0.3s ease-out';
                banner.style.opacity = '0';
                banner.style.transform = 'translateY(-100%)';
                setTimeout(() => {
                    banner.remove();
                }, 300);
            }
        }
        // Função para mostrar banner quando usuário faz login
        function showPromoBanner() {
            const promoBanner = document.getElementById('promo-banner');
            if (promoBanner && USER && USER.email) {
                // Atualiza o valor inicial no HTML
                const contadorElementos = document.querySelectorAll('#contador-pessoas');
                contadorElementos.forEach(el => {
                    el.textContent = pessoasComprando;
                });
                promoBanner.style.display = 'block';
                startCountdown();
                setInterval(updateContadorPessoas, 120000); // Atualiza a cada 2 minutos
            }
        }
