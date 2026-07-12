#!/usr/bin/env node
/**
 * Alterna o schema Prisma entre SQLite (dev) e PostgreSQL (Supabase/produção).
 * Uso: node scripts/switch-db.js sqlite | postgres
 */

const fs = require("fs");
const path = require("path");

const mode = process.argv[2];
const schemaDir = path.join(__dirname, "..", "prisma");
const target = path.join(schemaDir, "schema.prisma");

const configs = {
  sqlite: {
    source: null,
    content: `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
`,
  },
  postgres: {
    source: path.join(schemaDir, "schema.postgresql.prisma"),
    content: null,
  },
};

if (!configs[mode]) {
  console.error("Uso: node scripts/switch-db.js sqlite|postgres");
  process.exit(1);
}

const modelsStart = fs.readFileSync(
  configs.postgres.source || target,
  "utf8"
).indexOf("model User");

if (modelsStart === -1) {
  console.error("Não foi encontrado o bloco de models no schema.");
  process.exit(1);
}

const modelsBlock = fs
  .readFileSync(configs.postgres.source || target, "utf8")
  .slice(modelsStart);

let header;
if (mode === "postgres") {
  header = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

`;
} else {
  header = configs.sqlite.content;
}

fs.writeFileSync(target, header + modelsBlock);
console.log(`Schema alterado para: ${mode === "postgres" ? "PostgreSQL (Supabase)" : "SQLite (local)"}`);
console.log("Execute: npx prisma generate && npx prisma db push");
