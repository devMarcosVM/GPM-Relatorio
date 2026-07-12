import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { calcOrcamentoTotal } from "@/lib/orcamento";
import {
  endOfMonth,
  parseDateEnd,
  parseDateStart,
  startOfMonth,
} from "@/lib/adminFilters";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam ? parseDateStart(fromParam) : startOfMonth();
  const to = toParam ? parseDateEnd(toParam) : endOfMonth(new Date());

  const [relatorios, orcamentos, novosClientes, recentRelatorios, recentOrcamentos] =
    await Promise.all([
      prisma.relatorio.findMany({
        where: {
          status: "FINALIZADO",
          dataFim: { gte: from, lte: to },
        },
        include: { itens: true, cliente: { select: { nome: true } } },
        orderBy: { dataFim: "desc" },
      }),
      prisma.orcamento.findMany({
        where: {
          createdAt: { gte: from, lte: to },
        },
        include: { itens: true, cliente: { select: { nome: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cliente.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      prisma.relatorio.findMany({
        where: { dataInicio: { gte: from, lte: to } },
        include: { cliente: { select: { nome: true } } },
        orderBy: { dataInicio: "desc" },
        take: 5,
      }),
      prisma.orcamento.findMany({
        where: { createdAt: { gte: from, lte: to } },
        include: {
          cliente: { select: { nome: true } },
          itens: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const servicosRealizados = relatorios.reduce(
    (sum, r) => sum + r.itens.length,
    0
  );

  const orcamentosAprovados = orcamentos.filter((o) => o.status === "APROVADO");
  const receitaAprovada = orcamentosAprovados.reduce(
    (sum, o) => sum + calcOrcamentoTotal(o.itens, o.desconto, o.valorFinal),
    0
  );
  const receitaPotencial = orcamentos
    .filter((o) => o.status === "PENDENTE")
    .reduce(
      (sum, o) => sum + calcOrcamentoTotal(o.itens, o.desconto, o.valorFinal),
      0
    );

  return NextResponse.json({
    periodo: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    relatoriosFinalizados: relatorios.length,
    servicosRealizados,
    orcamentosTotal: orcamentos.length,
    orcamentosAprovados: orcamentosAprovados.length,
    orcamentosPendentes: orcamentos.filter((o) => o.status === "PENDENTE").length,
    receitaAprovada,
    receitaPotencial,
    novosClientes,
    recentRelatorios: recentRelatorios.map((r) => ({
      id: r.id,
      numero: r.numero,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      dataInicio: r.dataInicio.toISOString(),
      cliente: r.cliente,
    })),
    recentOrcamentos: recentOrcamentos.map((o) => ({
      id: o.id,
      numero: o.numero,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      cliente: o.cliente,
      total: calcOrcamentoTotal(o.itens, o.desconto, o.valorFinal),
    })),
  });
}
