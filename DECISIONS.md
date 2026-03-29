# Documentação de Decisões e Uso de IA

Este documento descreve as decisões arquiteturais e técnicas tomadas para a construção do **Transaction Manager**, bem como o detalhamento de como a Inteligência Artificial foi utilizada durante o processo.

---

## 1. Decisões Arquiteturais e Técnicas

### 1.1 Estrutura do Projeto (Monorepo)

Optamos por utilizar um **Monorepo** com **NPM Workspaces** e **Turborepo**.

- **Por quê?** Facilita a manutenção, orquestração de scripts (como lint, build e testes) e compartilhamento de configurações entre o Frontend (`apps/web`) e o Backend (`apps/api`), mantendo o código unificado e sincronizado.

### 1.2 Backend (API)

- **Framework & Linguagem:** Node.js com Express e TypeScript. Escolhidos pela maturidade, vasto ecossistema e tipagem estática que previne erros em tempo de compilação.
- **Ferramental de Execução:** `tsx` para desenvolvimento (hot-reload rápido com TypeScript) e `tsup` (baseado no esbuild) para gerar bundles de produção ultra-rápidos e otimizados.
- **Banco de Dados & ORM:** PostgreSQL com Prisma ORM (versão 7+). O PostgreSQL garante robustez e consistência transacional (ACID). O Prisma fornece tipagem forte do banco de dados até a ponta da API. Em vez de conexões diretas gerenciadas pelo Rust Engine interno do Prisma (padrão legado), optou-se pela utilização da nova configuração baseada no pacote `@prisma/adapter-pg` e _Connection Pool_ usando `pg`.
- **Testes:** `Vitest` com `Supertest`. Foi escolhido o Vitest ao invés do Jest para unificar a stack de testes com o Frontend (que já utiliza Vite/Vitest), reduzindo a curva de aprendizado e overhead de dependências.
- **Validação:** `Zod` para validação rigorosa de _schemas_ nos payloads de entrada, barrando inconsistências logo na primeira camada.
- **Arquitetura em Camadas (Modular):** Código organizado em _Modules_ baseados em domínio (`transactions`, `users`), onde cada módulo encapsula suas rotas, `controllers`, `use-cases` (regras de negócio) e `repositories` (acesso a dados). Esse design agrupa artefatos coesos, facilitando o isolamento e escalabilidade.

### 1.3 Resolução dos Requisitos Críticos de Negócio

- **Idempotência:** O `id` da transação enviado no payload será utilizado como Chave Primária (PK) ou restrição `UNIQUE` no banco de dados. Tentativas de duplicidade falharão no nível do banco e serão tratadas graciosamente na camada de serviço (UseCase).
- **Cálculo de Saldo (Ordem e Consistência):** Optou-se por uma abordagem inspirada em _Event Sourcing_ (Cálculo sob demanda). O saldo não será uma coluna mutável (`balance`) sujeita a condições de corrida (_race conditions_). Em vez disso, o saldo é calculado dinamicamente pela soma de todas as transações válidas do usuário. Isso resolve perfeitamente o problema de **transações chegando fora de ordem**.
- **Tratamento de Inconsistências:** Transações que falhem nas lógicas de negócio (ex: conta inexistente, saldo insuficiente em caso de saque/transferência) não entrarão no fluxo principal. Elas serão salvas em uma tabela específica `invalid_transactions` com o motivo da falha, atendendo ao requisito visual do painel.
- **Resiliência e Falhas Transitórias:** Foi implementada uma estratégia de **Retry com Exponential Backoff** na persistência do banco de dados (no _UseCase_). Caso o banco de dados sofra uma instabilidade momentânea ou _deadlock_, a API retentará a operação de forma controlada antes de devolver um erro.
- **Isolamento de Erros no Processamento em Lote:** O endpoint `POST /transactions` processa transações de forma concorrente e isolada via `Promise.allSettled`. Uma transação que quebre criticamente o servidor não impede que as demais no mesmo payload sejam salvas.

### 1.4 Frontend (Web)

- **Framework & Ferramentas:** React 18 com Vite e TypeScript.
- **Estilização:** TailwindCSS, permitindo um design system direto no código sem arquivos CSS complexos. Utilizou-se configurações estritas (sem valores arbitrários nas classes) para manter o padrão corporativo.
- **Estado e Requisições:** React Query (TanStack Query) acoplado com Axios. Garante cache, estados nativos de `loading/error` e refetching inteligente.
- **Arquitetura de UI:** Modularização baseada no conceito de _Feature-Sliced Design_ (pastas divididas por domínio: `dashboard`, `users`, `transactions`), com _Lazy Loading_ (`React.lazy` + `Suspense`) nas rotas principais para otimização de performance.
- **Estética:** Tema dark minimalista inspirado em terminais (`Terminal Minimal Light`), com tipografia monoespaçada (JetBrains Mono) e tons de verde.

### 1.5 Qualidade e Padronização

- Foram implementados globalmente **ESLint**, **Prettier**, **Husky** (Git Hooks) e **lint-staged**. Isso garante que nenhum código mal formatado ou com erros sintáticos seja adicionado ao repositório via commits.

---

## 2. Uso de Inteligência Artificial

A Inteligência Artificial (IA) foi utilizada como uma parceira de pareamento (Pair Programmer) e ferramenta de automação estrutural (Agente) através de uma interface de linha de comando orientada a ferramentas (tools).

### Como a IA foi utilizada:

1. **Brainstorming e Decisões de Arquitetura:**
   - A IA propôs estratégias viáveis para desafios complexos (ex: como evitar anomalias com dados fora de ordem sem usar locks excessivos no DB, sugerindo o cálculo de saldo dinâmico/Event Sourcing).
   - Debate e consenso sobre a substituição do Jest pelo Vitest no back-end para melhor compatibilidade com o monorepo.
   - Design da estrutura de diretórios e padrões de resiliência (como _Retry com Exponential Backoff_ para lidar com indisponibilidade momentânea ou deadlocks do banco de dados).

2. **Prototipação de Interface (Design):**
   - Utilizando uma ferramenta interna de canvas (`Pencil MCP`), a IA elaborou o design da aplicação visualmente, definindo cores, espaçamentos e layouts de tabela inspirados na estética de terminal.
   - Refinamento automático do design sob demanda (ex: adequando nomenclaturas de _snake_case_ para _Title Case_ visando usabilidade, e separando uma interface monolítica em múltiplas telas).

3. **Automação de Scaffold e Infraestrutura:**
   - A IA gerou a infraestrutura base do Monorepo emitindo dezenas de comandos Bash simultâneos para criar diretórios, instalar dependências (`npm workspaces`), inicializar o Git e criar arquivos estruturais complexos (como `docker-compose.yml`, `tailwind.config.js`, `.eslintrc.js`).
   - Geração de banco de dados e arquivos de Seeding baseados na documentação e PDF fornecidos para Mockup e testes reais.

4. **Integração de Backend e Frontend:**
   - Construção dos UseCases e Repositories do Backend isolando completamente regras de negócios e orquestrando o Prisma.
   - A IA mapeou de forma autônoma os arquivos simulados (`mock`) do Frontend React, instalou o `axios` e implementou os _hooks_ do `@tanstack/react-query` de forma a puxarem os dados reais gerados pelos endpoints da API recém construída.
   - Resolução inteligente de erros com pacotes recém-atualizados. A IA realizou buscas autônomas no framework "Context7 MCP" buscando na documentação atual e oficial do repositório Prisma a nova forma de conexão na Versão 7 e efetuou a refatoração.

5. **Implementação Rápida de Componentes React:**
   - Com o design aprovado, a IA traduziu a UI para componentes em React + Tailwind, incluindo lógica de React Router e estruturas flexíveis (`flex`, `grid`) responsivas.

### Correções Manuais e Adaptações

- **Fallback de Gerenciador de Pacotes:** O plano original utilizava `pnpm` e arquivos `pnpm-workspace.yaml`. No momento da execução, o ambiente de desenvolvimento relatou que o `pnpm` não estava disponível. A IA corrigiu isso de forma autônoma (mas mediante solicitação) adaptando tudo para usar NPM Workspaces nativo e modificando o `package.json`.
- **Conflitos de ESLint (O "Erro da IA"):**
  - **O Problema:** Ao utilizar os scaffolds mais modernos (Vite), arquivos como `eslint.config.js` (Flat Config) foram gerados misturados com a mentalidade legado (`.eslintrc`) das outras pastas, resultando em erros onde o ESLint não reconhecia a palavra `import` (Syntax/Parse Error no Typescript).
  - **Como foi identificado:** Solicitou-se ativamente que a IA rodasse `npm run lint`. O terminal retornou código de erro 2.
  - **A Correção:** A IA teve que ler explicitamente os logs do terminal, apagar o `eslint.config.js` via bash (`rm`), instalar os parsers adequados (`@typescript-eslint/parser`) e criar arquivos consistentes de configuração do ESLint em ambos os projetos do monorepo, padronizando os interpretadores.
- **Tipagem Estrita (Any):**
  - **O Problema:** Durante a construção dos _UseCases_ iniciais, a IA introduziu anotações de _cast_ para `any` no payload Zod para escapar de checagens do Prisma antes de migrar os campos.
  - **Como foi identificado e corrigido:** O usuário pontuou em revisão humana de código que o uso de `any` feria as premissas de Clean Code previamente acordadas. A IA removeu todos os `any` e substituiu por _Type Guards_ rigorosos e tipos nativos de input das entidades do Prisma (`Prisma.TransactionUncheckedCreateInput`).
- **Adequação da Arquitetura de Módulos (Refatoração):**
  - **O Problema:** Em um primeiro momento a IA criou pastas achatadas na raiz do src (ex: `src/controllers`, `src/use-cases`), ignorando o _layout_ de Módulos do repositório já rascunhado para domínio (`modules/transactions`, `modules/users`).
  - **Como foi corrigido:** Com o direcionamento manual via chat, a IA realizou uma varredura completa da estrutura no terminal (`find`), apagou as pastas raiz e realocou todos os artefatos respeitando a premissa de _Domain-Driven_ dos Módulos, corrigindo os imports no processo.
- **Atualização Abrupta do Prisma v7:**
  - **O Problema:** Houve um erro no _build_ (Schema Error) em tempo real indicando: `The datasource property url is no longer supported in schema files`.
  - **Como foi corrigido:** O usuário passou o log exato de erro. A IA então consumiu autonomamente as documentações atualizadas do repositório do Prisma via MCP, entendeu que a versão 7 introduziu uma mudança massiva ("Breaking Change"), instalou o pacote `@prisma/adapter-pg` e refatorou todo o sistema de conexão para utilizar o arquivo moderno `prisma.config.ts`.

---

_Este documento reflete as fundações sobre as quais o projeto foi erguido, combinando automação por IA com diretrizes estritas de Engenharia de Software._
