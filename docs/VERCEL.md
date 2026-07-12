# Deploy na Vercel + Supabase

Guia passo a passo para colocar o app em produção. Não é necessário experiência prévia.

---

## Visão geral

| Serviço | Função |
|---------|--------|
| **Vercel** | Hospeda o site (Next.js) |
| **Supabase** | Banco PostgreSQL + armazenamento de fotos |

---

## Parte 1 — Criar o banco no Supabase

### 1.1 Criar conta e projeto

1. Acesse [supabase.com](https://supabase.com) e crie uma conta (pode usar GitHub)
2. Clique em **New project**
3. Escolha um nome (ex.: `relatorio-gpm`)
4. Defina uma **senha forte** para o banco — **anote em local seguro**
5. Região: **South America (São Paulo)** se disponível
6. Aguarde o projeto ficar pronto (~2 min)
    
### 1.2 Copiar credenciais do banco

No painel novo do Supabase, as strings de conexão **não** ficam em Settings → Database. Siga assim:

1. Abra o projeto (ex.: **Relatorio-GPM**)
2. No topo da página, clique no botão verde **Connect**
3. Escolha **ORMs** ou **App Frameworks** (qualquer um mostra as strings)
4. Copie estas duas:

| String | Porta | Variável no `.env` |
|--------|-------|-------------------|
| **Transaction pooler** (ou *Transaction mode*) | **6543** | `DATABASE_URL` |
| **Session pooler** (ou *Session mode*) | **5432** | `DIRECT_URL` (opcional) |

5. Troque `[YOUR-PASSWORD]` pela **senha do banco** que você definiu ao criar o projeto

**Se esqueceu a senha:** Settings (engrenagem) → **Database** (menu lateral) → **Reset database password**

**Seu Project ID** (Settings → General): `pvxmcaasiijltwcbquyp`  
Host do pooler (copie exatamente do painel **Connect** — pode ser `aws-1-sa-east-1`):

Exemplo (substitua `SUA_SENHA` pela senha do banco):
```env
DATABASE_URL="postgresql://postgres.pvxmcaasiijltwcbquyp:SUA_SENHA@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.pvxmcaasiijltwcbquyp:SUA_SENHA@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
```

> **Ignore** os passos do painel `npm install prisma` e `npx prisma init` — o projeto **já tem** Prisma configurado.  
> **Ignore** `supabase link` e Agent Skills — não são necessários.  
> Basta colar as URLs no `.env` e rodar `npx prisma db push`.

### 1.3 Copiar chaves da API

1. Settings (engrenagem no canto inferior esquerdo)
2. Menu **Configuration** → **API Keys**

| Variável | Onde copiar |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Project URL** (ex.: `https://pvxmcaasiijltwcbquyp.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave **anon** / **public** |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave **service_role** (secret — não exponha no front) |

### 1.4 Criar bucket de fotos

1. No menu lateral: **Storage** → **New bucket**
2. Nome: `relatorio-fotos`
3. **Public bucket**: ativado (fotos aparecem no PDF)
4. Clique em **Create bucket**

---

## Parte 2 — Preparar o banco (no seu computador)

### 2.1 Configurar `.env` local

Edite o `.env` na raiz do projeto (não precisa de `.env.local` — o Prisma lê `.env`):

```env
# Supabase — cole do painel Connect → ORMs → Prisma
DATABASE_URL="postgresql://postgres.pvxmcaasiijltwcbquyp:SUA_SENHA@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.pvxmcaasiijltwcbquyp:SUA_SENHA@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"

AUTH_SECRET="cole-uma-string-longa-aleatoria-aqui"
NEXT_PUBLIC_APP_URL="https://seu-app.vercel.app"

NEXT_PUBLIC_SUPABASE_URL="https://pvxmcaasiijltwcbquyp.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

ADMIN_EMAIL="gpmdesentupidora@gmail.com"
ADMIN_PASSWORD="sua-senha-forte"
ADMIN_NOME="Administrador"

TECNICO_EMAIL="tecnico@empresa.com"
TECNICO_PASSWORD="sua-senha-forte"
TECNICO_NOME="Técnico Campo"
```

O `prisma/schema.prisma` já está com `directUrl` — não precisa alterar.

**AUTH_SECRET:** gere com:
```bash
openssl rand -base64 32
```

**NEXT_PUBLIC_APP_URL:** por enquanto use um placeholder; depois do deploy na Vercel troque pela URL real (ex.: `https://relatorio-gpm.vercel.app`).

### 2.2 Criar tabelas e usuários iniciais

No terminal, na pasta do projeto:

```bash
npm install
npx prisma db push
npm run db:seed
```

Se aparecer "Seed concluído", o banco está pronto.

---

## Parte 3 — Deploy na Vercel

### 3.1 Enviar código para o GitHub

Se ainda não tiver repositório:

```bash
git add .
git commit -m "Preparar deploy produção"
git push origin main
```

### 3.2 Importar na Vercel

1. Acesse [vercel.com](https://vercel.com) e entre com GitHub
2. **Add New** → **Project**
3. Importe o repositório do projeto
4. Framework: **Next.js** (detectado automaticamente)
5. **Não clique em Deploy ainda** — configure as variáveis primeiro

### 3.3 Variáveis de ambiente na Vercel

**Atalho:** na raiz do projeto existe `.env.vercel` (já preenchido com Supabase + auth). Na Vercel:

1. **Settings** → **Environment Variables** → **Import .env**
2. Selecione o arquivo `.env.vercel`
3. Marque **Production** (e **Preview** se quiser testar branches)
4. Confirme a importação

Ou adicione manualmente **todas** estas (Production):

| Nome | Valor |
|------|-------|
| `DATABASE_URL` | Transaction pooler — porta **6543**, com `?pgbouncer=true` |
| `DIRECT_URL` | Session pooler — porta **5432** (Prisma migrations/push) |
| `AUTH_SECRET` | Mesma string gerada com `openssl rand -base64 32` |
| `NEXT_PUBLIC_APP_URL` | `https://SEU-PROJETO.vercel.app` (placeholder até o 1º deploy) |
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave publishable / anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave secret / service_role |
| `ADMIN_EMAIL` | E-mail do admin |
| `ADMIN_PASSWORD` | Senha do admin |
| `ADMIN_NOME` | Nome do admin |
| `TECNICO_EMAIL` | E-mail do técnico |
| `TECNICO_PASSWORD` | Senha do técnico |
| `TECNICO_NOME` | Nome do técnico |

> **Não adicione** `RUN_DB_SETUP` na Vercel — isso é só para Docker. O banco já foi criado com `db push` + `seed`.

> Se a senha do banco tiver `/`, use `%2F` na URL (ex.: `z%2Fg5QCq...`).

Marque **Production** (e opcionalmente Preview) para cada variável.

### 3.4 Fazer o deploy

Clique em **Deploy** e aguarde o build (~2–5 min).

Quando terminar, acesse a URL gerada (ex.: `https://relatorio-gpm.vercel.app`).

### 3.5 Ajustar URL do app (se necessário)

Se você usou placeholder no `NEXT_PUBLIC_APP_URL`:

1. Vercel → projeto → **Settings** → **Environment Variables**
2. Edite `NEXT_PUBLIC_APP_URL` com a URL real
3. **Deployments** → último deploy → **Redeploy**

---

## Parte 4 — Configuração pós-deploy

Faça login como admin e configure:

1. **Admin → Configurações** — dados da empresa (razão social, CNPJ, logo)
2. **Admin → Catálogo** — serviços e preços
3. **Admin → Usuários** — confira técnicos e altere senhas se necessário

---

## Checklist de teste em produção

- [ ] Login admin e técnico funcionam
- [ ] Criar cliente
- [ ] Criar orçamento e gerar PDF
- [ ] Criar relatório, tirar foto, finalizar
- [ ] Fotos aparecem no PDF
- [ ] Enviar link de assinatura pelo WhatsApp
- [ ] Cliente abre link `/assinar/...` e assina
- [ ] Instalar PWA no celular (menu do navegador → Adicionar à tela inicial)

---

## Problemas comuns

### Login não persiste / volta para tela de login

- Confirme `NEXT_PUBLIC_APP_URL` com `https://` (sem barra no final)
- Faça redeploy após alterar a variável

### Erro ao criar relatório / upload de foto

- Verifique se o bucket `relatorio-fotos` existe e é **público**
- Confirme `SUPABASE_SERVICE_ROLE_KEY` na Vercel

### Erro de banco / Prisma

- Confirme `DATABASE_URL` com porta **6543** e `?pgbouncer=true`
- Rode `npx prisma db push` localmente com a mesma `DATABASE_URL`

### PDF sem fotos

- Bucket deve ser público
- Fotos novas vão para o Supabase; fotos antigas de teste local não existem na nuvem

---

## Atualizar o app depois

Cada `git push` na branch principal dispara deploy automático na Vercel.

Se mudar o schema do banco (`prisma/schema.prisma`):

```bash
npx prisma db push
```

Rode localmente com `DATABASE_URL` apontando para o Supabase de produção.
