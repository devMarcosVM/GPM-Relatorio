# PostgreSQL local + pgAdmin

Guia para usar PostgreSQL no seu computador e visualizar os dados no pgAdmin.

## 1. Iniciar o PostgreSQL

No terminal:

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql   # opcional: iniciar com o sistema
```

Verifique se está rodando:

```bash
systemctl status postgresql
```

## 2. Criar banco e usuário

Entre no PostgreSQL como superusuário:

```bash
sudo -u postgres psql
```

Dentro do `psql`, execute:

```sql
CREATE USER relatorio WITH PASSWORD 'relatorio123';
CREATE DATABASE relatorio OWNER relatorio;
GRANT ALL PRIVILEGES ON DATABASE relatorio TO relatorio;
\q
```

> Troque `relatorio123` por uma senha que você preferir.

## 3. Configurar o `.env` do projeto

Edite o arquivo `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://relatorio:relatorio123@localhost:5432/relatorio"
AUTH_SECRET="dev-secret-change-in-production"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Formato da URL:

```
postgresql://USUARIO:SENHA@localhost:5432/NOME_DO_BANCO
```

## 4. Migrar a aplicação para PostgreSQL

Na pasta do projeto:

```bash
npm run db:postgres
npx prisma db push
npm run db:seed
npm run dev
```

Isso:
- altera o Prisma de SQLite para PostgreSQL
- cria todas as tabelas no banco `relatorio`
- insere usuários demo e catálogo de serviços

## 5. Conectar no pgAdmin

1. Abra o **pgAdmin**
2. Clique com botão direito em **Servers → Register → Server**
3. Aba **General**: Name = `Relatório Local`
4. Aba **Connection**:
   - **Host**: `localhost`
   - **Port**: `5432`
   - **Maintenance database**: `relatorio`
   - **Username**: `relatorio`
   - **Password**: `relatorio123` (a que você definiu)
5. Salve

Depois navegue:

```
Servers → Relatório Local → Databases → relatorio → Schemas → public → Tables
```

Tabelas que você verá:

| Tabela | Conteúdo |
|--------|----------|
| `User` | Usuários (admin, técnicos) |
| `Empresa` | Dados da empresa |
| `Cliente` | Clientes |
| `CatalogoServico` | Tipos de serviço |
| `Relatorio` | Relatórios de serviço |
| `RelatorioItem` | Itens de cada relatório |
| `Foto` | Fotos antes/depois |
| `Orcamento` | Orçamentos |
| `OrcamentoItem` | Itens do orçamento |

## 6. Dados da empresa

Cadastre em **Admin → Configurações** na aplicação (`http://localhost:3000`).
Os dados aparecerão na tabela `Empresa` no pgAdmin.

---

## Voltar para SQLite (opcional)

Se quiser voltar ao banco em arquivo:

```env
DATABASE_URL="file:./dev.db"
```

```bash
npm run db:sqlite
npm run db:setup
```

---

## Problemas comuns

### `connection refused`
PostgreSQL não está rodando → `sudo systemctl start postgresql`

### `password authentication failed`
Usuário ou senha errados no `.env` — confira com o que criou no passo 2.

### `database "relatorio" does not exist`
Rode o `CREATE DATABASE relatorio` do passo 2.

### Tabelas vazias após migrar
Rode `npm run db:seed` e use a aplicação normalmente.

---

## Supabase (produção na nuvem)

Para deploy com Supabase, use [docs/SUPABASE.md](./SUPABASE.md). Lá a URL usa pooler e pode exigir `directUrl` — diferente do PostgreSQL local.
