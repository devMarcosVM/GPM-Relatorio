import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  relatorioAcessoNegado,
  relatorioFinalizado,
} from "@/lib/relatorioAccess";

async function loadItemRelatorio(itemId: string) {
  return prisma.relatorioItem.findUnique({
    where: { id: itemId },
    include: {
      relatorio: { select: { id: true, status: true, tecnicoId: true } },
    },
  });
}

async function assertItemEditavel(
  itemId: string,
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>
) {
  const row = await loadItemRelatorio(itemId);
  if (!row) {
    return { response: NextResponse.json({ error: "Não encontrado" }, { status: 404 }) };
  }
  if (relatorioAcessoNegado(session, row.relatorio)) {
    return { response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }) };
  }
  if (relatorioFinalizado(row.relatorio)) {
    return {
      response: NextResponse.json(
        { error: "Relatório finalizado não pode ser editado" },
        { status: 400 }
      ),
    };
  }
  return { row };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const check = await assertItemEditavel(id, session);
  if ("response" in check && check.response) return check.response;

  const data = await request.json();

  const item = await prisma.relatorioItem.update({
    where: { id },
    data: { observacoes: data.observacoes },
    include: { servico: true, fotos: true },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const check = await assertItemEditavel(id, session);
  if ("response" in check && check.response) return check.response;

  await prisma.relatorioItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
