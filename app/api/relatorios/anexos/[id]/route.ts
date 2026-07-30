import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { relatorioAcessoNegado } from "@/lib/relatorioAccess";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const anexo = await prisma.relatorioAnexo.findUnique({
    where: { id },
    include: {
      relatorio: { select: { id: true, status: true, tecnicoId: true } },
    },
  });

  if (!anexo) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (relatorioAcessoNegado(session, anexo.relatorio)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await prisma.relatorioAnexo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
