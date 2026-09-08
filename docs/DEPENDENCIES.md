# Dependências do navegador

O `npm audit` avalia o lockfile; não avalia automaticamente bibliotecas copiadas para `src/vendor` nem scripts externos.

| Biblioteca | Versão revisada | Origem |
| --- | --- | --- |
| DOMPurify | 3.4.15 | Pacote npm `dompurify`, também fixado pelo lockfile |
| jsPDF | 4.2.1 | Pacote npm `jspdf`, distribuição UMD |
| AutoTable | 5.0.8 | Pacote npm `jspdf-autotable`, plugin do navegador |
| Lucide | 1.43.0 | Pacote npm `lucide`, distribuição UMD |
| Ícone Instagram legado | 0.577.0 | Vetor Lucide preservado em `legacy-brand.js`, licença ISC |

Os arquivos servidos localmente preservam as licenças upstream. Na revisão de 08/09/2026, os tarballs de jsPDF, AutoTable e Lucide foram conferidos contra a integridade SHA512 do registro npm; os hashes SHA256 dos bundles ficam em `scripts/tests/vendor-runtime.test.js`. `.gitattributes` preserva seus bytes entre Windows e Linux. O build apenas retira referências a source maps não publicados.

Para atualizar, baixe a versão exata do registro oficial, confira `dist.integrity`, substitua somente os bundles/licenças correspondentes e atualize os hashes depois de revisar o conteúdo. Execute `npm test`, que gera relatórios com os exportadores existentes, testa paginação e confere os ícones. Depois gere `dist` e valide as páginas no navegador. Não altere hashes apenas para silenciar uma falha inesperada.

O Play CDN do Tailwind ainda é usado pela aplicação. A [documentação oficial](https://tailwindcss.com/docs/installation/play-cdn) o destina a desenvolvimento. A migração pendente deve compilar Tailwind v3 durante o build, cobrir classes montadas dinamicamente com uma safelist e verificar as views/modais antes de remover o CDN e restringir a CSP. Google Identity, Turnstile, Mercado Pago e fontes externas continuam sendo integrações externas e devem ser acompanhados separadamente.
