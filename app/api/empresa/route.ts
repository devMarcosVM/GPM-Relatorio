import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, requireAdmin } from "@/lib/auth";
import { validateEmpresa, normalizeEmpresaPayload } from "@/lib/empresa";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const empresa = await prisma.empresa.findFirst();
  return NextResponse.json(empresa);
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
    const data = await request.json();

    const payload = normalizeEmpresaPayload({
      razaoSocial: data.razaoSocial?.trim() ?? "",
      cnpj: data.cnpj?.trim() ?? "",
      endereco: data.endereco?.trim() ?? "",
      telefone: data.telefone?.trim() ?? "",
      email: data.email?.trim().toLowerCase() ?? "",
      logoUrl: data.logoUrl?.trim() || null,
    });

    const validationError = validateEmpresa(payload);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existing = await prisma.empresa.findFirst();

    if (existing) {
      const empresa = await prisma.empresa.update({
        where: { id: existing.id },
        data: payload,
      });
      return NextResponse.json(empresa);
    }

    const empresa = await prisma.empresa.create({ data: payload });
    return NextResponse.json(empresa, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Acesso negado") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }
    return NextResponse.json({ error: "Erro ao salvar" }, { status: 500 });
  }
}
