# S.S.W Intelligence

Interface web da S.S.W Intelligence, uma plataforma de auditoria de experiências digitais e análise de oportunidades de melhoria assistida por IA.

## Produto

A aplicação transforma a análise de uma presença digital em uma jornada clara: coleta sinais técnicos e de experiência, organiza achados por prioridade e apresenta recomendações que apoiam decisões de produto, marketing e tecnologia.

## Capacidades

- Auditoria de performance, acessibilidade, SEO, segurança e experiência do usuário.
- Diagnóstico de conversão e simulação por perfis de público.
- Análise comparativa e acompanhamento de resultados.
- Relatórios visuais e histórico de auditorias.
- Fluxos de autenticação e administração da conta.
- Interface responsiva, preparada para desktop e dispositivos móveis.

## Arquitetura

O projeto é uma aplicação estática modular. A interface é composta em HTML, CSS e JavaScript, enquanto operações de dados e processamento são atendidas por serviços externos da plataforma.

```text
.
├── docs/                 # Documentação técnica complementar
├── docker/               # Configuração da imagem de entrega
├── public/               # Recursos públicos e cabeçalhos HTTP
├── scripts/              # Rotinas de build
├── sites/                # Rota institucional de serviços
├── src/
│   ├── app/              # Fluxos e módulos da aplicação
│   ├── assets/           # Imagens e materiais de apoio
│   ├── components/       # Componentes reutilizáveis
│   ├── styles/           # Design e estilos globais
│   └── utils/            # Utilitários do navegador
├── termos/               # Rota institucional de termos
├── index.html            # Ponto de entrada
├── Dockerfile            # Imagem de produção
└── package.json          # Dependências e comandos do projeto
```

## Tecnologias

- HTML, CSS e JavaScript modular.
- Tailwind CSS e componentes reutilizáveis.
- Node.js para desenvolvimento e build.
- Docker e Nginx para entrega estática.
- Cloudflare Pages para publicação.

## Desenvolvimento local

Pré-requisitos: Node.js 22 ou superior e npm.

```powershell
npm ci
npm run dev
```

O servidor de desenvolvimento fica disponível em `http://localhost:3000`.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Inicia o ambiente local de desenvolvimento. |
| `npm run preview` | Executa uma prévia local da aplicação. |
| `npm run build` | Prepara a aplicação para publicação. |

## Segurança e publicação

Este repositório público não contém informações confidenciais, dados operacionais ou configurações de infraestrutura. A configuração necessária para cada ambiente é administrada exclusivamente pela infraestrutura de publicação e pelos serviços internos da plataforma.

As alterações enviadas à branch `main` seguem o fluxo de publicação configurado para produção.

## Documentação complementar

- [Desenvolvimento local](docs/LOCAL_DEVELOPMENT.md)
- [Open Graph](docs/OPEN_GRAPH_SETUP.md)
- [Organização dos módulos](src/app/README.md)
