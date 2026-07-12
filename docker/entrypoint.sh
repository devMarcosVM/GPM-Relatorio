#!/bin/sh
set -e

echo "==> Aguardando PostgreSQL e sincronizando schema..."
until prisma db push --schema=./prisma/schema.prisma --skip-generate 2>/dev/null; do
  echo "Banco indisponível, tentando novamente em 2s..."
  sleep 2
done

if [ "$RUN_DB_SETUP" = "true" ]; then
  echo "==> Executando seed..."
  tsx prisma/seed.ts
fi

echo "==> Iniciando aplicação..."
exec node server.js
