# Bolão Brasileirão 2026 — App Web

Aplicação full-stack para gerenciar o bolão do Brasileirão.

## Stack

- **Backend:** Python 3.11+ / FastAPI / SQLAlchemy / SQLite (local) ou PostgreSQL (produção)
- **Frontend:** React 18 / TypeScript / Vite / TailwindCSS / Recharts
- **Gerenciamento:** Poetry (backend) / npm (frontend)

## Requisitos

- Python 3.11+
- Poetry (`pip install poetry`)
- Node.js 18+
- npm

## Instalação (desenvolvimento local)

### Backend

```bash
cd app/backend
poetry install
```

### Frontend

```bash
cd app/frontend
npm install
```

## Desenvolvimento

### Iniciar backend (porta 8000)

```bash
cd app/backend
poetry run uvicorn app.main:app --reload --port 8000
```

### Iniciar frontend (porta 5173)

```bash
cd app/frontend
npm run dev
```

Acesse http://localhost:5173 no navegador.
O frontend faz proxy de `/api/*` para `http://localhost:8000`.

## Deploy em produção (Render + Neon)

### Pré-requisitos

1. **Neon** (neon.tech) — criar banco PostgreSQL gratuito e copiar a connection string
2. **Render** (render.com) — conectar ao repositório Git
3. **cron-job.org** — para agendamento automático de sync

### Passo a passo

1. Crie uma conta no [Neon](https://neon.tech) e crie um projeto. Copie a connection string (`postgresql://...`)
2. Crie uma conta no [Render](https://render.com) e conecte seu repositório Git
3. O `render.yaml` já está configurado — o Render detectará automaticamente
4. Configure as variáveis de ambiente no painel do Render:

| Variável | Valor |
|----------|-------|
| `BOLAO_DATABASE_URL` | Connection string do Neon (`postgresql://...`) |
| `BOLAO_ADMIN_USERNAME` | `admin` |
| `BOLAO_ADMIN_PASSWORD` | Sua senha segura |
| `BOLAO_SECRET_KEY` | Gerada automaticamente pelo Render |
| `BOLAO_SCRAPEDO_TOKEN` | Seu token do scrape.do |
| `BOLAO_CRON_SECRET` | Gerada automaticamente pelo Render |

5. Faça deploy (push no Git)
6. Acesse `https://bolao-brasileirao-fsa.onrender.com`

### Sync automático (cron)

Configure no [cron-job.org](https://cron-job.org) duas tarefas:

- **Toda terça-feira às 23:00 (Brasília):**
  ```
  POST https://bolao-brasileirao-fsa.onrender.com/api/admin/cron/sync?token=SEU_CRON_SECRET
  ```
- **Toda sexta-feira às 23:00 (Brasília):**
  ```
  POST https://bolao-brasileirao-fsa.onrender.com/api/admin/cron/sync?token=SEU_CRON_SECRET
  ```

O `CRON_SECRET` é o valor configurado na variável `BOLAO_CRON_SECRET` no Render.

## Uso

1. Acesse a aba **Admin** e clique em **Sincronizar Agora** para buscar dados do Sofascore
2. Na aba **Apostadores**, cadastre os apostadores com seus 7 times (requer login admin)
3. A aba **Ranking** mostra a classificação calculada automaticamente
4. A aba **Classificação** mostra a tabela do Brasileirão com zonas coloridas
5. A aba **Histórico** mostra gráficos de evolução ao longo das rodadas
6. A aba **Sobre** traz informações sobre o projeto e o desenvolvedor

## API Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/teams` | — | Lista todos os times |
| GET | `/api/standings` | — | Classificação do Brasileirão |
| GET | `/api/apostadores` | — | Lista apostadores |
| POST | `/api/apostadores` | Admin | Cadastra apostador |
| PUT | `/api/apostadores/{id}` | Admin | Atualiza apostador |
| DELETE | `/api/apostadores/{id}` | Admin | Remove apostador |
| GET | `/api/ranking` | — | Ranking com desempate |
| GET | `/api/historico` | — | Snapshots para gráficos |
| POST | `/api/auth/login` | — | Login admin (retorna JWT) |
| GET | `/api/auth/verify` | Admin | Verifica token JWT |
| POST | `/api/admin/sync` | Admin | Sincroniza com Sofascore |
| GET | `/api/admin/config` | Admin | Configuração atual |
| POST | `/api/admin/cron/sync?token=...` | Token | Sync via cron externo |
