# Guia de Deploy - SSW Intelligence

## Variáveis de Ambiente

### Cloudflare Pages (Produção)

Configure as seguintes variáveis em **Settings → Environment Variables**:

```bash
VITE_MP_PUBLIC_KEY=APP_USR-sua-chave-mercado-pago
ENCRYPTION_KEY=sua-chave-secreta-criptografia
API_URL=https://ssw-intelligence-api.onrender.com
```

### Desenvolvimento Local

1. Copie o arquivo de exemplo:
```bash
cp .env.example .env
```

2. Edite `.env` com suas variáveis:
```bash
VITE_MP_PUBLIC_KEY=APP_USR-sua-chave-mercado-pago
ENCRYPTION_KEY=sua-chave-secreta-criptografia
API_URL=https://ssw-intelligence-api.onrender.com
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
- **Build output directory**: `.` (raiz do projeto)

**Environment Variables:**
Adicione as variáveis listadas acima em **Settings → Environment Variables**

### 3. Deploy

O Cloudflare Pages irá:
1. Executar `npm run build`
2. Injetar variáveis de ambiente no HTML
3. Fazer deploy automático

## Estrutura do Projeto

```
MeuSistemaSSW/
├── docs/                    # Documentação
│   ├── DEPLOYMENT.md       # Este arquivo
│   └── OPEN_GRAPH_SETUP.md
├── public/                  # Arquivos estáticos Cloudflare
│   └── _headers            # Configurações de headers
├── src/                    # Código fonte
│   ├── assets/            # Imagens, PDFs
│   ├── components/        # Componentes reutilizáveis
│   ├── pages/             # Páginas
│   ├── styles/            # CSS global
│   └── utils/             # Utilitários
├── index.html             # Página principal
├── build.js               # Script de build
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

# Servir arquivos estáticos
npm start
```

## Segurança

### Chaves e Segredos

- **VITE_MP_PUBLIC_KEY**: Chave pública do Mercado Pago (pode ser exposta)
- **ENCRYPTION_KEY**: Chave para criptografia de localStorage (NÃO exponha)
- **API_URL**: URL da API backend (pode ser exposta)

### Boas Práticas

1. **Nunca** commite `.env` no repositório
2. Use chaves diferentes para desenvolvimento e produção
3. Rote as chaves periodicamente
4. Use variáveis de ambiente para todos os segredos

## Troubleshooting

### Erro: "VITE_MP_PUBLIC_KEY não configurada"

**Causa**: Variável de ambiente não configurada

**Solução**:
- Local: Configure em `.env`
- Cloudflare: Configure em Settings → Environment Variables

### Erro: "openCheckout is not defined"

**Causa**: Script `mercado-pago-checkout.js` não carregou

**Solução**:
- Verifique se `src/utils/mercado-pago-checkout.js` existe
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
