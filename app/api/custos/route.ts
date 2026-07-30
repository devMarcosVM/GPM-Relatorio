import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const custos = await prisma.custo.findMany({
    where: session.role === "TECNICO" ? { criadoPorId: session.id } : undefined,
    include: {
      criadoPor: { select: { id: true, nome: true, role: true } },
    },
    orderBy: [{ data: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(custos);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = await request.json();
  const descricao = String(data.descricao || "").trim();
  const valor = Number(data.valor);
  const dataCusto = data.data
    ? new Date(`${String(data.data)}T12:00:00`)
    : new Date();

  if (!descricao) {
    return NextResponse.json(
      { error: "Informe a descrição do custo" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(valor) || valor < 0) {
    return NextResponse.json(
      { error: "Informe um valor válido" },
      { status: 400 }
    );
  }
  if (Number.isNaN(dataCusto.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  const custo = await prisma.custo.create({
    data: {
      descricao,
      valor,
      data: dataCusto,
      criadoPorId: session.id,
    },
    include: {
      criadoPor: { select: { id: true, nome: true, role: true } },
    },
  });

  return NextResponse.json(custo, { status: 201 });
}
