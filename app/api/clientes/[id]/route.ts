import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { normalizeClientePayload, validateCliente, mensagemDocumentoDuplicado, mensagemErroClienteDuplicado } from "@/lib/cliente";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();
    const payload = normalizeClientePayload(data);
    const validationError = validateCliente(payload);

    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const duplicado = await mensagemDocumentoDuplicado(
      payload.documento,
      payload.documentoDigits,
      id
    );
    if (duplicado) {
      return NextResponse.json({ error: duplicado }, { status: 409 });
    }

    const cliente = await prisma.cliente.update({
      where: { id },
      data: payload,
    });

    return NextResponse.json(cliente);
  } catch (error) {
    const msg = mensagemErroClienteDuplicado(error);
    if (msg) {
      return NextResponse.json({ error: msg }, { status: 409 });
    }
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.cliente.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
