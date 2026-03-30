# 🏦 Transaction Manager

Um sistema robusto para processamento de transações financeiras com uma interface gráfica moderna (Dashboard) para visualização de métricas, conciliação e tratamento de erros.

Este projeto foi desenhado focando em resiliência, consistência de dados, boas práticas de Engenharia de Software e design de interface limpo.

---

## ✨ Funcionalidades

- **Processamento de Transações**: Suporta `deposit` (depósito), `withdraw` (saque) e `transfer` (transferência entre contas).
- **Cálculo Consistente de Saldo**: O saldo não sofre de _Race Conditions_. É calculado dinamicamente em tempo real baseado no histórico de transações bem-sucedidas do usuário (inspirado em _Event Sourcing_). Isso resolve o problema de transações chegando fora de ordem temporal.
- **Idempotência Garantida**: Evita efeitos colaterais de requisições duplicadas. Transações enviadas mais de uma vez com o mesmo `id` são ignoradas graciosamente, retornando sucesso ao cliente sem duplicar efeitos no banco de dados.
- **Tratamento de Inconsistências**: Requisições inválidas (sem saldo, campos obrigatórios ausentes, contas inexistentes) não derrubam o sistema nem são perdidas; elas são interceptadas e salvas em uma base específica para auditoria e _troubleshooting_.
- **Resiliência a Falhas**: Estratégia de _Retry com Exponential Backoff_ para lidar com indisponibilidades momentâneas ou deadlocks no Banco de Dados.
- **Dashboard Web**: Uma interface em React inspirada em aplicações _fintech / terminal_ minimalistas para acompanhar as movimentações e as contas em tempo real.

---

## 🛠 Tecnologias e Stack

### Estrutura

- **Monorepo** utilizando **NPM Workspaces** e **Turborepo** para orquestração de scripts.

### Backend (`apps/api`)

- **Node.js** com **Express** e **TypeScript**
- **PostgreSQL** (Banco de dados relacional robusto para sistemas financeiros)
- **Prisma ORM** (Modelagem de dados e Type Safety)
- **Zod** (Validação estrita de _schemas/payloads_ HTTP)
- **Vitest** (Testes automatizados)
- **Pino** (Logs estruturados de alta performance)

### Frontend (`apps/web`)

- **React 18** com **Vite** e **TypeScript**
- **TailwindCSS** (Estilização _Utility-first_)
- **TanStack React Query** (Gerenciamento de cache e estados assíncronos)
- **Axios** (Cliente HTTP)

---

## 🏗 Arquitetura

O backend adota princípios da _Clean Architecture_ e _Solid_:

- **Controllers**: Lidam apenas com as requisições HTTP e respostas.
- **Use Cases**: Contêm as regras de negócio puras (validação, idempotência, cálculos). Totalmente agnósticos ao banco de dados e frameworks externos.
- **Repositories**: Isolam a comunicação com o banco de dados via Prisma, facilitando a injeção de dependências e os testes unitários.

---

## ⚙️ Como Executar (Ambiente de Desenvolvimento)

### Pré-requisitos

- Node.js (v18 ou superior)
- Docker e Docker Compose (para subir o banco de dados)

### Passos

1. **Clone o repositório:**

   ```bash
   git clone <url-do-repositorio>
   cd transaction-manager
   ```

2. **Instale as dependências:**

   ```bash
   npm install
   ```

3. **Suba o banco de dados PostgreSQL:**
   (Caso utilize um Dev Container, o banco já pode estar configurado automaticamente. Senão, utilize o docker-compose caso exista na sua infra, ou aponte uma URI válida).

   ```bash
   docker-compose up -d
   ```

4. **Configure as Variáveis de Ambiente:**
   Na pasta `apps/api`, crie um arquivo `.env` com a conexão para o banco de dados:

   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/transaction_manager?schema=public"
   ```

5. **Execute as Migrations e o Seed do Banco de Dados:**
   Isso criará as tabelas e adicionará usuários iniciais para teste.

   ```bash
   cd apps/api
   npx prisma db push
   npm run prisma:seed
   cd ../../
   ```

6. **Inicie os serviços simultaneamente (Frontend e Backend):**
   Na raiz do monorepo, execute:
   ```bash
   npm run dev
   ```

A API estará rodando em `http://localhost:3333` e o Dashboard Web em `http://localhost:5173`.

---

## 📚 Endpoints Principais (API)

A base URL é: `http://localhost:3333`

- `POST /transactions` - Envia uma transação ou um _array_ de transações para processamento.
- `GET /transactions/resume` - Retorna as transações válidas e processadas.
- `GET /transactions/invalid` - Retorna log das transações que falharam em validação ou regras de negócio.
- `GET /users` - Lista os usuários com o saldo atualizado.

_Exemplo de Payload de Depósito (`POST /transactions`):_

```json
{
  "id": "e67eb3f1-bd12-4217-b7cd-26514bc5456f",
  "type": "deposit",
  "amount": 1500.0,
  "user_id": "uuid-do-usuario",
  "timestamp": "2023-10-24T14:32:01Z"
}
```

_Exemplo de Payload de Transferência (`POST /transactions`):_

```json
{
  "id": "f58bc100-bd12-4217-b7cd-26514bc5451a",
  "type": "transfer",
  "amount": 100.0,
  "from_user_id": "uuid-origem",
  "to_user_id": "uuid-destino",
  "timestamp": "2023-10-24T15:00:00Z"
}
```

---

## 📄 Documentação Auxiliar

As decisões detalhadas de arquitetura, justificativas de uso das tecnologias e todo o fluxo de **Uso de IA** durante o desenvolvimento estão documentados no arquivo:
👉 [**DECISIONS.md**](./DECISIONS.md)
