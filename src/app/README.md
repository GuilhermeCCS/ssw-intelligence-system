# App Structure

Esta pasta concentra a logica da aplicacao que antes ficava inline no `index.html`.

- `auth/`: telas e fluxos de autenticacao/verificacao.
- `core/`: bootstrap principal, navegacao, auditoria, relatorios e chat.
- `layout/`: carregadores de layout compartilhado, como footer.
- `payments/`: checkout e integracoes de pagamento no frontend.
- `sections/`: carregadores de secoes dinamicas, como ranking e precos.
- `ui/`: componentes/utilitarios globais de interface, como toast e banner promocional.

Os componentes HTML reutilizaveis continuam em `src/components`, os assets em `src/assets`, e estilos globais em `src/styles`.
