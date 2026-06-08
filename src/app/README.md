# App Structure

Esta pasta concentra a lógica da aplicação que antes ficava inline no `index.html`.

- `auth/`: telas e fluxos de autenticação/verificação.
- `core/`: bootstrap principal, navegação, auditoria, relatórios e chat.
- `layout/`: carregadores de layout compartilhado, como footer.
- `payments/`: checkout e integrações de pagamento no frontend.
- `sections/`: carregadores de secoes dinamicas, como ranking e precos.
- `ui/`: componentes/utilitarios globais de interface, como toast e banner promocional.

Os componentes HTML reutilizaveis continuam em `src/components`, os assets em `src/assets`, e estilos globais em `src/styles`.
