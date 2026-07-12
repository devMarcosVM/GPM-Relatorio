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

  const { id } = await params;
  const data = await request.json();

  if (!data.clienteId) {
    return NextResponse.json(
      { error: "Selecione o cliente contratante para finalizar" },
      { status: 400 }
    );
  }

  const updateData: {
    status: string;
    dataFim: Date;
    clienteId: string;
    enderecoServico?: string;
    observacoes?: string;
    assinaturaTecnico?: string | null;
    assinaturaCliente?: string | null;
  } = {
    status: "FINALIZADO",
    dataFim: new Date(),
    clienteId: data.clienteId,
    enderecoServico: data.enderecoServico || undefined,
    observacoes: data.observacoes || undefined,
  };

  if ("assinaturaTecnico" in data) {
    updateData.assinaturaTecnico = data.assinaturaTecnico || null;
  }
  if ("assinaturaCliente" in data) {
    updateData.assinaturaCliente = data.assinaturaCliente || null;
  }

  const relatorio = await prisma.relatorio.update({
    where: { id },
    data: updateData,
    include: {
      cliente: true,
      tecnico: true,
      itens: { include: { servico: true, fotos: true } },
    },
  });

  return NextResponse.json(relatorio);
}
