import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { generateAssinaturaToken, getAssinaturaExpiry } from "@/lib/assinaturaLink";
import { clampQuantidade, normalizeUnidade } from "@/lib/unidade";

async function mapItensComUnidade(
  itens: Array<{ servicoId: string; quantidade: number; precoUnitario: number }>
) {
  const servicoIds = itens.map((item) => item.servicoId);
  const servicos = await prisma.catalogoServico.findMany({
    where: { id: { in: servicoIds } },
    select: { id: true, unidade: true },
  });
  const unidadePorServico = new Map(
    servicos.map((servico) => [servico.id, normalizeUnidade(servico.unidade)])
  );

  return itens.map((item) => ({
    servicoId: item.servicoId,
    quantidade: clampQuantidade(
      Number(item.quantidade) || 1,
      unidadePorServico.get(item.servicoId) || "UNIDADE"
    ),
    precoUnitario: item.precoUnitario,
  }));
}

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

  if (
    session.role === "TECNICO" &&
    orcamento.criadoPorId !== session.id
  ) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json(orcamento);
}

export async function PUT(
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
    const finalizar = data.finalizar === true;
    const rascunho = data.rascunho === true && !finalizar;

    const existing = await prisma.orcamento.findUnique({
      where: { id },
      include: { itens: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
    }

    if (
      session.role === "TECNICO" &&
      existing.criadoPorId !== session.id
    ) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    if (existing.status !== "RASCUNHO") {
      return NextResponse.json(
        { error: "Só é possível editar orçamentos em rascunho" },
        { status: 400 }
      );
    }

    if (existing.assinaturaCliente) {
      return NextResponse.json(
        { error: "Orçamento já assinado" },
        { status: 400 }
      );
    }

    const itens = Array.isArray(data.itens) ? data.itens : [];

    if (!data.clienteId) {
      return NextResponse.json(
        { error: "Selecione o cliente" },
        { status: 400 }
      );
    }

    if (finalizar && itens.length === 0) {
      return NextResponse.json(
        { error: "Adicione pelo menos um serviço para finalizar" },
        { status: 400 }
      );
    }

    const itensCreate =
      itens.length > 0 ? await mapItensComUnidade(itens) : [];

    await prisma.orcamentoItem.deleteMany({ where: { orcamentoId: id } });

    const orcamento = await prisma.orcamento.update({
      where: { id },
      data: {
        status: finalizar ? "PENDENTE" : "RASCUNHO",
        clienteId: data.clienteId,
        desconto: data.desconto || 0,
        valorFinal:
          typeof data.valorFinal === "number" && data.valorFinal >= 0
            ? data.valorFinal
            : null,
        validadeDias: data.validadeDias || 15,
        formaPagamento: data.formaPagamento || null,
        observacoes: data.observacoes || null,
        ...(finalizar
          ? {
              tokenAssinatura: existing.tokenAssinatura || generateAssinaturaToken(),
              tokenAssinaturaExpira:
                existing.tokenAssinaturaExpira || getAssinaturaExpiry(),
            }
          : rascunho
            ? {
                tokenAssinatura: null,
                tokenAssinaturaExpira: null,
              }
            : {}),
        itens: {
          create: itensCreate,
        },
      },
      include: {
        cliente: true,
        itens: { include: { servico: true } },
      },
    });

    return NextResponse.json(orcamento);
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar orçamento" },
      { status: 500 }
    );
  }
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

  await prisma.orcamento.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
