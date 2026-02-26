import React, { useState, useEffect } from 'react';
import { initMercadoPago, Payment } from '@mercadopago/sdk-react';

const CheckoutModal = ({ isOpen, onClose, pacoteSelecionado, user }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('initial'); // initial, processing, pix_qr, success, error
  const [qrCodeData, setQrCodeData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && pacoteSelecionado) {
      // Inicializa o SDK do Mercado Pago
      initMercadoPago('APP_USR-0666c374-0f5e-4421-b67d-f9879c8866ac', { locale: 'pt-BR' });
    }
  }, [isOpen, pacoteSelecionado]);

  const handleSubmit = async (formData) => {
    setIsLoading(true);
    setPaymentStatus('processing');

    try {
      const response = await fetch('/api/pagamento/processar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.id || 'user_temp_id',
          pacote_id: pacoteSelecionado.id,
          payment_method_id: formData.payment_method_id,
          payer: formData.payer,
          transaction_amount: formData.transaction_amount,
          token: formData.token || null,
          installments: formData.installments || 1,
          issuer_id: formData.issuer_id || null
        }),
      });

      const result = await response.json();

      if (result.acao_requerida === 'pagar_pix') {
        setPaymentStatus('pix_qr');
        setQrCodeData({
          qr_code_base64: result.qr_code_base64,
          qr_code_copia_cola: result.qr_code_copia_cola
        });
      } else if (result.acao_requerida === 'sucesso_cartao') {
        setPaymentStatus('success');
        setTimeout(() => {
          onClose();
          window.location.reload(); // Recarrega para atualizar créditos
        }, 3000);
      } else if (result.acao_requerida === 'erro') {
        setPaymentStatus('error');
        setErrorMessage(result.mensagem || 'Ocorreu um erro ao processar o pagamento');
      }
    } catch (error) {
      setPaymentStatus('error');
      setErrorMessage('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Poderia adicionar um toast aqui
      alert('Código Pix copiado!');
    });
  };

  const closeModal = () => {
    setPaymentStatus('initial');
    setQrCodeData(null);
    setErrorMessage('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl mx-4 bg-[#0F1117] border border-white/10 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h3 className="text-2xl font-bold text-white">Finalizar Pagamento</h3>
            <p className="text-slate-400 mt-1">
              {pacoteSelecionado?.nome} - R$ {pacoteSelecionado?.preco}
            </p>
          </div>
          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {paymentStatus === 'initial' && (
            <div className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-blue-400 text-sm">
                    Aceitamos cartão de crédito, débito e Pix. Pagamento 100% seguro.
                  </p>
                </div>
              </div>

              {/* Payment Brick */}
              <div id="payment-brick-container" className="min-h-[400px]">
                <Payment
                  initialization={{
                    amount: parseFloat(pacoteSelecionado?.preco || '0'),
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

          {paymentStatus === 'processing' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-white text-lg">Processando pagamento...</p>
              <p className="text-slate-400 text-sm">Aguarde um momento</p>
            </div>
          )}

          {paymentStatus === 'pix_qr' && qrCodeData && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full mb-4">
                  <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Pague com Pix</h4>
                <p className="text-slate-400">Escaneie o QR Code ou copie o código</p>
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
                <p className="text-slate-400 text-sm mb-2">Código Pix:</p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 text-xs text-white bg-slate-900/50 p-3 rounded border border-white/5 break-all">
                    {qrCodeData.qr_code_copia_cola}
                  </code>
                  <button
                    onClick={() => copyToClipboard(qrCodeData.qr_code_copia_cola)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copiar</span>
                  </button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  <strong>Atenção:</strong> O pagamento será confirmado em até 5 minutos. 
                  A página será atualizada automaticamente.
                </p>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-full">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-2xl font-bold text-white">Pagamento Aprovado!</h4>
              <p className="text-slate-400">Seus créditos já estão na conta.</p>
              <p className="text-slate-500 text-sm">Redirecionando...</p>
            </div>
          )}

          {paymentStatus === 'error' && (
            <div className="text-center py-12 space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/20 rounded-full">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">Erro no Pagamento</h4>
              <p className="text-red-400">{errorMessage}</p>
              <button
                onClick={() => setPaymentStatus('initial')}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
