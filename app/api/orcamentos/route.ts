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

    if (!data.clienteId || !Array.isArray(data.itens) || data.itens.length === 0) {
      return NextResponse.json(
        { error: "Cliente e pelo menos um serviço são obrigatórios" },
        { status: 400 }
      );
    }

    const servicoIds = data.itens.map(
      (item: { servicoId: string }) => item.servicoId
    );
    const servicos = await prisma.catalogoServico.findMany({
      where: { id: { in: servicoIds } },
      select: { id: true, unidade: true },
    });
    const unidadePorServico = new Map(
      servicos.map((servico) => [servico.id, normalizeUnidade(servico.unidade)])
    );

    const orcamento = await prisma.orcamento.create({
      data: {
        numero: await getNextNumero(),
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
        tokenAssinatura: generateAssinaturaToken(),
        tokenAssinaturaExpira: getAssinaturaExpiry(),
        itens: {
          create: data.itens.map(
            (item: {
              servicoId: string;
              quantidade: number;
              precoUnitario: number;
            }) => ({
              servicoId: item.servicoId,
              quantidade: clampQuantidade(
                Number(item.quantidade) || 1,
                unidadePorServico.get(item.servicoId) || "UNIDADE"
              ),
              precoUnitario: item.precoUnitario,
            })
          ),
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
