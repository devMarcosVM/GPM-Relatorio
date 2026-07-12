# Configuração Supabase (Produção)

Este guia conecta o app ao **PostgreSQL** e **Storage** do Supabase.

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Anote a **URL do projeto** e as **API keys**

## 2. Obter strings de conexão do banco

No painel Supabase: **Project Settings → Database**

| Variável | Onde encontrar |
|----------|----------------|
| `DATABASE_URL` | Connection string → **URI** (modo Transaction, porta 6543) |
| `DIRECT_URL` | Connection string → **URI** (modo Session, porta 5432) |

Exemplo:
```env
DATABASE_URL="postgresql://postgres.xxxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxxx:[SENHA]@aws-0-sa-east-1.pooler.supabase.com:5432/postgres"
```

## 3. Criar bucket de fotos

No Supabase: **Storage → New bucket**

- Nome: `relatorio-fotos`
- Public bucket: **Sim** (fotos precisam aparecer no PDF)

## 4. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```env
# Auth
AUTH_SECRET="gere-uma-string-aleatoria-longa"
NEXT_PUBLIC_APP_URL="https://seu-app.vercel.app"

# Supabase Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."

# Dados da empresa (opcional — também editável no admin)
EMPRESA_RAZAO_SOCIAL="Nome da Empresa Ltda"
EMPRESA_CNPJ="00.000.000/0001-00"
EMPRESA_ENDERECO="Endereço completo"
EMPRESA_TELEFONE="(11) 99999-0000"
EMPRESA_EMAIL="contato@empresa.com.br"
EMPRESA_LOGO_URL="https://..."
```

## 5. Alternar schema para PostgreSQL

```bash
npm run db:postgres
npx prisma db push
npm run db:seed
```

Para voltar ao SQLite local:
```bash
npm run db:sqlite
npm run db:setup
```

## 6. Deploy na Vercel

1. Conecte o repositório GitHub à Vercel
2. Em **Settings → Environment Variables**, adicione todas as variáveis acima
3. O build roda `prisma generate` automaticamente (via `postinstall`)
4. **Importante:** rode `npx prisma db push` uma vez contra o Supabase antes do primeiro deploy, ou adicione ao build:

```json
"build": "prisma generate && prisma db push && next build"
```

(Recomendado apenas no primeiro deploy; depois use migrations.)

## 7. Checklist pós-deploy

- [ ] Login admin funciona
- [ ] Criar relatório e tirar foto (upload no Supabase Storage)
- [ ] PDF gerado com fotos visíveis
- [ ] Trocar senhas padrão em **Admin → Usuários**
- [ ] Preencher dados reais em **Admin → Configurações**

## Desenvolvimento local vs produção

| Ambiente | Banco | Fotos |
|----------|-------|-------|
| Local (padrão) | SQLite `prisma/dev.db` | `public/uploads/` |
| Produção | Supabase PostgreSQL | Supabase Storage |

Você pode usar Supabase também no dev local — basta configurar o `.env` e rodar `npm run db:postgres`.
