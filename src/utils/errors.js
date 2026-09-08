// Public messages are selected locally. Never display arbitrary response bodies,
// exception messages, traces or validation objects supplied by a service.
(function () {
    const messages = {
        401: 'Sua sessão expirou. Entre novamente para continuar.',
        403: 'Não foi possível autorizar esta ação. Verifique sua sessão e a verificação de segurança.',
        404: 'O item solicitado não está disponível.',
        408: 'A solicitação demorou mais que o esperado. Tente novamente.',
        413: 'O conteúdo enviado é muito grande. Reduza o tamanho e tente novamente.',
        429: 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente novamente.'
    };
    window.publicErrorMessage = function (_detail, fallback = 'Não foi possível concluir a solicitação. Tente novamente.', status) {
        if (Number(status) >= 500) return 'O serviço está temporariamente indisponível. Tente novamente em alguns instantes.';
        return messages[status] || fallback;
    };
})();
