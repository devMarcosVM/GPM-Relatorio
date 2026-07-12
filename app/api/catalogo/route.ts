import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const all = searchParams.get("all") === "true" && session.role === "ADMIN";

  const servicos = await prisma.catalogoServico.findMany({
    where: all ? undefined : { ativo: true },
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(servicos);
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const data = await request.json();

    const servico = await prisma.catalogoServico.create({
      data: {
        nome: data.nome,
        descricao: data.descricao || null,
        preco: parseFloat(data.preco) || 0,
        unidade: data.unidade === "METRO" ? "METRO" : "UNIDADE",
        orientacaoFoto: data.orientacaoFoto || "VERTICAL",
        ativo: data.ativo ?? true,
      },
    });

    return NextResponse.json(servico, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 });
  }
}
