# Relatório de Serviços

Sistema web (PWA) para criação de relatórios de serviço com fotos antes/depois e orçamentos automáticos. Desenvolvido para empresas de desentupimento, jateamento e sucção.

## Funcionalidades

- **Relatórios de serviço** com fotos antes/depois por item
- **Captura de câmera** direto no navegador (sem salvar na galeria)
- **Guia de orientação** horizontal/vertical por tipo de serviço
- **Orçamentos automáticos** com cálculo de preços e PDF
- **Assinatura digital** do técnico e cliente
- **Painel administrativo** para escritório
- **PWA instalável** no celular
- **Envio por WhatsApp** com link do PDF

## Stack

- Next.js 16 + TypeScript
- Tailwind CSS
- Prisma + SQLite (dev) / PostgreSQL (prod)
- @react-pdf/renderer
- browser-image-compression

## Início Rápido

```bash
# Instalar dependências
npm install

# Configurar banco de dados e dados iniciais
npm run db:setup

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Docker

```bash
# App + PostgreSQL (produção local)
docker compose up -d --build

# Ou via npm
npm run docker:up
```

Guia completo: **[docs/DOCKER.md](docs/DOCKER.md)**

### Desenvolvimento local

| Papel | E-mail | Senha padrão (altere em produção) |
|-------|--------|-----------------------------------|
| Admin | admin@empresa.com | definida em `ADMIN_PASSWORD` no `.env` |
| Técnico | tecnico@empresa.com | definida em `TECNICO_PASSWORD` no `.env` |

Para produção, use senhas fortes nas variáveis de ambiente da Vercel.

## Estrutura

```
app/
  campo/          # Telas mobile para técnicos
  admin/          # Painel administrativo
  api/            # API routes
  login/          # Autenticação
components/
  camera/         # Captura de fotos
  pdf/            # Templates PDF
  ui/             # Componentes de interface
lib/              # Utilitários, auth, storage
prisma/           # Schema e seed do banco
```

## Deploy em produção

**Guia completo:** **[docs/VERCEL.md](docs/VERCEL.md)** (Vercel + Supabase, passo a passo)

Resumo:
1. Crie projeto no [Supabase](https://supabase.com) (banco + bucket `relatorio-fotos`)
2. Rode `npx prisma db push` e `npm run db:seed` com as credenciais no `.env`
3. Importe o repositório na [Vercel](https://vercel.com) e configure as variáveis de ambiente
4. Acesse o app, configure empresa em **Admin → Configurações**

Detalhes do Supabase: **[docs/SUPABASE.md](docs/SUPABASE.md)**

### Gestão de usuários

Admin → **Usuários** — criar/editar técnicos e administradores, alterar senhas.

### Personalizar empresa

Cadastre e edite em **Admin → Configurações** — razão social, CNPJ, endereço, telefone, e-mail e logo.

Sem Supabase, as fotos ficam em `public/uploads/` localmente.

## Fluxo do Técnico

1. Login → Home
2. Novo Relatório → Seleciona cliente
3. Adiciona serviços do catálogo
4. Tira foto ANTES e DEPOIS de cada serviço
5. Assina e finaliza
6. Baixa PDF ou envia por WhatsApp

## Fluxo do Admin

1. Configura dados da empresa
2. Cadastra clientes e catálogo de serviços com preços
3. Acompanha relatórios e orçamentos no dashboard
4. Aprova/recusa orçamentos
