import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  buscarDocumentoPublicoPorToken,
  erroAssinatura,
} from "@/lib/assinatura";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const doc = await buscarDocumentoPublicoPorToken(token);

  if (!doc) {
    return NextResponse.json({ error: "Link inválido" }, { status: 404 });
  }

  return NextResponse.json(doc);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const doc = await buscarDocumentoPublicoPorToken(token);

  if (!doc) {
    return NextResponse.json({ error: "Link inválido" }, { status: 404 });
  }

  const bloqueio = erroAssinatura(doc);
  if (bloqueio) {
    return NextResponse.json({ error: bloqueio }, { status: 400 });
  }

  const { assinaturaCliente } = await request.json();
  if (!assinaturaCliente || typeof assinaturaCliente !== "string") {
    return NextResponse.json({ error: "Assinatura obrigatória" }, { status: 400 });
  }

  if (!assinaturaCliente.startsWith("data:image/")) {
    return NextResponse.json({ error: "Formato de assinatura inválido" }, { status: 400 });
  }

  if (doc.tipo === "relatorio") {
    await prisma.relatorio.update({
      where: { id: doc.id },
      data: {
        assinaturaCliente,
        tokenAssinatura: null,
        tokenAssinaturaExpira: null,
      },
    });
  } else {
    await prisma.orcamento.update({
      where: { id: doc.id },
      data: {
        assinaturaCliente,
        status: "APROVADO",
        tokenAssinatura: null,
        tokenAssinaturaExpira: null,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
