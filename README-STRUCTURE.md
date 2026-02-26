# Estrutura de Pastas Organizada

## 📁 Estrutura do Projeto

```
MeuSistemaSSW/
├── 📁 src/                          # Código fonte principal
│   ├── 📁 components/               # Componentes React/JS
│   │   └── 📄 CheckoutModal.jsx     # Modal de checkout Mercado Pago
│   ├── 📁 pages/                   # Páginas e arquivos principais
│   │   ├── 📄 index.html          # Página principal
│   │   ├── 📄 og-image-generator.html
│   │   ├── 📄 README.md
│   │   ├── 📄 package.json
│   │   └── 📄 package-lock.json
│   ├── 📁 utils/                   # Utilitários JavaScript
│   │   ├── 📄 auth.js             # Autenticação
│   │   ├── 📄 checkout-mercadopago.js # Checkout Mercado Pago
│   │   ├── 📄 config.js           # Configurações
│   │   └── 📄 ranking.js          # Sistema de ranking
│   ├── 📁 services/                # Serviços/API
│   ├── 📁 hooks/                   # Hooks personalizados
│   ├── 📁 styles/                  # Estilos CSS
│   │   ├── 📄 cyber-theme.css    # Tema cyber
│   │   └── 📄 style.css          # Estilos gerais
│   └── 📁 assets/                  # Assets estáticos
│       └── 📁 images/            # Imagens
│           ├── 🖼️ *.png             # Imagens de análise
│           ├── 🖼️ logos.ico         # Ícone do site
│           └── 🖼️ og-image.svg      # Open Graph image
├── 📁 .git/                       # Controle de versão
├── 📁 .vscode/                    # Configurações VS Code
├── 📄 .gitignore                  # Ignorar arquivos Git
└── 📄 OPEN_GRAPH_SETUP.md         # Setup Open Graph
```

## 🏗️ Organização por Tipo

### 📄 Páginas (`src/pages/`)
- **index.html**: Aplicação principal
- **og-image-generator.html**: Gerador de imagens Open Graph
- **README.md**: Documentação do projeto
- **package.json**: Dependências e scripts

### 🧩 Componentes (`src/components/`)
- **CheckoutModal.jsx**: Componente React para checkout

### 🔧 Utilitários (`src/utils/`)
- **auth.js**: Sistema de autenticação
- **checkout-mercadopago.js**: Integração Mercado Pago
- **config.js**: Configurações globais
- **ranking.js**: Sistema de ranking

### 🎨 Estilos (`src/styles/`)
- **cyber-theme.css**: Tema cyber/visual
- **style.css**: Estilos base

### 🖼️ Assets (`src/assets/images/`)
- Imagens de análise (B1RED, C1RED, etc.)
- Ícones e logos

## 🚀 Como Usar

### Desenvolvimento
```bash
# Acessar arquivos principais
cd src/pages
# Editar index.html

# Editar componentes
cd src/components

# Editar utilitários
cd src/utils
```

### Build
O projeto usa estrutura estática - basta abrir `src/pages/index.html` no navegador.

## 📋 Benefícios da Nova Estrutura

✅ **Organização clara**: Separação por tipo de arquivo
✅ **Manutenibilidade**: Fácil encontrar e editar arquivos
✅ **Escalabilidade**: Espaço para crescimento
✅ **Padrão mercado**: Estrutura similar a projetos modernos
✅ **Desenvolvimento limpo**: Separação de responsabilidades

## 🔗 Referências

- **Components**: Reutilizáveis e independentes
- **Utils**: Funções helper e configurações
- **Services**: Integrações com APIs externas
- **Assets**: Recursos estáticos otimizados
