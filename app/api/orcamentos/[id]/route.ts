import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const orcamento = await prisma.orcamento.findUnique({
    where: { id },
    include: {
      cliente: true,
      criadoPor: { select: { nome: true } },
      itens: { include: { servico: true } },
    },
  });

  if (!orcamento) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  return NextResponse.json(orcamento);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const orcamento = await prisma.orcamento.update({
      where: { id },
      data: { status: data.status },
      include: {
        cliente: true,
        itens: { include: { servico: true } },
      },
    });

    return NextResponse.json(orcamento);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
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
  await prisma.orcamento.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
