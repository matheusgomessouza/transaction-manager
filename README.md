# Transaction Manager

Sistema para processamento de transações financeiras com interface gráfica para visualização de métricas, conciliação e tratamento de erros.

---

## Funcionalidades

- **Processamento de Transações**: Suporta `deposit`, `withdraw` e `transfer`
- **Cálculo de Saldo sob Demanda**: Saldo calculado dinamicamente via soma de transações (Event Sourcing) — sem race conditions
- **Idempotência**: Transações duplicadas (mesmo `id`) são ignoradas graciosamente
- **Tratamento de Inconsistências**: Transações inválidas salvas em tabela separada com motivo da falha
- **Resiliência**: Retry com Exponential Backoff em falhas transitórias do banco
- **CRUD de Transações**: Criar e deletar transações via interface (modal Manage Transactions)
- **Dashboard Web**: Interface React dark-theme inspirada em terminais

---

## Stack

### Backend (`apps/api`)

| Tecnologia                     | Uso                              |
| ------------------------------ | -------------------------------- |
| Node.js + Express + TypeScript | API REST                         |
| PostgreSQL                     | Banco de dados                   |
| Prisma ORM (v7 + adapter-pg)   | ORM e migrations                 |
| Zod                            | Validação de payloads            |
| Vitest + Supertest             | Testes unitários e de integração |
| Pino                           | Logs estruturados                |

### Frontend (`apps/web`)

| Tecnologia                   | Uso                       |
| ---------------------------- | ------------------------- |
| React 18 + Vite + TypeScript | SPA                       |
| TailwindCSS                  | Estilização               |
| TanStack React Query         | Cache e estado assíncrono |
| Axios                        | Cliente HTTP              |

### Infraestrutura

| Tecnologia                 | Uso                         |
| -------------------------- | --------------------------- |
| Docker + Dev Container     | Ambiente de desenvolvimento |
| Turborepo + NPM Workspaces | Monorepo                    |
| Husky + lint-staged        | Git hooks                   |
| ESLint + Prettier          | Code quality                |

---

## Arquitetura

```
apps/
├── api/                          # Backend
│   ├── prisma/
│   │   ├── schema.prisma         # Modelo de dados
│   │   ├── seed.ts               # Dados iniciais
│   │   └── migrations/           # Migrations SQL
│   └── src/
│       ├── lib/                  # Prisma client, logger
│       ├── modules/
│       │   ├── transactions/     # Módulo de transações
│       │   │   ├── controllers/  # HTTP handlers
│       │   │   ├── routes/       # Express routes
│       │   │   ├── repositories/ # Acesso a dados (Prisma)
│       │   │   ├── use-cases/    # Regras de negócio
│       │   │   └── schemas/      # Validação Zod
│       │   └── users/            # Módulo de usuários
│       ├── routes/               # Agregação de rotas
│       ├── server.ts             # Entry point Express
│       └── __tests__/            # Testes de integração
└── web/                          # Frontend React
    └── src/
        ├── app/                  # Router e config
        ├── features/             # Feature-sliced (dashboard, users, transactions)
        ├── components/           # Layout compartilhado
        └── lib/                  # Axios config
```

---

## Como Executar

### Opção 1: Dev Container (Recomendado)

Requer **Docker** e **VS Code** com a extensão **Dev Containers**.

1. Clone o repositório
2. Abra no VS Code
3. Clique em **"Reopen in Container"** (ou `Ctrl+Shift+P` → `Dev Containers: Reopen in Container`)
4. O container instala dependências e gera o Prisma client automaticamente (`postCreateCommand`)
5. Após o container abrir, execute:

```bash
# Rode as migrations e o seed
cd apps/api
npx prisma migrate deploy
npx tsx prisma/seed.ts

# Inicie o backend e frontend
cd ../..
npm run dev
```

A API roda em `http://localhost:3333` e o frontend em `http://localhost:5173`.

### Opção 2: Docker Compose Manual

```bash
# Subir os bancos (db e test-db)
cd .devcontainer
docker compose up -d

# Instalar dependências
cd ..
npm install

# Configurar .env em apps/api
echo 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres' > apps/api/.env

# Rodar migrations e seed
cd apps/api
npx prisma migrate deploy
npx tsx prisma/seed.ts

# Iniciar
cd ../..
npm run dev
```

### Opção 3: Sem Docker

Requer PostgreSQL rodando localmente na porta 5432.

```bash
npm install

# Criar .env em apps/api
echo 'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres' > apps/api/.env

cd apps/api
npx prisma migrate deploy
npx tsx prisma/seed.ts
cd ../..
npm run dev
```

---

## Testes

### Unitários (mock, sem banco)

```bash
cd apps/api
npm run test
```

32 testes cobrindo: validação Zod, idempotência, regras de negócio, cálculo de saldo, endpoints via supertest.

### Integração (com banco real)

Requer o container rodando (service `test-db`):

```bash
cd apps/api
npm run test:integration
```

23 testes cobrindo: endpoints HTTP com supertest, requests malformados, edge cases de saldo, concorrência (Promise.all).

### Todos de uma vez

```bash
cd apps/api
npm run test && npm run test:integration
```

---

## Endpoints da API

Base URL: `http://localhost:3333`

| Método   | Rota                    | Descrição                             |
| -------- | ----------------------- | ------------------------------------- |
| `GET`    | `/health`               | Health check                          |
| `POST`   | `/transactions`         | Processar transação (single ou array) |
| `GET`    | `/transactions/resume`  | Listar transações válidas             |
| `GET`    | `/transactions/invalid` | Listar transações inválidas           |
| `DELETE` | `/transactions/:id`     | Deletar transação (saldo recalculado) |
| `GET`    | `/users`                | Listar usuários com saldo             |

### Exemplos de Payload

**Depósito:**

```json
{
  "id": "uuid-unico",
  "type": "deposit",
  "amount": 1500.0,
  "user_id": "uuid-do-usuario",
  "timestamp": "2026-03-30T12:00:00.000Z"
}
```

**Transferência:**

```json
{
  "id": "uuid-unico",
  "type": "transfer",
  "amount": 500.0,
  "from_user_id": "uuid-origem",
  "to_user_id": "uuid-destino",
  "timestamp": "2026-03-30T12:00:00.000Z"
}
```

---

## Scripts Disponíveis

| Script                     | Descrição                           |
| -------------------------- | ----------------------------------- |
| `npm run dev`              | Inicia backend + frontend           |
| `npm run build`            | Build de produção                   |
| `npm run test`             | Testes unitários (apps/api)         |
| `npm run test:integration` | Testes de integração com banco real |
| `npm run lint`             | ESLint                              |

---

## Troubleshooting Comum

- **`@rollup/rollup-linux-x64-gnu` não encontrado**: Rodar `npm install` de dentro do container, não do host
- **`EACCES` no `.vite`**: `node_modules` criado pelo Windows — reinstalar dentro do container
- **`lint-staged` não reconhecido**: O hook `pre-commit` só roda dentro do container
- **Portas não acessíveis**: Verificar se o Dev Container está conectado e `forwardPorts` configurado
- **Tabelas não existem**: Rodar `npx prisma migrate deploy` dentro do container

Detalhes completos em [DECISIONS.md](./DECISIONS.md).

---

## Documentação

- [**DECISIONS.md**](./DECISIONS.md) — Decisões arquiteturais, troubleshooting e uso de IA
- [**design/transaction-manager.pen**](./design/transaction-manager.pen) — Design system no Pencil MCP
