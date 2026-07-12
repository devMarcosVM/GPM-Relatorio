import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  buscarDocumentoPorToken,
  validarTokenAssinatura,
} from "@/lib/assinatura";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const doc = await buscarDocumentoPorToken(token);

  if (!doc) {
    return NextResponse.json({ error: "Link inválido" }, { status: 404 });
  }

  const bloqueio = validarTokenAssinatura(doc);

  return NextResponse.json({
    tipo: doc.tipo,
    numero: doc.numero,
    clienteNome: doc.cliente.nome,
    clienteDocumento: doc.cliente.documento,
    empresaNome: doc.empresa?.razaoSocial || "Prestador de Serviço",
    responsavelNome:
      doc.tipo === "relatorio" ? doc.tecnico.nome : doc.criadoPor.nome,
    jaAssinado: !!doc.assinaturaCliente,
    expirado: bloqueio === "Este link expirou. Solicite um novo link ao prestador de serviço.",
    total: doc.tipo === "orcamento" ? doc.total : undefined,
    temAssinaturaTecnico:
      doc.tipo === "relatorio" ? !!doc.assinaturaTecnico : false,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const doc = await buscarDocumentoPorToken(token);

  if (!doc) {
    return NextResponse.json({ error: "Link inválido" }, { status: 404 });
  }

  const bloqueio = validarTokenAssinatura(doc);
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
