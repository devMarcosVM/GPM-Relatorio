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
  const relatorio = await prisma.relatorio.findUnique({ where: { id } });

  if (!relatorio) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  if (relatorio.status !== "FINALIZADO") {
    return NextResponse.json(
      { error: "Finalize o relatório antes de gerar o link" },
      { status: 400 }
    );
  }

  if (relatorio.assinaturaCliente) {
    return NextResponse.json(
      { error: "Cliente já assinou este relatório" },
      { status: 400 }
    );
  }

  const updated = await prisma.relatorio.update({
    where: { id },
    data: {
      tokenAssinatura: generateAssinaturaToken(),
      tokenAssinaturaExpira: getAssinaturaExpiry(),
    },
    include: { cliente: true },
  });

  return NextResponse.json(updated);
}
