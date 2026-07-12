# Docker

## Opção 1 — Tudo no Docker (app + banco)

```bash
cp .env.docker.example .env.docker   # primeira vez — edite senhas
docker compose up -d --build
# ou com sudo:
sudo docker compose up -d --build
```

Acesse: [http://localhost:3000](http://localhost:3000)

Na primeira execução, o container aplica o schema (`prisma db push`) e roda o seed automaticamente (`RUN_DB_SETUP=true`).

### Variáveis de ambiente

O `docker-compose.yml` **não** contém usuário/senha do banco. Tudo fica em `.env.docker`:

```bash
cp .env.docker.example .env.docker
# Edite POSTGRES_PASSWORD, AUTH_SECRET e senhas dos usuários
docker compose up -d --build
```

| Variável | Descrição |
|----------|-----------|
| `POSTGRES_USER` | Usuário do PostgreSQL no container |
| `POSTGRES_PASSWORD` | Senha do PostgreSQL (**obrigatória**) |
| `POSTGRES_DB` | Nome do banco |
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

(Use os mesmos valores definidos no `.env.docker`.)

---

## Opção 2 — Só PostgreSQL no Docker (desenvolvimento)

```bash
docker compose -f docker-compose.dev.yml up -d
npm run db:local
npm run dev
```

Use o `.env` local com a mesma senha do `.env.docker`:

```
DATABASE_URL="postgresql://SEU_USER:SUA_SENHA@localhost:5432/SEU_BANCO"
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

## Teste no celular (rede de casa)

### 1. Subir banco + app

**Terminal 1 — PostgreSQL (se não tiver Postgres local):**
```bash
npm run docker:dev
```

**Terminal 2 — app acessível na rede:**
```bash
npm run dev:lan
```

O terminal deve mostrar:
```
Network: http://192.168.x.x:3000
```

### 2. `.env` — use o IP do notebook

```bash
hostname -I   # primeiro IP, ex.: 192.168.1.25
```

```env
NEXT_PUBLIC_APP_URL=http://192.168.1.25:3000
```

Reinicie o `npm run dev:lan` após alterar o `.env`.

### 3. No celular

- Mesmo **Wi‑Fi** do notebook (não use 4G/5G)
- Abra **`http://192.168.1.25:3000`** (com `http`, sem `s`)
- Se pedir login: `tecnico@empresa.com` / `tecnico123`

### 4. Se não abrir no celular

| Sintoma | O que fazer |
|---------|-------------|
| Timeout / não carrega | Router com **AP isolation** — celular não enxerga o PC. Desative em configurações do Wi‑Fi ou use Tailscale (abaixo) |
| Só funciona no PC | Confirme firewall: `sudo ufw allow 3000` |
| Página abre, login falha | Postgres parado — rode `npm run docker:dev` |
| Câmera não abre | Normal em HTTP — use Tailscale ou túnel HTTPS (abaixo) |

### 5. Alternativa: Tailscale (funciona fora de casa)

Seu notebook já tem IP Tailscale (`100.x.x.x` no `hostname -I`):

1. Instale [Tailscale](https://tailscale.com) no celular e entre na mesma conta
2. No celular abra: `http://100.x.x.x:3000` (seu IP Tailscale)
3. Atualize `NEXT_PUBLIC_APP_URL` com esse IP

### 6. HTTPS rápido (câmera no celular)

```bash
npm run dev:lan
# outro terminal:
npx cloudflared tunnel --url http://localhost:3000
```

Use a URL `https://....trycloudflare.com` no celular e em `NEXT_PUBLIC_APP_URL`.

---

## Produção

1. Defina `AUTH_SECRET` forte e `NEXT_PUBLIC_APP_URL` com o domínio real
2. Use `RUN_DB_SETUP=false` após o primeiro deploy (evita re-seed)
3. Configure backup do volume `postgres_data` e `uploads_data`
4. Para Supabase em produção, remova o serviço `db` e aponte `DATABASE_URL` externo
