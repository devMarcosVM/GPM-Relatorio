# Docker

## Opção 1 — Tudo no Docker (app + banco)

```bash
# Subir app + PostgreSQL
docker compose up -d --build

# Ver logs
docker compose logs -f app
```

Acesse: [http://localhost:3000](http://localhost:3000)

Na primeira execução, o container aplica o schema (`prisma db push`) e roda o seed automaticamente (`RUN_DB_SETUP=true`).

### Usuários demo

| Papel   | E-mail              | Senha      |
|---------|---------------------|------------|
| Admin   | admin@empresa.com   | admin123   |
| Técnico | tecnico@empresa.com | tecnico123 |

### Variáveis de ambiente

Copie `.env.docker.example` e passe no compose:

```bash
cp .env.docker.example .env.docker
docker compose --env-file .env.docker up -d --build
```

| Variável | Descrição |
|----------|-----------|
| `AUTH_SECRET` | Segredo JWT (obrigatório em produção) |
| `NEXT_PUBLIC_APP_URL` | URL pública do app |
| `RUN_DB_SETUP` | `true` roda migrate + seed ao iniciar |
| `ADMIN_*` / `TECNICO_*` | Credenciais do seed |

### Parar

```bash
docker compose down
```

Dados persistem nos volumes `postgres_data` e `uploads_data`.

### Porta 5432 em uso

Se você roda **só PostgreSQL** no Docker (`docker-compose.dev.yml`) ou tem Postgres instalado na máquina, a porta 5432 fica ocupada. No stack completo (`docker-compose.yml`) o banco **não expõe** a 5432 no host — só o app na 3000.

Para inspecionar o banco do stack completo:

```bash
docker compose exec db psql -U relatorio -d relatorio
```

---

## Opção 2 — Só PostgreSQL no Docker (desenvolvimento)

```bash
docker compose -f docker-compose.dev.yml up -d
npm run db:local
npm run dev
```

Use o `.env` local com:

```
DATABASE_URL="postgresql://relatorio:relatorio123@localhost:5432/relatorio"
```

---

## Comandos npm

```bash
npm run docker:up      # compose up -d --build
npm run docker:down    # compose down
npm run docker:logs    # logs do app
npm run docker:dev     # só PostgreSQL
```

---

## Produção

1. Defina `AUTH_SECRET` forte e `NEXT_PUBLIC_APP_URL` com o domínio real
2. Use `RUN_DB_SETUP=false` após o primeiro deploy (evita re-seed)
3. Configure backup do volume `postgres_data` e `uploads_data`
4. Para Supabase em produção, remova o serviço `db` e aponte `DATABASE_URL` externo
