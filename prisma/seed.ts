import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function env(key: string, fallback: string) {
  return process.env[key]?.trim() || fallback;
}

async function main() {
  const adminEmail = env("ADMIN_EMAIL", "admin@empresa.com");
  const adminPassword = env("ADMIN_PASSWORD", "admin123");
  const adminNome = env("ADMIN_NOME", "Administrador");

  const tecnicoEmail = env("TECNICO_EMAIL", "tecnico@empresa.com");
  const tecnicoPassword = env("TECNICO_PASSWORD", "tecnico123");
  const tecnicoNome = env("TECNICO_NOME", "João Técnico");

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      nome: adminNome,
      password: await bcrypt.hash(adminPassword, 10),
    },
    create: {
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 10),
      nome: adminNome,
      role: "ADMIN",
    },
  });

  const tecnico = await prisma.user.upsert({
    where: { email: tecnicoEmail },
    update: {
      nome: tecnicoNome,
      password: await bcrypt.hash(tecnicoPassword, 10),
    },
    create: {
      email: tecnicoEmail,
      password: await bcrypt.hash(tecnicoPassword, 10),
      nome: tecnicoNome,
      role: "TECNICO",
    },
  });

  // Dados da empresa são cadastrados pelo admin em: Admin → Configurações

  const servicos = [
    { nome: "Limpeza de Caixa de Gordura", preco: 350, orientacaoFoto: "VERTICAL" },
    { nome: "Limpeza de Fossa Séptica", preco: 800, orientacaoFoto: "VERTICAL" },
    { nome: "Limpeza de Caixa de Sabão", preco: 300, orientacaoFoto: "VERTICAL" },
    { nome: "Desentupimento de Ralo/Pia", preco: 200, orientacaoFoto: "HORIZONTAL" },
    { nome: "Jateamento de Tubulação", preco: 450, orientacaoFoto: "HORIZONTAL" },
    { nome: "Lavagem de Tubulação", preco: 120, orientacaoFoto: "HORIZONTAL", unidade: "METRO" },
    { nome: "Sucção de Resíduos", preco: 600, orientacaoFoto: "VERTICAL" },
    { nome: "Desentupimento Geral", preco: 250, orientacaoFoto: "HORIZONTAL" },
  ];

  for (const servico of servicos) {
    const existing = await prisma.catalogoServico.findFirst({
      where: { nome: servico.nome },
    });
    if (!existing) {
      await prisma.catalogoServico.create({ data: servico });
    }
  }

  console.log("Seed concluído.");
  console.log("Admin:", admin.email);
  console.log("Técnico:", tecnico.email);
  console.log("Configure a empresa em Admin → Configurações.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
