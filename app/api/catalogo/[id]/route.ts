import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const servico = await prisma.catalogoServico.update({
      where: { id },
      data: {
        nome: data.nome,
        descricao: data.descricao || null,
        preco: parseFloat(data.preco) || 0,
        orientacaoFoto: data.orientacaoFoto,
        ativo: data.ativo ?? true,
      },
    });

    return NextResponse.json(servico);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.catalogoServico.update({
      where: { id },
      data: { ativo: false },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
