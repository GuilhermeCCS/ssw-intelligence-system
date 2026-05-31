import React, { useState, useEffect } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

/**
 * CONFIGURAÇÃO SEGURA:
 * A PUBLIC KEY deve vir de variável de ambiente.
 *
 * Exemplo (.env):
 * VITE_MP_PUBLIC_KEY=APP_USR-xxxxxxxx
 *
 * Nunca coloque ACCESS TOKEN no frontend.
 */

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;

const CheckoutModal = ({
  isOpen,
  onClose,
  pacoteSelecionado,
  user
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('initial');
  const [qrCodeData, setQrCodeData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!MP_PUBLIC_KEY) {
      console.error('Mercado Pago public key não configurada');
      return;
    }

    initMercadoPago(MP_PUBLIC_KEY, {
      locale: 'pt-BR'
    });
  }, []);

  /**
   * Fecha modal com reset seguro
   */
  const resetModal = () => {
    setPaymentStatus('initial');
    setQrCodeData(null);
    setErrorMessage('');
    setIsLoading(false);
  };

  const closeModal = () => {
    resetModal();
    onClose();
  };

  /**
   * Submit seguro - Extração correta dos dados do Brick do Mercado Pago
   */
  const handleSubmit = async (data) => {
    try {
      setIsLoading(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      // DEBUG: Log do objeto completo recebido do Brick
      console.log("📦 DADOS COMPLETOS DO BRICK:", data);

      // O Brick pode enviar os dados em diferentes estruturas:
      // 1. Direto: data.payment_method_id, data.payer, etc.
      // 2. Aninhado: data.formData.payment_method_id, data.formData.payer, etc.
      
      // Extração segura - verifica ambas as estruturas
      const formData = data.formData || data;
      
      console.log("📋 DADOS EXTRAÍDOS DO FORMDATA:", formData);

      // Extração do payment_method_id
      const methodId = formData.payment_method_id;

      console.log("💳 payment_method_id extraído:", methodId);

      if (!methodId) {
        throw new Error("Por favor, selecione um método de pagamento válido (Pix ou Cartão).");
      }

      // Extração segura do payer com fallback
      const payer = formData.payer || { 
        email: user?.email || localStorage.getItem('user_email') 
      };

      console.log("👤 Payer extraído:", payer);

      const cfToken = document.querySelector('[name="cf-turnstile-response"]')?.value || '';
      if (!cfToken) {
        throw new Error('Resolva o captcha antes de continuar');
      }

      const payload = {
        pacote_id: pacoteSelecionado?.id || "pacote_basico",
        payment_method_id: methodId,
        payer: payer,
        token: formData.token || null,
        installments: Number(formData.installments || 1),
        issuer_id: formData.issuer_id || null,
        cf_token: cfToken
      };

      console.log("🚀 Payload enviado para API:", payload);

      const response = await fetch('https://ssw-intelligence-api.onrender.com/api/pagamento/processar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(user?.token ? { Authorization: `Bearer ${user.token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        console.error("❌ Erro do servidor:", err);
        throw new Error(err.detail || 'Falha ao processar pagamento');
      }

      const result = await response.json();
      console.log('✅ Resposta da API:', result);
      
      // 7. Tratar resposta
      switch (result?.acao_requerida) {
        case 'pagar_pix':
          setPaymentStatus('pix_qr');
          setQrCodeData({
            qr_code_base64: result.qr_code_base64,
            qr_code_copia_cola: result.qr_code_copia_cola
          });
          break;
        case 'sucesso_cartao':
          setPaymentStatus('success');
          setTimeout(() => closeModal(), 3000);
          break;
        default:
          throw new Error(result?.detail || 'Erro ao processar');
      }

    } catch (error) {
      console.error('❌ Erro no handleSubmit:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Copiar Pix
   */
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);

      // Substitua por toast futuramente
      alert('Código Pix copiado!');
    } catch (error) {
      console.error('Erro ao copiar código Pix');
    }
  };

  if (!isOpen || !pacoteSelecionado) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-[#0F1117] border border-white/10 rounded-2xl shadow-2xl">

        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-2xl font-bold text-white">
              Finalizar Pagamento
            </h3>

            <p className="text-slate-400 mt-1">
              {pacoteSelecionado.nome}
            </p>
          </div>

          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {/* CONTEÚDO */}
        <div className="p-6">

          {/* INICIAL */}
          {paymentStatus === 'initial' && (
            <div className="space-y-6">

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  Pagamento seguro via Mercado Pago.
                </p>
              </div>

              <div
                id="payment-brick-container"
                className="min-h-[400px]"
              >
                <Payment
                  initialization={{
                    /**
                     * Valor visual apenas.
                     * Backend deve validar.
                     */
                    amount: Number(
                      pacoteSelecionado.preco || 0
                    )
                  }}
                  customization={{
                    visual: {
                      theme: 'dark'
                    },
                    paymentMethods: {
                      creditCard: 'all',
                      debitCard: 'all',
                      bankTransfer: 'all'
                    }
                  }}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          )}

          {/* PROCESSANDO */}
          {paymentStatus === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>

              <p className="text-white text-lg">
                Processando pagamento...
              </p>
            </div>
          )}

          {/* PIX */}
          {paymentStatus === 'pix_qr' && qrCodeData && (
            <div className="space-y-6">

              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-2">
                  Pague com Pix
                </h4>

                <p className="text-slate-400">
                  Escaneie o QR Code
                </p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  <img
                    src={`data:image/jpeg;base64,${qrCodeData.qr_code_base64}`}
                    alt="QR Code Pix"
                    className="w-48 h-48"
                  />
                </div>
              </div>

              <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4">

                <p className="text-slate-400 text-sm mb-2">
                  Código Pix:
                </p>

                <div className="flex items-center space-x-2">

                  <code className="flex-1 text-xs text-white bg-slate-900/50 p-3 rounded border border-white/5 break-all">
                    {qrCodeData.qr_code_copia_cola}
                  </code>

                  <button
                    onClick={() =>
                      copyToClipboard(
                        qrCodeData.qr_code_copia_cola
                      )
                    }
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    Copiar
                  </button>

                </div>
              </div>
            </div>
          )}

          {/* SUCESSO */}
          {paymentStatus === 'success' && (
            <div className="text-center py-12 space-y-4">

              <h4 className="text-2xl font-bold text-emerald-400">
                Pagamento aprovado!
              </h4>

              <p className="text-slate-400">
                Os seus créditos foram libertados.
              </p>

            </div>
          )}

          {/* ERRO */}
          {paymentStatus === 'error' && (
            <div className="text-center py-12 space-y-4">

              <h4 className="text-xl font-bold text-red-400">
                Erro no pagamento
              </h4>

              <p className="text-slate-300">
                {errorMessage}
              </p>

              <button
                onClick={() => {
                  setPaymentStatus('initial');
                  setErrorMessage('');
                }}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Tentar novamente
              </button>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
