# Guia de Deploy - SSW Intelligence

## Variáveis de Ambiente

### Cloudflare Pages (Produção)

Configure as seguintes variáveis em **Settings → Environment Variables**:

```bash
VITE_MP_PUBLIC_KEY=APP_USR-sua-chave-mercado-pago
API_URL=sua-url-api
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
```

Esses valores são injetados no navegador. Portanto, use somente a chave **pública** do Mercado Pago, a URL pública da API e o client ID público do Google.

### Desenvolvimento local

Defina as variáveis na sessão do terminal antes do build. O repositório não mantém arquivos `.env` nem modelos de credenciais:

```powershell
$env:VITE_MP_PUBLIC_KEY = 'TEST-sua-chave-publica-do-mercado-pago'
$env:API_URL = 'http://localhost:8080'
$env:VITE_GOOGLE_CLIENT_ID = 'seu-client-id.apps.googleusercontent.com'
```

## Deploy no Cloudflare Pages

### 1. Conectar Repositório

1. Acesse [Cloudflare Pages](https://dash.cloudflare.com/)
2. Clique em "Create a project"
3. Conecte seu repositório GitHub
4. Selecione o repositório `GuilhermeCCS/ssw-intelligence-system`

### 2. Configurar Build

**Build Settings:**
- **Build command**: `npm run build`
- **Build output directory**: `dist`

O build publica somente as páginas e pastas de recursos autorizadas. Nunca publique a raiz do repositório: ela contém scripts, documentação e migrações SQL internas. `public/_headers`, `robots.txt` e `sitemap.xml` são copiados para a raiz de `dist`, junto de `_redirects` e `404.html`.

O `wrangler.toml` identifica o projeto existente `sswintelligence` e declara `pages_build_output_dir = "./dist"`. Antes do primeiro deploy desta configuração, confira as variáveis e eventuais bindings do projeto no painel, pois esse campo torna o arquivo a fonte de configuração do Pages. Não crie outro projeto nem publique o build local que usa valores de teste. [Documentação do Cloudflare](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).

**Environment Variables:**
Adicione as variáveis listadas acima em **Settings → Environment Variables**

### 3. Deploy

O Cloudflare Pages irá:
1. Executar `npm run build`
2. Injetar somente configurações públicas no HTML de `dist`, sem alterar os arquivos fonte
3. Publicar `dist` automaticamente ao receber alterações na branch de produção

Valide `npm ci`, `npm test` e `npm run build` antes do push. `npm run preview` serve apenas o artefato em `http://127.0.0.1:4173`. Rotas desconhecidas e arquivos privados devem retornar 404; `/home`, `/login`, `/agents`, `/history` e as demais entradas declaradas continuam com rewrite explícito.

A página `404.html` trata rotas desconhecidas no Pages. Os dez templates em `dist/errors` também estão ligados à configuração Nginx do Docker; erros gerados pela borda Cloudflare exigem configuração própria da plataforma e não são substituídos automaticamente por esses arquivos. [Servir páginas no Cloudflare](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Estrutura do Projeto

```
MeuSistemaSSW/
├── docs/                    # Documentação
│   ├── DEPLOYMENT.md       # Este arquivo
│   └── OPEN_GRAPH_SETUP.md
├── public/                  # Arquivos estáticos Cloudflare
│   └── _headers            # Configurações de headers
├── scripts/                 # Scripts de build
│   └── build.js            # Script de build
├── src/                    # Código fonte
│   ├── assets/            # Imagens, PDFs
│   ├── components/        # Componentes reutilizáveis
│   ├── pages/             # Páginas
│   ├── styles/            # CSS global
│   └── utils/             # Utilitários
├── index.html             # Página principal
├── package.json           # Dependências
└── wrangler.toml          # Configuração Cloudflare
```

## Scripts Disponíveis

```bash
# Desenvolvimento local
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Servir somente dist na porta 3000 (execute o build antes)
npm start
```

## Segurança

### Chaves e Segredos

- **VITE_MP_PUBLIC_KEY**: Chave pública do Mercado Pago (pode ser exposta)
- **API_URL**: URL pública da API backend (pode ser exposta)
- **VITE_GOOGLE_CLIENT_ID**: Client ID público do OAuth do Google (pode ser exposto)

Não use arquivos, variáveis ou argumentos de build do frontend para tokens privados, service roles, senhas ou chaves de criptografia. Mantenha-os apenas na API e no provedor de hospedagem apropriado.

### Boas Práticas

1. **Nunca** commite arquivos `.env`, inclusive modelos contendo valores reais.
2. Use configurações diferentes para desenvolvimento e produção.
3. Mantenha segredos somente no backend e rotacione-os periodicamente.
4. Revise qualquer valor injetado no HTML: ele se torna público.

## Troubleshooting

### Erro: "VITE_MP_PUBLIC_KEY não configurada"

**Causa**: Variável de ambiente não configurada

**Solução**:
- Local: Defina `VITE_MP_PUBLIC_KEY` na sessão do terminal antes do build.
- Cloudflare: Configure em Settings → Environment Variables.

### Erro: "openCheckout is not defined"

**Causa**: Script `mercado-pago-checkout.js` não carregou

**Solução**:
- Verifique se `src/app/payments/mercado-pago-checkout.js` existe
- Verifique se `env-injector.js` está carregando antes
- Verifique console para outros erros

### Botões de compra não funcionam

**Causa**: VITE_MP_PUBLIC_KEY não configurada

**Solução**:
- Configure a variável de ambiente
- Recarregue a página
- Verifique console para erros

## Suporte

Para problemas ou dúvidas:
- Abra uma issue no GitHub
- Consulte a documentação em `docs/`
