import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  loadRelatorioAccess,
  relatorioAcessoNegado,
  relatorioFinalizado,
} from "@/lib/relatorioAccess";

async function assertRelatorioEditavel(relatorioId: string, session: NonNullable<Awaited<ReturnType<typeof getSession>>>) {
  const access = await loadRelatorioAccess(relatorioId);
  if (!access) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (relatorioAcessoNegado(session, access)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }
  if (relatorioFinalizado(access)) {
    return NextResponse.json(
      { error: "Relatório finalizado não pode ser editado" },
      { status: 400 }
    );
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const denied = await assertRelatorioEditavel(id, session);
  if (denied) return denied;

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
