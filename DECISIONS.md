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
- **Banco de Dados & ORM:** PostgreSQL com Prisma ORM. O PostgreSQL garante robustez e consistência transacional (ACID). O Prisma fornece tipagem forte do banco de dados até a ponta da API.
- **Testes:** `Vitest` com `Supertest`. Foi escolhido o Vitest ao invés do Jest para unificar a stack de testes com o Frontend (que já utiliza Vite/Vitest), reduzindo a curva de aprendizado e overhead de dependências.
- **Validação:** `Zod` para validação rigorosa de _schemas_ nos payloads de entrada, barrando inconsistências logo na primeira camada.
- **Arquitetura em Camadas:** Código organizado em rotas, `controllers`, `use-cases` (regras de negócio) e `repositories` (acesso a dados), facilitando isolamento e testes unitários.

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
2. **Prototipação de Interface (Design):**
   - Utilizando uma ferramenta interna de canvas (`Pencil MCP`), a IA elaborou o design da aplicação visualmente, definindo cores, espaçamentos e layouts de tabela inspirados na estética de terminal.
   - Refinamento automático do design sob demanda (ex: adequando nomenclaturas de _snake_case_ para _Title Case_ visando usabilidade, e separando uma interface monolítica em múltiplas telas).

3. **Automação de Scaffold e Infraestrutura:**
   - A IA gerou a infraestrutura base do Monorepo emitindo dezenas de comandos Bash simultâneos para criar diretórios, instalar dependências (`npm workspaces`), inicializar o Git e criar arquivos estruturais complexos (como `docker-compose.yml`, `tailwind.config.js`, `.eslintrc.js`).

4. **Integração de Backend e Frontend:**
   - Construção dos UseCases e Repositories do Backend. A IA cometeu um deslize inicial introduzindo tipagens `any` para escapar de conflitos no Prisma com o Zod, que foi rapidamente corrigido para `unknown` e _Type Guards_ após alinhamento de _Clean Code_.
   - A IA mapeou de forma autônoma os arquivos simulados (`mock`) do Frontend React, instalou o `axios` e implementou os _hooks_ do `@tanstack/react-query` de forma a puxarem os dados reais gerados pelos endpoints da API recém construída.

5. **Implementação Rápida de Componentes React (Mock):**
   - Com o design aprovado, a IA traduziu a UI para componentes em React + Tailwind, incluindo lógica de React Router e estruturas flexíveis (`flex`, `grid`) responsivas.

### Correções Manuais e Adaptações

- **Fallback de Gerenciador de Pacotes:** O plano original utilizava `pnpm` e arquivos `pnpm-workspace.yaml`. No momento da execução, o ambiente de desenvolvimento relatou que o `pnpm` não estava disponível. A IA corrigiu isso de forma autônoma (mas mediante solicitação) adaptando tudo para usar NPM Workspaces nativo e modificando o `package.json`.
- **Conflitos de ESLint (O "Erro da IA"):**
  - **O Problema:** Ao utilizar os scaffolds mais modernos (Vite), arquivos como `eslint.config.js` (Flat Config) foram gerados misturados com a mentalidade legado (`.eslintrc`) das outras pastas, resultando em erros onde o ESLint não reconhecia a palavra `import` (Syntax/Parse Error no Typescript).
  - **Como foi identificado:** Solicitou-se ativamente que a IA rodasse `npm run lint`. O terminal retornou código de erro 2.
  - **A Correção:** A IA teve que ler explicitamente os logs do terminal, apagar o `eslint.config.js` via bash (`rm`), instalar os parsers adequados (`@typescript-eslint/parser`) e criar arquivos consistentes de configuração do ESLint em ambos os projetos do monorepo, padronizando os interpretadores.

---

_Este documento reflete as fundações sobre as quais o projeto foi erguido, combinando automação por IA com diretrizes estritas de Engenharia de Software._
