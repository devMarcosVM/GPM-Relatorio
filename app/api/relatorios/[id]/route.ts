import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

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
    include: {
      cliente: true,
      tecnico: { select: { id: true, nome: true, email: true } },
      itens: {
        include: { servico: true, fotos: true },
        orderBy: { ordem: "asc" },
      },
    },
  });

  if (!relatorio) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
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
  const data = await request.json();

  const updateData: Record<string, unknown> = {};
  if (data.enderecoServico !== undefined) updateData.enderecoServico = data.enderecoServico || null;
  if (data.observacoes !== undefined) updateData.observacoes = data.observacoes || null;
  if (data.assinaturaTecnico !== undefined) updateData.assinaturaTecnico = data.assinaturaTecnico;
  if (data.assinaturaCliente !== undefined) updateData.assinaturaCliente = data.assinaturaCliente;
  if (data.clienteId !== undefined) updateData.clienteId = data.clienteId || null;

  const relatorio = await prisma.relatorio.update({
    where: { id },
    data: updateData,
    include: {
      cliente: true,
      itens: { include: { servico: true, fotos: true } },
    },
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
  await prisma.relatorio.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
