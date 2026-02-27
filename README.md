# Bolão Brasileirão FSA 2026

Aplicação full-stack para gerenciamento de um bolão entre amigos sobre o Campeonato Brasileiro de Futebol 2026. Cada participante escolhe 7 times em ordem de prioridade (1 a 7). A pontuação é calculada com base na classificação real do Brasileirão, usando dados do Sofascore.

**URL:** https://bolao-brasileirao-fsa.onrender.com

---

## Stack tecnológica

### Backend
- Python 3.11 + FastAPI
- SQLAlchemy 2.0 (SQLite local / PostgreSQL em produção)
- Poetry (gerenciamento de dependências)
- Pydantic Settings (configuração via variáveis de ambiente)
- JWT (autenticação admin)
- cloudscraper + scrape.do (dados do Sofascore)

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- TailwindCSS (estilização)
- Recharts (gráficos)
- xlsx / jspdf (exportação Excel e PDF)
- React Router Dom

---

## Infraestrutura

O app roda em 4 serviços gratuitos:

| Serviço | Função |
|---------|--------|
| [Render](https://render.com) | Hospedagem do web service (backend + frontend estático) |
| [Neon](https://neon.tech) | Banco de dados PostgreSQL |
| [cron-job.org](https://cron-job.org) | Sync automático dos dados (terça e sexta) |
| [UptimeRobot](https://uptimerobot.com) | Keep-alive para evitar sleep do Render free tier |

---

## Estrutura de arquivos

```
bolao-brasileirao-fsa/
  README.md
  app/                            <- root dir para deploy
    build.sh                      <- script de build (frontend + backend)
    render.yaml                   <- configuração do Render

    backend/
      pyproject.toml              <- dependências Python (Poetry)
      static/badges/              <- logos dos times (.webp)
      app/
        main.py                   <- entry point FastAPI
        config.py                 <- Pydantic Settings (BOLAO_*)
        database.py               <- engine SQLAlchemy
        models.py                 <- Team, Apostador, Palpite, Snapshot
        schemas.py                <- schemas Pydantic
        auth.py                   <- JWT auth
        routers/                  <- endpoints da API
        services/                 <- sofascore, sync, ranking, historico, badges

    frontend/
      src/
        App.tsx                   <- React Router + layout
        pages/                    <- Ranking, Classificacao, Apostadores, Historico, Admin, Sobre
        components/               <- ApostadorForm, TeamSelect, RankingTable, etc.
        api/client.ts             <- API client
        utils/                    <- export Excel/PDF, import Excel
```

---

## Funcionalidades

- Ranking com views detalhada e compacta + pódio (ouro/prata/bronze)
- Classificação do Brasileirão em tempo real com zonas coloridas (Libertadores, Sul-Americana, Rebaixamento)
- Cadastro/edição/remoção de apostadores (admin)
- Importação e exportação de apostadores via Excel
- Exportação de ranking em PDF com logos dos times
- Histórico de pontuação por sessão com gráfico de evolução
- Autenticação JWT para painel admin
- Design responsivo (mobile/tablet/desktop)
- Sync automático via cron (terça e sexta)
- Badges dos times baixados e cacheados automaticamente

---

## Lógica de negócio

### Pontuação
- Cada apostador escolhe 7 times com prioridades de 1 a 7
- A pontuação de cada time = pontos do time na classificação real do Brasileirão
- Total = soma das 7 pontuações (quanto maior, melhor)

### Desempate
1. Maior pontuação total
2. Mais pontos no time de prioridade 1
3. Mais pontos no time de prioridade 2
4. ... até prioridade 7
5. Menor ordem de inscrição

### Sessões
- Dados são fotografados em sessões (terça e sexta-feira)
- Cada sessão gera um snapshot com pontuação e posição de cada apostador
- O histórico mostra a evolução ao longo das sessões

---

## API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/api/teams` | - | Lista times |
| GET | `/api/standings` | - | Classificação do Brasileirão |
| GET | `/api/apostadores` | - | Lista apostadores com palpites |
| POST | `/api/apostadores` | Admin | Cria apostador |
| POST | `/api/apostadores/import` | Admin | Importa apostadores (JSON) |
| PUT | `/api/apostadores/{id}` | Admin | Atualiza apostador |
| DELETE | `/api/apostadores/{id}` | Admin | Remove apostador |
| GET | `/api/ranking` | - | Ranking calculado |
| GET | `/api/historico` | - | Snapshots históricos |
| POST | `/api/auth/login` | - | Login admin (JWT) |
| GET | `/api/auth/verify` | Admin | Verifica token |
| POST | `/api/admin/sync` | Admin | Sync manual |
| GET | `/api/admin/config` | Admin | Configurações |
| GET\|POST | `/api/admin/cron/sync?token=X` | Token | Sync via cron |

---

## Variáveis de ambiente

Todas com prefixo `BOLAO_` (configuradas via painel do Render em produção):

| Variável | Descrição |
|----------|-----------|
| `BOLAO_DATABASE_URL` | Connection string (SQLite local ou PostgreSQL) |
| `BOLAO_ADMIN_USERNAME` | Username do admin |
| `BOLAO_ADMIN_PASSWORD` | Senha do admin |
| `BOLAO_SECRET_KEY` | Chave para assinar JWT |
| `BOLAO_CRON_SECRET` | Token para endpoint cron |
| `BOLAO_SCRAPEDO_TOKEN` | Token do scrape.do (fallback) |
| `BOLAO_SEASON_YEAR` | Ano da temporada (padrão: 2026) |
| `BOLAO_TOURNAMENT_ID` | ID do torneio no Sofascore (padrão: 325) |
| `BOLAO_SEASON_ID` | ID da temporada no Sofascore (padrão: 87678) |
| `BOLAO_TIMES_PER_APOSTADOR` | Times por apostador (padrão: 7) |

---

## Desenvolvimento local

### Backend

```bash
cd app/backend
poetry install --no-root
poetry run uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd app/frontend
npm install
npm run dev
```

O frontend roda em `http://localhost:5173` com proxy de `/api` para `localhost:8000`.

---

## Deploy

1. Crie um banco PostgreSQL no [Neon](https://neon.tech)
2. Crie um Web Service no [Render](https://render.com) conectado ao repositório
   - **Root Directory**: `app`
   - **Build Command**: `./build.sh`
   - **Start Command**: `cd backend && poetry run uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Configure as variáveis de ambiente no painel do Render
4. Configure o sync automático no [cron-job.org](https://cron-job.org)
5. Configure o keep-alive no [UptimeRobot](https://uptimerobot.com) (intervalo de 5 min)

---

## Autor

**Rodrigo Ribeiro Cardoso**
- GitHub: [rrcardoso](https://github.com/rrcardoso)
- LinkedIn: [rodrigo-r-cardoso](https://linkedin.com/in/rodrigo-r-cardoso)
