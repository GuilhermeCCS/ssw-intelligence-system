// Checkout Transparente Mercado Pago - Versão Vanilla JS
class CheckoutMercadoPago {
  constructor() {
    this.isInitialized = false;
    this.currentPayment = null;
    this.modal = null;
    this.currentUser = null;
    this.selectedPackage = null;
    
    // Carrega variáveis de ambiente
    this.API_BASE_URL = 'https://82e29984-9ee4-4727-929e-57421b477e7a-00-2bi525obh81pp.worf.replit.dev';
    this.MP_PUBLIC_KEY = 'APP_USR-0666c374-0f5e-4421-b67d-f9879c8866ac';
  }

  // Inicializa o SDK do Mercado Pago v2
  async init(publicKey = null) {
    const keyToUse = publicKey || this.MP_PUBLIC_KEY;
    try {
      // SDK v2 já está carregado via <script> no head
      if (!window.MercadoPago) {
        throw new Error('SDK do Mercado Pago não encontrado');
      }
      
      // Inicializa a instância do Mercado Pago (V2)
      this.mp = new window.MercadoPago(keyToUse, {
        locale: 'pt-BR'
      });
      
      // Cria o construtor de Bricks
      this.bricksBuilder = this.mp.bricks();
      
      this.isInitialized = true;
      console.log('Mercado Pago v2 inicializado com sucesso');
    } catch (error) {
      console.error('Erro ao inicializar Mercado Pago:', error);
      throw error;
    }
  }

  // Abre o modal de checkout
  async openCheckout(packageData, userData = null) {
    if (!this.isInitialized) {
      await this.init();
    }

    this.selectedPackage = packageData;
    this.currentUser = userData || { id: 'user_temp_id' };
    
    this.createModal();
    this.showModal();
    await this.renderPaymentBrick();
  }

  // Cria o modal HTML
  createModal() {
    if (this.modal) return;

    const modalHTML = `
      <div id="checkout-modal" class="fixed inset-0 z-50 hidden">
        <div class="fixed inset-0 bg-black/80 backdrop-blur-sm" onclick="checkoutMP.closeModal()"></div>
        <div class="fixed inset-0 flex items-center justify-center p-4">
          <div class="relative w-full max-w-2xl bg-[#0F1117] border border-white/10 rounded-2xl shadow-2xl">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-white/10">
              <div>
                <h3 class="text-2xl font-bold text-white">Finalizar Pagamento</h3>
                <p class="text-slate-400 mt-1" id="package-info">
                  ${this.selectedPackage?.nome || 'Pacote'} - R$ ${this.selectedPackage?.preco || '0,00'}
                </p>
              </div>
              <button onclick="checkoutMP.closeModal()" class="text-slate-400 hover:text-white transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Content -->
            <div class="p-6">
              <!-- Initial State -->
              <div id="payment-initial" class="space-y-6">
                <div class="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div class="flex items-center space-x-3">
                    <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p class="text-blue-400 text-sm">
                      Aceitamos cartão de crédito, débito e Pix. Pagamento 100% seguro.
                    </p>
                  </div>
                </div>

                <!-- Cloudflare Turnstile Widget -->
                <div id="turnstile-checkout" class="flex justify-center min-h-[65px] items-center">
                  <div class="text-xs text-slate-500 animate-pulse">Carregando verificação de segurança...</div>
                </div>

                <!-- Payment Brick Container -->
                <div id="payment-brick-container" class="min-h-[400px]"></div>
              </div>

              <!-- Processing State -->
              <div id="payment-processing" class="hidden flex-col items-center justify-center py-12 space-y-4">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                <p class="text-white text-lg">Processando pagamento...</p>
                <p class="text-slate-400 text-sm">Aguarde um momento</p>
              </div>

              <!-- Pix QR Code State -->
              <div id="payment-pix" class="hidden space-y-6">
                <div class="text-center">
                  <div class="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
                    <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                  </div>
                  <h4 class="text-xl font-bold text-white mb-2">Pague com Pix</h4>
                  <p class="text-slate-400">Escaneie o QR Code ou copie o código</p>
                </div>

                <div class="flex justify-center">
                  <div class="bg-white p-4 rounded-lg">
                    <img id="pix-qr-image" src="" alt="QR Code Pix" class="w-48 h-48" />
                  </div>
                </div>

                <div class="bg-slate-800/50 border border-white/10 rounded-lg p-4">
                  <p class="text-slate-400 text-sm mb-2">Código Pix:</p>
                  <div class="flex items-center space-x-2">
                    <code id="pix-code" class="flex-1 text-xs text-white bg-slate-900/50 p-3 rounded border border-white/5 break-all"></code>
                    <button onclick="checkoutMP.copyPixCode()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copiar</span>
                    </button>
                  </div>
                </div>

                <div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                  <p class="text-yellow-400 text-sm">
                    <strong>Atenção:</strong> O pagamento será confirmado em até 5 minutos. 
                    A página será atualizada automaticamente.
                  </p>
                </div>
              </div>

              <!-- Success State -->
              <div id="payment-success" class="hidden text-center py-12 space-y-4">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full">
                  <svg class="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 class="text-2xl font-bold text-white">Pagamento Aprovado!</h4>
                <p class="text-slate-400">Seus créditos já estão na conta.</p>
                <p class="text-slate-500 text-sm">Redirecionando...</p>
              </div>

              <!-- Error State -->
              <div id="payment-error" class="hidden text-center py-12 space-y-4">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full">
                  <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 class="text-xl font-bold text-white">Erro no Pagamento</h4>
                <p id="error-message" class="text-red-400"></p>
                <button onclick="checkoutMP.resetPayment()" class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                  Tentar Novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('checkout-modal');
  }

  // Renderiza o Payment Brick usando SDK v2
  async renderPaymentBrick() {
    const container = document.getElementById('payment-brick-container');
    
    if (!this.bricksBuilder || !container) {
      console.error('BricksBuilder não inicializado ou container não encontrado');
      return;
    }

    // Prevenção de duplicação: Destrói o brick anterior se ele já estiver na tela
    if (window.paymentBrickController) {
      window.paymentBrickController.unmount();
      window.paymentBrickController = null;
    }

    // Limpa o container
    container.innerHTML = '';

    const settings = {
      initialization: {
        amount: parseFloat(this.selectedPackage?.preco || '0'), // Valor dinâmico do plano selecionado
      },
      customization: {
        visual: {
          style: {
            theme: "dark",
            customVariables: {
              // Evita erros de SVG com height/width vazios
              formInputHeight: "48px",
              formInputWidth: "100%",
              borderRadius: "8px",
              buttonHeight: "48px",
              buttonWidth: "100%",
              fontSize: "16px",
              fontWeight: "400",
              // Adiciona valores explícitos para evitar SVG problems
              paymentMethodsIconSize: "24px",
              paymentMethodsIconWidth: "24px",
              paymentMethodsIconHeight: "24px"
            }
          },
          // Configurações explícitas para evitar problemas de renderização
          hideFormTitle: false,
          hidePaymentMethodSelectionBadge: false,
          // Desabilita animações que podem causar problemas de SVG
          disableAnimations: true,
          // Força renderização sem ícones customizados
          hidePaymentMethodIcon: false
        },
        paymentMethods: {
          creditCard: "all",
          debitCard: "all",
          bankTransfer: "all" // Habilita o Pix
        },
      },
      callbacks: {
        onReady: () => {
          // Remove o spinner de loading quando o formulário aparecer
          console.log('Payment Brick está pronto');
        },
        onSubmit: ({ selectedPaymentMethod, formData }) => {
          // Aqui você faz o fetch POST para o nosso '/api/pagamento/processar'
          return new Promise((resolve, reject) => {
            this.handlePaymentSubmit(formData)
              .then(resolve)
              .catch(reject);
          });
        },
        onError: (error) => {
          console.error("Erro no Brick:", error);
          
          // Verificar se é erro de SVG específico (height ou width)
          if (error.message && error.message.includes('svg') && 
              (error.message.includes('height') || error.message.includes('width'))) {
            console.warn('Erro de SVG detectado, tentando recriar o Brick...');
            // Tentar recriar o brick com configurações mais simples
            setTimeout(() => {
              this.renderPaymentBrick();
            }, 1000);
            return;
          }
          
          this.showError('Erro no formulário de pagamento');
        },
      },
    };

    try {
      // Renderiza a interface do cartão/pix dentro da div com id="payment-brick-container"
      window.paymentBrickController = await this.bricksBuilder.create(
        "payment",
        "payment-brick-container",
        settings
      );
      console.log('Payment Brick criado com sucesso');

      // Renderizar widget do Cloudflare Turnstile no checkout
      if (typeof turnstile !== 'undefined') {
        const turnstileContainer = document.getElementById('turnstile-checkout');
        if (turnstileContainer) {
          turnstile.render('#turnstile-checkout', {
            sitekey: '0x4AAAAAADU_DaUQEsTW3GMs',
            theme: 'dark',
            callback: function(token) {
              console.log('✅ Turnstile checkout token recebido:', token);
            },
            'error-callback': function(error) {
              console.error('❌ Erro na verificação do captcha:', error);
            }
          });
          console.log('✅ Widget Turnstile renderizado no checkout');
        }
      } else {
        console.warn('⚠️ Turnstile não está disponível');
      }
    } catch (error) {
      console.error('Erro ao criar Payment Brick:', error);
      
      // Verificar se é erro de SVG específico (height ou width)
      if (error.message && error.message.includes('svg') && 
          (error.message.includes('height') || error.message.includes('width'))) {
        console.warn('Erro de SVG na criação do Brick, tentando com configuração simplificada...');
        
        // Tentar criar com configuração mínima
        try {
          const minimalSettings = {
            initialization: {
              amount: parseFloat(this.selectedPackage?.preco || '0'),
            },
            callbacks: {
              onReady: () => console.log('Payment Brick simplificado está pronto'),
              onSubmit: ({ selectedPaymentMethod, formData }) => {
                return new Promise((resolve, reject) => {
                  this.handlePaymentSubmit(formData)
                    .then(resolve)
                    .catch(reject);
                });
              },
              onError: (err) => {
                console.error('Erro no Brick simplificado:', err);
                this.showError('Erro no formulário de pagamento');
              },
            },
          };
          
          window.paymentBrickController = await this.bricksBuilder.create(
            "payment",
            "payment-brick-container",
            minimalSettings
          );
          console.log('Payment Brick simplificado criado com sucesso');

          // Renderizar widget do Cloudflare Turnstile no checkout (fallback)
          if (typeof turnstile !== 'undefined') {
            const turnstileContainer = document.getElementById('turnstile-checkout');
            if (turnstileContainer) {
              turnstile.render('#turnstile-checkout', {
                sitekey: '0x4AAAAAADU_DaUQEsTW3GMs',
                theme: 'dark',
                callback: function(token) {
                  console.log('✅ Turnstile checkout token recebido (fallback):', token);
                }
              });
              console.log('✅ Widget Turnstile renderizado no checkout (fallback)');
            }
          }
        } catch (fallbackError) {
          console.error('Erro até mesmo na configuração simplificada:', fallbackError);
          this.showError('Erro ao carregar formulário de pagamento. Tente recarregar a página.');
        }
      } else {
        this.showError('Erro ao carregar formulário de pagamento');
      }
    }
  }

  // Processa o pagamento
  async handlePaymentSubmit(formData) {
    this.showState('processing');

    // Capturar token do Turnstile do DOM
    const cfToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
    if (!cfToken) {
      this.showError('Resolva o captcha primeiro');
      this.showState('initial');
      return;
    }

    const payload = {
      user_id: this.currentUser?.id || 'user_temp_id',
      pacote_id: this.selectedPackage.id,
      payment_method_id: formData.payment_method_id,
      payer: formData.payer,
      transaction_amount: formData.transaction_amount,
      token: formData.token || null,
      installments: formData.installments || 1,
      issuer_id: formData.issuer_id || null,
      cf_token: cfToken
    };

    try {
      const response = await fetch(`${this.API_BASE_URL}/api/pagamento/processar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // 1. Verifica se a resposta não é OK (ex: 405, 500)
      if (!response.ok) {
        const errorText = await response.text(); // Pega como texto para não quebrar o JSON parse
        console.error("Erro do servidor:", response.status, errorText);
        throw new Error(`Falha na API: ${response.status} - ${errorText || 'Erro interno do servidor'}`);
      }
      
      // 2. Se for OK, aí sim faz o parse do JSON
      const result = await response.json();
      console.log("Sucesso:", result);

      if (result.acao_requerida === 'pagar_pix') {
        this.showPixPayment(result);
      } else if (result.acao_requerida === 'sucesso_cartao') {
        // Cartão aprovado - mostrar sucesso imediatamente
        console.log('💳 Cartão aprovado! Chamando showSuccessScreen()...');
        this.showSuccessScreen();
      } else if (result.acao_requerida === 'erro') {
        this.showError(result.mensagem || 'Ocorreu um erro ao processar o pagamento');
      } else {
        this.showError('Resposta inesperada do servidor');
      }
    } catch (error) {
      console.error('Erro no pagamento:', error);
      this.showError(error.message || 'Erro de conexão com o servidor de pagamento');
    }
  }

  // Atualiza os créditos do usuário buscando dados atualizados da API
  async updateUserCredits() {
    try {
      // Buscar dados atualizados do usuário
      const response = await fetch(`${this.API_BASE_URL}/api/personas?user_id=${this.currentUser?.id || USER?.id}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Atualizar objeto global USER se existir
        if (typeof USER !== 'undefined' && data.length > 0) {
          USER.credits = data[0].credits;
          
          // Atualizar elementos do DOM que exibem os créditos
          const userCreditsCircle = document.getElementById('userCreditsCircle');
          if (userCreditsCircle) {
            userCreditsCircle.textContent = USER.credits || 0;
          }
          
          // Atualizar outros elementos que possam exibir créditos
          const creditElements = document.querySelectorAll('[id*="credit"], [id*="Credit"]');
          creditElements.forEach(element => {
            if (element.textContent !== undefined) {
              element.textContent = USER.credits || 0;
            }
          });
          
          console.log('Créditos atualizados:', USER.credits);
          
          // Disparar toast de sucesso
          if (typeof Toast !== 'undefined') {
            Toast.success('Pagamento Aprovado! Seus créditos foram atualizados.');
          } else {
            alert('Pagamento Aprovado! Seus créditos foram atualizados.');
          }
        }
      } else {
        console.warn('Não foi possível buscar dados atualizados do usuário');
        // Mesmo assim, mostrar sucesso
        if (typeof Toast !== 'undefined') {
          Toast.success('Pagamento Aprovado! Os créditos serão atualizados em breve.');
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar créditos:', error);
      // Não mostrar erro para o usuário, apenas log
    }
  }

  // Mostra o pagamento Pix
  showPixPayment(data) {
    document.getElementById('pix-qr-image').src = `data:image/jpeg;base64,${data.qr_code_base64}`;
    document.getElementById('pix-code').textContent = data.qr_code_copia_cola;
    this.showState('pix');
    
    // Inicia polling para verificar o pagamento
    this.startPixPolling(data.payment_id || data.id);
  }

  // Mostra tela de sucesso sem reload automático
  showSuccessScreen() {
    console.log('🎉 showSuccessScreen() chamada - Mostrando tela de sucesso...');
    console.log('📊 Timestamp:', new Date().toISOString());
    console.log('🔍 Modal:', this.modal ? 'encontrado' : 'NÃO ENCONTRADO');
    console.log('🔍 Container:', document.getElementById('payment-brick-container') ? 'encontrado' : 'NÃO ENCONTRADO');
    
    // Limpa qualquer timeout anterior
    if (window.successReloadTimeout) {
      clearTimeout(window.successReloadTimeout);
      console.log('⏹️ Reload anterior cancelado');
    }
    
    // IMPORTANTE: Força o estado para 'initial' para garantir que o container seja visível
    this.showState('initial');
    console.log('🔄 Estado alterado para initial - Container agora visível');
    
    // Limpa o container do modal
    const container = document.getElementById('payment-brick-container');
    if (container) {
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
          <!-- Ícone de sucesso animado -->
          <div class="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 animate-pulse">
            <svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <!-- Mensagem de sucesso -->
          <h2 class="text-4xl font-bold text-white mb-4">Pagamento Aprovado!</h2>
          <p class="text-slate-300 text-lg mb-8">Seus créditos já foram adicionados à sua conta.</p>
          
          <!-- Informações do pagamento -->
          <div class="bg-slate-800/50 rounded-lg p-4 mb-8 w-full max-w-sm">
            <div class="text-slate-400 text-sm mb-2">Resumo da transação</div>
            <div class="text-white font-medium">Pagamento processado com sucesso</div>
            <div class="text-slate-400 text-sm mt-1">Créditos disponíveis para uso</div>
          </div>
          
          <!-- Botões de ação -->
          <div class="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <button onclick="checkoutMP.closeModal()" class="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium">
              Fechar
            </button>
            <button onclick="window.location.reload()" class="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
              Atualizar Saldo
            </button>
          </div>
        </div>
      `;
      console.log('✅ HTML de sucesso injetado no container');
    } else {
      console.error('❌ Container payment-brick-container não encontrado!');
    }
    
    // Garante que o modal está visível
    if (this.modal) {
      this.modal.classList.remove('hidden');
      console.log('✅ Modal garantido como visível');
    } else {
      console.error('❌ Modal não encontrado!');
    }
    
    // NÃO FAZ RELOAD AUTOMÁTICO - Aguarda ação do usuário
    console.log('✅ Tela de sucesso exibida - Aguardando ação do usuário');
  }

  // Mostra sucesso (mantido para compatibilidade)
  showSuccess() {
    this.showState('success');
    
    // Disparar toast de sucesso se ainda não foi disparado
    if (typeof Toast !== 'undefined') {
      Toast.success('Pagamento Aprovado! Seus créditos foram atualizados.');
    }
    
    // Fechar modal após 3 segundos
    setTimeout(() => {
      this.closeModal();
      // Opcional: recarregar a página para garantir atualização completa
      // window.location.reload();
    }, 3000);
  }

  // Mostra erro
  showError(message) {
    document.getElementById('error-message').textContent = message;
    this.showState('error');
  }

  // Controla os estados do modal
  showState(state) {
    const states = ['initial', 'processing', 'pix', 'success', 'error'];
    states.forEach(s => {
      const element = document.getElementById(`payment-${s}`);
      if (element) {
        element.classList.toggle('hidden', s !== state);
      }
    });
  }

  // Mostra o modal
  showModal() {
    if (this.modal) {
      this.modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  // Fecha o modal
  closeModal() {
    if (this.modal) {
      this.modal.classList.add('hidden');
      document.body.style.overflow = 'auto';
      
      // Limpa polling do Pix se estiver ativo
      if (window.pixPolling) {
        clearInterval(window.pixPolling);
        window.pixPolling = null;
        console.log('Polling do Pix limpo ao fechar modal');
      }
    }
    this.resetPayment();
  }

  // Reseta o pagamento
  async resetPayment() {
    this.showState('initial');
    
    // Unmount do Payment Brick v2
    if (window.paymentBrickController) {
      await window.paymentBrickController.unmount();
      window.paymentBrickController = null;
    }
    
    // Recria o brick
    await this.renderPaymentBrick();
  }

  // Copia código Pix
  copyPixCode() {
    const codeElement = document.getElementById('pix-code');
    if (codeElement) {
      navigator.clipboard.writeText(codeElement.textContent).then(() => {
        // Poderia adicionar um toast aqui
        alert('Código Pix copiado!');
      });
    }
  }

  // Inicia polling para verificar pagamento Pix
  startPixPolling(paymentId) {
    // Limpa polling anterior se existir
    if (window.pixPolling) {
      clearInterval(window.pixPolling);
    }
    
    console.log('Iniciando polling para pagamento Pix:', paymentId);
    
    window.pixPolling = setInterval(async () => {
      try {
        const response = await fetch(`${this.API_BASE_URL}/api/pagamento/status/${paymentId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Status do pagamento Pix:', data);
          
          // Se pagamento foi aprovado
          if (data.status === 'approved') {
            // Para o polling
            clearInterval(window.pixPolling);
            window.pixPolling = null;
            
            console.log('✅ Pix aprovado! Chamando showSuccessScreen()...');
            
            // Mostra tela de sucesso
            this.showSuccessScreen();
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status do Pix:', error);
      }
    }, 3000); // Verifica a cada 3 segundos
  }
}

// Instância global
const checkoutMP = new CheckoutMercadoPago();

// Funções globais para acesso inline
window.openCheckout = (packageData, userData) => checkoutMP.openCheckout(packageData, userData);
window.checkoutMP = checkoutMP;
