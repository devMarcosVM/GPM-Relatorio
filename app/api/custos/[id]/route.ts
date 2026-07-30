import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function loadAuthorized(id: string) {
  const session = await getSession();
  if (!session) {
    return {
      response: NextResponse.json(
        { error: "Não autenticado" },
        { status: 401 }
      ),
    };
  }

  const custo = await prisma.custo.findUnique({ where: { id } });
  if (!custo) {
    return {
      response: NextResponse.json(
        { error: "Custo não encontrado" },
        { status: 404 }
      ),
    };
  }

  if (session.role === "TECNICO" && custo.criadoPorId !== session.id) {
    return {
      response: NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      ),
    };
  }

  return { session, custo };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await loadAuthorized(id);
  if ("response" in access) return access.response;

  const data = await request.json();
  const descricao = String(data.descricao || "").trim();
  const valor = Number(data.valor);
  const dataCusto = new Date(`${String(data.data)}T12:00:00`);

  if (!descricao) {
    return NextResponse.json(
      { error: "Informe a descrição do custo" },
      { status: 400 }
    );
  }
  if (!Number.isFinite(valor) || valor < 0) {
    return NextResponse.json(
      { error: "Informe um valor válido" },
      { status: 400 }
    );
  }
  if (Number.isNaN(dataCusto.getTime())) {
    return NextResponse.json({ error: "Data inválida" }, { status: 400 });
  }

  const custo = await prisma.custo.update({
    where: { id },
    data: { descricao, valor, data: dataCusto },
    include: {
      criadoPor: { select: { id: true, nome: true, role: true } },
    },
  });

  return NextResponse.json(custo);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const access = await loadAuthorized(id);
  if ("response" in access) return access.response;

  await prisma.custo.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
