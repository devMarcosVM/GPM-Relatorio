import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateAssinaturaToken, getAssinaturaExpiry } from "@/lib/assinaturaLink";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const orcamento = await prisma.orcamento.findUnique({ where: { id } });

  if (!orcamento) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (orcamento.assinaturaCliente) {
    return NextResponse.json(
      { error: "Cliente já assinou este orçamento" },
      { status: 400 }
    );
  }

  const updated = await prisma.orcamento.update({
    where: { id },
    data: {
      tokenAssinatura: generateAssinaturaToken(),
      tokenAssinaturaExpira: getAssinaturaExpiry(),
    },
    include: { cliente: true },
  });

  return NextResponse.json(updated);
}
