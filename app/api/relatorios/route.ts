import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function getNextNumero() {
  const last = await prisma.relatorio.findFirst({
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return (last?.numero ?? 0) + 1;
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";

  const relatorios = await prisma.relatorio.findMany({
    where: mine && session.role === "TECNICO" ? { tecnicoId: session.id } : undefined,
    include: {
      cliente: true,
      tecnico: { select: { nome: true } },
      itens: { include: { servico: true, fotos: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(relatorios);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = await request.json().catch(() => ({}));

  const relatorio = await prisma.relatorio.create({
    data: {
      numero: await getNextNumero(),
      clienteId: data.clienteId || null,
      tecnicoId: session.id,
      enderecoServico: data.enderecoServico || null,
      observacoes: data.observacoes || null,
    },
    include: { cliente: true },
  });

  return NextResponse.json(relatorio, { status: 201 });
}
