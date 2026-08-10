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
Copy-Item .env.example .env
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

1. Crie os arquivos locais de ambiente:

```powershell
Copy-Item ..\sswapi-main\.env.example ..\sswapi-main\.env
Copy-Item .env.example .env
```

2. Preencha as variaveis necessarias e rode:

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
- `npm run build:local`: injeta configuracoes locais; permite rodar sem chave de pagamento.
- `npm run build`: build de producao; exige `VITE_MP_PUBLIC_KEY`.
