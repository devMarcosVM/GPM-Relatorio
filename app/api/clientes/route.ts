import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = await request.json();

  const cliente = await prisma.cliente.create({
    data: {
      nome: data.nome,
      documento: data.documento || null,
      telefone: data.telefone || null,
      email: data.email || null,
      endereco: data.endereco || null,
    },
  });

  return NextResponse.json(cliente, { status: 201 });
}
