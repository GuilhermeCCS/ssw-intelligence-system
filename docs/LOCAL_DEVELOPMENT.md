# Desenvolvimento local

## Estrutura do frontend

```text
ssw-frontend/
|- src/
|  |- app/            # fluxos e telas da aplicacao
|  |- components/     # componentes reutilizaveis
|  |- styles/         # estilos globais
|  `- utils/          # utilitarios e configuracao de ambiente
|- public/             # arquivos estaticos publicados
|- scripts/            # scripts de build
|- docs/               # documentacao tecnica
|- docker/             # configuracao do Nginx
|- Dockerfile          # imagem estatica de producao
`- docker-compose.local.yml
```

## Sem Docker

Em um terminal, inicie a API em `../sswapi-main`:

```powershell
cd ..\sswapi-main
# Crie o arquivo .env local conforme a documentação do repositório da API.
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m playwright install chromium
python -m uvicorn app.api.main:app --reload --port 8080
```

Em outro terminal, no diretorio `ssw-frontend`:

```powershell
npm ci
npm run dev
```

Abra `http://localhost:3000`. Em localhost, o frontend usa automaticamente a API em `http://localhost:8080`; basta atualizar o navegador apos salvar uma alteracao.

## Com Docker

1. Defina a chave pública do Mercado Pago na sessão do terminal. Ela é necessária para criar a imagem do frontend:

```powershell
$env:VITE_MP_PUBLIC_KEY = 'TEST-sua-chave-publica-do-mercado-pago'
$env:VITE_GOOGLE_CLIENT_ID = '' # opcional
```

2. No repositório da API, crie e preencha o arquivo local `../sswapi-main/.env`; ele não deve ser versionado.

3. Inicie os serviços:

```powershell
docker compose -f docker-compose.local.yml up --build
```

A interface ficara em `http://localhost:3000` e a API em `http://localhost:8080/docs`.

Para encerrar e remover os containers criados pelo compose:

```powershell
docker compose -f docker-compose.local.yml down
```

## Builds

- `npm run dev`: servidor estatico para desenvolvimento; nao altera arquivos rastreados.
- `npm run build:local`: gera `dist` com configuracoes locais, sem modificar os fontes; permite rodar sem chave de pagamento.
- `npm run build`: gera `dist` para producao; exige `VITE_MP_PUBLIC_KEY` e URL HTTPS para a API.
- `npm run preview`: serve apenas `dist` em `http://127.0.0.1:4173`; execute um build antes.
- `npm test`: valida fluxos do frontend e isolamento do artefato publico.

O servidor `npm run dev` serve a raiz para desenvolvimento. Nao o exponha na internet nem use esse comando em producao. O Docker e o Cloudflare publicam somente `dist`; veja [DEPLOYMENT.md](DEPLOYMENT.md).
