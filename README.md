# S.S.W Intelligence

Frontend da plataforma S.S.W Intelligence, voltada à auditoria de presença digital, análise de conversão e benchmarking assistidos por IA.

## Visão geral

A aplicação oferece uma experiência web para criar auditorias, comparar sites, visualizar resultados, gerar relatórios e administrar créditos. O frontend é estático, construído com HTML, CSS e JavaScript modular, e consome a API SSW para autenticação, processamento das análises, pagamentos e histórico.

## Principais recursos

- Auditorias de performance, SEO, acessibilidade, segurança e experiência do usuário.
- Diagnóstico de conversão e simulação por personas.
- Comparação entre domínios e visualização de rankings.
- Relatórios e histórico de análises.
- Autenticação, recuperação de conta e login com Google.
- Compra e gestão de créditos com Mercado Pago.

## Tecnologias

- HTML, CSS e JavaScript sem framework de interface.
- Tailwind CSS via CDN e componentes modulares em `src/`.
- Node.js para servidor local e build de configuração pública.
- Docker e Nginx para entrega da aplicação estática.
- Cloudflare Pages como destino de deploy.

## Estrutura do repositório

```text
.
├── docs/                 # Guias técnicos, deploy e configurações auxiliares
├── docker/               # Configuração do Nginx
├── precos/               # Rota estática de preços
├── public/               # Headers e recursos públicos
├── scripts/              # Scripts de build
├── sites/                # Rota estática de serviços
├── src/
│   ├── app/              # Fluxos da aplicação e módulos de interface
│   ├── assets/           # Imagens e materiais de apoio
│   ├── components/       # Componentes reutilizáveis
│   ├── styles/           # Estilos globais
│   └── utils/            # Configuração e utilitários do navegador
├── termos/               # Rota estática de termos
├── index.html            # Entrada principal da aplicação
├── Dockerfile            # Imagem de produção
└── package.json          # Scripts e dependências do projeto
```

## Desenvolvimento local

Pré-requisitos: Node.js 22 ou superior e npm. Para usar todos os fluxos, inicie também a API SSW na porta `8080`.

```powershell
npm ci
npm run dev
```

Abra `http://localhost:3000`. Em ambiente local, o frontend aponta automaticamente para `http://localhost:8080`.

## Build e publicação

O build injeta no HTML apenas configurações que podem ser públicas no navegador. Defina-as no ambiente de deploy ou, para testar localmente, na sessão do terminal:

```powershell
$env:VITE_MP_PUBLIC_KEY = 'TEST-sua-chave-publica-do-mercado-pago'
$env:API_URL = 'https://sua-api.exemplo.com'
$env:VITE_GOOGLE_CLIENT_ID = 'seu-client-id.apps.googleusercontent.com' # opcional
npm run build
```

Para executar a imagem de produção localmente, use `docker compose -f docker-compose.local.yml up --build`. O guia completo está em [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) e as orientações de publicação em [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Configuração e segurança

Nenhum arquivo de ambiente é versionado neste repositório. Arquivos `.env` são estritamente locais e estão protegidos pelo `.gitignore`.

As únicas variáveis expostas ao navegador são `VITE_MP_PUBLIC_KEY`, `API_URL` e `VITE_GOOGLE_CLIENT_ID`. Não inclua senhas, tokens privados, chaves de serviço ou credenciais de banco de dados no frontend; elas pertencem exclusivamente à API e à plataforma de hospedagem.

## Scripts disponíveis

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o servidor estático em `http://localhost:3000`. |
| `npm run build:local` | Gera a configuração local sem exigir a chave pública do Mercado Pago. |
| `npm run build` | Executa o build de produção; exige `VITE_MP_PUBLIC_KEY`. |
| `npm run preview` | Serve a aplicação em `http://localhost:4173`. |

## Documentação adicional

- [Desenvolvimento local](docs/LOCAL_DEVELOPMENT.md)
- [Deploy](docs/DEPLOYMENT.md)
- [Configuração de Open Graph](docs/OPEN_GRAPH_SETUP.md)
- [Organização dos módulos da aplicação](src/app/README.md)
