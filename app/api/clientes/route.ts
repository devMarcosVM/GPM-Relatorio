import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { normalizeClientePayload, validateCliente, mensagemDocumentoDuplicado, mensagemErroClienteDuplicado } from "@/lib/cliente";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
  });

  return NextResponse.json(clientes);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data = await request.json();
  const payload = normalizeClientePayload(data);
  const validationError = validateCliente(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const duplicado = await mensagemDocumentoDuplicado(
    payload.documento,
    payload.documentoDigits
  );
  if (duplicado) {
    return NextResponse.json({ error: duplicado }, { status: 409 });
  }

  try {
    const cliente = await prisma.cliente.create({
      data: payload,
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    const msg = mensagemErroClienteDuplicado(error);
    if (msg) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    throw error;
  }
}
