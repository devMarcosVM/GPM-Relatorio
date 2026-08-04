import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  loadRelatorioAccess,
  relatorioAcessoNegado,
  relatorioFinalizado,
} from "@/lib/relatorioAccess";

const relatorioInclude = {
  cliente: true,
  tecnico: { select: { id: true, nome: true, email: true } },
  anexos: { orderBy: { createdAt: "asc" as const } },
  itens: {
    include: { servico: true, fotos: true },
    orderBy: { ordem: "asc" as const },
  },
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  const relatorio = await prisma.relatorio.findUnique({
    where: { id },
    include: relatorioInclude,
  });

  if (!relatorio) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (session.role === "TECNICO" && relatorio.tecnico.id !== session.id) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  return NextResponse.json(relatorio);
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
  const access = await loadRelatorioAccess(id);
  if (!access) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (relatorioAcessoNegado(session, access)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  const data = await request.json();
  if (relatorioFinalizado(access)) {
    return NextResponse.json(
      { error: "Relatório finalizado não pode ser editado" },
      { status: 400 }
    );
  }

  const updateData: Record<string, unknown> = {};
  if (data.enderecoServico !== undefined) {
    updateData.enderecoServico = data.enderecoServico || null;
  }
  if (data.observacoes !== undefined) {
    updateData.observacoes = data.observacoes || null;
  }
  if (data.assinaturaTecnico !== undefined) {
    updateData.assinaturaTecnico = data.assinaturaTecnico;
  }
  if (data.assinaturaCliente !== undefined) {
    updateData.assinaturaCliente = data.assinaturaCliente;
  }
  if (data.clienteId !== undefined) {
    updateData.clienteId = data.clienteId || null;
  }

  if (data.tecnicoId !== undefined) {
    if (session.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Apenas admin pode alterar o técnico responsável" },
        { status: 403 }
      );
    }
    if (!data.tecnicoId || typeof data.tecnicoId !== "string") {
      return NextResponse.json(
        { error: "Técnico responsável inválido" },
        { status: 400 }
      );
    }
    const tecnico = await prisma.user.findUnique({
      where: { id: data.tecnicoId },
      select: { id: true, role: true },
    });
    if (!tecnico || (tecnico.role !== "TECNICO" && tecnico.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "Usuário não encontrado ou sem permissão para ser responsável" },
        { status: 400 }
      );
    }
    updateData.tecnicoId = tecnico.id;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Nada para atualizar" }, { status: 400 });
  }

  const relatorio = await prisma.relatorio.update({
    where: { id },
    data: updateData,
    include: relatorioInclude,
  });

  return NextResponse.json(relatorio);
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

  const access = await loadRelatorioAccess(id);
  if (!access) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }
  if (relatorioAcessoNegado(session, access)) {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
  }

  await prisma.relatorio.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
