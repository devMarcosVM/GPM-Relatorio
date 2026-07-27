import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateAssinaturaToken, getAssinaturaExpiry } from "@/lib/assinaturaLink";
import { clampQuantidade, normalizeUnidade } from "@/lib/unidade";

async function getNextNumero() {
  const last = await prisma.orcamento.findFirst({
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  return (last?.numero ?? 0) + 1;
}

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

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";

  const orcamentos = await prisma.orcamento.findMany({
    where: mine && session.role === "TECNICO" ? { criadoPorId: session.id } : undefined,
    include: {
      cliente: true,
      criadoPor: { select: { nome: true } },
      itens: { include: { servico: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orcamentos);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const rascunho = data.rascunho === true;
    const itens = Array.isArray(data.itens) ? data.itens : [];

    if (!data.clienteId) {
      return NextResponse.json(
        { error: "Selecione o cliente para salvar o orçamento" },
        { status: 400 }
      );
    }

    if (!rascunho && itens.length === 0) {
      return NextResponse.json(
        { error: "Adicione pelo menos um serviço para finalizar" },
        { status: 400 }
      );
    }

    const itensCreate =
      itens.length > 0 ? await mapItensComUnidade(itens) : [];

    const orcamento = await prisma.orcamento.create({
      data: {
        numero: await getNextNumero(),
        status: rascunho ? "RASCUNHO" : "PENDENTE",
        clienteId: data.clienteId,
        criadoPorId: session.id,
        desconto: data.desconto || 0,
        valorFinal:
          typeof data.valorFinal === "number" && data.valorFinal >= 0
            ? data.valorFinal
            : null,
        validadeDias: data.validadeDias || 15,
        formaPagamento: data.formaPagamento || null,
        observacoes: data.observacoes || null,
        tokenAssinatura: rascunho ? null : generateAssinaturaToken(),
        tokenAssinaturaExpira: rascunho ? null : getAssinaturaExpiry(),
        itens: {
          create: itensCreate,
        },
      },
      include: {
        cliente: true,
        itens: { include: { servico: true } },
      },
    });

    return NextResponse.json(orcamento, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar orçamento:", error);
    return NextResponse.json(
      { error: "Erro ao criar orçamento. Reinicie o servidor após atualizar o banco." },
      { status: 500 }
    );
  }
}
