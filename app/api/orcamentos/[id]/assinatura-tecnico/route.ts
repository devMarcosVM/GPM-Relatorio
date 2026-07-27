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

  try {
    const { id } = await params;
    const data = await request.json();
    const assinaturaTecnico = data.assinaturaTecnico;

    if (!assinaturaTecnico || typeof assinaturaTecnico !== "string") {
      return NextResponse.json(
        { error: "Assinatura obrigatória" },
        { status: 400 }
      );
    }

    if (!assinaturaTecnico.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Assinatura inválida" },
        { status: 400 }
      );
    }

    const existing = await prisma.orcamento.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (
      session.role === "TECNICO" &&
      existing.criadoPorId !== session.id
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (existing.status === "RASCUNHO") {
      return NextResponse.json(
        { error: "Finalize o orçamento antes de assinar" },
        { status: 400 }
      );
    }

    const orcamento = await prisma.orcamento.update({
      where: { id },
      data: { assinaturaTecnico },
      include: {
        cliente: true,
        criadoPor: { select: { nome: true } },
        itens: { include: { servico: true } },
      },
    });

    return NextResponse.json(orcamento);
  } catch (error) {
    console.error("Erro ao salvar assinatura do técnico:", error);
    return NextResponse.json(
      { error: "Erro ao salvar assinatura" },
      { status: 500 }
    );
  }
}
