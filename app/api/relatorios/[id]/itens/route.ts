import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const data = await request.json();

  const count = await prisma.relatorioItem.count({ where: { relatorioId: id } });

  const item = await prisma.relatorioItem.create({
    data: {
      relatorioId: id,
      servicoId: data.servicoId,
      observacoes: data.observacoes || null,
      ordem: count,
    },
    include: { servico: true, fotos: true },
  });

  return NextResponse.json(item, { status: 201 });
}
