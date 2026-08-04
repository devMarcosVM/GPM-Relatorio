import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  loadRelatorioAccess,
  relatorioAcessoNegado,
} from "@/lib/relatorioAccess";
import { getNextNumeroRelatorio } from "@/lib/relatorioNumero";

const relatorioInclude = {
  cliente: true,
  tecnico: { select: { id: true, nome: true, email: true } },
  anexos: { orderBy: { createdAt: "asc" as const } },
  itens: {
    include: { servico: true, fotos: true },
    orderBy: { ordem: "asc" as const },
  },
};

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const access = await loadRelatorioAccess(id);
  if (!access) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (relatorioAcessoNegado(session, access)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const origem = await prisma.relatorio.findUnique({
    where: { id },
    include: {
      anexos: true,
      itens: {
        include: { fotos: true },
        orderBy: { ordem: "asc" },
      },
    },
  });

  if (!origem) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const numero = await getNextNumeroRelatorio();

  const novo = await prisma.$transaction(async (tx) => {
    const relatorio = await tx.relatorio.create({
      data: {
        numero,
        status: "RASCUNHO",
        clienteId: origem.clienteId,
        tecnicoId: session.id,
        enderecoServico: origem.enderecoServico,
        observacoes: origem.observacoes,
        itens: {
          create: origem.itens.map((item) => ({
            servicoId: item.servicoId,
            observacoes: item.observacoes,
            ordem: item.ordem,
            fotos: {
              create: item.fotos.map((foto) => ({
                tipo: foto.tipo,
                url: foto.url,
                orientacao: foto.orientacao,
              })),
            },
          })),
        },
        anexos: {
          create: origem.anexos.map((anexo) => ({
            url: anexo.url,
          })),
        },
      },
      include: relatorioInclude,
    });

    return relatorio;
  });

  return NextResponse.json(novo, { status: 201 });
}
